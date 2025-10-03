/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useState } from 'react';
import { parseErrorLineColumn } from '../errorHelpers';
import { FlowModelContext, JSRunner } from '@nocobase/flow-engine';

export type RunLog = { level: 'log' | 'info' | 'warn' | 'error'; msg: string; line?: number; column?: number };

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

export function useCodeRunner(hostCtx: FlowModelContext, version = 'v1') {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [running, setRunning] = useState(false);
  const clearLogs = useCallback(() => setLogs([]), []);
  const run = useCallback(
    async (code: string): Promise<Awaited<ReturnType<JSRunner['run']>> | undefined> => {
      setRunning(true);
      setLogs([]);
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
        const push = (level: RunLog['level'], args: any[]) => {
          const msg = args.map((x: any) => safeToString(x)).join(' ');
          setLogs((prev) => [...prev, { level, msg }]);
          nativeConsole[level]?.(...args);
        };
        const captureConsole = createConsoleCapture(push);

        runtimeModel.setStepParams?.('jsSettings', 'runJs', { code, version });

        // Monkey-patch JSRunner.run to inject captureConsole into globals for all runjs calls during preview
        type JSRunnerPrototype = { run: JSRunner['run'] };
        const proto = JSRunner.prototype as unknown as JSRunnerPrototype;
        const originalRun = proto.run;
        let firstResolved = false;
        let resolveDeferred: (res: any) => void = () => {};
        const deferred = new Promise<any>((resolve) => (resolveDeferred = resolve));
        proto.run = async function patchedRun(this: any, jsCode: string) {
          const prevConsole = this?.globals?.console;
          try {
            if (!this.globals) this.globals = {};
            this.globals.console = captureConsole;
          } catch (e) {
            console.warn('[useCodeRunner] inject console failed:', e);
          }
          try {
            const res = await originalRun.call(this, jsCode);
            if (!firstResolved) {
              firstResolved = true;
              try {
                resolveDeferred(res);
              } catch (e) {
                console.warn('[useCodeRunner] resolve deferred failed:', e);
              }
            }
            return res;
          } finally {
            try {
              if (typeof prevConsole === 'undefined') delete this.globals.console;
              else this.globals.console = prevConsole;
            } catch (e) {
              console.warn('[useCodeRunner] restore console failed:', e);
            }
          }
        } as JSRunner['run'];

        const runOnModel = async (m) => {
          const flow = m?.getFlow?.('jsSettings');
          const isManual = flow?.manual === true;
          if (isManual) {
            await m.applyFlow('jsSettings', { preview: { code, version } });
          } else {
            await m.applyAutoFlows({ preview: { code, version } }, false);
          }
        };

        await runOnModel(runtimeModel);
        const timeoutMs = 12000;
        const runResult = await Promise.race([
          deferred,
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: false, timeout: true, error: new Error('Preview timed out') }),
              timeoutMs,
            ),
          ),
        ]);
        (JSRunner.prototype as unknown as JSRunnerPrototype).run = originalRun;
        if (!runResult?.success) {
          const errText = runResult?.timeout ? 'Execution timed out' : String(runResult?.error || 'Unknown error');
          const pos = parseErrorLineColumn(runResult?.error);
          if (pos && typeof pos.line === 'number' && typeof pos.column === 'number') {
            setLogs((prev) => [...prev, { level: 'error', msg: errText, line: pos.line, column: pos.column }]);
          } else {
            push('error', [errText]);
          }
        } else {
          push('info', ['Execution succeeded']);
        }
        return runResult as Awaited<ReturnType<JSRunner['run']>>;
      } catch (err: any) {
        const msg = err?.message || String(err) || 'Run preview failed';
        setLogs((prev) => [...prev, { level: 'error', msg }]);
        return { success: false, error: err } as Awaited<ReturnType<JSRunner['run']>>;
      } finally {
        setRunning(false);
      }
    },
    [hostCtx, version],
  );

  return { run, logs, clearLogs, running };
}
