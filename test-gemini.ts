import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING },
    organicStatus: { type: Type.STRING },
    processingLevel: { type: Type.STRING },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          isProcessed: { type: Type.BOOLEAN },
          isOrganic: { type: Type.BOOLEAN }
        },
        required: ["name", "description", "isProcessed", "isOrganic"]
      }
    },
    nutrients: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                amount: { type: Type.STRING },
                description: { type: Type.STRING }
            },
            required: ["name", "amount", "description"]
        }
    },
    skinAnalysis: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        positiveEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
        negativeEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["summary", "positiveEffects", "negativeEffects"]
    },
    affectedBodyParts: { type: Type.ARRAY, items: { type: Type.STRING } },
    recallInfo: {
      type: Type.OBJECT,
      properties: {
        hasRecall: { type: Type.BOOLEAN },
        details: { type: Type.STRING },
        date: { type: Type.STRING }
      },
      required: ["hasRecall", "details"]
    }
  },
  required: ["productName", "organicStatus", "processingLevel", "ingredients", "nutrients", "skinAnalysis", "recallInfo"]
};

async function run() {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts: [{text: "Analyze the product 'CeraVe Hydrating Cleanser' for a user with dry skin."}] },
        config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: analysisSchema,
            maxOutputTokens: 8192
        }
    });
    console.log("RESPONSE TEXT:");
    console.log(response.text);
  } catch (e) {
    console.error(e);
  }
}
run();
