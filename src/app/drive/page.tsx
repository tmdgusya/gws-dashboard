'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Folder, FileText, Image, FileSpreadsheet, Presentation, File, Upload, MoreVertical } from 'lucide-react';

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
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('spreadsheet')) return FileSpreadsheet;
  if (mimeType.includes('document')) return FileText;
  if (mimeType.includes('presentation')) return Presentation;
  if (mimeType.includes('folder')) return Folder;
  return File;
}

function getFileColor(mimeType: string) {
  if (mimeType.includes('image')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
  if (mimeType.includes('spreadsheet')) return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
  if (mimeType.includes('document')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
  if (mimeType.includes('presentation')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
  if (mimeType.includes('folder')) return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
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

  const selectedFile = files.find(f => f.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
        <div className="p-4">
          <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors cursor-pointer">
            <Upload className="w-5 h-5" />
            <span>Upload</span>
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-2">
          <button
            onClick={handleBack}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
              currentFolder === 'root'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Folder className="w-5 h-5" />
            <span>My Drive</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center gap-4 bg-white dark:bg-zinc-900">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800' : ''
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-800' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950">
          {loading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Folder className="w-12 h-12 mb-4" />
              <p>No files found</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const colorClass = getFileColor(file.mimeType);
                const isSelected = selectedId === file.id;

                return (
                  <div
                    key={file.id}
                    onClick={() => handleSelect(file.id)}
                    onDoubleClick={() => handleOpen(file)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-950'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(file.modifiedTime)}
                        {file.size && `· ${formatSize(file.size)}`}
                      </p>
                    </div>
                    {file.shared && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">Shared</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {files.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                const colorClass = getFileColor(file.mimeType);
                const isSelected = selectedId === file.id;

                return (
                  <div
                    key={file.id}
                    onClick={() => handleSelect(file.id)}
                    onDoubleClick={() => handleOpen(file)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-950'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-2`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{formatDate(file.modifiedTime)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
