'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Button, IconButton, InputBase, Skeleton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import BackupTableIcon from '@mui/icons-material/BackupTable';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import UploadIcon from '@mui/icons-material/Upload';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: number;
  webViewLink?: string;
  parents?: string[];
  shared?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('image')) return ImageIcon;
  if (mimeType.includes('spreadsheet')) return BackupTableIcon;
  if (mimeType.includes('document')) return DescriptionIcon;
  if (mimeType.includes('presentation')) return SlideshowIcon;
  if (mimeType.includes('folder')) return FolderIcon;
  return InsertDriveFileIcon;
}

function getFileColor(mimeType: string) {
  if (mimeType.includes('image')) return { bg: '#F3E8FF', text: '#9333EA' };
  if (mimeType.includes('spreadsheet')) return { bg: '#DCFCE7', text: '#16A34A' };
  if (mimeType.includes('document')) return { bg: '#DBEAFE', text: '#2563EB' };
  if (mimeType.includes('presentation')) return { bg: '#FEF9C3', text: '#CA8A04' };
  if (mimeType.includes('folder')) return { bg: '#F4F4F5', text: '#52525B' };
  return { bg: '#F4F4F5', text: '#52525B' };
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export default function DrivePage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchFiles = useCallback(async (folderId?: string, query?: string) => {
    setLoading(true);
    try {
      let q = 'trashed=false';
      if (folderId && folderId !== 'root') {
        q += ` and "${folderId}" in parents`;
      }
      if (query) {
        q += ` and name contains '${query}'`;
      }

      const res = await fetch(`/api/drive/files?pageSize=50&q=${encodeURIComponent(q)}&orderBy=modifiedTime desc`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentFolder === 'root' ? undefined : currentFolder, searchQuery);
  }, [currentFolder, searchQuery, fetchFiles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleOpen = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setCurrentFolder(file.id);
      setSelectedId(null);
      setSearchQuery('');
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleBack = () => {
    setCurrentFolder('root');
    setSelectedId(null);
    setSearchQuery('');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    if (currentFolder !== 'root') {
      formData.append('parents', JSON.stringify([currentFolder]));
    }

    try {
      await fetch('/api/drive/files', {
        method: 'POST',
        body: formData
      });
      fetchFiles(currentFolder === 'root' ? undefined : currentFolder, searchQuery);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar */}
      <Box sx={{ width: 224, borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2 }}>
          <Button
            component="label"
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<UploadIcon />}
            sx={{ py: 1.5, borderRadius: 3, textTransform: 'none', fontSize: '1rem' }}
          >
            Upload
            <input
              type="file"
              hidden
              onChange={handleUpload}
            />
          </Button>
        </Box>
        
        <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              selected={currentFolder === 'root'}
              onClick={handleBack}
              sx={{ borderRadius: 2, '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.dark' } }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText primary="My Drive" primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: 56, borderBottom: 1, borderColor: 'divider', px: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search files..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{ flex: 1, fontSize: '0.875rem' }}
          />
          <Box display="flex" gap={1}>
            <IconButton onClick={() => setViewMode('list')} color={viewMode === 'list' ? 'primary' : 'default'}>
              <ViewListIcon />
            </IconButton>
            <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'}>
              <GridViewIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: 'background.default' }}>
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Grid size={{ xs: 12, sm: viewMode === 'grid' ? 6 : 12, md: viewMode === 'grid' ? 4 : 12, lg: viewMode === 'grid' ? 3 : 12 }} key={i}>
                  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3 }} variant="outlined">
                    <Skeleton variant="rounded" width={48} height={48} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : files.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" color="text.secondary">
              <FolderIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography>No files found</Typography>
            </Box>
          ) : viewMode === 'list' ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell width={150}>Last modified</TableCell>
                    <TableCell width={100}>File size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    const colors = getFileColor(file.mimeType);
                    const isSelected = selectedId === file.id;

                    return (
                      <TableRow
                        key={file.id}
                        hover
                        onClick={() => handleSelect(file.id)}
                        onDoubleClick={() => handleOpen(file)}
                        selected={isSelected}
                        sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon fontSize="small" />
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {file.name}
                            </Typography>
                            {file.shared && (
                              <Typography variant="caption" color="primary">Shared</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{formatDate(file.modifiedTime)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{formatSize(file.size)}</Typography></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Grid container spacing={2}>
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const colors = getFileColor(file.mimeType);
                const isSelected = selectedId === file.id;

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
                    <Paper
                      variant="outlined"
                      onClick={() => handleSelect(file.id)}
                      onDoubleClick={() => handleOpen(file)}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        cursor: 'pointer',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'action.selected' : 'background.paper',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: colors.bg, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Icon />
                      </Box>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatDate(file.modifiedTime)}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
