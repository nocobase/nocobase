/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'ses';

export interface JSRunnerOptions {
  timeoutMs?: number;
  globals?: Record<string, any>;
  version?: string;
  /**
   * Enable RunJS template compatibility preprocessing for `{{ ... }}`.
   * When enabled via `ctx.runjs(code, vars, { preprocessTemplates: true })` (default),
   * the code will be rewritten to call `ctx.resolveJsonTemplate(...)` at runtime.
   */
  preprocessTemplates?: boolean;
}

export class JSRunner {
  private globals: Record<string, any>;
  private timeoutMs: number;

  constructor(options: JSRunnerOptions = {}) {
    const bindWindowFn = (key: 'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval') => {
      if (typeof window !== 'undefined' && typeof window[key] === 'function') {
        return window[key].bind(window);
      }
      const fn = globalThis[key];
      return typeof fn === 'function' ? fn.bind(globalThis) : fn;
    };

    const providedGlobals = options.globals || {};
    const liftedGlobals: Record<string, any> = {};

    // Auto-lift selected globals from safe window into top-level sandbox globals
    // so user code can access them directly (e.g. `new Blob(...)`).
    if (!Object.prototype.hasOwnProperty.call(providedGlobals, 'Blob')) {
      try {
        const blobCtor = (providedGlobals as any).window?.Blob;
        if (typeof blobCtor !== 'undefined') {
          liftedGlobals.Blob = blobCtor;
        }
      } catch {
        // ignore when window proxy blocks property access
      }
    }

    if (!Object.prototype.hasOwnProperty.call(providedGlobals, 'URL')) {
      try {
        const urlCtor = (providedGlobals as any).window?.URL;
        if (typeof urlCtor !== 'undefined') {
          liftedGlobals.URL = urlCtor;
        }
      } catch {
        // ignore when window proxy blocks property access
      }
    }

    this.globals = {
      console,
      setTimeout: bindWindowFn('setTimeout'),
      clearTimeout: bindWindowFn('clearTimeout'),
      setInterval: bindWindowFn('setInterval'),
      clearInterval: bindWindowFn('clearInterval'),
      ...liftedGlobals,
      ...providedGlobals,
    };
    this.timeoutMs = options.timeoutMs ?? 5000; // 默认 5 秒超时
  }

  /**
   * 注册单个变量或函数
   */
  register(name: string, value: any): void {
    this.globals[name] = value;
  }

  /**
   * 异步运行代码，带错误处理和超时机制
   */
  async run(code: string): Promise<{
    success: boolean;
    value?: any;
    error?: any;
    timeout?: boolean;
  }> {
    const search = typeof location !== 'undefined' ? location.search : undefined;
    if (typeof search === 'string' && search.includes('skipRunJs=true')) {
      return { success: true, value: null };
    }
    const wrapped = `(async () => {
      try {
        ${code};
      } catch (e) {
        throw e;
      }
    })()`;

    const compartment = new Compartment(this.globals);

    try {
      const task = compartment.evaluate(wrapped);
      const timeoutPromise = new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('Execution timed out')), this.timeoutMs),
      );
      const result = await Promise.race([task, timeoutPromise]);
      return { success: true, value: result };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        error: err,
        timeout: err.message === 'Execution timed out',
      };
    }
  }
}
