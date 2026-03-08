'use client';

import { useEffect, useState, useCallback } from 'react';
import { useChatContext } from '@/components/chat/ChatContext';
import {
  Box, Typography, IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

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
  const { addCalendarContext } = useChatContext();

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

    return events.filter((event) => {
      const eventStart = event.start?.dateTime ? new Date(event.start.dateTime) :
                           event.start?.date ? new Date(event.start.date + 'T00:00:00') : null;
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

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const event = {
      summary: formData.get('summary') as string,
      start: formData.get('start') as string,
      end: formData.get('end') as string,
      location: formData.get('location') as string
    };

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

  const formatEventDateTime = (event: Event): string => {
    if (event.start?.date) {
      return new Date(event.start.date + 'T00:00:00').toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (event.start?.dateTime) {
      return new Date(event.start.dateTime).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return '';
  };

  const formatEventEndTime = (event: Event): string | undefined => {
    if (event.end?.dateTime) {
      const date = new Date(event.end.dateTime);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return undefined;
  };

  const handleAskAI = (e: React.MouseEvent, event: Event) => {
    e.preventDefault();
    e.stopPropagation();

    addCalendarContext({
      id: event.id,
      summary: event.summary || '(No title)',
      startTime: formatEventTime(event),
      endTime: formatEventEndTime(event),
      location: event.location,
      description: event.description,
      date: formatEventDateTime(event),
    });
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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: 56, borderBottom: 1, borderColor: 'divider', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={goToPrevious} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={goToNext} size="small">
              <ChevronRightIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="medium" sx={{ ml: 1, mr: 2 }}>
              {formatDate(currentDate)}
            </Typography>
            <Button variant="outlined" size="small" onClick={goToToday} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Today
            </Button>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            New Event
          </Button>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: 1, borderColor: 'divider' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Box key={day} sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" fontWeight="medium" color="text.secondary" textTransform="uppercase">
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, gridAutoRows: '1fr' }}>
            {loading ? (
              Array(35).fill(null).map((_, i) => (
                <Box key={i} sx={{ p: 1, borderBottom: 1, borderRight: 1, borderColor: 'divider' }}>
                  <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, width: '60%' }} />
                </Box>
              ))
            ) : (
              days.map((item, i) => {
                if (!item) {
                  return (
                    <Box key={i} sx={{ p: 1, borderBottom: 1, borderRight: 1, borderColor: 'divider', bgcolor: 'action.hover' }} />
                  );
                }

                const dayEvents = getEventsForDay(item.day);
                const hasEvent = dayEvents.length > 0;

                return (
                  <Box
                    key={i}
                    onClick={() => handleDayClick(item.day)}
                    sx={{
                      p: 1,
                      borderBottom: 1,
                      borderRight: 1,
                      borderColor: 'divider',
                      cursor: 'pointer',
                      bgcolor: item.isToday ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        bgcolor: item.isToday ? 'primary.main' : 'transparent',
                        color: item.isToday ? 'primary.contrastText' : 'inherit',
                        fontWeight: item.isToday ? 'bold' : 'regular',
                        mb: 0.5,
                      }}
                    >
                      {item.day}
                    </Typography>
                    {hasEvent && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, overflow: 'hidden' }}>
                        {dayEvents.slice(0, 2).map((event) => (
                          <Box
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            sx={{
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: 'primary.light',
                              color: 'primary.dark',
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText', '& .ask-ai-btn': { opacity: 1, color: 'inherit' } }
                            }}
                          >
                            <Typography variant="caption" noWrap sx={{ flex: 1, fontSize: '0.7rem' }}>
                              {event.summary || '(No title)'}
                            </Typography>
                            <IconButton
                              className="ask-ai-btn"
                              size="small"
                              onClick={(e) => handleAskAI(e, event)}
                              sx={{ p: 0.25, opacity: 0, transition: 'opacity 0.2s', color: 'primary.main' }}
                              title="AI에게 질문하기"
                            >
                              <AutoAwesomeOutlinedIcon sx={{ fontSize: '0.8rem' }} />
                            </IconButton>
                          </Box>
                        ))}
                        {dayEvents.length > 2 && (
                          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, fontSize: '0.7rem' }}>
                            +{dayEvents.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {selectedEvent && (
        <Box sx={{ width: 320, borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper', p: 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="medium">
              {selectedEvent.summary || '(No title)'}
            </Typography>
            <IconButton
              onClick={(e) => handleAskAI(e, selectedEvent)}
              color="primary"
              title="AI에게 질문하기"
              size="small"
            >
              <AutoAwesomeOutlinedIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2">
              <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>Time:</Box>
              {formatEventTime(selectedEvent)}
            </Typography>
            {selectedEvent.location && (
              <Typography variant="body2">
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>Location:</Box>
                {selectedEvent.location}
              </Typography>
            )}
            {selectedEvent.description && (
              <Typography variant="body2" color="text.secondary">
                {selectedEvent.description}
              </Typography>
            )}
          </Box>
          {selectedEvent.htmlLink && (
            <Button
              component="a"
              href={selectedEvent.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              variant="text"
              sx={{ mt: 3, alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Open in Google Calendar
            </Button>
          )}
        </Box>
      )}

      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Event</DialogTitle>
        <form onSubmit={handleCreateEvent}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              autoFocus
              label="Title"
              name="summary"
              required
              fullWidth
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Start"
                  name="start"
                  type="datetime-local"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="End"
                  name="end"
                  type="datetime-local"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Location (optional)"
              name="location"
              fullWidth
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowCreateModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
