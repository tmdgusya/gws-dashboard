# GWS Workspace Hub - Design Document

## Overview

Transform the existing gws CLI API explorer into a personal productivity dashboard for Google Workspace (Gmail, Drive, Calendar). The API explorer is fully replaced. AI interaction happens through Claude Code with the installed `google-workspace` skill.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Google Material Design aesthetic
- Backend: `gws` CLI via `child_process.spawn` (existing pattern)

## Architecture: Service-Centric Routing

```
/              → Dashboard home (summary widgets)
/gmail         → Gmail client (inbox, compose, search, labels)
/drive         → Drive file manager (browse, preview, upload/download, share)
/calendar      → Calendar (month/week/day views, event CRUD)
```

### Layout

Top navigation bar for service switching. Full-width content area below.

```
┌──────────────────────────────────────────┐
│  [GWS] [Dashboard] [Gmail] [Drive] [Cal] │
├──────────────────────────────────────────┤
│            Main content (full width)      │
└──────────────────────────────────────────┘
```

## Page Designs

### Dashboard Home (`/`)

Three summary cards at top:
- Unread email count
- Today's event count
- Recent files count

Below: three sections showing recent emails (5), today's schedule, and recent files (5).

Data fetched in parallel from:
- `gws gmail users messages list --params '{"userId":"me","q":"is:unread","maxResults":5}'`
- `gws calendar events list --params '{"calendarId":"primary","timeMin":"<today>","timeMax":"<tomorrow>","singleEvents":true}'`
- `gws drive files list --params '{"pageSize":5,"orderBy":"modifiedTime desc","fields":"files(id,name,mimeType,modifiedTime,webViewLink)"}'`

### Gmail (`/gmail`)

Three-column layout:
1. **Left sidebar** (200px): Label navigation (Inbox, Starred, Sent, Drafts, Trash, custom labels) + Compose button
2. **Center**: Message list with search bar. Each row: checkbox, sender, subject snippet, timestamp, read/unread indicator
3. **Detail**: Clicking a message expands it below the list or opens a detail view showing full HTML body

Key API calls:
- List: `gws gmail users messages list --params '{"userId":"me","labelIds":"INBOX"}'`
- Read: `gws gmail users messages get --params '{"userId":"me","id":"<id>","format":"full"}'`
- Send: `gws gmail +send` (helper command)
- Labels: `gws gmail users labels list --params '{"userId":"me"}'`
- Search: `gws gmail users messages list --params '{"userId":"me","q":"<query>"}'`
- Modify labels: `gws gmail users messages modify --params '{"userId":"me","id":"<id>"}' --json '{"addLabelIds":["STARRED"]}'`

### Drive (`/drive`)

Two-column layout:
1. **Left sidebar** (200px): Folder tree navigation + Upload button
2. **Center**: File list (table or grid view toggle) with search bar. Columns: name, type icon, modified date, size, sharing status

Features:
- Folder navigation: click folder to enter, breadcrumb to go back
- File preview: Google Docs/Sheets/Slides open via webViewLink. Images display inline.
- Upload: drag-and-drop zone + file picker, uses `gws drive +upload`
- Download: `gws drive files get --params '{"fileId":"<id>","alt":"media"}' --output <path>`
- Share: dialog showing permissions, add/remove via `gws drive permissions`

Key API calls:
- List: `gws drive files list --params '{"q":"\"<folderId>\" in parents and trashed=false","fields":"files(id,name,mimeType,modifiedTime,size,webViewLink,shared)"}'`
- Upload: `gws drive +upload --upload <file>`
- Permissions: `gws drive permissions list --params '{"fileId":"<id>"}'`

### Calendar (`/calendar`)

Full-width layout:
- **Header**: Month/year navigation, view toggle (Month/Week/Day), "New Event" button
- **Grid**: Calendar grid matching selected view
- **Events**: Colored dots/bars on dates, click to open detail modal

Event modal (create/edit): title, start/end datetime, location, description, calendar selector.

Key API calls:
- List: `gws calendar events list --params '{"calendarId":"primary","timeMin":"<start>","timeMax":"<end>","singleEvents":true,"orderBy":"startTime"}'`
- Create: `gws calendar +insert` or `gws calendar events insert`
- Update: `gws calendar events update --params '{"calendarId":"primary","eventId":"<id>"}' --json '{...}'`
- Delete: `gws calendar events delete --params '{"calendarId":"primary","eventId":"<id>"}'`

## Backend Architecture

Reuse existing `/api/cli` route pattern. Add typed wrapper routes for cleaner frontend consumption:

```
/api/gmail/messages      → list, get, send
/api/gmail/labels        → list
/api/drive/files         → list, get, upload, download
/api/drive/permissions   → list, create, delete
/api/calendar/events     → list, get, create, update, delete
```

Each route calls `gws` CLI under the hood, parses output, returns typed JSON.

## Design System

Google Material aesthetic via Tailwind:
- Rounded corners (rounded-xl for cards, rounded-full for FABs)
- Elevation shadows (shadow-sm, shadow-md)
- Material color palette (blue-600 primary, surface whites, zinc neutrals)
- 14px base font, Inter/system font
- Smooth transitions (transition-all duration-200)
- FAB-style compose/create buttons

## Non-Goals (v1)

- Multi-account support
- Offline mode
- Push notifications
- Mobile-responsive layout (desktop-first)
- AI chat in dashboard (use Claude Code + gws skill instead)
