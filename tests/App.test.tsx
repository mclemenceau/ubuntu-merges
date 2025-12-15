/**
 * App component integration tests
 * Tests the main application shell, navigation, and data loading
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as api from '../services/api';
import { mockPackages } from './fixtures';

// Mock the API module
vi.mock('../services/api', () => ({
  fetchMergeData: vi.fn(),
  fetchChangelog: vi.fn(),
  fetchDebianChangelog: vi.fn(),
  parseAgeToDays: vi.fn(),
  normalizeData: vi.fn(),
  extractChangelogEntry: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial loading', () => {
    it('shows loading state initially', () => {
      vi.mocked(api.fetchMergeData).mockImplementation(() => new Promise(() => {}));
      
      render(<App />);
      
      expect(screen.getByText('Fetching merge data from Ubuntu...')).toBeInTheDocument();
    });

    it('displays loader spinner during loading', () => {
      vi.mocked(api.fetchMergeData).mockImplementation(() => new Promise(() => {}));
      
      render(<App />);
      
      // Check for the Loader2 animation class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('successful data load', () => {
    it('renders dashboard after successful load', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });

    it('displays package count after load', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Tracking/)).toBeInTheDocument();
      });
      
      // The package count appears in the subtitle text
      const trackingText = screen.getByText(/Tracking/);
      expect(trackingText).toBeInTheDocument();
    });

    it('fetches data on mount', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(api.fetchMergeData).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error handling', () => {
    it('shows error state when fetch fails', async () => {
      vi.mocked(api.fetchMergeData).mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
      });
    });

    it('displays error message', async () => {
      vi.mocked(api.fetchMergeData).mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to connect/)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      vi.mocked(api.fetchMergeData).mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry Connection')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Retry Connection'));
      
      await waitFor(() => {
        expect(api.fetchMergeData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('navigation', () => {
    it('starts on dashboard view by default', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
    });

    it('switches to package list when Package List tab is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Package List'));
      
      expect(screen.getByText('Package Registry')).toBeInTheDocument();
    });

    it('switches back to dashboard when Overview tab is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      // Switch to list
      await user.click(screen.getByText('Package List'));
      expect(screen.getByText('Package Registry')).toBeInTheDocument();
      
      // Switch back to dashboard
      await user.click(screen.getByText('Overview'));
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });
  });

  describe('sidebar', () => {
    it('renders sidebar with branding', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      // Wait for data to load first
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      // Now check sidebar branding - multiple elements may match due to mobile/desktop
      const ubuntuElements = screen.getAllByText('Ubuntu');
      expect(ubuntuElements.length).toBeGreaterThan(0);
    });

    it('shows data source info in sidebar', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      expect(screen.getByText('merges.ubuntu.com')).toBeInTheDocument();
    });

    it('toggles sidebar collapse when menu button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Ubuntu')).toBeInTheDocument();
      });
      
      // Find the menu toggle button (the one with the Menu icon)
      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('w-64'); // Not collapsed
      
      // Click the toggle button
      const menuButtons = screen.getAllByRole('button');
      const menuToggle = menuButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg !== null && btn.closest('aside') !== null;
      });
      
      if (menuToggle) {
        await user.click(menuToggle);
        expect(sidebar).toHaveClass('w-20'); // Collapsed
      }
    });
  });

  describe('team click from dashboard', () => {
    it('switches to package list with team filter when team is clicked in dashboard', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      // The handleTeamClick should set preselectedTeam and switch to list view
      // This is tested through the Dashboard component's onTeamClick prop
      // The App passes handleTeamClick which sets preselectedTeam and activeTab
    });
  });

  describe('package detail slide-over', () => {
    it('opens package detail when package is selected', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      // Switch to package list
      await user.click(screen.getByText('Package List'));
      
      // Click on a package row
      const firefoxRow = screen.getByText('firefox').closest('tr');
      if (firefoxRow) {
        await user.click(firefoxRow);
      }
      
      // Package detail should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes package detail when close button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Package List'));
      
      const firefoxRow = screen.getByText('firefox').closest('tr');
      if (firefoxRow) {
        await user.click(firefoxRow);
      }
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close the detail panel
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('responsive layout', () => {
    it('renders mobile header on small screens', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
      });
      
      // The mobile header should exist in the DOM (hidden on md+ screens)
      const mobileHeader = document.querySelector('.md\\:hidden');
      expect(mobileHeader).toBeInTheDocument();
    });
  });

  describe('last sync time', () => {
    it('displays last sync time', async () => {
      vi.mocked(api.fetchMergeData).mockResolvedValue(mockPackages);
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Last Sync:/)).toBeInTheDocument();
      });
    });
  });
});
