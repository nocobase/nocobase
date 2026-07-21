/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'ses';
import { wrapRunJSCodeForEvaluation } from '@nocobase/runjs/compiler/line-map';
import { FlowExitAllException, FlowExitException } from './utils/exceptions';
import {
  createRunJSRuntimeIssue,
  reportRunJSRuntimeIssue,
  setRunJSRuntimeReporting,
  type RunJSRuntimeReportingOptions,
} from './runjsRuntimeReporter';
import { setRunJSApiFailureReporting } from './runjsApiFailureReporter';

export interface JSRunnerOptions {
  /** Maximum execution time in milliseconds. Defaults to 5 seconds. */
  timeoutMs?: number;
  globals?: Record<string, any>;
  version?: string;
  /**
   * Enable RunJS template compatibility preprocessing for `{{ ... }}`.
   * When enabled (or falling back to version default),
   * the code will be rewritten to call `ctx.resolveJsonTemplate(...)` at runtime.
   */
  preprocessTemplates?: boolean;
  /** Optional, execution-scoped reporting used by explicit preview hosts. */
  runtimeReporting?: RunJSRuntimeReportingOptions;
}

export const DEFAULT_RUNJS_TIMEOUT_MS = 5_000;

/**
 * Decide whether RunJS `{{ ... }}` compatibility preprocessing should run.
 *
 * Priority:
 * 1. Explicit `preprocessTemplates` option always wins.
 * 2. Otherwise, `version === 'v2'` disables preprocessing.
 * 3. Fallback keeps v1-compatible behavior (enabled).
 */
export function shouldPreprocessRunJSTemplates(
  options?: Pick<JSRunnerOptions, 'preprocessTemplates' | 'version'>,
): boolean {
  if (typeof options?.preprocessTemplates === 'boolean') {
    return options.preprocessTemplates;
  }
  return options?.version !== 'v2';
}

const RUNJS_BROWSER_GLOBAL_NAMES = [
  'fetch',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'BroadcastChannel',
  'EventSource',
  'indexedDB',
  'caches',
  'Function',
  'eval',
  'globalThis',
  'Intl',
  'Blob',
  'URL',
  'location',
] as const;

export const RUNJS_ALLOWED_BARE_GLOBAL_NAMES = [
  'ctx',
  'console',
  'window',
  'document',
  'navigator',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'Array',
  'ArrayBuffer',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'JSON',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'NaN',
  'Infinity',
  ...RUNJS_BROWSER_GLOBAL_NAMES,
] as const;

function collectRunJSBrowserGlobals(providedGlobals: Record<string, unknown> = {}) {
  const windowGlobal = providedGlobals.window;
  if (!windowGlobal || typeof windowGlobal !== 'object') {
    return {};
  }

  const windowRecord = windowGlobal as Record<string, unknown>;
  const globals: Record<string, unknown> = {};
  RUNJS_BROWSER_GLOBAL_NAMES.forEach((name) => {
    if (Object.prototype.hasOwnProperty.call(providedGlobals, name)) {
      return;
    }
    try {
      const value = windowRecord[name];
      if (typeof value === 'undefined') {
        return;
      }
      globals[name] = name === 'fetch' && typeof value === 'function' ? value.bind(windowGlobal) : value;
    } catch {
      // Ignore browser globals that cannot be read in the current environment.
    }
  });
  return globals;
}

