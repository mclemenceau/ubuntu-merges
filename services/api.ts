
import { MergePackage, PackageSet } from '../types';

const MAIN_URL = 'https://merges.ubuntu.com/main.json';
const UNIVERSE_URL = 'https://merges.ubuntu.com/universe.json';
const RESTRICTED_URL = 'https://merges.ubuntu.com/restricted.json';
const MULTIVERSE_URL = 'https://merges.ubuntu.com/multiverse.json';

// Use a rotating set of CORS proxies to ensure reliability. 
// corsproxy.io is prioritized as it handles large files better.
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

// Fetches AND parses the JSON. If either network or parsing fails, it tries the next proxy.
const fetchDataWithFallback = async (targetUrl: string): Promise<any> => {
  let lastError: any;
  for (const proxyGen of PROXIES) {
    try {
      const url = proxyGen(targetUrl);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Proxy response status: ${res.status}`);
      }

      // We await the json() here to catch "Content-Length mismatch" or malformed JSON errors
      // within the try block, so we can fail over to the next proxy.
      return await res.json(); 
    } catch (e) {
      console.warn(`Proxy request/parse failed for ${targetUrl} via proxy. Trying next...`, e);
      lastError = e;
    }
  }
  throw lastError || new Error(`Unable to fetch and parse ${targetUrl} from any proxy.`);
};

// Fetches raw TEXT. Used for changelogs.
const fetchTextWithFallback = async (targetUrl: string): Promise<string> => {
  let lastError: any;
  for (const proxyGen of PROXIES) {
    try {
      const url = proxyGen(targetUrl);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Proxy response status: ${res.status}`);
      }

      return await res.text(); 
    } catch (e) {
      console.warn(`Proxy text request failed for ${targetUrl} via proxy. Trying next...`, e);
      lastError = e;
    }
  }
  throw lastError || new Error(`Unable to fetch text from ${targetUrl}`);
};

// Helper to parse age string to days
const parseAgeToDays = (ageInput: string | number | undefined): number => {
  if (ageInput === undefined || ageInput === null) return 0;
  
  const str = String(ageInput).toLowerCase().trim();
  
  // Check for day/week/year suffixes
  if (str.includes('y')) return Math.round(parseFloat(str) * 365);
  if (str.includes('mo')) return Math.round(parseFloat(str) * 30); 
  if (str.includes('w')) return Math.round(parseFloat(str) * 7);
  if (str.includes('d')) return Math.round(parseFloat(str));
  if (str.includes(':')) return 0; // Time format, effectively 0 days

  // Try parsing as number directly (assuming days if no unit)
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
};

