/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { subscribeRunJSRenderDiagnostics, type RunJSRenderDiagnosticTarget } from '@nocobase/flow-engine';
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';

import type { RunJSConsoleEntry } from './types';

interface PreviewSessionState {
  diagnosticKeys: Set<string>;
  dispose: () => void;
  finalized: boolean;
  runFailedMessage: string;
  snapshotKey: string;
  statusEntryId?: number;
}

interface StartRunJSPreviewSessionOptions {
  runFailedMessage: string;
  snapshotKey: string;
  target?: RunJSRenderDiagnosticTarget;
}

export interface RunJSPreviewSessionHandle {
  cancel(): void;
  finalize(statusEntryId: number): void;
  hasRuntimeErrors(): boolean;
}

export function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useRunJSPreviewSession(options: {
  appendConsole: (entry: Omit<RunJSConsoleEntry, 'id'>) => number;
  isSnapshotCurrent: (snapshotKey: string) => boolean;
  updateConsole: (id: number, entry: Omit<RunJSConsoleEntry, 'id'>) => void;
}) {
  const { appendConsole, isSnapshotCurrent, updateConsole } = options;
  const activeSessionRef = useRef<PreviewSessionState | null>(null);

  const cancel = useCallback(() => {
    const session = activeSessionRef.current;
    activeSessionRef.current = null;
    session?.dispose();
  }, []);

  const start = useCallback(
    ({ runFailedMessage, snapshotKey, target }: StartRunJSPreviewSessionOptions): RunJSPreviewSessionHandle => {
      cancel();
      const session: PreviewSessionState = {
        diagnosticKeys: new Set(),
        dispose: () => {},
        finalized: false,
        runFailedMessage,
        snapshotKey,
      };
      activeSessionRef.current = session;

      if (target) {
        session.dispose = subscribeRunJSRenderDiagnostics(target, (diagnostic) => {
          if (activeSessionRef.current !== session || !isSnapshotCurrent(session.snapshotKey)) {
            return;
          }
          if (session.diagnosticKeys.has(diagnostic.key)) {
            return;
          }
          session.diagnosticKeys.add(diagnostic.key);
          appendConsole({ level: 'error', message: diagnostic.message });
          if (session.finalized && session.statusEntryId !== undefined) {
            updateConsole(session.statusEntryId, { level: 'error', message: session.runFailedMessage });
          }
        });
      }

      return {
        cancel() {
          if (activeSessionRef.current === session) {
            cancel();
          }
        },
        finalize(statusEntryId) {
          if (activeSessionRef.current !== session) {
            return;
          }
          session.statusEntryId = statusEntryId;
          session.finalized = true;
          if (session.diagnosticKeys.size > 0) {
            updateConsole(statusEntryId, { level: 'error', message: session.runFailedMessage });
          }
        },
        hasRuntimeErrors() {
          return session.diagnosticKeys.size > 0;
        },
      };
    },
    [appendConsole, cancel, isSnapshotCurrent, updateConsole],
  );

  useEffect(() => cancel, [cancel]);

  return { cancel, start };
}
