/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useRef, useState } from 'react';
import { parseErrorLineColumn, WRAPPER_PRELUDE_LINES } from '../errorHelpers';
import {
  FlowModelContext,
  JSRunner,
  createSafeWindow,
  createSafeDocument,
  createSafeNavigator,
  prepareRunJsCode,
} from '@nocobase/flow-engine';

export type RunLog = { level: 'log' | 'info' | 'warn' | 'error'; msg: string; line?: number; column?: number };
type RunResult = Awaited<ReturnType<JSRunner['run']>>;

const LOGGER_LEVEL_TO_RUNLOG_LEVEL: Record<string, RunLog['level']> = {
  trace: 'log',
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

function safeToString(x: any): string {
  try {
    if (typeof x === 'string') return x;
    return JSON.stringify(x);
  } catch (_) {
    try {
      return String(x);
    } catch (e) {
      return '[Unstringifiable]';
    }
  }
}

function createConsoleCapture(push: (level: RunLog['level'], args: any[]) => void) {
  return {
    log: (...args: any[]) => push('log', args),
    info: (...args: any[]) => push('info', args),
    warn: (...args: any[]) => push('warn', args),
    error: (...args: any[]) => push('error', args),
  };
}
function parseInlineLineColumn(msg: string): { line: number; column: number } | null {
  const text = String(msg || '');
  const m = text.match(/[（(]line\s*(\d+)(?::(\d+))?[）)]/i);
  if (!m) return null;
  const line = Number(m[1]);
  const column = Number(m[2] || 1);
  if (!Number.isFinite(line) || line <= 0) return null;
  if (!Number.isFinite(column) || column <= 0) return { line, column: 1 };
  return { line, column };
}
function createLoggerWrapperFactory(append: (level: RunLog['level'], args: any[]) => void) {
  const originalToWrapped = new WeakMap<object, any>();
  const wrappedToOriginal = new WeakMap<object, any>();

  const wrap = (logger: any): any => {
    if (!logger || (typeof logger !== 'object' && typeof logger !== 'function')) return logger;
    if (wrappedToOriginal.has(logger as any)) return logger;
    const existing = originalToWrapped.get(logger as any);
    if (existing) return existing;

    const wrapped = new Proxy(logger as any, {
      get(target, prop, receiver) {
        if (prop === 'child' && typeof (target as any).child === 'function') {
          return (...args: any[]) => {
            const childLogger = (target as any).child.apply(target, args);
            return wrap(childLogger);
          };
        }

        if (
          typeof prop === 'string' &&
          prop in LOGGER_LEVEL_TO_RUNLOG_LEVEL &&
          typeof (target as any)[prop] === 'function'
        ) {
          const mapped = LOGGER_LEVEL_TO_RUNLOG_LEVEL[prop];
          return (...args: any[]) => {
            try {
              append(mapped, args);
            } catch (_) {
              // ignore log capture failures
            }
            return (target as any)[prop].apply(target, args);
          };
        }

        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      },
    });

    originalToWrapped.set(logger as any, wrapped);
    wrappedToOriginal.set(wrapped, logger as any);
    return wrapped;
  };

  return wrap;
}

export function useCodeRunner(hostCtx: FlowModelContext, version = 'v1') {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [running, setRunning] = useState(false);
  const activeRunTokenRef = useRef(0);
  const cancelActiveCaptureRef = useRef<(() => void) | null>(null);
  const clearLogs = useCallback(() => setLogs([]), []);
  const tr = hostCtx?.t || ((key: string) => key);
  const run = useCallback(
    async (code: string): Promise<RunResult | undefined> => {
      setRunning(true);
      setLogs([]);
      activeRunTokenRef.current += 1;
      const runToken = activeRunTokenRef.current;
      cancelActiveCaptureRef.current?.();
      cancelActiveCaptureRef.current = null;
      try {
        const model = hostCtx?.model;
        if (!model) throw new Error('No model in FlowContext');
        const engine = hostCtx.engine;
        const runtimeModel = engine.getModel(model.uid, true) || model;

        const nativeConsole: Record<RunLog['level'], (...args: any[]) => void> = {
          log: (...args) => console.log(...args),
          info: (...args) => console.info(...args),
          warn: (...args) => console.warn(...args),
          error: (...args) => console.error(...args),
        };
        const append = (level: RunLog['level'], args: any[]) => {
          const msg = args.map((x: any) => safeToString(x)).join(' ');
          // For RunJS deprecation warnings we embed "(line x:y)" in the message (user line numbers).
          // Convert it to raw line numbers (+ wrapper prelude) so the editor jump uses the same contract as errors.
          const pos = level === 'warn' ? parseInlineLineColumn(msg) : null;
          if (pos) {
            setLogs((prev) => [...prev, { level, msg, line: pos.line + WRAPPER_PRELUDE_LINES, column: pos.column }]);
          } else {
            setLogs((prev) => [...prev, { level, msg }]);
          }
          // nativeConsole[level]?.(...args);
        };
        const push = (level: RunLog['level'], args: any[]) => {
          append(level, args);
          nativeConsole[level]?.(...args);
        };
        const captureConsole = createConsoleCapture(push);
        const wrapLogger = createLoggerWrapperFactory(append);

        // 选择一个可用的设置流：优先 jsSettings，不存在则尝试 clickSettings
        const preferFlowKeys = ['jsSettings', 'clickSettings'] as const;
        const availableKey = preferFlowKeys.find((k) => runtimeModel.getFlow(k));
        const flowKey = availableKey || 'jsSettings';
        const preparedForPreview = await prepareRunJsCode(code, { preprocessTemplates: true });

        // Monkey-patch JSRunner.run to inject captureConsole into globals for all runjs calls during preview
        type JSRunnerPrototype = { run: JSRunner['run'] };
        const proto = JSRunner.prototype as unknown as JSRunnerPrototype;
        const originalRun = proto.run;
        let resolveDeferred: (res: RunResult) => void = () => {};
        const deferred = new Promise<RunResult>((resolve) => (resolveDeferred = resolve));
        let previewResult: RunResult | undefined;
        let restored = false;
        const restore = () => {
          if (restored) return;
          restored = true;
          (JSRunner.prototype as unknown as JSRunnerPrototype).run = originalRun;
          cancelActiveCaptureRef.current = null;
        };
        cancelActiveCaptureRef.current = restore;
        proto.run = async function patchedRun(this: { globals?: Record<string, any> }, jsCode: string) {
          // Be tolerant to flows that run either the raw source or the prepared (preprocessed/compiled) code.
          const isPreviewCode = jsCode === preparedForPreview || jsCode === code;
          const prevConsole = this?.globals?.console;
          const prevLoggerDescriptor = this?.globals?.ctx
            ? Object.getOwnPropertyDescriptor(this.globals.ctx, 'logger')
            : undefined;
          try {
            if (!this.globals) this.globals = {};
            try {
              this.globals.console = captureConsole;
            } catch (e) {
              console.warn('[useCodeRunner] inject console failed:', e);
            }

            try {
              if (this.globals.ctx) {
                const originalLogger = this.globals.ctx.logger;
                const wrappedLogger = wrapLogger(originalLogger);
                Object.defineProperty(this.globals.ctx, 'logger', {
                  configurable: true,
                  enumerable: true,
                  writable: false,
                  value: wrappedLogger,
                });
              }
            } catch (e) {
              console.warn('[useCodeRunner] inject logger failed:', e);
            }
          } catch (e) {
            console.warn('[useCodeRunner] inject globals failed:', e);
          }
          try {
            const res = await originalRun.call(this, jsCode);
            // 预览过程中会触发 params-resolvers 等内部 ctx.runjs 调用（例如 resolveJsonTemplate 解析 {{ }}）。
            // 这些内部调用失败不应影响“预览代码本身”的执行结果，否则会出现预览成功但提示失败的误判。
            if (isPreviewCode) {
              previewResult = res;
              resolveDeferred(res);
            }
            return res;
          } finally {
            try {
              if (typeof prevConsole === 'undefined') delete this.globals.console;
              else this.globals.console = prevConsole;
            } catch (e) {
              console.warn('[useCodeRunner] restore console failed:', e);
            }
            try {
              if (this.globals?.ctx) {
                if (typeof prevLoggerDescriptor === 'undefined') delete this.globals.ctx.logger;
                else Object.defineProperty(this.globals.ctx, 'logger', prevLoggerDescriptor);
              }
            } catch (e) {
              console.warn('[useCodeRunner] restore logger failed:', e);
            }
          }
        } as JSRunner['run'];

        const runOnModel = async (m) => {
          const flow = m?.getFlow?.(flowKey);
          const isManual = flow?.manual === true;
          // 如果 flow 显式绑定了某个事件（如 on: 'click'），则按事件名分发；
          // 否则：manual=true 走 applyFlow；没有 on 且非 manual 走 beforeRender。
          const onDef = flow?.on;
          const eventName = typeof onDef === 'string' ? onDef : onDef?.eventName;
          if (!flow) {
            // 无可用流程（典型场景：联动规则里的 RunJS 预览），直接在当前上下文执行代码
            const navigator = createSafeNavigator();
            await hostCtx.runjs(
              code,
              { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
              { version },
            );
          } else if (typeof eventName === 'string') {
            await m.dispatchEvent(eventName, { preview: { code, version } }, { sequential: true, useCache: false });
          } else if (isManual) {
            await m.applyFlow(flowKey, { preview: { code, version } });
          } else {
            await m.dispatchEvent(
              'beforeRender',
              { preview: { code, version } },
              { sequential: true, useCache: false },
            );
          }
        };

        let runResult: RunResult | undefined;
        try {
          await runOnModel(runtimeModel);
        } catch (e) {
          restore();
          throw e;
        }

        const pushRunResultLog = (res: RunResult) => {
          if (!res?.success) {
            const errText = res?.timeout ? tr('Execution timed out') : String(res?.error || tr('Unknown error'));
            const pos = parseErrorLineColumn(res?.error);
            if (pos && typeof pos.line === 'number' && typeof pos.column === 'number') {
              setLogs((prev) => [...prev, { level: 'error', msg: errText, line: pos.line, column: pos.column }]);
            } else {
              push('error', [errText]);
            }
          } else {
            push('info', [tr('Execution succeeded')]);
          }
        };

        if (previewResult) {
          restore();
          runResult = previewResult;
          pushRunResultLog(runResult);
          return runResult;
        }

        // Some flows (e.g. using ctx.onRefReady) schedule the actual ctx.runjs call asynchronously.
        // Do not block the preview button; instead, resolve optimistically and update logs when result arrives.
        const timeoutMs = 12000;
        void (async () => {
          const result: RunResult = await Promise.race([
            deferred,
            new Promise<RunResult>((resolve) =>
              setTimeout(
                () => resolve({ success: false, timeout: true, error: new Error('Preview timed out') }),
                timeoutMs,
              ),
            ),
          ]);
          if (activeRunTokenRef.current !== runToken) return;
          restore();
          pushRunResultLog(result);
        })();

        return { success: true, value: undefined };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err) || tr('Run preview failed');
        setLogs((prev) => [...prev, { level: 'error', msg }]);
        return { success: false, error: err };
      } finally {
        setRunning(false);
      }
    },
    [hostCtx, version, tr],
  );

  return { run, logs, clearLogs, running };
}
