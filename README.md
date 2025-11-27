# Ubuntu Merge Radar

**Ubuntu Merge Radar** is a specialized dashboard designed for Ubuntu and Debian developers. It provides a modern, responsive interface to track, visualize, and analyze packages that are pending merge from Debian into Ubuntu.

The application aggregates real-time data from `merges.ubuntu.com`, transforming raw JSON reports into an actionable operational dashboard. It simplifies the workflow for packagers by offering robust filtering, team analytics, and integrated changelog comparisons.

## ✨ Features

*   **Operational Dashboard**: Visualize the merge backlog with metrics on Total Packages, Average Age, and Active Teams. Charts break down the workload by Component (Main/Universe/Restricted/Multiverse) and Pending Age.
*   **Interactive Package Registry**: A powerful list view with search and multi-criteria filtering (Component, Team, Uploader, Age).
*   **Smart Changelog Comparison**:
    *   **Side-by-Side View**: Compare Ubuntu and Debian changelogs in a split-pane modal to quickly identify changes.
    *   **Intelligent Fetching**: Automatically locates and parses the specific changelog entry for the requested version, stripping away unrelated history.
*   **Canonical Branding**: Designed with the official Ubuntu color palette (Orange/Aubergine/Dark Grey) and typography for a native look and feel.
*   **Deep Linking**: Links directly to Launchpad source pages, Debian Tracker, and raw Merge Reports.

## 🚀 Usage

This project is a static Single Page Application (SPA) that runs directly in the browser. It requires no complex build step or backend server.

### Prerequisites
You need a simple HTTP server to serve the files. You can use:
*   Node.js `serve`
*   Python `http.server`
*   VS Code "Live Server" extension

### Running Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ubuntu-merge-radar.git
    cd ubuntu-merge-radar
    ```

2.  **Start a local server**:
    
    *   **Using Python 3**:
        ```bash
        python3 -m http.server 8000
        ```
    *   **Using Node.js**:
        ```bash
        npx serve .
        ```

3.  **Open in Browser**:
    Navigate to `http://localhost:8000` (or the port shown in your terminal).

## 📊 Data Sources

The application consumes public JSON endpoints provided by the Ubuntu Archive Team:
*   `merges.ubuntu.com/main.json`
*   `merges.ubuntu.com/universe.json`
*   `merges.ubuntu.com/restricted.json`
*   `merges.ubuntu.com/multiverse.json`

**Note on CORS**: Since these legacy endpoints do not send CORS headers, the application routes requests through public CORS proxies (e.g., `corsproxy.io`) to function in a browser environment.

## 🛠 Tech Stack

*   **Core**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Visualization**: [Recharts](https://recharts.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Architecture**: No-Build ES Modules (via `importmap`)

## 🎨 Design

The UI follows the [Canonical Design System](https://vanillaframework.io/docs) principles:
*   **Font**: Ubuntu (via Google Fonts)
*   **Primary Color**: Ubuntu Orange `#E95420`
*   **Secondary Color**: Canonical Dark Grey `#262626`
*   **Accent**: Ubuntu Aubergine `#77216F`

See `DESIGN.md` for detailed architectural and design decisions.

## 🔗 Resources

*   [Ubuntu Merge Reports](https://merges.ubuntu.com/)
*   [Ubuntu Packaging Guide](https://packaging.ubuntu.com/)
*   [Debian Package Tracker](https://tracker.debian.org/)
