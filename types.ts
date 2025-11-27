
export enum PackageSet {
  MAIN = 'Main',
  UNIVERSE = 'Universe',
  RESTRICTED = 'Restricted',
  MULTIVERSE = 'Multiverse'
}

// Raw data shape from merges.ubuntu.com json (supporting various key formats)
export interface RawPackageData {
  // Potential keys for package name
  source?: string;
  package?: string;
  name?: string;
  
  // Potential keys for Ubuntu version
  version_ubuntu?: string;
  ubuntu_version?: string;
  ubuntu?: string;
  
  // Potential keys for Debian version
  version_debian?: string;
  debian_version?: string;
  debian?: string;
  
  status?: string;
  component?: string;
  teams?: string[];
  age?: string | number;
  
  // Uploader info
  uploader?: string;
  user?: string;
  changed_by?: string;
}

export interface MergePackage {
  id: string;
  name: string;
  ubuntuVersion: string;
  debianVersion: string;
  component: PackageSet;
  teams: string[];
  age: string;
  ageInDays: number;
  uploader: string;
  lastUpdated?: string;
}
