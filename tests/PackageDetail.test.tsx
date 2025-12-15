/**
 * PackageDetail component tests
 * Tests slide-over panel behavior, data display, and link generation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackageDetail } from '../components/PackageDetail';
import { createMockPackage } from './fixtures';
import { PackageSet } from '../types';

// Mock the API functions
vi.mock('../services/api', () => ({
  fetchChangelog: vi.fn().mockResolvedValue('Mock Ubuntu changelog content'),
  fetchDebianChangelog: vi.fn().mockResolvedValue('Mock Debian changelog content'),
}));

describe('PackageDetail', () => {
  const mockOnClose = vi.fn();
  const mockPackage = createMockPackage({
    name: 'test-package',
    ubuntuVersion: '1.0-1ubuntu1',
    debianVersion: '1.0-2',
    component: PackageSet.MAIN,
    teams: ['ubuntu-desktop', 'foundations'],
    uploader: 'Test User <test@example.com>',
  });

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('rendering', () => {
    it('returns null when pkg is null', () => {
      const { container } = render(<PackageDetail pkg={null} onClose={mockOnClose} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders slide-over panel when pkg is provided', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays package name in header', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('test-package')).toBeInTheDocument();
    });

    it('displays component badge', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('Main')).toBeInTheDocument();
    });
  });

  describe('version display', () => {
    it('displays Ubuntu version', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('1.0-1ubuntu1')).toBeInTheDocument();
    });

    it('displays Debian version', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('1.0-2')).toBeInTheDocument();
    });

    it('displays Ubuntu Version label', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('Ubuntu Version')).toBeInTheDocument();
    });

    it('displays Debian Version label', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('Debian Version')).toBeInTheDocument();
    });
  });

  describe('uploader information', () => {
    it('displays uploader name', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays uploader email as mailto link', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      const emailLink = screen.getByText('test@example.com');
      expect(emailLink).toBeInTheDocument();
      expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:test@example.com');
    });

    it('handles Unknown uploader gracefully', () => {
      const unknownUploader = createMockPackage({ uploader: 'Unknown' });
      render(<PackageDetail pkg={unknownUploader} onClose={mockOnClose} />);
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('handles uploader without email', () => {
      const noEmail = createMockPackage({ uploader: 'Just Name' });
      render(<PackageDetail pkg={noEmail} onClose={mockOnClose} />);
      expect(screen.getByText('Just Name')).toBeInTheDocument();
      // Should not have any mailto links in this case
      expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
    });
  });

  describe('teams display', () => {
    it('displays all teams', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('ubuntu-desktop')).toBeInTheDocument();
      expect(screen.getByText('foundations')).toBeInTheDocument();
    });

    it('renders Teams heading', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    it('does not render Teams section when no teams', () => {
      const noTeams = createMockPackage({ teams: [] });
      render(<PackageDetail pkg={noTeams} onClose={mockOnClose} />);
      expect(screen.queryByText('Teams')).not.toBeInTheDocument();
    });
  });

  describe('external links', () => {
    it('renders Launchpad link with correct URL', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      const lpLink = screen.getByText('View on Launchpad');
      expect(lpLink.closest('a')).toHaveAttribute(
        'href',
        'https://launchpad.net/ubuntu/+source/test-package'
      );
    });

    it('renders Debian Tracker link with correct URL', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      const debianLink = screen.getByText('Debian Package Tracker');
      expect(debianLink.closest('a')).toHaveAttribute(
        'href',
        'https://tracker.debian.org/pkg/test-package'
      );
    });

    it('renders Merge Report link with correct URL', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      const reportLink = screen.getByText('Merge Report');
      expect(reportLink.closest('a')).toHaveAttribute(
        'href',
        'https://merges.ubuntu.com/t/test-package/REPORT'
      );
    });

    it('generates correct URL prefix for lib packages', () => {
      const libPkg = createMockPackage({ name: 'libgtk3' });
      render(<PackageDetail pkg={libPkg} onClose={mockOnClose} />);
      const reportLink = screen.getByText('Merge Report');
      // lib packages should use first 4 chars as prefix
      expect(reportLink.closest('a')).toHaveAttribute(
        'href',
        'https://merges.ubuntu.com/libg/libgtk3/REPORT'
      );
    });

    it('opens links in new tab', () => {
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      const lpLink = screen.getByText('View on Launchpad').closest('a');
      expect(lpLink).toHaveAttribute('target', '_blank');
      expect(lpLink).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      
      // Find the backdrop (the semi-transparent overlay)
      const backdrop = document.querySelector('.bg-opacity-75');
      if (backdrop) {
        await user.click(backdrop);
      }
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('changelog modal triggers', () => {
    it('opens Ubuntu changelog modal when Ubuntu version box is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      
      const ubuntuVersionBox = screen.getByText('Ubuntu Version').closest('div');
      if (ubuntuVersionBox) {
        await user.click(ubuntuVersionBox);
      }
      
      // The ChangelogModal should appear
      await waitFor(() => {
        expect(screen.getByText(/Ubuntu Changes/i)).toBeInTheDocument();
      });
    });

    it('opens Debian changelog modal when Debian version box is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      
      const debianVersionBox = screen.getByText('Debian Version').closest('div');
      if (debianVersionBox) {
        await user.click(debianVersionBox);
      }
      
      await waitFor(() => {
        expect(screen.getByText(/Debian Changes/i)).toBeInTheDocument();
      });
    });

    it('opens comparison modal when compare button is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageDetail pkg={mockPackage} onClose={mockOnClose} />);
      
      const compareButton = screen.getByTitle('Compare Versions Side-by-Side');
      await user.click(compareButton);
      
      await waitFor(() => {
        expect(screen.getByText('Version Comparison')).toBeInTheDocument();
      });
    });
  });

  describe('component badge colors', () => {
    it('uses correct color for Main component', () => {
      const mainPkg = createMockPackage({ component: PackageSet.MAIN });
      render(<PackageDetail pkg={mainPkg} onClose={mockOnClose} />);
      const badge = screen.getByText('Main');
      expect(badge).toHaveClass('bg-[#E95420]');
    });

    it('uses correct color for Universe component', () => {
      const universePkg = createMockPackage({ component: PackageSet.UNIVERSE });
      render(<PackageDetail pkg={universePkg} onClose={mockOnClose} />);
      const badge = screen.getByText('Universe');
      expect(badge).toHaveClass('bg-[#77216F]');
    });

    it('uses correct color for Restricted component', () => {
      const restrictedPkg = createMockPackage({ component: PackageSet.RESTRICTED });
      render(<PackageDetail pkg={restrictedPkg} onClose={mockOnClose} />);
      const badge = screen.getByText('Restricted');
      expect(badge).toHaveClass('bg-yellow-600');
    });

    it('uses correct color for Multiverse component', () => {
      const multiversePkg = createMockPackage({ component: PackageSet.MULTIVERSE });
      render(<PackageDetail pkg={multiversePkg} onClose={mockOnClose} />);
      const badge = screen.getByText('Multiverse');
      expect(badge).toHaveClass('bg-blue-600');
    });
  });
});
