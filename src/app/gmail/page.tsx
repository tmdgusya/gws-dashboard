'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';

interface Message {
  id: string;
  threadId: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
  labelIds?: string[];
}

export default function GmailPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async (labelId: string, query?: string) => {
    setLoading(true);
    try {
      let url = `/api/gmail/messages?labelIds=${labelId}&maxResults=20`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.messages) {
        const details = await Promise.all(
          data.messages.slice(0, 10).map((msg: Message) => {
            return fetch(`/api/gmail/messages/${msg.id}?format=metadata`).then(r => r.json());
          })
        );
        setMessages(details);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(activeLabel, searchQuery);
  }, [activeLabel, searchQuery, fetchMessages]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleLabelChange = (labelId: string) => {
    setActiveLabel(labelId);
    setSelectedId(null);
    setSearchQuery('');
  };

  const handleCompose = () => {
    router.push('/gmail/compose');
  };

  const selectedMessage = messages.find(m => m.id === selectedId);

  const getHeader = (msg: Message, name: string): string => {
    return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  };

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return '';
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const getInitials = (from: string): string => {
    const match = from.match(/^([^<]+)/);
    if (match) {
      const name = match[1].trim();
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return from.slice(0, 2).toUpperCase();
  };

  const isUnread = (msg: Message): boolean => {
    return msg.labelIds?.includes('UNREAD') || false;
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="p-4">
          <button
            onClick={handleCompose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Compose
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2">
          {['INBOX', 'STARRED', 'SENT', 'DRAFT', 'TRASH'].map((labelId) => {
            const isActive = activeLabel === labelId;
            return (
              <button
                key={labelId}
                onClick={() => handleLabelChange(labelId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="flex-1 text-left">{labelId}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center gap-3 bg-white dark:bg-zinc-900">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search mail..."
              value={searchQuery}
              onChange={handleSearch}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </header>

        <div className="flex-1 flex">
          <div className="w-96 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                    <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">No messages</div>
                ) : (
                  messages.map((msg) => {
                    const from = getHeader(msg, 'from');
                    const subject = getHeader(msg, 'subject');
                    const msgIsUnread = isUnread(msg);
                    const isSelected = selectedId === msg.id;

                    return (
                      <button
                        key={msg.id}
                        onClick={() => handleSelect(msg.id)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950'
                            : msgIsUnread
                              ? 'bg-blue-50/50 dark:bg-blue-950/30'
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          msgIsUnread ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                        }`}>
                          {getInitials(from)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${msgIsUnread ? 'font-semibold' : ''}`}>
                            {from.split('<')[0].trim()}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {subject || '(no subject)'}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {formatTime(msg.internalDate)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex-1 bg-white dark:bg-zinc-900 p-4">
            {selectedMessage ? (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-zinc-500">
                    From: {getHeader(selectedMessage, 'from')}
                  </p>
                  <p className="text-lg font-semibold">
                    {getHeader(selectedMessage, 'subject') || '(no subject)'}
                  </p>
                </div>
                <div className="prose text-sm text-zinc-700 dark:text-zinc-300">
                  {selectedMessage.snippet}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
