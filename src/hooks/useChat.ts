import { useState, useCallback } from 'react';
import { chatApi, ChatMessage } from '../services/api';

export function useChat(organizationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { response } = await chatApi.message(
        content,
        history,
        organizationId || undefined
      );

      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error as assistant message
      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `Erro ao processar mensagem: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [messages, organizationId]);

  const generateInsight = useCallback(async (prompt: string) => {
    setIsTyping(true);
    setError(null);

    try {
      const { insight } = await chatApi.insight(prompt, organizationId || undefined);
      return insight;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate insight';
      setError(errorMessage);
      throw err;
    } finally {
      setIsTyping(false);
    }
  }, [organizationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    generateInsight,
    clearMessages,
  };
}

export default useChat;
