'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, List, ListItem, ListItemButton, ListItemText, ListItemAvatar, 
  Avatar, Typography, InputBase, Button, Skeleton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

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
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <Box sx={{ width: 256, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<AddIcon />}
            onClick={handleCompose}
            sx={{ py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '1rem' }}
          >
            Compose
          </Button>
        </Box>
        <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
          {['INBOX', 'STARRED', 'SENT', 'DRAFT', 'TRASH'].map((labelId) => {
            const isActive = activeLabel === labelId;
            return (
              <ListItem key={labelId} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleLabelChange(labelId)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' },
                  }}
                >
                  <ListItemText primary={labelId} primaryTypographyProps={{ variant: 'body2', fontWeight: isActive ? 'bold' : 'medium' }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: 56, borderBottom: 1, borderColor: 'divider', px: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search mail..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Email List */}
          <Box sx={{ width: 384, borderRight: 1, borderColor: 'divider', overflowY: 'auto', bgcolor: 'background.default' }}>
            {loading ? (
              <List>
                {[1, 2, 3, 4, 5].map((i) => (
                  <ListItem key={i}>
                    <ListItemAvatar>
                      <Skeleton variant="circular" width={40} height={40} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Skeleton variant="text" width="40%" />}
                      secondary={<Skeleton variant="text" width="80%" />}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <List disablePadding>
                {messages.length === 0 ? (
                  <Typography align="center" color="text.secondary" sx={{ py: 4, variant: 'body2' }}>
                    No messages
                  </Typography>
                ) : (
                  messages.map((msg) => {
                    const from = getHeader(msg, 'from');
                    const subject = getHeader(msg, 'subject');
                    const msgIsUnread = isUnread(msg);
                    const isSelected = selectedId === msg.id;

                    return (
                      <ListItem key={msg.id} disablePadding divider>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => handleSelect(msg.id)}
                          sx={{
                            bgcolor: isSelected ? 'action.selected' : msgIsUnread ? 'action.hover' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: msgIsUnread ? 'primary.main' : 'grey.300', color: msgIsUnread ? 'primary.contrastText' : 'grey.700', width: 40, height: 40, fontSize: '0.875rem' }}>
                              {getInitials(from)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="baseline">
                                <Typography variant="body2" fontWeight={msgIsUnread ? 'bold' : 'medium'} noWrap>
                                  {from.split('<')[0].trim()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                                  {formatTime(msg.internalDate)}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {subject || '(no subject)'}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })
                )}
              </List>
            )}
          </Box>

          {/* Email View Pane */}
          <Box sx={{ flex: 1, bgcolor: 'background.paper', p: 3, overflowY: 'auto' }}>
            {selectedMessage ? (
              <Box>
                <Box mb={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    From: {getHeader(selectedMessage, 'from')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {getHeader(selectedMessage, 'subject') || '(no subject)'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.snippet}
                </Typography>
              </Box>
            ) : (
              <Box height="100%" display="flex" alignItems="center" justifyContent="center">
                <Typography color="text.secondary">Select a message to read</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
