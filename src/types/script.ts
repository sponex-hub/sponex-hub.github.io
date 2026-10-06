export type VrpCategory = 'all' | 'jobs' | 'nui' | 'systems' | 'garages' | 'utilities';

export interface FiveMScript {
  id: string;
  title: string;
  category: VrpCategory;
  frameworks: string[]; // ['vRP', 'vRPex', 'Dunko', 'vRP 2.0']
  version: string;
  resmon: string;
  author: string;
  license: string;
  description: string;
  imageUrl?: string;
  features: string[];
  dependencies: string[];
  cfgCommand: string;
  downloadUrl: string;
  githubUrl?: string;
  downloads?: number;
  createdAt?: string;
}
