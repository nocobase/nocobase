export interface IPluginData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  displayName: string;
  version: string;
  enabled: boolean;
  installed: boolean;
  builtIn: boolean;
  isOfficial?: boolean;
  newVersion?: boolean;
  options: Record<string, unknown>;
  description?: string;
  type: 'npm' | 'upload';
  isCompatible?: boolean;
}
