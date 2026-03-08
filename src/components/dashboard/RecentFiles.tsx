'use client';

import Link from 'next/link';
import { FileText, Image, FileSpreadsheet, Presentation, File } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: number;
  webViewLink?: string;
}

interface RecentFilesProps {
  files?: DriveFile[];
  loading?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('spreadsheet')) return FileSpreadsheet;
  if (mimeType.includes('document')) return FileText;
  if (mimeType.includes('presentation')) return Presentation;
  return File;
}

function getFileColor(mimeType: string) {
  if (mimeType.includes('image')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300';
  if (mimeType.includes('spreadsheet')) return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
  if (mimeType.includes('document')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
  if (mimeType.includes('presentation')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300';
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

export default function RecentFiles({ files = [], loading = false }: RecentFilesProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Files</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Files</h3>
        <Link href="/drive" className="text-sm text-blue-600 hover:text-blue-700">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {files.length === 0 ? (
          <p className="text-zinc-500 text-sm col-span-full text-center py-4">No recent files</p>
        ) : (
          files.slice(0, 5).map((file) => {
            const Icon = getFileIcon(file.mimeType);
            const colorClass = getFileColor(file.mimeType);
            
            return (
              <Link
                key={file.id}
                href={file.webViewLink || `/drive?file=${file.id}`}
                target={file.webViewLink ? '_blank' : undefined}
                className="group p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-2`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium truncate group-hover:text-blue-600">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDate(file.modifiedTime)}
                </p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