const normalizeData = (rawData: any, component: PackageSet): MergePackage[] => {
  let list: any[] = [];

  // Handle Dictionary (Object) format: { "pkgName": { ... }, "pkgName2": { ... } }
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    list = Object.values(rawData);
  } 
  // Handle Array format: [ { ... }, { ... } ]
  else if (Array.isArray(rawData)) {
    list = rawData;
  } else {
    console.warn(`Unexpected data format for ${component}`, rawData);
    return [];
  }

  return list
    .filter(item => item !== null && item !== undefined)
    .map((item, index) => {
      let name = 'Unknown';
      let ubuntu = 'N/A';
      let debian = 'N/A';
      let teams: string[] = [];
      let age = '0d';
      let uploader = 'Unknown';

      // Strategy 1: Handle if item is an Array [name, ubuntu, debian, ...]
      if (Array.isArray(item)) {
        name = item[0] || 'Unknown';
        ubuntu = item[1] || 'N/A';
        debian = item[2] || 'N/A';
        // Arrays usually don't have teams/age/uploader in this specific simplistic view
      } 
      // Strategy 2: Handle if item is an Object with case-insensitive keys
      else if (typeof item === 'object') {
        // Create a lowercase map of keys to values
        const lowerKeys: Record<string, any> = {};
        Object.keys(item).forEach(k => {
          lowerKeys[k.toLowerCase()] = item[k];
        });

        // Mapping based on user provided schema and common variants
        name = lowerKeys.source_package || lowerKeys.source || lowerKeys.package || lowerKeys.name || lowerKeys.pkg || lowerKeys.src || 'Unknown';
        ubuntu = lowerKeys.left_version || lowerKeys.version_ubuntu || lowerKeys.ubuntu_version || lowerKeys.ubuntu || lowerKeys.version || 'N/A';
        debian = lowerKeys.right_version || lowerKeys.version_debian || lowerKeys.debian_version || lowerKeys.debian || lowerKeys.new_version || 'N/A';
        
        // Extract teams
        if (lowerKeys.teams && Array.isArray(lowerKeys.teams)) {
          teams = lowerKeys.teams;
        }

        // Extract Age
        if (lowerKeys.age) {
          age = String(lowerKeys.age);
        }

        // Extract Uploader (check 'uploader', then 'user', then 'changed_by')
        uploader = lowerKeys.uploader || lowerKeys.user || lowerKeys.changed_by || 'Unknown';

        // Fallback: If still unknown, dump keys for debugging in the UI
        if (name === 'Unknown') {
          const keys = Object.keys(item).slice(0, 5).join(', ');
          name = `Unknown (Keys: ${keys})`;
        }
      }

      return {
        id: `${component}-${name}-${index}`,
        name: String(name),
        ubuntuVersion: String(ubuntu),
        debianVersion: String(debian),
        component: component,
        teams: teams,
        age: age,
        ageInDays: parseAgeToDays(age),
        uploader: String(uploader),
        lastUpdated: new Date().toISOString()
      };
    });
};

export const fetchMergeData = async (): Promise<MergePackage[]> => {
  // Use Promise.all to fetch all datasets in parallel
  // Note: We use fetchDataWithFallback which handles the JSON parsing
  const [mainData, universeData, restrictedData, multiverseData] = await Promise.all([
    fetchDataWithFallback(MAIN_URL),
    fetchDataWithFallback(UNIVERSE_URL),
    fetchDataWithFallback(RESTRICTED_URL),
    fetchDataWithFallback(MULTIVERSE_URL)
  ]);

  const normalizedMain = normalizeData(mainData, PackageSet.MAIN);
  const normalizedUniverse = normalizeData(universeData, PackageSet.UNIVERSE);
  const normalizedRestricted = normalizeData(restrictedData, PackageSet.RESTRICTED);
  const normalizedMultiverse = normalizeData(multiverseData, PackageSet.MULTIVERSE);

  return [...normalizedMain, ...normalizedUniverse, ...normalizedRestricted, ...normalizedMultiverse];
};

// Helper to extract the single changelog block for the requested version
const extractChangelogEntry = (fullText: string, targetVersion: string): string => {
  const lines = fullText.split('\n');
  let startLine = -1;
  let endLine = -1;
  
  // Clean target version for comparison (remove epoch if present for loose matching)
  const cleanTarget = targetVersion.includes(':') ? targetVersion.split(':').pop()! : targetVersion;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match Debian changelog header: package (version) distribution; urgency=...
    // We check if line starts with a non-whitespace char to avoid matching indented content
    const match = line.match(/^(\S+)\s+\((.+?)\)/);
    
    if (match) {
      const foundVersion = match[2];
      const cleanFound = foundVersion.includes(':') ? foundVersion.split(':').pop()! : foundVersion;

      // Logic:
      // 1. If we haven't found our start block yet, check if this line matches our target version.
      // 2. If we HAVE found our start block, this new header means the previous block ended.
      
      if (startLine === -1) {
        // We match if exact match, or if cleaned versions match (handling epoch differences)
        if (foundVersion === targetVersion || cleanFound === cleanTarget) {
          startLine = i;
        }
      } else {
        // We found a new header after finding our start, so this is the end.
        endLine = i;
        break;
      }
    }
  }

  // If we found the start, slice it.
  if (startLine !== -1) {
    if (endLine === -1) endLine = lines.length;
    return lines.slice(startLine, endLine).join('\n').trim();
  }
  
  // Fallback: If we couldn't find the specific version, return the FIRST entry (latest)
  // This handles cases where the version string format might slightly differ or be missing
  // Scan for the first header and second header
  let firstHeaderIndex = -1;
  let secondHeaderIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
     if (lines[i].match(/^(\S+)\s+\((.+?)\)/)) {
       if (firstHeaderIndex === -1) firstHeaderIndex = i;
       else {
         secondHeaderIndex = i;
         break;
       }
     }
  }
  
  if (firstHeaderIndex !== -1) {
    const end = secondHeaderIndex !== -1 ? secondHeaderIndex : lines.length;
    return lines.slice(firstHeaderIndex, end).join('\n').trim();
  }

  // Absolute fallback: return full text if no structure recognized
  return fullText;
};

