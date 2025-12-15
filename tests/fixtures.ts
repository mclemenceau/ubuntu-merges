/**
 * Test fixtures - sample data for testing
 */
import { MergePackage, PackageSet } from '../types';

export const createMockPackage = (overrides: Partial<MergePackage> = {}): MergePackage => ({
  id: 'Main-test-pkg-0',
  name: 'test-package',
  ubuntuVersion: '1.0-1ubuntu1',
  debianVersion: '1.0-2',
  component: PackageSet.MAIN,
  teams: ['ubuntu-desktop'],
  age: '5d',
  ageInDays: 5,
  uploader: 'Test User <test@example.com>',
  lastUpdated: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const mockPackages: MergePackage[] = [
  createMockPackage({
    id: 'Main-firefox-0',
    name: 'firefox',
    ubuntuVersion: '120.0-0ubuntu1',
    debianVersion: '121.0-1',
    component: PackageSet.MAIN,
    teams: ['ubuntu-desktop', 'mozilla'],
    age: '3d',
    ageInDays: 3,
    uploader: 'Mozilla Team <mozilla@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Main-gnome-shell-1',
    name: 'gnome-shell',
    ubuntuVersion: '45.0-1ubuntu2',
    debianVersion: '45.1-1',
    component: PackageSet.MAIN,
    teams: ['ubuntu-desktop'],
    age: '2w',
    ageInDays: 14,
    uploader: 'GNOME Team <gnome@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Universe-nodejs-2',
    name: 'nodejs',
    ubuntuVersion: '18.0.0-1',
    debianVersion: '20.0.0-1',
    component: PackageSet.UNIVERSE,
    teams: ['ubuntu-server'],
    age: '1mo',
    ageInDays: 30,
    uploader: 'Server Team <server@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Universe-python3-defaults-3',
    name: 'python3-defaults',
    ubuntuVersion: '3.11.0-1',
    debianVersion: '3.12.0-1',
    component: PackageSet.UNIVERSE,
    teams: ['ubuntu-server', 'foundations'],
    age: '6mo',
    ageInDays: 180,
    uploader: 'Foundations Team <foundations@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Restricted-nvidia-driver-4',
    name: 'nvidia-driver',
    ubuntuVersion: '535.0-0ubuntu1',
    debianVersion: '545.0-1',
    component: PackageSet.RESTRICTED,
    teams: ['ubuntu-drivers'],
    age: '1y',
    ageInDays: 365,
    uploader: 'Drivers Team <drivers@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Multiverse-steam-5',
    name: 'steam',
    ubuntuVersion: '1.0.0.75-1ubuntu1',
    debianVersion: '1.0.0.78-1',
    component: PackageSet.MULTIVERSE,
    teams: [],
    age: '10d',
    ageInDays: 10,
    uploader: 'Unknown',
  }),
  createMockPackage({
    id: 'Main-libreoffice-6',
    name: 'libreoffice',
    ubuntuVersion: '7.5.0-0ubuntu1',
    debianVersion: '7.6.0-1',
    component: PackageSet.MAIN,
    teams: ['ubuntu-desktop', 'libreoffice'],
    age: '45d',
    ageInDays: 45,
    uploader: 'LibreOffice Team <lo@ubuntu.com>',
  }),
  createMockPackage({
    id: 'Main-libgtk3-7',
    name: 'libgtk3',
    ubuntuVersion: '3.24.38-1ubuntu1',
    debianVersion: '3.24.39-1',
    component: PackageSet.MAIN,
    teams: ['ubuntu-desktop'],
    age: '200d',
    ageInDays: 200,
    uploader: 'Desktop Team <desktop@ubuntu.com>',
  }),
];

// Statistics expected from mockPackages
export const expectedStats = {
  total: 8,
  mainCount: 4, // firefox, gnome-shell, libreoffice, libgtk3
  universeCount: 2, // nodejs, python3-defaults
  restrictedCount: 1, // nvidia-driver
  multiverseCount: 1, // steam
  activeTeams: 7, // ubuntu-desktop, mozilla, ubuntu-server, foundations, ubuntu-drivers, libreoffice (excluding empty)
  totalDays: 3 + 14 + 30 + 180 + 365 + 10 + 45 + 200, // 847
  avgAge: Math.round(847 / 8), // 106
};

// Unique teams in mockPackages
export const expectedTeams = [
  'foundations',
  'libreoffice',
  'mozilla',
  'ubuntu-desktop',
  'ubuntu-drivers',
  'ubuntu-server',
];

// Unique uploaders (names only)
export const expectedUploaders = [
  'Desktop Team',
  'Drivers Team',
  'Foundations Team',
  'GNOME Team',
  'LibreOffice Team',
  'Mozilla Team',
  'Server Team',
];
