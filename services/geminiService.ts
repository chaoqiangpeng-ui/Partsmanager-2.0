import { GoogleGenAI } from "@google/genai";
import { PopulatedPart, Machine } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeMaintenanceData = async (
  parts: PopulatedPart[],
  machines: Machine[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key not found. Unable to generate analysis.";

  // Prepare a summary payload
  const criticalParts = parts.filter(p => p.status === 'CRITICAL');
  const warningParts = parts.filter(p => p.status === 'WARNING');
  
  const payload = {
    totalMachines: machines.length,
    totalParts: parts.length,
    criticalCount: criticalParts.length,
    warningCount: warningParts.length,
    criticalDetails: criticalParts.map(p => ({
      part: p.definition.name,
      machine: p.machineName,
      health: `${p.healthPercentage.toFixed(1)}%`,
      daysUsed: p.currentDaysUsed,
      maxLifeDays: p.definition.maxLifetimeDays
    })),
    machines: machines.map(m => m.name)
  };

  const prompt = `
    You are an industrial maintenance expert. Analyze the following JSON data representing the current state of a factory's machinery and parts.
    
    Data: ${JSON.stringify(payload, null, 2)}

    Please provide a concise executive summary in HTML format (using <h3>, <ul>, <li>, <strong>, <p> tags, but no markdown code blocks).
    Focus on:
    1. Immediate risks (Critical parts).
    2. Upcoming maintenance needs (Warning parts).
    3. A specific recommendation for the most urgent machine.
    4. Keep the tone professional and urgent if necessary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "Failed to communicate with AI service.";
  }
};