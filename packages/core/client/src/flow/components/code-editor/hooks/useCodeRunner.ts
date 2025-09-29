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

async function ensureElementInjection(hostCtx: any) {
  // Inject ctx.element if accessible
  let injected = false;
  try {
    const direct = hostCtx?.blockModel?.context?.ref?.current as HTMLElement | undefined;
    if (direct instanceof HTMLElement) {
      hostCtx.defineProperty('element', { get: () => direct });
      injected = true;
    }
  } catch (err) {
    // Debug note: failed to inject element via blockModel.context.ref.current
    try {
      console.debug?.('[useCodeRunner] ref injection failed', err);
    } catch (_) {
      void 0;
    }
  }
  if (!injected) {
    try {
      const uid = hostCtx?.model?.uid || hostCtx?.blockModel?.uid;
      if (uid) {
        const container = document.getElementById(`model-${uid}`);
        const mount = container?.querySelector('div') as HTMLElement | null;
        if (mount instanceof HTMLElement) {
          hostCtx.defineProperty('element', { get: () => mount });
          injected = true;
        }
      }
    } catch (err) {
      // Debug note: failed to inject element via #model-<uid>
      try {
        console.debug?.('[useCodeRunner] container injection failed', err);
      } catch (_) {
        void 0;
      }
    }
  }
  if (!injected && hostCtx?.onRefReady && hostCtx?.ref) {
    await new Promise<void>((resolve) => {
      try {
        hostCtx.onRefReady(hostCtx.ref, (el: HTMLElement) => {
          try {
            hostCtx.defineProperty('element', { get: () => el });
          } catch (err) {
            try {
              console.debug?.('[useCodeRunner] onRefReady defineProperty failed', err);
            } catch (_) {
              void 0;
            }
          }
          resolve();
        });
      } catch (err) {
        try {
          console.debug?.('[useCodeRunner] onRefReady failed to attach', err);
        } catch (_) {
          void 0;
        }
        resolve();
      }
    });
  }
}

export function useCodeRunner(hostCtx: any, version = 'v1') {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [running, setRunning] = useState(false);

  const clearLogs = useCallback(() => setLogs([]), []);
  const run = useCallback(
    async (code: string) => {
      try {
        setRunning(true);
        setLogs([]);
        if (!hostCtx?.createJSRunner) {
          return { success: false, error: new Error('Runner not available') };
        }
        const nativeConsole: Record<RunLog['level'], (...args: any[]) => void> = {
          log: (...args) => console.log(...args),
          info: (...args) => console.info(...args),
          warn: (...args) => console.warn(...args),
          error: (...args) => console.error(...args),
        };
        const push = (level: RunLog['level'], args: any[]) => {
          const msg = args.map((x: any) => safeToString(x)).join(' ');
          setLogs((prev) => [...prev, { level, msg }]);
          try {
            nativeConsole[level]?.(...args);
          } catch (_) {
            void 0;
          }
        };
        const captureConsole = createConsoleCapture(push);
        const runner = hostCtx.createJSRunner({ version, globals: { console: captureConsole } });
        try {
          if (/\bctx\.element\b/.test(code)) {
            await ensureElementInjection(hostCtx);
          }
        } catch (err) {
          try {
            console.debug?.('[useCodeRunner] ensureElementInjection failed', err);
          } catch (_) {
            void 0;
          }
        }
        const res = await runner.run(code);
        if (!res?.success) {
          const errText = res?.timeout ? 'Execution timed out' : String(res?.error || 'Unknown error');
          const pos = parseErrorLineColumn(res?.error);
          if (pos && typeof pos.line === 'number' && typeof pos.column === 'number') {
            setLogs((prev) => [...prev, { level: 'error', msg: errText, line: pos.line, column: pos.column }]);
          } else {
            push('error', [errText]);
          }
        } else {
          push('info', [`Result: ${JSON.stringify(res.value)}`]);
        }
        return res;
      } finally {
        setRunning(false);
      }
    },
    [hostCtx, version],
  );

  return { run, logs, clearLogs, running };
}
