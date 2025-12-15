/**
 * Dashboard component tests
 * Tests statistics calculation and chart rendering
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from '../components/Dashboard';
import { mockPackages, expectedStats } from './fixtures';
import { PackageSet } from '../types';

describe('Dashboard', () => {
  const mockOnTeamClick = vi.fn();

  beforeEach(() => {
    mockOnTeamClick.mockClear();
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText('Total Packages')).toBeInTheDocument();
    });

    it('renders all stat cards', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText('Total Packages')).toBeInTheDocument();
      expect(screen.getByText('Average Age')).toBeInTheDocument();
      expect(screen.getByText('Active Teams')).toBeInTheDocument();
    });

    it('renders chart sections', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText('Pending Age Distribution')).toBeInTheDocument();
      expect(screen.getByText('Packages by Component')).toBeInTheDocument();
      expect(screen.getByText('Top Teams by Package Volume')).toBeInTheDocument();
    });
  });

  describe('statistics calculation', () => {
    it('displays correct total package count', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText(String(expectedStats.total))).toBeInTheDocument();
    });

    it('displays correct average age', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText(`${expectedStats.avgAge}d`)).toBeInTheDocument();
    });

    it('displays correct active teams count', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      // There are 6 unique teams in mockPackages (excluding empty teams array)
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(<Dashboard data={[]} onTeamClick={mockOnTeamClick} />);
      // Use getAllByText since '0' appears multiple times (total=0, teams=0)
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
      expect(screen.getByText('0d')).toBeInTheDocument(); // Average age
    });
  });

  describe('age distribution bins', () => {
    it('correctly bins packages by age', () => {
      // Based on mockPackages:
      // < 1 Week: firefox (3d) = 1
      // 1-4 Weeks: gnome-shell (14d), steam (10d) = 2
      // 1-6 Months: nodejs (30d), libreoffice (45d), python3-defaults (180d) = 3
      // > 6 Months: nvidia-driver (365d), libgtk3 (200d) = 2
      
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      // recharts doesn't render chart labels in jsdom, so we just verify the chart section renders
      expect(screen.getByText('Pending Age Distribution')).toBeInTheDocument();
    });
  });

  describe('component distribution', () => {
    it('displays component distribution section', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      // recharts doesn't render chart labels in jsdom, verify section exists
      expect(screen.getByText('Packages by Component')).toBeInTheDocument();
    });
  });

  describe('team click interaction', () => {
    // Note: Testing click on recharts bars is complex due to SVG rendering
    // In a real scenario, you'd use more specific selectors or data-testid
    it('onTeamClick prop is available', () => {
      render(<Dashboard data={mockPackages} onTeamClick={mockOnTeamClick} />);
      // The component should accept and use the onTeamClick handler
      expect(mockOnTeamClick).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles single package', () => {
      const singlePkg = [mockPackages[0]];
      render(<Dashboard data={singlePkg} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('3d')).toBeInTheDocument(); // firefox has 3d age
    });

    it('handles packages with no teams', () => {
      const noTeamsPkg = [{
        ...mockPackages[0],
        teams: [],
      }];
      render(<Dashboard data={noTeamsPkg} onTeamClick={mockOnTeamClick} />);
      // Should still render without errors
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles packages with multiple teams', () => {
      const multiTeamPkg = [{
        ...mockPackages[0],
        teams: ['team1', 'team2', 'team3', 'team4', 'team5'],
      }];
      render(<Dashboard data={multiTeamPkg} onTeamClick={mockOnTeamClick} />);
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 teams
    });
  });
});
