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
  newVersion?: boolean;
  compressedFileUrl?: string;
  options: Record<string, unknown>;
  description?: string;
  type: 'npm' | 'upload' | 'url';
  isCompatible?: boolean;
  readmeUrl: string;
  changelogUrl: string;
}
