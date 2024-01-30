export interface IPluginData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  displayName: string;
  packageName: string;
  version: string;
  enabled: boolean;
  installed: boolean;
  builtIn: boolean;
  registry?: string;
  authToken?: string;
  compressedFileUrl?: string;
  options: Record<string, unknown>;
  description?: string;
  type: 'npm' | 'upload' | 'url';
  isCompatible?: boolean;
  readmeUrl: string;
  changelogUrl: string;
  error: boolean;
  updatable?: boolean;
  homepage?: string;
  keywords?: string[];
}
