/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import type { LightExtensionDiagnostic, LightExtensionKind, LightExtensionTreeEntryInput } from '../../shared/types';
import { BrowserPreviewSession, BrowserPreviewSessionError } from './BrowserPreviewSession';
import { ProvisionalPreviewSandbox } from './ProvisionalPreviewSandbox';
import type {
  BrowserPreviewEntryContract,
  BrowserPreviewFailureCode,
  BrowserPreviewMetrics,
  ProvisionalCompileResult,
} from './protocol';

export type BrowserProvisionalPreviewStatus =
  | 'disabled'
  | 'initializing'
  | 'building'
  | 'ready'
  | 'diagnostic'
  | 'degraded';

export interface BrowserProvisionalPreviewState {
  enabled: boolean;
  status: BrowserProvisionalPreviewStatus;
  diagnostics: LightExtensionDiagnostic[];
  failureCode?: BrowserPreviewFailureCode | string;
  metrics?: BrowserPreviewMetrics;
  result?: ProvisionalCompileResult;
}

interface UseBrowserProvisionalPreviewInput {
  enabled: boolean;
  files: LightExtensionTreeEntryInput[];
  entry?: BrowserPreviewEntryContract;
  debounceMs?: number;
  sessionFactory?: () => BrowserPreviewSession;
  sandboxFactory?: () => ProvisionalPreviewSandbox;
}

const DISABLED_STATE: BrowserProvisionalPreviewState = {
  enabled: false,
  status: 'disabled',
  diagnostics: [],
};

export function useBrowserProvisionalPreview({
  enabled,
  files,
  entry,
  debounceMs = 350,
  sessionFactory,
  sandboxFactory,
}: UseBrowserProvisionalPreviewInput): BrowserProvisionalPreviewState {
  const [state, setState] = useState<BrowserProvisionalPreviewState>(DISABLED_STATE);
  const sessionRef = useRef<BrowserPreviewSession | null>(null);
  const sandboxRef = useRef<ProvisionalPreviewSandbox | null>(null);
  const buildSequenceRef = useRef(0);
  const workspaceFiles = useMemo(
    () => files.map((file) => ({ path: file.path, content: file.content || '', language: file.language })),
    [files],
  );
  useEffect(() => {
    if (!enabled) {
      sessionRef.current?.dispose();
      sandboxRef.current?.dispose();
      sessionRef.current = null;
      sandboxRef.current = null;
      setState(DISABLED_STATE);
      return;
    }
    sessionRef.current ||= sessionFactory?.() || new BrowserPreviewSession();
    sandboxRef.current ||= sandboxFactory?.() || new ProvisionalPreviewSandbox();
    setState((current) => ({ ...current, enabled: true, status: 'initializing' }));

    return () => {
      buildSequenceRef.current += 1;
      sessionRef.current?.dispose();
      sandboxRef.current?.dispose();
      sessionRef.current = null;
      sandboxRef.current = null;
    };
  }, [enabled, sandboxFactory, sessionFactory]);

  useEffect(() => {
    if (!enabled || !entry || workspaceFiles.length === 0 || !sessionRef.current || !sandboxRef.current) {
      return;
    }
    const sequence = ++buildSequenceRef.current;
    const session = sessionRef.current;
    const sandbox = sandboxRef.current;
    setState((current) => ({
      ...current,
      enabled: true,
      status: 'building',
      diagnostics: [],
      failureCode: undefined,
      result: undefined,
    }));

    const runBuild = async () => {
      setState((current) => ({ ...current, enabled: true, status: 'building', failureCode: undefined }));
      try {
        try {
          await session.cancelLatestBuild();
        } catch {
          // Stale response rejection still prevents an uncancellable build from reaching the editor.
        }
        await session.syncWorkspace(workspaceFiles);
        const result = await session.build(entry);
        if (!result || buildSequenceRef.current !== sequence) {
          return;
        }
        let diagnostics = result.diagnostics;
        if (result.accepted && result.artifact.code) {
          const sandboxResult = await sandbox.execute(result.artifact.code);
          if (!sandboxResult.accepted) {
            diagnostics = [
              ...diagnostics,
              {
                code: 'PREVIEW_SANDBOX_RUNTIME_FAILED',
                severity: 'warning',
                message: sandboxResult.message || 'Provisional preview sandbox execution failed',
                path: entry.entryPath,
                details: { provisional: true },
              },
            ];
          }
        }
        if (buildSequenceRef.current !== sequence) {
          return;
        }
        setState({
          enabled: true,
          status: result.accepted ? (diagnostics.length ? 'diagnostic' : 'ready') : 'diagnostic',
          diagnostics,
          failureCode: result.accepted ? undefined : result.metrics.previewFailureCode,
          metrics: result.metrics,
          result,
        });
      } catch (error) {
        if (buildSequenceRef.current !== sequence) {
          return;
        }
        const failureCode = error instanceof BrowserPreviewSessionError ? error.code : 'PREVIEW_BUILD_FAILED';
        const message = error instanceof Error ? error.message : String(error);
        setState({
          enabled: true,
          status: 'degraded',
          failureCode,
          diagnostics: [
            {
              code: failureCode,
              severity: 'warning',
              message,
              path: entry.entryPath,
              details: { provisional: true },
            },
          ],
        });
      }
    };

    const timer = setTimeout(runBuild, debounceMs);
    return () => {
      clearTimeout(timer);
    };
  }, [debounceMs, enabled, entry, workspaceFiles]);

  return state;
}

export function getLightExtensionPreviewSurfaceStyle(
  kind: LightExtensionKind,
): BrowserPreviewEntryContract['surfaceStyle'] {
  if (kind === 'js-action') {
    return 'action';
  }
  if (kind === 'runjs') {
    return 'value';
  }
  return 'render';
}
