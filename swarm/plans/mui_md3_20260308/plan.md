# Plan: Material Design 3 Redesign

## Phase 1: Setup & Environment 🔄 🔄 🔄 🔄 🔄 ✅
- [x] Task 1.1: Install MUI v6 dependencies (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@mui/material-nextjs`).
- [x] Task 1.2: Configure the Material 3 Theme with Light/Dark mode support and MD3 color palettes in a new `src/lib/theme.ts`.
- [x] Task 1.3: Update `src/app/layout.tsx` to include `AppRouterCacheProvider`, `ThemeProvider`, and `CssBaseline`.

## Phase 2: Navigation & Core Layout 🔄 🔄 🔄 ✅
- [x] Task 2.1: Replace `src/components/TopNav.tsx` with an MD3 `AppBar` and include a Light/Dark mode toggle.
- [x] Task 2.2: Refactor `src/components/chat/ChatPanel.tsx` to use MUI `Drawer` (or custom Paper), `Box`, `Typography`, and `TextField`, preserving the resize logic.

## Phase 3: Dashboard Redesign 🔄 🔄 🔄 🔄 🔄 🔄 🔄 🔄 ❌
- [x] Task 3.1: Redesign `src/components/dashboard/SummaryCards.tsx` using MUI `Card` and `Grid2`.
- [!] Task 3.2: Redesign `src/components/dashboard/RecentEmails.tsx` and `TodaySchedule.tsx` using MUI `List`, `ListItem`, and `Card`.
- [x] Task 3.3: Redesign `src/components/dashboard/RecentFiles.tsx` using MUI `Table` or `List` within a `Card`.

## Phase 4: Sub-Page Redesign 🔄 🔄 🔄 🔄 ❌
- [!] Task 4.1: Redesign `src/app/gmail/page.tsx` using MUI `List` and `Paper`.
- [!] Task 4.2: Redesign `src/app/drive/page.tsx` using MUI `Grid2` for file cards or a `Table`.
- [!] Task 4.3: Redesign `src/app/calendar/page.tsx` using MUI components for event lists and calendar controls.

## Phase 5: Cleanup & Verification
- [ ] Task 5.1: Replace all remaining Lucide icons with Material Symbols across the entire codebase.
- [ ] Task 5.2: Remove unused Tailwind classes and CSS that conflict with MUI.
- [ ] Task 5.3: Verify responsiveness and theme consistency (Light/Dark mode) on all pages.
