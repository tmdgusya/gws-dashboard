'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useChatContext } from '@/components/chat/ChatContext';

interface Event {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  htmlLink?: string;
}

interface TodayScheduleProps {
  events?: Event[];
  loading?: boolean;
}

function formatTime(dateTime?: string, date?: string): string {
  if (date) return 'All day';
  if (!dateTime) return '';
  const d = new Date(dateTime);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatEventDate(dateTime?: string, date?: string): string {
  if (date) {
    return new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  if (dateTime) {
    return new Date(dateTime).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return '';
}

export default function TodaySchedule({ events = [], loading = false }: TodayScheduleProps) {
  const { addCalendarContext } = useChatContext();

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-2 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatEventTime = (event: Event): string => {
    if (event.start?.date) return 'All day';
    return formatTime(event.start?.dateTime);
  };

  const handleAskAI = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();

    const startTime = formatEventTime(event);
    const endTime = event.end?.dateTime
      ? formatTime(event.end.dateTime)
      : undefined;

    addCalendarContext({
      id: event.id,
      summary: event.summary || '(No title)',
      startTime,
      endTime,
      location: event.location,
      description: event.description,
      date: formatEventDate(event.start?.dateTime, event.start?.date),
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        <Link href="/calendar" className="text-sm text-blue-600 hover:text-blue-700">
          View calendar →
        </Link>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No events today</p>
        ) : (
          events.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="group flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 p-2 -mx-2 rounded-lg transition-colors"
            >
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.summary || '(No title)'}</p>
                <p className="text-xs text-zinc-500">
                  {formatEventTime(event)}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
              <button
                onClick={(e) => handleAskAI(e, event)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all flex-shrink-0"
                title="AI에게 질문하기"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
