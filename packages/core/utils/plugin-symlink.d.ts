export declare function resolvePluginStoragePath(): string;
export declare function getStoragePluginNames(target: any): Promise<any[]>;
export declare function getPluginSourceRoots(storagePluginsPath: string): string[];
export declare function resolvePluginSourcePath(pluginName: string, storagePluginsPath: string): Promise<string>;
export declare function createStoragePluginSymLink(pluginName: any): Promise<void>;
export declare function createStoragePluginsSymlink(): Promise<void>;
export declare function createDevPluginSymLink(pluginName: any): Promise<void>;
export declare function createDevPluginsSymlink(): Promise<void>;
export declare function syncPluginSymlinks(): Promise<void>;
