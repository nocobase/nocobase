export interface PluginData {
  name?: string;
  version?: string;
  registry?: string;
  clientUrl?: string;
  zipUrl?: string;
  enabled?: boolean;
  type?: 'upload' | 'npm' | 'local';
  isOfficial?: boolean;
  installed?: boolean;
  builtIn?: boolean;
  options?: any;
}
