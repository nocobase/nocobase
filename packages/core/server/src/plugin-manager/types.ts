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
  installed?: boolean;
  builtIn?: boolean;
  options?: any;
}

export interface PluginResponse extends PluginData {
  displayName?: string;
  packageJson: Record<string, any>;
  readmeUrl: string;
  description?: string;
}
