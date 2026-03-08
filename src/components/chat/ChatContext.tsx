'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface EmailContext {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface ChatContextType {
  pendingContext: string | null;
  setPendingContext: (context: string | null) => void;
  addEmailContext: (email: EmailContext) => void;
  clearContext: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [pendingContext, setPendingContext] = useState<string | null>(null);

  const addEmailContext = useCallback((email: EmailContext) => {
    const contextText = `[이메일 정보]\n병는: ${email.from}\n제목: ${email.subject}\n내용: ${email.snippet}\n일시: ${email.date}\n\n이 이메일에 대해 `;
    setPendingContext(contextText);
  }, []);

  const clearContext = useCallback(() => {
    setPendingContext(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        pendingContext,
        setPendingContext,
        addEmailContext,
        clearContext,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
