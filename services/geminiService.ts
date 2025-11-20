import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, AICommentary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fast model for real-time commentary
const MODEL_FAST = 'gemini-2.5-flash-lite-latest';

// Thinking model for deep game analysis
const MODEL_THINKING = 'gemini-3-pro-preview';

export const getFastCommentary = async (score: number, event: 'eat' | 'die' | 'start'): Promise<AICommentary> => {
  try {
    const prompt = `
      You are a futuristic, neon-cyberpunk game announcer AI.
      The player just triggered this event: "${event}".
      Current Score: ${score}.
      
      Generate a very short, punchy, witty one-liner commentary (max 10 words).
      If they died, be slightly sarcastic but encouraging.
      If they ate, be hyped.
      If start, be ominous but inviting.
      
      Return JSON format: { "text": "string", "mood": "neutral" | "excited" | "sarcastic" }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            mood: { type: Type.STRING, enum: ['neutral', 'excited', 'sarcastic'] }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return { text: "System online.", mood: "neutral" };
    
    return JSON.parse(jsonText) as AICommentary;
  } catch (error) {
    console.error("Error getting fast commentary:", error);
    return { text: "Connection unstable...", mood: "neutral" };
  }
};

export const getDeepGameAnalysis = async (score: number, moves: number, durationSeconds: number): Promise<AIAnalysisResult> => {
  try {
    const prompt = `
      Analyze this Snake game performance.
      Score: ${score}
      Moves taken: ${moves}
      Duration: ${durationSeconds} seconds.
      
      Provide a strategic breakdown.
      1. Analyze the efficiency based on score vs time.
      2. Give a "Score Rating" (e.g., "Neon Novice", "Cyber Warlord").
      3. Provide 3 specific actionable tips for the next run to improve reflexes or strategy in a grid-based environment.
      
      Be in character: A high-level AI tactical advisor.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_THINKING,
      contents: prompt,
      config: {
        // Thinking configuration as requested
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Detailed paragraph analysis" },
            scoreRating: { type: Type.STRING, description: "Cool rank title" },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text");

    return JSON.parse(jsonText) as AIAnalysisResult;
  } catch (error) {
    console.error("Error getting deep analysis:", error);
    return {
      analysis: "Data corruption detected in sector 7. Unable to compile full tactical report.",
      scoreRating: "Unknown Entity",
      tips: ["Check network connection.", "Try again.", "Stay alert."]
    };
  }
};