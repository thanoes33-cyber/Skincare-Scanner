
import { GoogleGenAI, Type, Chat, Modality, Content } from "@google/genai";
import type { UserProfile } from '../types';

/**
 * Handle specific Gemini API errors, particularly the 'NOT_FOUND' error 
 * which indicates a missing or misconfigured paid project key.
 */
const handleGeminiError = async (error: any) => {
  const errorMessage = error?.message || String(error);
  console.error("Gemini API Error:", errorMessage);
  throw error;
};

const extractJson = (text: string): string => {
  if (!text) return '';
  
  // 1. Try to extract from markdown code blocks
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    return match[1].trim();
  }
  
  // 2. Try to find the outermost object or array
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  let startIndex = -1;
  let endIndex = -1;
  
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    endIndex = lastBrace;
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    startIndex = firstBracket;
    endIndex = lastBracket;
  }
  
  if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    return text.substring(startIndex, endIndex + 1);
  }
  
  return text.trim();
};

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
    organicStatus: {
      type: Type.STRING,
      description: "Indicate if the product is certified organic, contains organic ingredients, or is conventional (e.g., '100% Organic', 'Contains Organic Components', 'Conventional')."
    },
    processingLevel: {
      type: Type.STRING,
      description: "The level of processing of the product (e.g., 'Unprocessed/Whole Food', 'Minimally Processed', 'Processed Additives', 'Ultra-Processed')."
    },
    ingredients: {
      type: Type.ARRAY,
      description: "A list of key ingredients (for packaged products) or nutritional components (for produce).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING, description: "A brief description of the ingredient/component." },
          isProcessed: { type: Type.BOOLEAN, description: "True if this ingredient is an industrial additive, preservative, or highly processed component." },
          isOrganic: { type: Type.BOOLEAN, description: "True if this specific ingredient is likely or explicitly organic." }
        },
        required: ["name", "description", "isProcessed", "isOrganic"]
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
          description: "A one-paragraph summary of the overall potential impact on the user's skin, including notes on processing/organic status."
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
    affectedBodyParts: {
      type: Type.ARRAY,
      description: "A list of body parts that might be negatively affected or damaged by the product (e.g., 'face', 'hands', 'liver', 'stomach', 'heart', 'lungs', 'kidneys', 'brain', 'eyes', 'skin', 'hair', 'nails').",
      items: { type: Type.STRING }
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
  required: ["productName", "organicStatus", "processingLevel", "ingredients", "nutrients", "skinAnalysis", "recallInfo"]
};


export const analyzeProduct = async (mediaFile: File, userProfile: UserProfile, additionalContext?: string) => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const mediaPart = await fileToGenerativePart(mediaFile);

  const prompt = `You are a nutritional and dermatological expert. Analyze the product or produce item in the image or video.
  ${additionalContext ? `\nContext from scan: ${additionalContext}` : ''} 
  
  CRITICAL TASKS:
  1. Identify the product definitively. If it's a produce item (like an apple), determine if it's likely organic vs conventional. If it's a packaged product, determine its official ingredient list to the best of your knowledge.
  2. Determine if the product is 'Highly Processed', 'Minimally Processed', or 'Whole Food'.
  3. Break down ingredients and flag those that are industrial additives (Processed) vs natural/organic.
  4. Based on the user profile, explain potential effects on skin and identify any specific body parts that could be damaged or negatively affected.
  5. Check for any product recalls in the last 12 months to the best of your knowledge.
  
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

  Provide your analysis in the specified JSON format. Keep descriptions concise to avoid truncation.`;

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [mediaPart, {text: prompt}] },
          config: {
              responseMimeType: 'application/json',
              responseSchema: analysisSchema
          }
      });

      let jsonText = response.text?.trim();
      if (!jsonText) {
        throw new Error("Received empty response from the analysis service.");
      }
      
      jsonText = extractJson(jsonText);
      
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error(`Attempt ${attempt}: Failed to parse JSON response. Raw text was:`, jsonText);
        lastError = new Error("Failed to parse the analysis result. The response might have been truncated.");
      }
    } catch (error) {
      console.error(`Attempt ${attempt}: Error analyzing product:`, error);
      lastError = error;
    }
  }
  return handleGeminiError(lastError);
};

