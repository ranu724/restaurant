
import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem, Ingredient, Sale, Expense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (
  menuItems: MenuItem[],
  ingredients: Ingredient[],
  sales: Sale[],
  expenses: Expense[]
) => {
  const prompt = `
    Analyze this restaurant's data and provide strategic recommendations:
    - Menu Items: ${JSON.stringify(menuItems)}
    - Ingredients: ${JSON.stringify(ingredients)}
    - Sales History: ${JSON.stringify(sales)}
    - Other Expenses: ${JSON.stringify(expenses)}

    Provide insights on:
    1. Profit margins for specific items.
    2. Menu items with low margin vs high popularity.
    3. Potential waste risks or reorder suggestions.
    4. Cost-saving opportunities.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, description: "Low, Medium, High" },
                  suggestion: { type: Type.STRING }
                },
                required: ["title", "description", "impact", "suggestion"]
              }
            }
          },
          required: ["insights"]
        }
      }
    });

    return JSON.parse(response.text).insights;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return [];
  }
};
