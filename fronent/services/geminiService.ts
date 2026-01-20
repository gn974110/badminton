import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTeamNameAndStrategy = async (playerNames: string[]): Promise<{ name: string; strategy: string }> => {
  const ai = getAiClient();
  if (!ai) {
    return {
      name: "羽球特攻隊",
      strategy: "API Key 遺失。只要把球打過網就對了！"
    };
  }

  try {
    const prompt = `
      我有一組羽球雙打隊伍，隊員有：${playerNames.join(", ")}。
      
      1. 幫他們取一個簡短、有趣或帥氣的隊名（請用繁體中文）。
      2. 給一個關於雙打的簡短戰術建議（請用繁體中文）。
      
      請只回傳以下 JSON 格式：
      {
        "name": "隊名",
        "strategy": "戰術建議"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      name: "努力不懈隊",
      strategy: "專注於溝通和輪轉補位。"
    };
  }
};