export const analyzeTextProduct = async (productName: string, userProfile: UserProfile) => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `You are a nutritional and dermatological expert. Analyze the following product: "${productName}".
  
  CRITICAL TASKS:
  1. Identify the official ingredient list for "${productName}" to the best of your knowledge. DO NOT guess ingredients if you are unsure.
  2. Identify if this product is 'Organic' (certified) or contains organic ingredients.
  3. Categorize the 'Processing Level' (Whole Food, Minimally Processed, Processed, or Ultra-Processed).
  4. For each ingredient, indicate if it is 'Processed' (synthetic additive/highly refined) or 'Organic/Natural'.
  5. Check for any safety recalls associated with this specific item in the last year to the best of your knowledge.
  6. Based on the user profile, explain potential effects on skin and identify any specific body parts that could be damaged or negatively affected.

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

  Provide your analysis in the specified JSON format. Keep descriptions concise to avoid truncation.`;

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts: [{text: prompt}] },
          config: {
              responseMimeType: 'application/json',
              responseSchema: analysisSchema
          }
      });

      let jsonText = response.text?.trim();
      if (!jsonText) {
        throw new Error("Received empty response from the analysis service.");
      }
      
      jsonText = extractJson(jsonText);
      
      try {
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error(`Attempt ${attempt}: Failed to parse JSON response. Raw text was:`, jsonText);
        lastError = new Error("Failed to parse the analysis result. The response might have been truncated.");
      }
    } catch (error) {
      console.error(`Attempt ${attempt}: Error analyzing product by text:`, error);
      lastError = error;
    }
  }
  return handleGeminiError(lastError);
};

export const searchProductSelections = async (query: string): Promise<string[]> => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify up to 10 distinct, specific, and relevant product names that the user might be looking for when they type "${query}". Focus on precise product titles (e.g., "CeraVe Foaming Facial Cleanser").`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    let text = response.text?.trim() || '';
    
    text = extractJson(text);
    
    try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
            return json.slice(0, 10);
        }
        return [];
    } catch (e) {
        console.error("Failed to parse product selections JSON:", text, e);
        return [];
    }
  } catch (error) {
    console.error("Error searching product selections:", error);
    return handleGeminiError(error);
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
      model: 'gemini-3.1-flash-lite-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: glossarySchema
      }
    });

    let jsonText = response.text?.trim() || '';
    
    jsonText = extractJson(jsonText);

    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse ingredient info JSON:", jsonText, parseError);
      throw new Error(`Failed to parse information for ${ingredientName}.`);
    }
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
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error editing image:", error);
    return handleGeminiError(error);
  }
};

export const searchProductWeb = async (query: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide information, reviews, and potential safety alerts for: ${query}`
    });

    return {
      text: response.text,
      groundingMetadata: null
    };
  } catch (error) {
    console.error("Error searching web:", error);
    return handleGeminiError(error);
  }
};

export const findProductImage = async (productName: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clean, white-background product shot of ${productName}.`,
          },
        ],
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding product image:", error);
    return handleGeminiError(error);
  }
};

export const createChatSession = (userProfile: UserProfile, history: Content[] = []): Chat => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `You are a world-class dual-specialist in Clinical Dermatology and Holistic Nutrition for the "Skincare Scanner" app.
  
  YOUR MISSION:
  Decode complex ingredient labels and provide personalized, scientifically-backed advice for both skincare products and food/produce.
  
  EXPERTISE & REASONING GUIDELINES:
  1. **Cross-Domain Analysis**: Understand the link between diet (nutrition) and skin health (dermatology). For example, know how high-glycemic ultra-processed foods can trigger acne.
  2. **Ingredient Decoding**: Be able to explain complex chemical names in both cosmetics and food additives (preservatives, thickeners, etc.).
  3. **NOVA Scale & Organic Standards**: Understand and explain processing levels (Whole Food vs Ultra-Processed) and what certifications like USDA Organic really mean for the user.
  4. **Strict Personalization**: You MUST ALWAYS prioritize the User's Profile provided below. 
  
  USER PROFILE:
  - **Skin Type**: ${userProfile.skinType}
  - **Skin Concerns**: ${userProfile.skinConcerns.join(', ') || 'None specified'}
  - **Health Conditions/Allergies**: ${userProfile.healthConditions || 'None specified'}
  - **Sensitivities**: ${Object.keys(userProfile.ingredientSensitivities).length > 0 ? 
      Object.entries(userProfile.ingredientSensitivities).map(([k, v]) => `${k} (${v} sensitivity)`).join(', ') : 'None specified'}

  CONVERSATION STYLE:
  - **Professional & Insightful**: Don't just give yes/no answers. Explain the "Why" using your expertise.
  - **Concise but Comprehensive**: Keep responses readable but packed with value.
  - **Safety First**: Explicitly warn if a user mentions an ingredient or food they are sensitive to.
  - **Ethical Limit**: Remind users that while you are an expert AI, you are not a replacement for a face-to-face consultation with a doctor for serious medical conditions.`;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

/**
 * Text-to-Speech (TTS) feature using gemini-2.5-flash-preview-tts
 */
export const generateSpeech = async (text: string) => {
  if (!process.env.API_KEY) throw new Error("API key is not configured.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini TTS.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return handleGeminiError(error);
  }
};

/**
 * Audio decoding utilities as per guidelines
 */
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
