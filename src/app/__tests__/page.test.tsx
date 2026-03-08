import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Dashboard Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * REGRESSION TEST: Dashboard should fetch full message metadata
   *
   * Issue: The dashboard was only fetching message list (IDs only) and passing
   * those directly to RecentEmails component. This caused all emails to show
   * as "(no subject) — ..." because the list API doesn't include payload data.
   *
   * Fix: For each message returned from list, fetch full metadata.
   */
  it('fetches full message metadata for each email to display subject and snippet', async () => {
    // Mock message list response (only contains IDs - what Gmail list API returns)
    const messageListResponse = {
      messages: [
        { id: 'msg1', threadId: 'thread1' },
        { id: 'msg2', threadId: 'thread2' },
        { id: 'msg3', threadId: 'thread3' },
      ],
      resultSizeEstimate: 3,
    };

    // Mock full message details (what metadata API returns)
    const fullMessageDetails = [
      {
        id: 'msg1',
        threadId: 'thread1',
        snippet: 'Meeting tomorrow at 2pm',
        internalDate: Date.now().toString(),
        labelIds: ['INBOX', 'UNREAD'],
        payload: {
          headers: [
            { name: 'Subject', value: 'Team Meeting' },
            { name: 'From', value: 'John Doe <john@example.com>' },
          ],
        },
      },
      {
        id: 'msg2',
        threadId: 'thread2',
        snippet: 'Your invoice is ready',
        internalDate: Date.now().toString(),
        labelIds: ['INBOX'],
        payload: {
          headers: [
            { name: 'Subject', value: 'Invoice #1234' },
            { name: 'From', value: 'Billing <billing@example.com>' },
          ],
        },
      },
      {
        id: 'msg3',
        threadId: 'thread3',
        snippet: 'Project update for Q4',
        internalDate: Date.now().toString(),
        labelIds: ['INBOX'],
        payload: {
          headers: [
            { name: 'Subject', value: 'Q4 Roadmap' },
            { name: 'From', value: 'Jane Smith <jane@example.com>' },
          ],
        },
      },
    ];

    // Setup fetch mock to return different responses based on URL
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/gmail/messages?') && !url.includes('/api/gmail/messages/')) {
        // List endpoint
        return Promise.resolve({
          json: () => Promise.resolve(messageListResponse),
        });
      }
      if (url.includes('/api/gmail/messages/')) {
        // Metadata endpoint - find matching message
        const msgId = url.match(/messages\/([^?]+)/)?.[1];
        const msg = fullMessageDetails.find((m) => m.id === msgId);
        return Promise.resolve({
          json: () => Promise.resolve(msg || {}),
        });
      }
      if (url.includes('/api/calendar/events')) {
        return Promise.resolve({
          json: () => Promise.resolve({ items: [] }),
        });
      }
      if (url.includes('/api/drive/files')) {
        return Promise.resolve({
          json: () => Promise.resolve({ files: [] }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });

    render(<Home />);

    // Wait for all fetch calls to complete
    await waitFor(() => {
      // Should call list endpoint twice (emails + unread count)
      const listCalls = mockFetch.mock.calls.filter(
        (call) =>
          call[0].includes('/api/gmail/messages?') &&
          !call[0].includes('/api/gmail/messages/')
      );
      expect(listCalls.length).toBeGreaterThanOrEqual(2);
    });

    // Verify that metadata endpoints were called for each message
    await waitFor(() => {
      const metadataCalls = mockFetch.mock.calls.filter((call) =>
        call[0].includes('/api/gmail/messages/')
      );
      // Should fetch metadata for each of the 3 messages
      expect(metadataCalls).toHaveLength(3);
      expect(metadataCalls[0][0]).toContain('/api/gmail/messages/msg1?format=metadata');
      expect(metadataCalls[1][0]).toContain('/api/gmail/messages/msg2?format=metadata');
      expect(metadataCalls[2][0]).toContain('/api/gmail/messages/msg3?format=metadata');
    });

    // Verify subjects are rendered (not showing "(no subject)")
    // Using regex matchers since text may be split across multiple nodes
    await waitFor(() => {
      expect(screen.getByText(/Team Meeting/)).toBeInTheDocument();
      expect(screen.getByText(/Invoice #1234/)).toBeInTheDocument();
      expect(screen.getByText(/Q4 Roadmap/)).toBeInTheDocument();
    });
  });

  it('handles message with no subject by showing "(no subject)"', async () => {
    const messageListResponse = {
      messages: [{ id: 'msg1', threadId: 'thread1' }],
      resultSizeEstimate: 1,
    };

    const messageWithoutSubject = {
      id: 'msg1',
      threadId: 'thread1',
      snippet: 'Message without subject line',
      internalDate: Date.now().toString(),
      labelIds: ['INBOX'],
      payload: {
        headers: [
          // No subject header
          { name: 'From', value: 'sender@example.com' },
        ],
      },
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/gmail/messages?') && !url.includes('/api/gmail/messages/')) {
        return Promise.resolve({
          json: () => Promise.resolve(messageListResponse),
        });
      }
      if (url.includes('/api/gmail/messages/')) {
        return Promise.resolve({
          json: () => Promise.resolve(messageWithoutSubject),
        });
      }
      if (url.includes('/api/calendar/events')) {
        return Promise.resolve({
          json: () => Promise.resolve({ items: [] }),
        });
      }
      if (url.includes('/api/drive/files')) {
        return Promise.resolve({
          json: () => Promise.resolve({ files: [] }),
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({}),
      });
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/\(no subject\)/)).toBeInTheDocument();
    });
  });
});
