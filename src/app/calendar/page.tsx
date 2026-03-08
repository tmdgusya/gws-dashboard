'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Event {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  htmlLink?: string;
  status?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatEventTime(event: Event): string {
  if (event.start?.date) return 'All day';
  if (event.start?.dateTime) {
    const date = new Date(event.start.dateTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return '';
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const timeMin = start.toISOString();
      const timeMax = end.toISOString();
      
      const res = await fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=100`);
      const data = await res.json();
      setEvents(data.items || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    fetchEvents(start, end);
  }, [year, month, fetchEvents]);

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedEvent(null);
  };

  const goToPrevious = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedEvent(null);
  };

  const goToNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedEvent(null);
  };

  const getEventsForDay = (day: number) => {
    const dayStart = new Date(year, month, day, 0, 0, 0);
    const dayEnd = new Date(year, month, day, 23, 59, 59);
    
    return events.filter((event) => {
      const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) : 
                           event.start?.date ? new Date(event.start.date) : null;
      if (!eventStart) return false;
      
      return isSameDay(eventStart, dayStart);
    });
  };

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
    } else {
      setSelectedEvent(null);
    }
  };

  const handleCreateEvent = async (event: { summary: string; start: string; end: string; location?: string }) => {
    try {
      await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      setShowCreateModal(false);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      fetchEvents(start, end);
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const days: Array<{ day: number; isToday: boolean } | null> = [];
  
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isSameDay(new Date(year, month, day), new Date());
    days.push({ day, isToday });
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {formatDate(currentDate)}
            </h2>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1 text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-zinc-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1">
            {loading ? (
              Array(35).fill(null).map((_, i) => (
                <div key={i} className="p-2 border-b border-r border-zinc-100 dark:border-zinc-800 animate-pulse">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                </div>
              ))
            ) : (
              days.map((item, i) => {
                if (!item) {
                  return (
                    <div key={i} className="p-2 border-b border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50" />
                  );
                }
                
                const dayEvents = getEventsForDay(item.day);
                const hasEvent = dayEvents.length > 0;

                return (
                  <div
                    key={i}
                    onClick={() => handleDayClick(item.day)}
                    className={`p-2 border-b border-r border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      item.isToday ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <p className={`text-sm ${item.isToday ? 'text-blue-600 font-semibold' : ''}`}>
                      {item.day}
                    </p>
                    {hasEvent && (
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            className="text-xs px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 truncate cursor-pointer"
                          >
                            {event.summary || '(No title)'}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <p className="text-xs text-zinc-500">
                            +{dayEvents.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <h3 className="text-lg font-semibold mb-4">
            {selectedEvent.summary || '(No title)'}
          </h3>
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-zinc-500">Time:</span>{' '}
              {formatEventTime(selectedEvent)}
            </p>
            {selectedEvent.location && (
              <p>
                <span className="text-zinc-500">Location:</span>{' '}
                {selectedEvent.location}
              </p>
            )}
            {selectedEvent.description && (
              <p className="text-zinc-600 dark:text-zinc-400">
                {selectedEvent.description}
              </p>
            )}
          </div>
          {selectedEvent.htmlLink && (
            <a
              href={selectedEvent.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Open in Google Calendar →
            </a>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">New Event</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateEvent({
                  summary: formData.get('summary') as string,
                  start: formData.get('start') as string,
                  end: formData.get('end') as string,
                  location: formData.get('location') as string
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="summary"
                  required
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start</label>
                  <input
                    type="datetime-local"
                    name="start"
                    required
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End</label>
                  <input
                    type="datetime-local"
                    name="end"
                    required
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location (optional)</label>
                <input
                  type="text"
                  name="location"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
