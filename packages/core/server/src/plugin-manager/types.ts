export interface PluginData {
  name?: string;
  packageName?: string;
  version?: string;
  preVersion?: string;
  registry?: string;
  clientUrl?: string;
  zipUrl?: string;
  enabled?: boolean;
  type?: 'url' | 'npm';
  isOfficial?: boolean;
  installed?: boolean;
  builtIn?: boolean;
  options?: any;
}
