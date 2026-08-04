export interface PluginPackageInfo {
  name: string;
  packageName: string;
  origins: string[];
  resolvedPath: string;
}

export interface ParsePluginNameOptions {
  nodeModulesPath?: string;
  pluginPackagePrefixes?: string[];
}

export interface PresetPackageJsonLike {
  dependencies?: Record<string, string>;
  builtIn?: string[];
  deprecated?: string[];
}

export declare const DEFAULT_PLUGIN_PACKAGE_PREFIXES: string[];
export declare function splitPluginNames(value?: string): string[];
export declare function getPluginPackagePrefixes(): string[];
export declare function getPluginNameFromPackageName(packageName: string, prefixes?: string[]): string;
export declare function isValidPackageName(packageName: string): boolean;
export declare function looksLikePluginPackage(packageName: string, prefixes?: string[]): boolean;
export declare function parsePluginName(
  nameOrPkg: string,
  options?: ParsePluginNameOptions,
): Promise<{ name: string; packageName: string }>;
export declare function getPresetNocoBasePackageJson(options?: {
  nodeModulesPath?: string;
  cwd?: string;
}): Promise<PresetPackageJsonLike | null>;
export declare function resolvePluginPackagePath(
  packageName: string,
  options?: {
    nodeModulesPath?: string;
    storagePluginsPath?: string;
  },
): Promise<string>;
export declare function discoverPluginPackages(options?: {
  nodeModulesPath?: string;
  storagePluginsPath?: string;
  cwd?: string;
  pluginPackagePrefixes?: string[];
}): Promise<PluginPackageInfo[]>;
