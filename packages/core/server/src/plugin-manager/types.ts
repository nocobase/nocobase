export interface PluginData {
  name?: string;
  packageName?: string;
  version?: string;
  preVersion?: string;
  registry?: string;
  clientUrl?: string;
  compressedFileUrl?: string;
  enabled?: boolean;
  type?: 'url' | 'npm' | 'upload';
  authToken?: string;
  isOfficial?: boolean;
  installed?: boolean;
  builtIn?: boolean;
  options?: any;
}
