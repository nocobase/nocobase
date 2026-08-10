/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useRef } from 'react';

import type { RunJSCompileDiagnostic, RunJSSourceLocator, RunJSWorkspaceFile } from './types';
import type { UseRunJSSourceResourceResult } from './useRunJSSourceResource';
import { buildWorkspaceChanges } from './workspaceUtils';

interface UseRunJSDraftDiagnosticsOptions {
  baseCommitId?: string | null;
  baseFiles: RunJSWorkspaceFile[];
  delay?: number;
  enabled: boolean;
  entryPath: string;
  files: RunJSWorkspaceFile[];
  locator?: RunJSSourceLocator;
  onDiagnostics: (diagnostics: RunJSCompileDiagnostic[]) => void;
  repoId?: string;
  request: UseRunJSSourceResourceResult['request'];
  snapshotKey: string;
  version: string;
}

export function useRunJSDraftDiagnostics(options: UseRunJSDraftDiagnosticsOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const delay = options.delay ?? 500;

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const { baseCommitId, baseFiles, entryPath, files, locator, onDiagnostics, repoId, request, version } =
        optionsRef.current;
      if (!locator || !repoId) {
        return;
      }
      try {
        const result = await request('compilePreview', {
          locator,
          repoId,
          baseCommitId,
          files: buildWorkspaceChanges(baseFiles, files),
          entryPath,
          version,
        });
        if (!cancelled) {
          onDiagnostics(result.artifact.diagnostics);
        }
      } catch (_) {
        // Draft diagnostics are best-effort and must not surface background request failures as Run results.
      }
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delay, options.enabled, options.snapshotKey]);
}
