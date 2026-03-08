'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { useChatContext } from './ChatContext';
import ToolIndicator from './ToolIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPanel() {
  const { pendingContext, clearContext } = useChatContext();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '안녕하세요! GWS Workspace Hub의 AI 어시스턴트입니다. Gmail, Drive, Calendar 관련 작업을 도와드릴 수 있어요.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingTools, setExecutingTools] = useState<{ name: string; status: 'loading' | 'success' | 'error'; message?: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [width, setWidth] = useState(320);

  useEffect(() => {
    const saved = localStorage.getItem('chatPanelWidth');
    if (saved) {
      setWidth(parseInt(saved, 10));
    }
  }, []);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (pendingContext) {
      setInput(pendingContext);
      clearContext();
      inputRef.current?.focus();
      setIsOpen(true);
    }
  }, [pendingContext, clearContext]);

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, 280), 600);
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('chatPanelWidth', width.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, width]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setExecutingTools([{ name: 'Thinking...', status: 'loading' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 요청 처리 중 오류가 발생했습니다.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-20 z-40 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-l-lg shadow-lg transition-colors"
        title="AI 채팅 열기"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{ width: `${width}px` }}
      className={`relative border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-[calc(100vh-4rem)] ${isDragging ? 'select-none' : ''}`}
    >
      {/* Resize handle */}
      <div
        onMouseDown={startDragging}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize group ${isDragging ? 'bg-blue-500' : 'hover:bg-blue-500/50'} transition-colors`}
      >
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${isDragging ? 'bg-white' : 'bg-zinc-300 group-hover:bg-white dark:bg-zinc-600'} transition-colors`} />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="패널 닫기"
        >
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600'
              }`}
            >
              {message.role === 'assistant' ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[calc(100%-3rem)] rounded-2xl px-3 py-2 text-sm ${
                message.role === 'assistant'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}
            >
              {message.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < message.content.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex flex-col">
              {executingTools.length > 0 && (
                <ToolIndicator tools={executingTools} />
              )}
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-sm text-zinc-500">생각 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            className="w-full pr-10 pl-3 py-2 bg-zinc-100 dark:bg-zinc-800 border-0 rounded-lg resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">
          Enter로 전송, Shift+Enter로 줄바꿈
        </p>
      </div>
    </div>
  );
}
