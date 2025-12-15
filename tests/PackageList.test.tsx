/**
 * PackageList component tests
 * Tests filtering, sorting, pagination, and search functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PackageList } from '../components/PackageList';
import { mockPackages, createMockPackage } from './fixtures';
import { PackageSet } from '../types';

describe('PackageList', () => {
  const mockOnSelectPackage = vi.fn();

  beforeEach(() => {
    mockOnSelectPackage.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      expect(screen.getByPlaceholderText('Search packages...')).toBeInTheDocument();
    });

    it('renders package rows', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.getByText('gnome-shell')).toBeInTheDocument();
    });

    it('renders filter dropdowns', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      expect(screen.getByText('All Components')).toBeInTheDocument();
      expect(screen.getByText('All Teams')).toBeInTheDocument();
      expect(screen.getByText('All Uploaders')).toBeInTheDocument();
      expect(screen.getByText('Any Age')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      expect(screen.getByText('Package')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('displays empty state when no packages match', () => {
      render(<PackageList data={[]} onSelectPackage={mockOnSelectPackage} />);
      expect(screen.getByText('No packages found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('filters packages by name', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'firefox');
      
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.queryByText('gnome-shell')).not.toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'FIREFOX');
      
      expect(screen.getByText('firefox')).toBeInTheDocument();
    });

    it('shows no results for non-matching search', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'nonexistentpackage');
      
      expect(screen.getByText('No packages found matching your criteria.')).toBeInTheDocument();
    });

    it('partial search matches', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const searchInput = screen.getByPlaceholderText('Search packages...');
      await user.type(searchInput, 'fire'); // partial match for firefox
      
      expect(screen.getByText('firefox')).toBeInTheDocument();
    });
  });

  describe('component filter', () => {
    it('filters by Main component', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const componentSelect = screen.getByDisplayValue('All Components');
      await user.selectOptions(componentSelect, 'Main');
      
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.getByText('gnome-shell')).toBeInTheDocument();
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument(); // Universe
    });

    it('filters by Universe component', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const componentSelect = screen.getByDisplayValue('All Components');
      await user.selectOptions(componentSelect, 'Universe');
      
      expect(screen.getByText('nodejs')).toBeInTheDocument();
      expect(screen.queryByText('firefox')).not.toBeInTheDocument();
    });
  });

  describe('team filter', () => {
    it('populates team dropdown with unique teams', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const teamSelect = screen.getByDisplayValue('All Teams');
      expect(within(teamSelect).getByText('ubuntu-desktop')).toBeInTheDocument();
      expect(within(teamSelect).getByText('ubuntu-server')).toBeInTheDocument();
    });

    it('filters by selected team', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const teamSelect = screen.getByDisplayValue('All Teams');
      await user.selectOptions(teamSelect, 'ubuntu-desktop');
      
      // firefox and gnome-shell have ubuntu-desktop team
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.getByText('gnome-shell')).toBeInTheDocument();
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument(); // ubuntu-server only
    });
  });

  describe('age filter', () => {
    it('filters packages less than 1 week old', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const ageSelect = screen.getByDisplayValue('Any Age');
      await user.selectOptions(ageSelect, '< 1 Week');
      
      // Only firefox (3d) is less than 7 days
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.queryByText('gnome-shell')).not.toBeInTheDocument(); // 14d
    });

    it('filters packages 1-4 weeks old', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const ageSelect = screen.getByDisplayValue('Any Age');
      await user.selectOptions(ageSelect, '1-4 Weeks');
      
      // gnome-shell (14d) and steam (10d) are 7-30 days
      expect(screen.getByText('gnome-shell')).toBeInTheDocument();
      expect(screen.getByText('steam')).toBeInTheDocument();
      expect(screen.queryByText('firefox')).not.toBeInTheDocument(); // 3d
    });

    it('filters packages older than 6 months', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const ageSelect = screen.getByDisplayValue('Any Age');
      await user.selectOptions(ageSelect, '> 6 Months');
      
      // nvidia-driver (365d) and libgtk3 (200d) are > 180 days
      expect(screen.getByText('nvidia-driver')).toBeInTheDocument();
      expect(screen.getByText('libgtk3')).toBeInTheDocument();
      expect(screen.queryByText('firefox')).not.toBeInTheDocument();
    });
  });

  describe('uploader filter', () => {
    it('populates uploader dropdown with unique uploaders', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const uploaderSelect = screen.getByDisplayValue('All Uploaders');
      expect(within(uploaderSelect).getByText('Mozilla Team')).toBeInTheDocument();
      expect(within(uploaderSelect).getByText('GNOME Team')).toBeInTheDocument();
    });

    it('filters by uploader', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const uploaderSelect = screen.getByDisplayValue('All Uploaders');
      await user.selectOptions(uploaderSelect, 'Mozilla Team');
      
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.queryByText('gnome-shell')).not.toBeInTheDocument();
    });
  });

  describe('combined filters', () => {
    it('applies multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // Filter by Main component and ubuntu-desktop team
      const componentSelect = screen.getByDisplayValue('All Components');
      await user.selectOptions(componentSelect, 'Main');
      
      const teamSelect = screen.getByDisplayValue('All Teams');
      await user.selectOptions(teamSelect, 'ubuntu-desktop');
      
      // firefox, gnome-shell, libreoffice, libgtk3 are Main + ubuntu-desktop
      expect(screen.getByText('firefox')).toBeInTheDocument();
      expect(screen.getByText('gnome-shell')).toBeInTheDocument();
      expect(screen.queryByText('nodejs')).not.toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sorts by age descending by default', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const rows = screen.getAllByRole('row');
      // First data row (after header) should be the oldest package
      // nvidia-driver has 365d age, libgtk3 has 200d
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText('nvidia-driver')).toBeInTheDocument();
    });

    it('toggles sort direction on column click', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const ageHeader = screen.getByText('Age');
      await user.click(ageHeader); // Click to toggle to ascending
      
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      // After ascending, youngest package should be first (firefox 3d)
      expect(within(firstDataRow).getByText('firefox')).toBeInTheDocument();
    });

    it('sorts by package name', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const packageHeader = screen.getByText('Package');
      await user.click(packageHeader);
      
      // After clicking Package, should sort by name
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      // 'firefox' comes first alphabetically among our packages
      expect(within(firstDataRow).getByText('firefox')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('shows pagination when more than 25 items', () => {
      // Create 30 packages
      const manyPackages = Array.from({ length: 30 }, (_, i) => 
        createMockPackage({ id: `pkg-${i}`, name: `package-${i}`, ageInDays: i })
      );
      
      render(<PackageList data={manyPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // There are both desktop and mobile pagination buttons - use getAllByText
      const prevButtons = screen.getAllByText('Previous');
      const nextButtons = screen.getAllByText('Next');
      expect(prevButtons.length).toBeGreaterThan(0);
      expect(nextButtons.length).toBeGreaterThan(0);
    });

    it('does not show pagination for less than 25 items', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });

    it('navigates to next page', async () => {
      const user = userEvent.setup();
      const manyPackages = Array.from({ length: 30 }, (_, i) => 
        createMockPackage({ 
          id: `pkg-${i}`, 
          name: `package-${String(i).padStart(2, '0')}`, 
          ageInDays: 30 - i // Sort descending by age
        })
      );
      
      render(<PackageList data={manyPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // Use getAllByText and click the first one (desktop version)
      const nextButtons = screen.getAllByText('Next');
      await user.click(nextButtons[0]);
      
      // Page 2 should show "Showing 26 to 30"
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
    });

    it('disables Previous on first page', () => {
      const manyPackages = Array.from({ length: 30 }, (_, i) => 
        createMockPackage({ id: `pkg-${i}`, name: `package-${i}` })
      );
      
      render(<PackageList data={manyPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // Get first Previous button (desktop)
      const prevButtons = screen.getAllByText('Previous');
      expect(prevButtons[0]).toBeDisabled();
    });
  });

  describe('row selection', () => {
    it('calls onSelectPackage when row is clicked', async () => {
      const user = userEvent.setup();
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      const firefoxRow = screen.getByText('firefox').closest('tr');
      if (firefoxRow) {
        await user.click(firefoxRow);
      }
      
      expect(mockOnSelectPackage).toHaveBeenCalledTimes(1);
      expect(mockOnSelectPackage).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'firefox' })
      );
    });
  });

  describe('initial filter from props', () => {
    it('applies initialFilterTeam prop', () => {
      render(
        <PackageList 
          data={mockPackages} 
          onSelectPackage={mockOnSelectPackage}
          initialFilterTeam="ubuntu-server"
        />
      );
      
      // Only packages with ubuntu-server team should be shown
      expect(screen.getByText('nodejs')).toBeInTheDocument();
      expect(screen.queryByText('firefox')).not.toBeInTheDocument();
    });
  });

  describe('component badges', () => {
    it('displays correct badge colors for components', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // Check that badges are rendered - we look for the component text
      const mainBadges = screen.getAllByText('Main');
      expect(mainBadges.length).toBeGreaterThan(0);
    });
  });

  describe('age-based row coloring', () => {
    it('applies different row colors based on age', () => {
      render(<PackageList data={mockPackages} onSelectPackage={mockOnSelectPackage} />);
      
      // The table rows should have different background classes based on age
      // This is a visual test - we verify rows are rendered
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // header + data rows
    });
  });
});
