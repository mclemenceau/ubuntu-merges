/**
 * Modal component tests
 * Tests ChangelogModal and ComparisonModal behavior
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChangelogModal } from '../components/ChangelogModal';
import { ComparisonModal } from '../components/ComparisonModal';
import { createMockPackage } from './fixtures';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  fetchChangelog: vi.fn(),
  fetchDebianChangelog: vi.fn(),
  parseAgeToDays: vi.fn(),
  normalizeData: vi.fn(),
  extractChangelogEntry: vi.fn(),
}));

describe('ChangelogModal', () => {
  const mockOnClose = vi.fn();
  const mockPackage = createMockPackage({
    name: 'test-package',
    ubuntuVersion: '1.0-1ubuntu1',
    debianVersion: '1.0-2',
  });

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ChangelogModal pkg={mockPackage} isOpen={false} variant="ubuntu" onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders modal when isOpen is true', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays package name in title', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      expect(screen.getByText(/test-package/)).toBeInTheDocument();
    });
  });

  describe('ubuntu variant', () => {
    it('displays Ubuntu branding', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Ubuntu Changes for test-package')).toBeInTheDocument();
    });

    it('displays Ubuntu version', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      expect(screen.getByText('1.0-1ubuntu1')).toBeInTheDocument();
    });

    it('calls fetchChangelog for Ubuntu variant', async () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu changelog');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(api.fetchChangelog).toHaveBeenCalledWith(mockPackage);
      });
    });

    it('displays changelog content after loading', async () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu changelog content here');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Ubuntu changelog content here')).toBeInTheDocument();
      });
    });
  });

  describe('debian variant', () => {
    it('displays Debian branding', () => {
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="debian" onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Debian Changes for test-package')).toBeInTheDocument();
    });

    it('displays Debian version', () => {
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Changelog content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="debian" onClose={mockOnClose} />
      );
      
      expect(screen.getByText('1.0-2')).toBeInTheDocument();
    });

    it('calls fetchDebianChangelog for Debian variant', async () => {
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian changelog');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="debian" onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(api.fetchDebianChangelog).toHaveBeenCalledWith(mockPackage);
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while fetching', () => {
      // Don't resolve the promise immediately
      vi.mocked(api.fetchChangelog).mockImplementation(() => new Promise(() => {}));
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Fetching changelog...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(api.fetchChangelog).mockRejectedValue(new Error('Fetch failed'));
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Changelog Snippet Unavailable')).toBeInTheDocument();
      });
    });

    it('shows external link button on error', async () => {
      vi.mocked(api.fetchChangelog).mockRejectedValue(new Error('Fetch failed'));
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Open in Launchpad')).toBeInTheDocument();
      });
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchChangelog).mockResolvedValue('Content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      const closeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchChangelog).mockResolvedValue('Content');
      
      render(
        <ChangelogModal pkg={mockPackage} isOpen={true} variant="ubuntu" onClose={mockOnClose} />
      );
      
      const backdrop = document.querySelector('.bg-opacity-80');
      if (backdrop) {
        await user.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

describe('ComparisonModal', () => {
  const mockOnClose = vi.fn();
  const mockPackage = createMockPackage({
    name: 'comparison-test',
    ubuntuVersion: '2.0-1ubuntu1',
    debianVersion: '2.0-2',
  });

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('returns null when isOpen is false', () => {
      const { container } = render(
        <ComparisonModal pkg={mockPackage} isOpen={false} onClose={mockOnClose} />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('renders modal when isOpen is true', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays Version Comparison title', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Version Comparison')).toBeInTheDocument();
    });

    it('displays package name', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('comparison-test')).toBeInTheDocument();
    });
  });

  describe('split view', () => {
    it('displays both Ubuntu and Debian panels', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('Ubuntu')).toBeInTheDocument();
      expect(screen.getByText('Debian')).toBeInTheDocument();
    });

    it('displays both versions', () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      expect(screen.getByText('2.0-1ubuntu1')).toBeInTheDocument();
      expect(screen.getByText('2.0-2')).toBeInTheDocument();
    });

    it('fetches both changelogs in parallel', async () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu content');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian content');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(api.fetchChangelog).toHaveBeenCalledWith(mockPackage);
        expect(api.fetchDebianChangelog).toHaveBeenCalledWith(mockPackage);
      });
    });

    it('displays both changelog contents after loading', async () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu changelog text');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian changelog text');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Ubuntu changelog text')).toBeInTheDocument();
        expect(screen.getByText('Debian changelog text')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('shows error for Ubuntu panel if Ubuntu fetch fails', async () => {
      vi.mocked(api.fetchChangelog).mockRejectedValue(new Error('Ubuntu fetch failed'));
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian content');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Debian content')).toBeInTheDocument();
      });
    });

    it('shows error for Debian panel if Debian fetch fails', async () => {
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu content');
      vi.mocked(api.fetchDebianChangelog).mockRejectedValue(new Error('Debian fetch failed'));
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Ubuntu content')).toBeInTheDocument();
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
      });
    });

    it('shows both errors if both fetches fail', async () => {
      vi.mocked(api.fetchChangelog).mockRejectedValue(new Error('Ubuntu failed'));
      vi.mocked(api.fetchDebianChangelog).mockRejectedValue(new Error('Debian failed'));
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      await waitFor(() => {
        const unavailableTexts = screen.getAllByText('Unavailable');
        expect(unavailableTexts).toHaveLength(2);
      });
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      const closeButton = screen.getByText('Close Comparison');
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(api.fetchChangelog).mockResolvedValue('Ubuntu');
      vi.mocked(api.fetchDebianChangelog).mockResolvedValue('Debian');
      
      render(
        <ComparisonModal pkg={mockPackage} isOpen={true} onClose={mockOnClose} />
      );
      
      // Find the X button in the header
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));
      if (xButton) {
        await user.click(xButton);
      }
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
