import { GoogleGenerativeAI, ChatSession, Content } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const CTI_SYSTEM_PROMPT = `Você é o Sentinel AI, um assistente especializado em Cyber Threat Intelligence (CTI).
Seu papel é auxiliar analistas de segurança com:
- Análise de ameaças e tendências
- Interpretação de indicadores de comprometimento (IOCs)
- Recomendações baseadas em frameworks como MITRE ATT&CK
- Priorização de requisitos de inteligência (PIRs)
- Sugestões para relatórios de análise

Sempre responda em português brasileiro, de forma técnica mas acessível.
Cite fontes e frameworks quando relevante.`;

export async function generateCTIInsight(prompt: string, context: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `${CTI_SYSTEM_PROMPT}

DADOS DO PROGRAMA CTI:
${context}

SOLICITAÇÃO DO ANALISTA:
${prompt}

Responda de forma estruturada e acionável.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate CTI insight');
  }
}

export async function getCTIChatResponse(
  history: { role: 'user' | 'model'; parts: string }[],
  currentMessage: string,
  context: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert history to proper format
    const chatHistory: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    // Add system context as first message if history is empty
    if (chatHistory.length === 0) {
      chatHistory.push({
        role: 'user',
        parts: [{ text: `${CTI_SYSTEM_PROMPT}\n\nContexto da Organização:\n${context}` }],
      });
      chatHistory.push({
        role: 'model',
        parts: [{ text: 'Entendido. Estou pronto para auxiliar com análises de Cyber Threat Intelligence. Como posso ajudar?' }],
      });
    }

    const chat: ChatSession = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Chat API Error:', error);
    throw new Error('Failed to get AI chat response');
  }
}

export async function analyzeReport(reportContent: string, pirTitle: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `${CTI_SYSTEM_PROMPT}

Analise o seguinte relatório de CTI relacionado ao PIR "${pirTitle}":

${reportContent}

Forneça:
1. Resumo executivo (2-3 frases)
2. Principais IOCs identificados
3. TTPs relevantes (referência MITRE ATT&CK)
4. Recomendações de mitigação
5. Nível de criticidade sugerido (Baixo/Médio/Alto/Crítico)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini Report Analysis Error:', error);
    throw new Error('Failed to analyze report');
  }
}
