import { CleanOptions, SyncOptions } from '@nocobase/database';
import { requireModule } from '@nocobase/utils';
import Application from '../application';
import { Plugin } from '../plugin';
import { PluginManager } from './plugin-manager';

export interface PluginManagerOptions {
  app: Application;
  plugins?: any[];
}

export interface InstallOptions {
  cliArgs?: any[];
  clean?: CleanOptions | boolean;
  sync?: SyncOptions;
}

export type PluginResolverResult = {
  name?: string;
  packageName?: string;
  version?: string;
  Plugin: any;
};

export type PluginResolverHandleOptions = {
  isPackageName?: boolean;
  pluginName?: string;
  packageName?: string;
  authToken?: string;
  registry?: string;
  upgrading?: boolean;
};

export type PluginType = string | typeof Plugin;

export class PluginResolver {
  constructor(protected app: Application) {}

  async handlePluginClass(pluginName: PluginType, options: PluginResolverHandleOptions): Promise<PluginResolverResult> {
    return {
      Plugin: pluginName,
    };
  }

  async handleLocalPackage(pluginName: string, options: PluginResolverHandleOptions): Promise<PluginResolverResult> {
    const { packageName } = options;
    const packageJson = PluginManager.getPackageJson(packageName);
    return {
      name: pluginName,
      packageName,
      version: packageJson.version,
      Plugin: requireModule(packageName),
    };
  }

  async handleCompressedPackage(pkgPath: string, options: PluginResolverHandleOptions): Promise<PluginResolverResult> {
    return {
      Plugin: '',
    };
  }

  async handle(pluginName: PluginType, options: PluginResolverHandleOptions): Promise<PluginResolverResult> {
    if (typeof pluginName !== 'string') {
      return this.handlePluginClass(pluginName, options);
    }

    if (!options.isPackageName) {
      options.packageName = PluginManager.getPackageName(pluginName);
      return this.handleLocalPackage(pluginName, options);
    }

    let pkgPath = pluginName;

    if (options.isPackageName) {
      if (options.upgrading && !this.isStoragePackage(pluginName)) {
        options.packageName = pluginName;
        return this.handleLocalPackage(this.getPluginNameViaPackageName(pluginName), options);
      }
      if (this.packageExists(pluginName)) {
        options.packageName = pluginName;
        return this.handleLocalPackage(this.getPluginNameViaPackageName(pluginName), options);
      }
      pkgPath = await this.downloadNpmPackage(pluginName, options);
    } else if (this.isURL(pluginName)) {
      pkgPath = await this.download(pluginName, options);
    }

    if (!this.isCompressedPackage(pkgPath)) {
      throw new Error('invalid');
    }

    return this.handleCompressedPackage(pkgPath, options);
  }

  getPluginNameViaPackageName(packageName: string) {
    return packageName;
  }

  protected async download(url: string, options) {
    return '';
  }

  protected async downloadNpmPackage(packageName: string, options) {
    return '';
  }

  isStoragePackage(packageName: string) {
    return true;
  }

  packageExists(packageName: string) {
    try {
      require.resolve(packageName);
      return true;
    } catch (error) {
      return false;
    }
  }

  protected isCompressedPackage(file) {
    return true;
  }

  protected isURL(string) {
    let url;

    try {
      url = new URL(string);
    } catch (e) {
      return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
  }
}
