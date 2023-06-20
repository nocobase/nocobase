import { Plugin } from './Plugin';

export interface HashRouterOptions {
  type: 'hash';
  basename?: string;
  // TODO: 补充 hash 参数
}

export interface BrowserRouterOptions {
  type: 'browser';
  basename?: string;
  // TODO: 补充 browser 参数
}

export interface MemoryRouterOptions {
  type: 'memory';
  basename?: string;
  // TODO: 补充 memory 参数
}

export type RouterOptions = HashRouterOptions | BrowserRouterOptions | MemoryRouterOptions;

export interface PluginOptions {
  name: string;
}

export type PluginNameOrClass = string | [typeof Plugin, PluginOptions];

export interface ApplicationOptions {
  apiClient?: any;
  // List of preset plugins
  plugins?: PluginNameOrClass[];
  components?: any;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  importPlugins?: (name: string) => Promise<any>;
}
