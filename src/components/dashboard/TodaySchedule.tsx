'use client';

import Link from 'next/link';
import { useChatContext } from '@/components/chat/ChatContext';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Button,
  Box,
  Skeleton,
  IconButton
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CircleIcon from '@mui/icons-material/Circle';

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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight="bold">Today&apos;s Schedule</Typography>}
        action={
          <Button 
            component={Link} 
            href="/calendar" 
            endIcon={<ArrowForwardIcon />}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            View calendar
          </Button>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flex: 1, p: 0, pt: 1, '&:last-child': { pb: 2 } }}>
        <List disablePadding>
          {loading ? (
            [1, 2, 3].map((i) => (
              <ListItem key={i}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Skeleton variant="circular" width={12} height={12} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
              </ListItem>
            ))
          ) : events.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No events today
            </Typography>
          ) : (
            events.slice(0, 5).map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  px: 3,
                  py: 1.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  '& .ask-ai-btn': { opacity: 0 },
                  '&:hover .ask-ai-btn': { opacity: 1 },
                  transition: 'background-color 0.2s',
                  alignItems: 'flex-start'
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="ask AI"
                    className="ask-ai-btn"
                    onClick={(e) => handleAskAI(e, event)}
                    color="primary"
                    title="AI에게 질문하기"
                    size="small"
                    sx={{ transition: 'opacity 0.2s', mt: -0.5, mr: 0 }}
                  >
                    <AutoAwesomeOutlinedIcon fontSize="small" />
                  </IconButton>
                }
              >
                <Box sx={{ mt: 0.5, mr: 2, display: 'flex' }}>
                  <CircleIcon sx={{ fontSize: 10, color: 'success.main' }} />
                </Box>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="medium" noWrap pr={4}>
                      {event.summary || '(No title)'}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" display="block" noWrap pr={4}>
                      {formatEventTime(event)}
                      {event.location && ` · ${event.location}`}
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
}
