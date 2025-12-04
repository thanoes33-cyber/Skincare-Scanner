
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { UserProfile } from '../types';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve(''); // Should not happen with readAsDataURL
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    productName: {
      type: Type.STRING,
      description: "The identified name of the product or produce from the image or video."
    },
    ingredients: {
      type: Type.ARRAY,
      description: "A list of key ingredients (for packaged products) or nutritional components (for produce).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "A brief description of the ingredient/component." }
        },
        required: ["name", "description"]
      }
    },
    nutrients: {
        type: Type.ARRAY,
        description: "A list of key nutrients and their amounts.",
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING, description: "Amount per serving, e.g., '10g' or '30% DV'" },
                description: { type: Type.STRING, description: "A brief description of the nutrient's role." }
            },
            required: ["name", "amount", "description"]
        }
    },
    skinAnalysis: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: "A one-paragraph summary of the overall potential impact on the user's skin."
        },
        positiveEffects: {
          type: Type.ARRAY,
          description: "A list of potential positive effects for the user's skin.",
          items: { type: Type.STRING }
        },
        negativeEffects: {
          type: Type.ARRAY,
          description: "A list of potential negative effects or things to watch out for, paying special attention to user sensitivities.",
          items: { type: Type.STRING }
        },
      },
      required: ["summary", "positiveEffects", "negativeEffects"]
    },
    recallInfo: {
        type: Type.OBJECT,
        properties: {
            hasRecall: { type: Type.BOOLEAN, description: "True if there have been any significant recalls for this product or brand in the last 12 months." },
            details: { type: Type.STRING, description: "Details of the recall if one exists, otherwise a statement confirming no recent recalls were found." },
            date: { type: Type.STRING, description: "Date of the recall if applicable (YYYY-MM-DD)." }
        },
        required: ["hasRecall", "details"]
    }
  },
  required: ["productName", "ingredients", "nutrients", "skinAnalysis", "recallInfo"]
};


export const analyzeProduct = async (mediaFile: File, userProfile: UserProfile, additionalContext?: string) => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const mediaPart = await fileToGenerativePart(mediaFile);

  const prompt = `You are a nutritional and dermatological expert. Analyze the product or produce item in the image or video.${additionalContext ? `\nContext from scan: ${additionalContext}` : ''} 
  1. Identify the product (specific skincare item or type of produce/food).
  2. List its key ingredients (for packaged goods) or main nutritional components (for produce/whole foods).
  3. Based on the following user profile, explain the potential positive and negative effects of this item on their skin.
  4. Check for any product recalls associated with this specific item or brand within the last year (up to today's date). If there was a recall, provide details and the approximate date.
  
  User Profile:
  - Skin Type: ${userProfile.skinType}
  - Skin Concerns: ${userProfile.skinConcerns.join(', ')}
  - Health Conditions/Allergies: ${userProfile.healthConditions || 'None specified'}
  - Specific Ingredient Sensitivities: ${
    Object.entries(userProfile.ingredientSensitivities).length > 0
    ? Object.entries(userProfile.ingredientSensitivities)
        .map(([ingredient, level]) => `${ingredient} (${level} sensitivity)`)
        .join(', ')
    : 'None specified'
  }

  Provide your analysis in the specified JSON format. Pay close attention to the user's sensitivities when generating the 'negativeEffects' list.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [mediaPart, {text: prompt}] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing product:", error);
    throw new Error("Failed to get analysis from the AI. The product might be unclear or the API service is busy.");
  }
};

export const analyzeTextProduct = async (productName: string, userProfile: UserProfile) => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are a nutritional and dermatological expert. Analyze the following product: "${productName}".
  1. Identify the product (specific skincare item or type of produce/food) definitively.
  2. List its key ingredients (for packaged goods) or main nutritional components (for produce/whole foods).
  3. Based on the following user profile, explain the potential positive and negative effects of this item on their skin.
  4. Check for any product recalls associated with this specific item or brand within the last year.

  User Profile:
  - Skin Type: ${userProfile.skinType}
  - Skin Concerns: ${userProfile.skinConcerns.join(', ')}
  - Health Conditions/Allergies: ${userProfile.healthConditions || 'None specified'}
  - Specific Ingredient Sensitivities: ${
    Object.entries(userProfile.ingredientSensitivities).length > 0
    ? Object.entries(userProfile.ingredientSensitivities)
        .map(([ingredient, level]) => `${ingredient} (${level} sensitivity)`)
        .join(', ')
    : 'None specified'
  }

  Provide your analysis in the specified JSON format. Pay close attention to the user's sensitivities when generating the 'negativeEffects' list.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: prompt}] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisSchema
            // Note: googleSearch tool is excluded here because it cannot be used simultaneously with responseSchema.
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing product by text:", error);
    throw new Error("Failed to analyze the product. Please check the name and try again.");
  }
};

export const searchProductSelections = async (query: string): Promise<string[]> => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a Google Search for "${query}".
      Based on the search results, identify 10 distinct, specific, and relevant product names that the user might be looking for.
      Focus on precise product titles (e.g., "CeraVe Foaming Facial Cleanser" instead of just "CeraVe").
      Return ONLY a raw JSON array of strings. Do not use Markdown formatting.
      Example: ["Product A", "Product B", "Product C"]`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || '';
    // Clean up any markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const json = JSON.parse(cleanText);
        if (Array.isArray(json)) {
            return json.slice(0, 10); // Ensure max 10
        }
        return [];
    } catch (e) {
        console.warn("Failed to parse search selections JSON", e);
        return [];
    }
  } catch (error) {
    console.error("Error searching product selections:", error);
    throw new Error("Failed to search for products.");
  }
};

const glossarySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the ingredient." },
    commonUses: { type: Type.STRING, description: "A paragraph on the common uses in skincare and other products." },
    potentialBenefits: { type: Type.STRING, description: "A paragraph on the potential benefits for the skin." },
    possibleReactions: { type: Type.STRING, description: "A paragraph on possible adverse reactions or side effects." }
  },
  required: ["name", "commonUses", "potentialBenefits", "possibleReactions"]
};

export const getIngredientInfo = async (ingredientName: string) => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Provide a concise, educational summary for the ingredient "${ingredientName}" for a skincare context. Your audience is a general consumer, so be clear and easy to understand. Format the response as JSON with the specified schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: glossarySchema
      }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error(`Error fetching glossary for ${ingredientName}:`, error);
    throw new Error(`Failed to get information for ${ingredientName}.`);
  }
};

export const editProductImage = async (mediaFile: File, editPrompt: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mediaPart = await fileToGenerativePart(mediaFile);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          mediaPart,
          { text: editPrompt }
        ]
      },
      config: {
        responseModalities: [Modality.IMAGE]
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit image. Please try a different prompt.");
  }
};

export const searchProductWeb = async (query: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest information, reviews, and potential safety alerts for: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  } catch (error) {
    console.error("Error searching web:", error);
    throw new Error("Failed to search the web.");
  }
};

export const findProductImage = async (productName: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find a public image URL for "${productName}".
      Prefer a clean, white-background product shot if available.
      Return ONLY the raw URL string. Do not use Markdown.
      Example: https://example.com/image.jpg`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text?.trim();
    // Basic validation to ensure it looks like a URL and not a sentence
    if (text && text.startsWith('http') && !text.includes(' ')) {
        return text;
    }
    return null;
  } catch (error) {
    console.error("Error finding product image:", error);
    return null;
  }
};

export const createChatSession = (userProfile: UserProfile): Chat => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a friendly and expert skincare consultant for the "Skincare Scanner" app.
  
  User Profile:
  - Skin Type: ${userProfile.skinType}
  - Concerns: ${userProfile.skinConcerns.join(', ') || 'None'}
  - Health Conditions: ${userProfile.healthConditions || 'None'}
  - Sensitivities: ${Object.keys(userProfile.ingredientSensitivities).length > 0 ? 
      Object.entries(userProfile.ingredientSensitivities).map(([k, v]) => `${k} (${v})`).join(', ') : 'None'}

  Your goal is to help the user understand skincare, ingredients, and products tailored to their specific needs and sensitivities. 
  - Be encouraging and concise.
  - If a user asks about a product, analyze it based on their profile.
  - Warn them about their specific sensitivities if relevant.
  - Do not give medical advice; suggest consulting a dermatologist for serious issues.`;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};
