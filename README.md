# Ubuntu Merge Radar

**DISCLAIMER**: My intention with this project is to evaluate Google ai studio
while doing a fun little project for the Ubuntu Community and learn a few new
things along the way. I'm not a web developer and can't properly assess the
quality and maintainability of this application but part of the experiment is to
do this assessment, potentially try copilot to do post ai studio cleanup and
learn about npm deployment and maybe even snap or charm the final app.
Feedback welcome!

**Ubuntu Merge Radar** is a specialized dashboard designed for Ubuntu and Debian
developers. It provides a modern, responsive interface to track, visualize, and
analyze packages that are pending merge from Debian into Ubuntu.

The application aggregates real-time data from `merges.ubuntu.com`, transforming
raw JSON reports into an actionable operational dashboard. It simplifies the
workflow for packagers by offering filtering, team analytics, and integrated
changelog comparisons.

## ✨ Features

*   **Dashboard**: Visualize the merge backlog with metrics on Total Packages,
  Average Age, and Active Teams. Charts break down the workload by Component
  (Main/Universe/Restricted/Multiverse) and Pending Age.
*   **Interactive Package Registry**: A list view with search and multi-criteria
  filtering (Component, Team, Uploader, Age).
*   **Changelog Comparison**:
    *   **Side-by-Side View**: Compare Ubuntu and Debian changelogs in a
        split-pane modal to quickly identify changes.
    *   **Changelog Fetching**: Automatically locates and parses the specific
        changelog entry for the requested version, stripping away unrelated
        history.
*   **Canonical Branding**: Designed with the official Ubuntu color palette
    (Orange/Aubergine/Dark Grey) and typography for a native look and feel.
*   **Linking**: Links directly to Launchpad source pages, Debian Tracker,
    and raw Merge Reports.

## 🚀 Usage

This project is a static Single Page Application that runs directly in the
browser. It requires no complex build step or backend server.

### Prerequisites
You will need Node.js installed, On Ubuntu I went for the node snap which offers
multiple version of node on different branch.
```
sudo snap install --channel 24/stable node
```
### Running Locally

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mclemenceau/ubuntu-merges.git
    cd ubuntu-merges
    ```

2.  **Start a local server**:

    *   **Using Node.js**:
        ```bash
        npm install
        npm run dev
        ```

3.  **Open in Browser**:
    Navigate to `http://localhost:8000` (or the port shown in your terminal).

## 📊 Data Sources

The application consumes public JSON endpoints provided by the Ubuntu Archive
Team:
*   `merges.ubuntu.com/main.json`
*   `merges.ubuntu.com/universe.json`
*   `merges.ubuntu.com/restricted.json`
*   `merges.ubuntu.com/multiverse.json`

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