// Heuristic: detect likely bare `{{ctx.xxx}}` usage in executable positions (not quoted string literals).
const BARE_CTX_TEMPLATE_RE = /(^|[=(:,[\s)])(\{\{\s*(ctx(?:\.|\[|\?\.)[^}]*)\s*\}\})/m;

function extractDeprecatedCtxTemplateUsage(code: string): { placeholder: string; expression: string } | null {
  const src = String(code || '');
  const m = src.match(BARE_CTX_TEMPLATE_RE);
  if (!m) return null;
  const placeholder = String(m[2] || '').trim();
  const expression = String(m[3] || '').trim();
  if (!placeholder || !expression) return null;
  return { placeholder, expression };
}

function shouldHintCtxTemplateSyntax(err: any, usage: { placeholder: string; expression: string } | null): boolean {
  const isSyntaxError = err instanceof SyntaxError || String((err as any)?.name || '') === 'SyntaxError';
  if (!isSyntaxError) return false;
  if (!usage) return false;
  const msg = String((err as any)?.message || err || '');
  return /unexpected token/i.test(msg);
}

function toCtxTemplateSyntaxHintError(
  err: any,
  usage: {
    placeholder: string;
    expression: string;
  },
): Error {
  const hint = `"${usage.placeholder}" has been deprecated and cannot be used as executable RunJS syntax. Use await ctx.getVar("${usage.expression}") instead, or keep "${usage.placeholder}" as a plain string.`;
  const out = new SyntaxError(hint);
  try {
    (out as any).cause = err;
  } catch (_) {
    // ignore
  }
  try {
    // Hint-only error: avoid leaking internal bundle line numbers from stack parsers in preview UI.
    (out as any).__runjsHideLocation = true;
    out.stack = `${out.name}: ${out.message}`;
  } catch (_) {
    // ignore
  }
  return out;
}

export class JSRunner {
  private globals: Record<string, any>;
  private timeoutMs: number;
  private runtimeReporting?: RunJSRuntimeReportingOptions;

  constructor(options: JSRunnerOptions = {}) {
    const bindWindowFn = (key: 'setTimeout' | 'clearTimeout' | 'setInterval' | 'clearInterval') => {
      if (typeof window !== 'undefined' && typeof window[key] === 'function') {
        return window[key].bind(window);
      }
      const fn = globalThis[key];
      return typeof fn === 'function' ? fn.bind(globalThis) : fn;
    };

    const providedGlobals = options.globals || {};
    const liftedGlobals = collectRunJSBrowserGlobals(providedGlobals);

    this.globals = {
      console,
      setTimeout: bindWindowFn('setTimeout'),
      clearTimeout: bindWindowFn('clearTimeout'),
      setInterval: bindWindowFn('setInterval'),
      clearInterval: bindWindowFn('clearInterval'),
      ...liftedGlobals,
      ...providedGlobals,
    };
    this.timeoutMs = options.timeoutMs ?? DEFAULT_RUNJS_TIMEOUT_MS;
    this.runtimeReporting = options.runtimeReporting;
    setRunJSRuntimeReporting(providedGlobals.ctx, this.runtimeReporting);
    setRunJSApiFailureReporting(
      providedGlobals.ctx,
      this.runtimeReporting?.apiFailureReporter
        ? {
            identity: this.runtimeReporting.identity,
            reporter: this.runtimeReporting.apiFailureReporter,
          }
        : undefined,
    );
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
    const wrapped = wrapRunJSCodeForEvaluation(code);

    const compartment = new Compartment(this.globals);

    let task: Promise<unknown>;
    try {
      task = Promise.resolve(compartment.evaluate(wrapped));
    } catch (error) {
      if (error instanceof FlowExitException || error instanceof FlowExitAllException) {
        throw error;
      }
      const usage = extractDeprecatedCtxTemplateUsage(code);
      const outError =
        shouldHintCtxTemplateSyntax(error, usage) && usage ? toCtxTemplateSyntaxHintError(error, usage) : error;
      reportRunJSRuntimeIssue(
        this.runtimeReporting,
        createRunJSRuntimeIssue({ kind: 'runtime-error', error: outError }, this.runtimeReporting?.identity),
      );
      console.error(outError);
      return { success: false, error: outError, timeout: false };
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Execution timed out')), this.timeoutMs);
      });
      const result = await Promise.race([task, timeoutPromise]);
      return { success: true, value: result };
    } catch (err) {
      if (err instanceof FlowExitException) {
        throw err;
      }
      if (err instanceof FlowExitAllException) {
        throw err;
      }
      const usage = extractDeprecatedCtxTemplateUsage(code);
      const outErr = shouldHintCtxTemplateSyntax(err, usage) && usage ? toCtxTemplateSyntaxHintError(err, usage) : err;
      const timedOut = (outErr as { message?: unknown })?.message === 'Execution timed out';
      reportRunJSRuntimeIssue(
        this.runtimeReporting,
        timedOut
          ? createRunJSRuntimeIssue({ kind: 'timeout', timeoutMs: this.timeoutMs })
          : createRunJSRuntimeIssue({ kind: 'promise-rejection', error: outErr }, this.runtimeReporting?.identity),
      );
      console.error(outErr);
      return {
        success: false,
        error: outErr,
        timeout: timedOut,
      };
    } finally {
      if (typeof timeoutId !== 'undefined') {
        clearTimeout(timeoutId);
      }
    }
  }
}
