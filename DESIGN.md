
# Ubuntu Merges Tracker - Design Document

## Overview

**Ubuntu Merges Tracker** is a specialized dashboard designed for Debian and Ubuntu packagers. It tracks the status of packages that are "pending merge" from Debian into Ubuntu. It ingests real-time data from `merges.ubuntu.com`, normalizes it, and provides a modern, interactive interface to visualize workloads, filter by teams/uploaders, and compare version changelogs.

## Architecture

The application is a **Client-Side Single Page Application (SPA)** built with React and TypeScript. It operates without a dedicated backend server, relying on browser-based data fetching through CORS proxies to interact with Ubuntu's legacy reporting infrastructure.

### Data Flow
1.  **Ingestion**: Fetches JSON reports (Main, Universe, Restricted, Multiverse) from `merges.ubuntu.com`.
2.  **Proxying**: Uses a rotating list of CORS proxies (`corsproxy.io`, `allorigins.win`, `codetabs.com`) to bypass browser CORS restrictions on the source servers.
3.  **Normalization**: Converts varied raw data structures (Arrays vs Objects) into a unified `MergePackage` schema.
4.  **Enrichment**: Parses raw text fields to derive "Age in Days" and "Uploader Name" for sorting/filtering.

## Visual Identity & Branding

The design strictly follows **Canonical's Branding Guidelines** to ensure the tool feels native to the Ubuntu ecosystem.

*   **Typography**: `Ubuntu` font family used throughout.
*   **Color Palette**:
    *   **Ubuntu Orange** (`#E95420`): Primary actions, highlights, active states, "Needs Merge" indicators.
    *   **Canonical Dark Grey** (`#262626`): Sidebar, headers, text.
    *   **Ubuntu Aubergine** (`#77216F`): Secondary accents, charts (Teams).
    *   **Canonical Green** (`#0E8420`): Positive actions (Retry, Analyze).
    *   **Warm Grey** (`#AEA79F`): Subtitles, inactive icons, outdated status.

## Core Components

### 1. App Shell (`App.tsx`)
*   **Layout**: A responsive layout with a collapsible sidebar and a main content area.
*   **Sidebar**: Contains navigation (Overview vs List), branding, and footer info. Collapses to a slim 80px bar to maximize screen real estate.
*   **State Management**: Holds the global `data` array and connection error states.

### 2. Dashboard (`components/Dashboard.tsx`)
*   **Purpose**: High-level operational awareness.
*   **Visualizations** (via `recharts`):
    *   **Age Distribution**: Bar chart showing how long packages have been pending.
    *   **Component Distribution**: Bar chart comparing Main vs Universe vs Restricted vs Multiverse.
    *   **Top Teams**: Interactive bar chart showing the busiest teams. Clicking a bar filters the Package List.
*   **Metrics**: Total Packages, Average Age, Active Teams count.

### 3. Package Registry (`components/PackageList.tsx`)
*   **Purpose**: The primary work surface for packagers.
*   **Features**:
    *   **Filtering**: Robust filter bar for Name (Search), Component, Team, Uploader, and Age.
    *   **Sorting**: Sort by Package Name, Age (default), or Versions.
    *   **Pagination**: Client-side pagination (25 items/page).
    *   **Badges**: Visual indicators for component types (Orange/Purple/Yellow/Blue).

### 4. Package Detail (`components/PackageDetail.tsx`)
*   **UX Pattern**: Slide-over panel (draws form right) to maintain context of the list.
*   **Features**:
    *   **Version Grid**: Prominent display of Ubuntu vs Debian versions.
    *   **Interactive Comparison**: Clickable version boxes trigger Changelog modals.
    *   **External Links**: Direct deep-links to Launchpad, Debian Tracker, and raw Merge Reports.
    *   **Contact Info**: Parsed Uploader name and email (mailto link).

### 5. Modals
*   **ChangelogModal**: Fetches raw text from `changelogs.ubuntu.com` or `tracker.debian.org`. It uses a heuristic to find the specific version block within the changelog file and "trims" the excess, showing only the relevant entry.
*   **ComparisonModal**: A split-view modal that fetches both Ubuntu and Debian changelogs simultaneously for side-by-side diffing.

## Services

### API Service (`services/api.ts`)
*   **`fetchMergeData`**: Parallel fetching of all 4 dataset types with error handling.
*   **`fetchChangelog`**: Constructs the complex URL paths required by Ubuntu's changelog server (handling `lib` prefixes and epochs).
*   **`fetchDebianChangelog`**: Handles Debian's specific URL patterns on their tracker.
*   **`normalizeData`**: A robust parser that handles inconsistencies in the upstream JSON (case sensitivity, missing fields, array vs object formats).

## Libraries & Tech Stack

*   **React 19**: Core UI library.
*   **TypeScript**: Type safety, particularly for the Data Models (`MergePackage`).
*   **Vite 6**: Fast dev server with HMR and production bundler.
*   **Tailwind CSS**: Utility-first styling for rapid, responsive layout.
*   **Recharts**: Composable charting library for React.
*   **Lucide React**: Consistent, clean icon set.

## Testing Architecture

The application includes comprehensive automated testing:

### Unit Tests (Vitest + React Testing Library)
*   **Location**: `tests/` directory
*   **Scope**:
    *   Component rendering and user interactions
    *   API service functions (data fetching, parsing, normalization)
    *   Edge cases and error handling
*   **Configuration**: `vitest.config.ts`

### E2E Tests (Playwright)
*   **Location**: `e2e/` directory
*   **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
*   **Scope**:
    *   Full user workflows (navigation, search, filtering)
    *   Modal interactions (changelog, comparison)
    *   Error states and retry functionality
    *   Responsive design across viewports
*   **Configuration**: `playwright.config.ts`

### Test Commands
```bash
npm run test:unit          # Unit tests
npm run test:unit:coverage # With coverage report
npm run test:e2e           # E2E tests (headless)
npm run test:e2e:ui        # E2E with interactive UI
```
