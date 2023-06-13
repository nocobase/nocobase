export interface HashRouterOptions {
  type: 'hash' | 'browser' | 'memory';
  basename?: string;
}

export interface BrowserRouterOptions {
  type: 'browser';
  basename?: string;
}

export interface MemoryRouterOptions {
  type: 'memory';
  basename?: string;
}

export type RouterOptions = HashRouterOptions | BrowserRouterOptions | MemoryRouterOptions;

export interface ApplicationOptions {
  apiClient?: any;
  plugins?: string[];
  components?: any;
  scopes?: Record<string, any>;
  router?: RouterOptions;
  importPlugins?: (name: string) => Promise<any>;
}
