
import { GoogleGenAI } from "@google/genai";

export async function generateCTIInsight(prompt: string, context: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `DADOS DO PROGRAMA CTI:\n${context}\n\nSOLICITAÇÃO DO USUÁRIO:\n${prompt}`,
      config: {
        systemInstruction: "Você é um analista sênior de Cyber Threat Intelligence (CTI) de nível mundial. Sua especialidade é correlacionar dados aparentemente desconexos (PIRs, fontes de logs, incidentes e relatórios táticos) para encontrar padrões, prever ameaças e sugerir ações de mitigação. Responda em Português de forma profissional e técnica.",
        thinkingConfig: {
          thinkingBudget: 32768
        },
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao processar sua solicitação com a IA. Verifique sua conexão e tente novamente.";
  }
}

export function createCTIChat(context: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview', // Flash is better for snappy chat, or Pro for deep questions
    config: {
      systemInstruction: `Você é o assistente virtual do CTI Sentinel. Você tem acesso aos dados da organização atual: ${context}. Responda perguntas sobre o programa de inteligência, sugira melhorias e ajude a navegar nos dados.`,
    },
  });
}