// Helper to check if text looks like a valid changelog (not HTML 404)
const isValidChangelog = (text: string) => {
  const trimmed = text.trim().toLowerCase();
  return !trimmed.startsWith('<!doctype') && !trimmed.startsWith('<html') && trimmed.length > 50;
};

export const fetchChangelog = async (pkg: MergePackage): Promise<string> => {
  // Construct Ubuntu Changelog URL
  // Format: https://changelogs.ubuntu.com/changelogs/pool/{component}/{prefix}/{package}/{package}_{version}/changelog
  
  const component = pkg.component.toLowerCase();
  const name = pkg.name;
  const version = pkg.ubuntuVersion;
  const prefix = name.startsWith('lib') ? name.substring(0, 4) : name.substring(0, 1);
  const poolBase = `https://changelogs.ubuntu.com/changelogs/pool/${component}/${prefix}/${name}`;

  // Candidate versions to try for the URL construction
  const candidates = [
    version,
    version.replace(/:/g, '%3a'),
    version.includes(':') ? version.split(':').pop() : undefined
  ].filter(Boolean) as string[];

  // Remove duplicates
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candVersion of uniqueCandidates) {
    const url = `${poolBase}/${name}_${candVersion}/changelog`;
    try {
      const text = await fetchTextWithFallback(url);
      if (isValidChangelog(text)) {
        return extractChangelogEntry(text, version);
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  throw new Error("Changelog not found after trying multiple URL variations");
};

export const fetchDebianChangelog = async (pkg: MergePackage): Promise<string> => {
  const name = pkg.name;
  const version = pkg.debianVersion;
  const prefix = name.startsWith('lib') ? name.substring(0, 4) : name.substring(0, 1);
  
  // Clean version: Remove epoch (e.g., 1:2.3 -> 2.3)
  const cleanVersion = version.includes(':') ? version.split(':').pop()! : version;

  // Components to try on ftp-master
  const components = ['main', 'contrib', 'non-free'];

  // Try metadata.ftp-master.debian.org first (more reliable for special chars)
  for (const comp of components) {
    // Format: https://metadata.ftp-master.debian.org/changelogs/{component}/{prefix}/{package}/{package}_{version}_changelog
    const url = `https://metadata.ftp-master.debian.org/changelogs/${comp}/${prefix}/${name}/${name}_${cleanVersion}_changelog`;
    
    try {
      const text = await fetchTextWithFallback(url);
      if (isValidChangelog(text)) {
        return extractChangelogEntry(text, version);
      }
    } catch (e) {
      // Continue to next component
    }
  }

  // Fallback to tracker.debian.org if ftp-master fails
  try {
    const trackerUrl = `https://tracker.debian.org/media/packages/${prefix}/${name}/changelog-${cleanVersion}`;
    const text = await fetchTextWithFallback(trackerUrl);
    if (isValidChangelog(text)) {
      return extractChangelogEntry(text, version);
    }
  } catch (e) {
    console.warn("Failed to fetch Debian changelog from tracker fallback", e);
  }

  throw new Error("Debian changelog not found");
};
