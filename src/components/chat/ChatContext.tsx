'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface EmailContext {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface CalendarContext {
  id: string;
  summary: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  date: string;
}

export interface ChatContextType {
  pendingContext: string | null;
  setPendingContext: (context: string | null) => void;
  addEmailContext: (email: EmailContext) => void;
  addCalendarContext: (event: CalendarContext) => void;
  clearContext: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [pendingContext, setPendingContext] = useState<string | null>(null);

  const addEmailContext = useCallback((email: EmailContext) => {
    const contextText = `[이메일 정보]\n보낸: ${email.from}\n제목: ${email.subject}\n내용: ${email.snippet}\n일시: ${email.date}\n\n이 이메일에 대해 `;
    setPendingContext(contextText);
  }, []);

  const addCalendarContext = useCallback((event: CalendarContext) => {
    let contextText = `[캘린더 일정]\n제목: ${event.summary}\n일시: ${event.date}`;
    if (event.startTime && event.startTime !== 'All day') {
      contextText += ` ${event.startTime}`;
      if (event.endTime) {
        contextText += ` ~ ${event.endTime}`;
      }
    }
    if (event.location) {
      contextText += `\n장소: ${event.location}`;
    }
    if (event.description) {
      const shortDesc = event.description.length > 100
        ? event.description.slice(0, 100) + '...'
        : event.description;
      contextText += `\n설명: ${shortDesc}`;
    }
    contextText += `\n\n이 일정에 대해 `;
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
        addCalendarContext,
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
