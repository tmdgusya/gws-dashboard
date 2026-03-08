# Spec: Material Design 3 Redesign

## Overview
Redesign the GWS Workspace Hub UI/UX to follow the Google Material Design 3 (MD3) system using MUI v6. The goal is to provide a modern, cohesive look with native support for light and dark modes, while preserving all existing functionality.

## Functional Requirements
- **FR1: MUI v6 Integration:** Install and configure MUI v6, `@mui/material-nextjs`, and related dependencies.
- **FR2: Material Symbols:** Replace all Lucide icons with official Material Symbols (Outlined or Rounded).
- **FR3: Theme Implementation:** Implement a Material 3 Theme with support for Light and Dark modes.
- **FR4: Component Migration:** Replace custom Tailwind-based components with MUI components (AppBar, Drawer, Card, Button, Typography, etc.).
- **FR5: Layout Update:** Update the root layout to include MUI's `AppRouterCacheProvider` and `ThemeProvider`.

## Non-Functional Requirements
- **NFR1: Logical Parity:** No changes to API calls, data fetching logic, or state management.
- **NFR2: Performance:** Minimize layout shifts and ensure fast theme switching.
- **NFR3: Accessibility:** Ensure MUI components meet WCAG accessibility standards.

## Acceptance Criteria
- [ ] The dashboard and all sub-pages (Gmail, Drive, Calendar) use MUI MD3 components.
- [ ] Light and Dark modes are supported and follow MD3 color specifications.
- [ ] Lucide icons are completely removed and replaced with Material Symbols.
- [ ] Navigation (TopNav) is replaced with an MD3-style App Bar or Navigation Bar.
- [ ] Summary Cards, Recent Emails, Today's Schedule, and Recent Files use MD3 Cards and List items.

## Out of Scope
- Adding new business logic or features.
- Redesigning the API routes.
- Mobile-specific optimizations beyond standard MUI responsiveness.
