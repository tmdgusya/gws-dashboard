'use client';

import { useEffect, useState } from 'react';
import SummaryCards from '@/components/dashboard/SummaryCards';
import RecentEmails from '@/components/dashboard/RecentEmails';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import RecentFiles from '@/components/dashboard/RecentFiles';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const today = new Date();
        const timeMin = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const timeMax = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const [emailsRes, eventsRes, filesRes, unreadRes] = await Promise.all([
          fetch('/api/gmail/messages?maxResults=5&labelIds=INBOX'),
          fetch(`/api/calendar/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=5`),
          fetch('/api/drive/files?pageSize=5&q=trashed=false&fields=files(id,name,mimeType,modifiedTime,webViewLink)&orderBy=modifiedTime desc'),
          fetch('/api/gmail/messages?maxResults=1&q=is:unread')
        ]);

        const emailsData = await emailsRes.json();
        const eventsData = await eventsRes.json();
        const filesData = await filesRes.json();
        const unreadData = await unreadRes.json();

        // Fetch full message details (metadata) for each email
        const emailDetails = emailsData.messages
          ? await Promise.all(
              emailsData.messages.map((msg: any) =>
                fetch(`/api/gmail/messages/${msg.id}?format=metadata`).then(r => r.json())
              )
            )
          : [];

        setEmails(emailDetails);
        setEvents(eventsData.items || []);
        setFiles(filesData.files || []);
        setUnreadCount(unreadData.resultSizeEstimate || 0);
        setEventCount((eventsData.items || []).length);
        setFileCount(filesData.files?.length || 0);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Welcome back! Here&apos;s your workspace overview.
        </p>
      </div>

      <div className="space-y-6">
        <SummaryCards 
          unreadCount={unreadCount}
          eventCount={eventCount}
          fileCount={fileCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentEmails messages={emails} loading={loading} />
          <TodaySchedule events={events} loading={loading} />
        </div>

        <RecentFiles files={files} loading={loading} />
      </div>
    </div>
  );
}
