import { GoogleGenAI } from "@google/genai";
import { CSV_NOTES_CONTEXT } from '../constants';
import { ParametricStats } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeProgress = async (stats: ParametricStats, userQuery: string) => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key missing.";

  const systemInstruction = `You are an expert Building Energy Modeler and Data Scientist assisting with a large-scale parametric simulation plan (IESVE).
  
  CONTEXT:
  ${CSV_NOTES_CONTEXT}
  
  CURRENT STATUS:
  - Total Batches: ${stats.totalBatches}
  - Completed: ${stats.completed} (${stats.progressPercentage.toFixed(1)}%)
  - Failed: ${stats.failed}
  - Running: ${stats.running}
  
  Your goal is to provide actionable advice on quality control, simulation strategy, or interpreting the progress. Keep answers concise and technical.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error analyzing the simulation plan. Please check your API key or try again later.";
  }
};
