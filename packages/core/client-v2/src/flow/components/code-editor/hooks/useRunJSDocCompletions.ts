/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useState } from 'react';
import type { Completion } from '@codemirror/autocomplete';
import { buildRunJSCompletions, type SnippetEntry } from '../runjsCompletions';

export function useRunJSDocCompletions(hostCtx: any, version = 'v1', scene?: string | string[]) {
  const [completions, setCompletions] = useState<Completion[] | null>(null);
  const [entries, setEntries] = useState<SnippetEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { completions, entries } = await buildRunJSCompletions(hostCtx, version, scene);
        if (!cancelled) {
          setCompletions(completions);
          setEntries(entries);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setCompletions(null);
          setEntries([]);
          setError(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hostCtx, version, scene]);
  return { completions, entries, error };
}
