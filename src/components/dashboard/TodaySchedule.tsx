'use client';

import Link from 'next/link';

interface Event {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
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

export default function TodaySchedule({ events = [], loading = false }: TodayScheduleProps) {
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
            <div key={event.id} className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.summary || '(No title)'}</p>
                <p className="text-xs text-zinc-500">
                  {formatEventTime(event)}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
