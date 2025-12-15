/**
 * Unit tests for API service utilities
 * Tests parsing, normalization, and changelog extraction logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAgeToDays, normalizeData, extractChangelogEntry } from '../services/api';
import { PackageSet, MergePackage } from '../types';
import { 
  fetchDataWithFallback, 
  fetchTextWithFallback, 
  isValidChangelog,
  fetchMergeData,
  fetchChangelog,
  fetchDebianChangelog
} from '../services/api';

describe('parseAgeToDays', () => {
  describe('day parsing', () => {
    it('parses "5d" as 5 days', () => {
      expect(parseAgeToDays('5d')).toBe(5);
    });

    it('parses "1d" as 1 day', () => {
      expect(parseAgeToDays('1d')).toBe(1);
    });

    it('parses "0d" as 0 days', () => {
      expect(parseAgeToDays('0d')).toBe(0);
    });

    it('parses "365d" as 365 days', () => {
      expect(parseAgeToDays('365d')).toBe(365);
    });

    it('parses fractional days "2.5d" as 3 days (rounded)', () => {
      expect(parseAgeToDays('2.5d')).toBe(3);
    });
  });

  describe('week parsing', () => {
    it('parses "1w" as 7 days', () => {
      expect(parseAgeToDays('1w')).toBe(7);
    });

    it('parses "2w" as 14 days', () => {
      expect(parseAgeToDays('2w')).toBe(14);
    });

    it('parses "4w" as 28 days', () => {
      expect(parseAgeToDays('4w')).toBe(28);
    });

    it('parses "1.5w" as 11 days (rounded)', () => {
      expect(parseAgeToDays('1.5w')).toBe(11);
    });
  });

  describe('month parsing', () => {
    it('parses "1mo" as 30 days', () => {
      expect(parseAgeToDays('1mo')).toBe(30);
    });

    it('parses "2mo" as 60 days', () => {
      expect(parseAgeToDays('2mo')).toBe(60);
    });

    it('parses "6mo" as 180 days', () => {
      expect(parseAgeToDays('6mo')).toBe(180);
    });

    it('parses "12mo" as 360 days', () => {
      expect(parseAgeToDays('12mo')).toBe(360);
    });
  });

  describe('year parsing', () => {
    it('parses "1y" as 365 days', () => {
      expect(parseAgeToDays('1y')).toBe(365);
    });

    it('parses "2y" as 730 days', () => {
      expect(parseAgeToDays('2y')).toBe(730);
    });

    it('parses "0.5y" as 183 days (rounded)', () => {
      expect(parseAgeToDays('0.5y')).toBe(183);
    });
  });

  describe('time format (hours:minutes)', () => {
    it('parses "12:30" as 0 days (same-day)', () => {
      expect(parseAgeToDays('12:30')).toBe(0);
    });

    it('parses "00:05" as 0 days', () => {
      expect(parseAgeToDays('00:05')).toBe(0);
    });
  });

  describe('numeric input (no unit)', () => {
    it('parses raw number 5 as 5 days', () => {
      expect(parseAgeToDays(5)).toBe(5);
    });

    it('parses string "10" as 10 days', () => {
      expect(parseAgeToDays('10')).toBe(10);
    });

    it('parses "0" as 0 days', () => {
      expect(parseAgeToDays('0')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for undefined', () => {
      expect(parseAgeToDays(undefined)).toBe(0);
    });

    it('returns 0 for null', () => {
      expect(parseAgeToDays(null as any)).toBe(0);
    });

    it('returns 0 for empty string', () => {
      expect(parseAgeToDays('')).toBe(0);
    });

    it('returns 0 for non-numeric string', () => {
      expect(parseAgeToDays('invalid')).toBe(0);
    });

    it('handles uppercase "5D"', () => {
      expect(parseAgeToDays('5D')).toBe(5);
    });

    it('handles whitespace " 5d "', () => {
      expect(parseAgeToDays(' 5d ')).toBe(5);
    });
  });
});

describe('normalizeData', () => {
  describe('array format input', () => {
    it('normalizes array of objects with standard keys', () => {
      const rawData = [
        {
          source_package: 'test-pkg',
          left_version: '1.0-1ubuntu1',
          right_version: '1.0-2',
          teams: ['ubuntu-desktop'],
          age: '5d',
          uploader: 'Test User <test@example.com>'
        }
      ];

      const result = normalizeData(rawData, PackageSet.MAIN);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-pkg');
      expect(result[0].ubuntuVersion).toBe('1.0-1ubuntu1');
      expect(result[0].debianVersion).toBe('1.0-2');
      expect(result[0].component).toBe(PackageSet.MAIN);
      expect(result[0].teams).toEqual(['ubuntu-desktop']);
      expect(result[0].ageInDays).toBe(5);
      expect(result[0].uploader).toBe('Test User <test@example.com>');
    });

    it('normalizes array of arrays [name, ubuntu, debian]', () => {
      const rawData = [
        ['array-pkg', '2.0-1', '2.0-2']
      ];

      const result = normalizeData(rawData, PackageSet.UNIVERSE);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('array-pkg');
      expect(result[0].ubuntuVersion).toBe('2.0-1');
      expect(result[0].debianVersion).toBe('2.0-2');
      expect(result[0].component).toBe(PackageSet.UNIVERSE);
    });

    it('handles multiple packages', () => {
      const rawData = [
        { source_package: 'pkg1', left_version: '1.0', right_version: '1.1' },
        { source_package: 'pkg2', left_version: '2.0', right_version: '2.1' },
        { source_package: 'pkg3', left_version: '3.0', right_version: '3.1' }
      ];

      const result = normalizeData(rawData, PackageSet.MAIN);

      expect(result).toHaveLength(3);
      expect(result.map(p => p.name)).toEqual(['pkg1', 'pkg2', 'pkg3']);
    });
  });

  describe('object/dictionary format input', () => {
    it('normalizes object where values are package data', () => {
      const rawData = {
        'pkg-a': {
          source_package: 'pkg-a',
          left_version: '1.0',
          right_version: '1.1'
        },
        'pkg-b': {
          source_package: 'pkg-b',
          left_version: '2.0',
          right_version: '2.1'
        }
      };

      const result = normalizeData(rawData, PackageSet.RESTRICTED);

      expect(result).toHaveLength(2);
      expect(result.map(p => p.name).sort()).toEqual(['pkg-a', 'pkg-b']);
    });
  });

  describe('alternative key names', () => {
    it('handles "source" instead of "source_package"', () => {
      const rawData = [{ source: 'alt-pkg', left_version: '1.0', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].name).toBe('alt-pkg');
    });

    it('handles "package" key', () => {
      const rawData = [{ package: 'pkg-key', left_version: '1.0', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].name).toBe('pkg-key');
    });

    it('handles "version_ubuntu" instead of "left_version"', () => {
      const rawData = [{ source: 'pkg', version_ubuntu: '1.0-ubuntu1', right_version: '1.0' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].ubuntuVersion).toBe('1.0-ubuntu1');
    });

    it('handles "version_debian" instead of "right_version"', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', version_debian: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].debianVersion).toBe('1.1');
    });

    it('handles "user" instead of "uploader"', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', right_version: '1.1', user: 'Alt User' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].uploader).toBe('Alt User');
    });

    it('handles "changed_by" key', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', right_version: '1.1', changed_by: 'Changed By User' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].uploader).toBe('Changed By User');
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase keys', () => {
      const rawData = [{ 
        SOURCE_PACKAGE: 'upper-pkg', 
        LEFT_VERSION: '1.0', 
        RIGHT_VERSION: '1.1' 
      }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].name).toBe('upper-pkg');
    });

    it('handles mixed case keys', () => {
      const rawData = [{ 
        Source_Package: 'mixed-pkg', 
        Left_Version: '1.0', 
        Right_Version: '1.1' 
      }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].name).toBe('mixed-pkg');
    });
  });

  describe('missing/default values', () => {
    it('defaults name to "Unknown" if no name key found', () => {
      const rawData = [{ left_version: '1.0', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].name).toContain('Unknown');
    });

    it('defaults ubuntuVersion to "N/A" if missing', () => {
      const rawData = [{ source: 'pkg', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].ubuntuVersion).toBe('N/A');
    });

    it('defaults debianVersion to "N/A" if missing', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].debianVersion).toBe('N/A');
    });

    it('defaults teams to empty array if missing', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].teams).toEqual([]);
    });

    it('defaults uploader to "Unknown" if missing', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', right_version: '1.1' }];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].uploader).toBe('Unknown');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input array', () => {
      expect(normalizeData([], PackageSet.MAIN)).toEqual([]);
    });

    it('returns empty array for empty object', () => {
      expect(normalizeData({}, PackageSet.MAIN)).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(normalizeData(null, PackageSet.MAIN)).toEqual([]);
    });

    it('returns empty array for undefined input', () => {
      expect(normalizeData(undefined, PackageSet.MAIN)).toEqual([]);
    });

    it('filters out null entries in array', () => {
      const rawData = [
        { source: 'pkg1', left_version: '1.0', right_version: '1.1' },
        null,
        { source: 'pkg2', left_version: '2.0', right_version: '2.1' }
      ];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result).toHaveLength(2);
    });

    it('generates unique IDs for each package', () => {
      const rawData = [
        { source: 'pkg1', left_version: '1.0', right_version: '1.1' },
        { source: 'pkg2', left_version: '2.0', right_version: '2.1' }
      ];
      const result = normalizeData(rawData, PackageSet.MAIN);
      expect(result[0].id).not.toBe(result[1].id);
    });

    it('includes component in ID for uniqueness across sets', () => {
      const rawData = [{ source: 'pkg', left_version: '1.0', right_version: '1.1' }];
      const mainResult = normalizeData(rawData, PackageSet.MAIN);
      const universeResult = normalizeData(rawData, PackageSet.UNIVERSE);
      expect(mainResult[0].id).toContain('Main');
      expect(universeResult[0].id).toContain('Universe');
    });
  });
});

describe('extractChangelogEntry', () => {
  const sampleChangelog = `test-package (2.0-1) unstable; urgency=medium

  * New upstream release
  * Fixed bug #12345

 -- Maintainer <maint@example.com>  Mon, 01 Jan 2024 10:00:00 +0000

test-package (1.5-1) unstable; urgency=low

  * Previous release
  * Some other changes

 -- Maintainer <maint@example.com>  Sun, 01 Dec 2023 10:00:00 +0000

test-package (1.0-1) unstable; urgency=low

  * Initial release

 -- Maintainer <maint@example.com>  Sat, 01 Nov 2023 10:00:00 +0000`;

  it('extracts the correct version entry when version matches exactly', () => {
    const result = extractChangelogEntry(sampleChangelog, '2.0-1');
    expect(result).toContain('New upstream release');
    expect(result).toContain('Fixed bug #12345');
    expect(result).not.toContain('Previous release');
  });

  it('extracts middle version entry correctly', () => {
    const result = extractChangelogEntry(sampleChangelog, '1.5-1');
    expect(result).toContain('Previous release');
    expect(result).not.toContain('New upstream release');
    expect(result).not.toContain('Initial release');
  });

  it('extracts last version entry correctly', () => {
    const result = extractChangelogEntry(sampleChangelog, '1.0-1');
    expect(result).toContain('Initial release');
    expect(result).not.toContain('Previous release');
  });

  it('handles version with epoch (1:2.0-1)', () => {
    const changelogWithEpoch = `test-package (1:2.0-1) unstable; urgency=medium

  * Epoched version

 -- Maintainer <maint@example.com>  Mon, 01 Jan 2024 10:00:00 +0000`;

    const result = extractChangelogEntry(changelogWithEpoch, '1:2.0-1');
    expect(result).toContain('Epoched version');
  });

  it('matches version ignoring epoch when epoch differs', () => {
    const changelogWithEpoch = `test-package (1:2.0-1) unstable; urgency=medium

  * Epoched version

 -- Maintainer <maint@example.com>  Mon, 01 Jan 2024 10:00:00 +0000`;

    // Search for version without epoch, should still match
    const result = extractChangelogEntry(changelogWithEpoch, '2.0-1');
    expect(result).toContain('Epoched version');
  });

  it('returns first entry when target version not found', () => {
    const result = extractChangelogEntry(sampleChangelog, '9.9-9');
    // Should fallback to first (latest) entry
    expect(result).toContain('New upstream release');
  });

  it('handles single-entry changelog', () => {
    const singleEntry = `pkg (1.0-1) stable; urgency=low

  * Only entry

 -- Dev <dev@example.com>  Mon, 01 Jan 2024 00:00:00 +0000`;

    const result = extractChangelogEntry(singleEntry, '1.0-1');
    expect(result).toContain('Only entry');
  });

  it('returns full text for unstructured changelog', () => {
    const unstructured = 'This is just plain text without version headers';
    const result = extractChangelogEntry(unstructured, '1.0');
    expect(result).toBe(unstructured);
  });
});

// ============================================================================
// fetchDataWithFallback tests
// ============================================================================

describe('isValidChangelog', () => {
  it('returns true for valid changelog text', () => {
    const validChangelog = `package (1.0-1) stable; urgency=low

  * Initial release

 -- Maintainer <maint@example.com>  Mon, 01 Jan 2024 00:00:00 +0000`;
    expect(isValidChangelog(validChangelog)).toBe(true);
  });

  it('returns false for HTML doctype response (404 page)', () => {
    const html404 = '<!DOCTYPE html><html><head><title>404</title></head></html>';
    expect(isValidChangelog(html404)).toBe(false);
  });

  it('returns false for HTML response starting with <html>', () => {
    const htmlPage = '<html><body>Not Found</body></html>';
    expect(isValidChangelog(htmlPage)).toBe(false);
  });

  it('returns false for short text (less than 50 chars)', () => {
    const shortText = 'This is too short';
    expect(isValidChangelog(shortText)).toBe(false);
  });

  it('returns true for long plain text without HTML', () => {
    const longText = 'A'.repeat(100);
    expect(isValidChangelog(longText)).toBe(true);
  });

  it('handles whitespace-padded HTML', () => {
    const paddedHtml = '   <!doctype html><html></html>';
    expect(isValidChangelog(paddedHtml)).toBe(false);
  });

  it('is case-insensitive for HTML detection', () => {
    const upperHtml = '<!DOCTYPE HTML><HTML></HTML>';
    expect(isValidChangelog(upperHtml)).toBe(false);
  });
});

describe('fetchDataWithFallback', () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns parsed JSON on successful fetch', async () => {
    const mockData = { packages: ['test'] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const result = await fetchDataWithFallback('https://example.com/data.json');
    expect(result).toEqual(mockData);
  });

  it('tries next proxy on fetch failure', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

    const result = await fetchDataWithFallback('https://example.com/data.json');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('tries next proxy on non-ok response', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

    const result = await fetchDataWithFallback('https://example.com/data.json');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('tries next proxy on JSON parse failure', async () => {
    const mockData = { success: true };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });

    const result = await fetchDataWithFallback('https://example.com/data.json');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('throws last error after all proxies fail', async () => {
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Proxy 1 failed'))
      .mockRejectedValueOnce(new Error('Proxy 2 failed'))
      .mockRejectedValueOnce(new Error('Proxy 3 failed'));

    await expect(fetchDataWithFallback('https://example.com/data.json'))
      .rejects.toThrow('Proxy 3 failed');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws generic error if no lastError captured', async () => {
    // Edge case: all proxies fail with non-Error throw
    global.fetch = vi.fn()
      .mockImplementation(() => { throw undefined; });

    await expect(fetchDataWithFallback('https://example.com/data.json'))
      .rejects.toThrow('Unable to fetch and parse');
  });

  it('uses correct proxy URL format for first proxy (corsproxy.io)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });

    await fetchDataWithFallback('https://merges.ubuntu.com/main.json');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('corsproxy.io')
    );
  });
});

describe('fetchTextWithFallback', () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns text on successful fetch', async () => {
    const mockText = 'changelog content here';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockText)
    });

    const result = await fetchTextWithFallback('https://example.com/changelog');
    expect(result).toBe(mockText);
  });

  it('tries next proxy on failure', async () => {
    const mockText = 'success';
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockText)
      });

    const result = await fetchTextWithFallback('https://example.com/changelog');
    expect(result).toBe(mockText);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('tries next proxy on non-ok response', async () => {
    const mockText = 'success';
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockText)
      });

    const result = await fetchTextWithFallback('https://example.com/changelog');
    expect(result).toBe(mockText);
  });

  it('throws after all proxies fail', async () => {
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Failed 1'))
      .mockRejectedValueOnce(new Error('Failed 2'))
      .mockRejectedValueOnce(new Error('Failed 3'));

    await expect(fetchTextWithFallback('https://example.com/changelog'))
      .rejects.toThrow('Failed 3');
  });

  it('throws generic error if no lastError', async () => {
    global.fetch = vi.fn().mockImplementation(() => { throw undefined; });

    await expect(fetchTextWithFallback('https://example.com/changelog'))
      .rejects.toThrow('Unable to fetch text');
  });
});

describe('fetchMergeData', () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches and normalizes data from all four components', async () => {
    const mockMainData = {
      'test-pkg': {
        source_package: 'test-pkg',
        ubuntu_version: '1.0-1ubuntu1',
        debian_version: '1.0-1',
        age: '5d'
      }
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMainData)
    });

    const result = await fetchMergeData();
    
    // Should have called fetch for all 4 components (through first proxy)
    expect(global.fetch).toHaveBeenCalledTimes(4);
    // Should return normalized packages
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('component');
  });

  it('combines packages from all components', async () => {
    const createMockData = (prefix: string) => ({
      [`${prefix}-pkg`]: {
        source_package: `${prefix}-pkg`,
        ubuntu_version: '1.0',
        debian_version: '1.0'
      }
    });

    let callCount = 0;
    const components = ['main', 'universe', 'restricted', 'multiverse'];
    
    global.fetch = vi.fn().mockImplementation(() => {
      const data = createMockData(components[callCount % 4]);
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data)
      });
    });

    const result = await fetchMergeData();
    expect(result.length).toBe(4);
  });
});

describe('fetchChangelog', () => {
  const originalFetch = global.fetch;
  
  const mockPkg: MergePackage = {
    id: 'test-package-main',
    name: 'test-package',
    component: PackageSet.MAIN,
    ubuntuVersion: '1.0-1ubuntu1',
    debianVersion: '1.0-1',
    age: '5d',
    ageInDays: 5,
    teams: [],
    uploader: 'Test'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches and extracts changelog for package', async () => {
    const changelogText = `test-package (1.0-1ubuntu1) focal; urgency=medium

  * Test change

 -- Maintainer <maint@ubuntu.com>  Mon, 01 Jan 2024 00:00:00 +0000`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(changelogText)
    });

    const result = await fetchChangelog(mockPkg);
    expect(result).toContain('Test change');
  });

  it('uses lib prefix for library packages', async () => {
    const libPkg = { ...mockPkg, name: 'libtest' };
    const changelogText = `libtest (1.0-1ubuntu1) focal; urgency=medium

  * Library change

 -- Maintainer <maint@ubuntu.com>  Mon, 01 Jan 2024 00:00:00 +0000`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(changelogText)
    });

    await fetchChangelog(libPkg);
    
    // Should use 'libt' as prefix (first 4 chars for lib* packages)
    // URL is encoded through proxy
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(decodeURIComponent(fetchCall)).toContain('/libt/libtest/');
  });

  it('tries version without epoch if present', async () => {
    const epochPkg = { ...mockPkg, ubuntuVersion: '1:2.0-1ubuntu1' };
    
    // First call returns invalid (HTML 404), second succeeds
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<!doctype html><html>404</html>')
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`test-package (1:2.0-1ubuntu1) focal; urgency=medium

  * Epoched version

 -- Maintainer <maint@ubuntu.com>  Mon, 01 Jan 2024 00:00:00 +0000`)
      });

    const result = await fetchChangelog(epochPkg);
    expect(result).toContain('Epoched version');
  });

  it('throws error when all candidates fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<!doctype html><html>404</html>')
    });

    await expect(fetchChangelog(mockPkg))
      .rejects.toThrow('Changelog not found');
  });
});

describe('fetchDebianChangelog', () => {
  const originalFetch = global.fetch;
  
  const mockPkg: MergePackage = {
    id: 'test-package-main',
    name: 'test-package',
    component: PackageSet.MAIN,
    ubuntuVersion: '1.0-1ubuntu1',
    debianVersion: '1.0-1',
    age: '5d',
    ageInDays: 5,
    teams: [],
    uploader: 'Test'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches Debian changelog from ftp-master', async () => {
    const changelogText = `test-package (1.0-1) unstable; urgency=medium

  * Debian change

 -- Maintainer <maint@debian.org>  Mon, 01 Jan 2024 00:00:00 +0000`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(changelogText)
    });

    const result = await fetchDebianChangelog(mockPkg);
    expect(result).toContain('Debian change');
  });

  it('tries all Debian components (main, contrib, non-free)', async () => {
    // First two fail, third succeeds
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<!doctype html>404')
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('<!doctype html>404')
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`test-package (1.0-1) unstable; urgency=medium

  * Found in non-free

 -- Maintainer <maint@debian.org>  Mon, 01 Jan 2024 00:00:00 +0000`)
      });

    const result = await fetchDebianChangelog(mockPkg);
    expect(result).toContain('Found in non-free');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('falls back to tracker.debian.org if ftp-master fails', async () => {
    // All ftp-master attempts fail, tracker succeeds
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('short') }) // main - invalid
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('short') }) // contrib - invalid
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('short') }) // non-free - invalid
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`test-package (1.0-1) unstable; urgency=medium

  * From tracker fallback

 -- Maintainer <maint@debian.org>  Mon, 01 Jan 2024 00:00:00 +0000`)
      });

    const result = await fetchDebianChangelog(mockPkg);
    expect(result).toContain('From tracker fallback');
  });

  it('strips epoch from version for URL construction', async () => {
    const epochPkg = { ...mockPkg, debianVersion: '2:3.0-1' };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`test-package (2:3.0-1) unstable; urgency=medium

  * Version with epoch

 -- Maintainer <maint@debian.org>  Mon, 01 Jan 2024 00:00:00 +0000`)
    });

    await fetchDebianChangelog(epochPkg);
    
    // URL should use 3.0-1 not 2:3.0-1
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    const decodedUrl = decodeURIComponent(fetchCall);
    expect(decodedUrl).toContain('3.0-1');
    expect(decodedUrl).not.toContain('2:3.0-1');
  });

  it('throws error when all sources fail', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('short') // Always invalid
    });

    await expect(fetchDebianChangelog(mockPkg))
      .rejects.toThrow('Debian changelog not found');
  });

  it('uses lib prefix for library packages', async () => {
    const libPkg = { ...mockPkg, name: 'libfoo' };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`libfoo (1.0-1) unstable; urgency=medium

  * Lib changelog

 -- Maintainer <maint@debian.org>  Mon, 01 Jan 2024 00:00:00 +0000`)
    });

    await fetchDebianChangelog(libPkg);
    
    const fetchCall = (global.fetch as any).mock.calls[0][0];
    expect(decodeURIComponent(fetchCall)).toContain('/libf/libfoo/');
  });
});
