'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Message {
  id: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
  labelIds?: string[];
}

interface RecentEmailsProps {
  messages?: Message[];
  loading?: boolean;
}

export default function RecentEmails({ messages = [], loading = false }: RecentEmailsProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Emails</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getHeader = (msg: Message, name: string) => {
    return msg.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value || '';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getInitials = (from: string) => {
    const match = from.match(/^([^<]+)/);
    if (match) {
      const parts = match[1].trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return from.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Emails</h3>
        <Link href="/gmail" className="text-sm text-blue-600 hover:text-blue-700">
          View all →
        </Link>
      </div>
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No recent emails</p>
        ) : (
          messages.slice(0, 5).map((msg) => {
            const from = getHeader(msg, 'from');
            const subject = getHeader(msg, 'subject');
            const isUnread = msg.labelIds?.includes('UNREAD');

            return (
              <Link
                key={msg.id}
                href={`/gmail?message=${msg.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${isUnread ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {getInitials(from)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isUnread ? 'font-semibold' : ''}`}>
                    {from.split('<')[0].trim()}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {subject || '(no subject)'} — {msg.snippet?.slice(0, 50)}...
                  </p>
                </div>
                <span className="text-xs text-zinc-400">
                  {msg.internalDate && formatTime(msg.internalDate)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
