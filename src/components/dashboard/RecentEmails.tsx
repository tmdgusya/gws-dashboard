'use client';

import Link from 'next/link';
import { useChatContext } from '@/components/chat/ChatContext';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  Button,
  Box,
  Skeleton,
  IconButton
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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
  const { addEmailContext } = useChatContext();

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

  const handleAskAI = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    const from = getHeader(msg, 'from');
    const subject = getHeader(msg, 'subject');
    addEmailContext({
      id: msg.id,
      from: from.split('<')[0].trim(),
      subject: subject || '(no subject)',
      snippet: msg.snippet?.slice(0, 100) || '',
      date: msg.internalDate ? formatTime(msg.internalDate) : '',
    });
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight="bold">Recent Emails</Typography>}
        action={
          <Button 
            component={Link} 
            href="/gmail" 
            endIcon={<ArrowForwardIcon />}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            View all
          </Button>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flex: 1, p: 0, pt: 1, '&:last-child': { pb: 2 } }}>
        <List disablePadding>
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <ListItem key={i}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton variant="text" width="40%" />}
                  secondary={<Skeleton variant="text" width="80%" />}
                />
              </ListItem>
            ))
          ) : messages.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              No recent emails
            </Typography>
          ) : (
            messages.slice(0, 5).map((msg) => {
              const from = getHeader(msg, 'from');
              const subject = getHeader(msg, 'subject');
              const isUnread = msg.labelIds?.includes('UNREAD');

              return (
                <ListItem
                  key={msg.id}
                  disablePadding
                  sx={{
                    bgcolor: isUnread ? 'action.hover' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    '& .ask-ai-btn': { opacity: 0 },
                    '&:hover .ask-ai-btn': { opacity: 1 },
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="ask AI"
                      className="ask-ai-btn"
                      onClick={(e) => handleAskAI(e, msg)}
                      color="primary"
                      title="AI에게 질문하기"
                      size="small"
                      sx={{ transition: 'opacity 0.2s', mr: 1 }}
                    >
                      <AutoAwesomeOutlinedIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton component={Link} href={`/gmail?message=${msg.id}`} sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: isUnread ? 'primary.main' : 'action.selected', color: isUnread ? 'primary.contrastText' : 'text.primary', width: 40, height: 40, fontSize: '0.875rem', fontWeight: 'medium' }}>
                        {getInitials(from)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
                          <Typography variant="body2" fontWeight={isUnread ? 'bold' : 'medium'} noWrap>
                            {from.split('<')[0].trim()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {msg.internalDate && formatTime(msg.internalDate)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap display="block" pr={4}>
                          {subject || '(no subject)'} &mdash; {msg.snippet?.slice(0, 50)}...
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </CardContent>
    </Card>
  );
}
