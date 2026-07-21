/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionProblem } from '../../../shared/problems';
import { WorkspaceProblemStore, getWorkspaceProblemRowKey } from '../workspaceProblemStore';

function problem(input: {
  code: string;
  message: string;
  requestId: string;
  source: 'browser-preview' | 'runjs-compiler' | 'typescript';
}) {
  return createLightExtensionProblem({
    phase: input.source === 'typescript' ? 'typecheck' : 'compile',
    source: input.source,
    code: input.code,
    severity: 'error',
    message: input.message,
    path: 'src/client/js-blocks/example/index.tsx',
    range: { start: { line: 2, column: 4 } },
    snapshotId: 'server-snapshot',
    requestId: input.requestId,
  });
}

describe('WorkspaceProblemStore', () => {
  it('deduplicates matching fingerprints across producers and preserves provenance', () => {
    const store = new WorkspaceProblemStore();
    store.setSnapshot('workspace-1');
    store.replaceProblems({
      producer: 'canonical',
      snapshotId: 'workspace-1',
      problems: [problem({ code: 'TS2322', message: 'Type mismatch', requestId: 'canonical-1', source: 'typescript' })],
    });
    store.replaceProblems({
      producer: 'typescript:src/client/js-blocks/example/index.tsx',
      snapshotId: 'workspace-1',
      problems: [problem({ code: 'TS2322', message: 'Type mismatch', requestId: 'local-1', source: 'typescript' })],
    });

    expect(store.getSnapshot().problems).toHaveLength(1);
    expect(store.getSnapshot().problems[0].provenance).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ requestId: 'canonical-1' }),
        expect.objectContaining({ requestId: 'local-1' }),
      ]),
    );
  });

  it('keeps different reasons at the same source location', () => {
    const store = new WorkspaceProblemStore();
    store.setSnapshot('workspace-1');
    store.replaceProblems({
      producer: 'canonical',
      snapshotId: 'workspace-1',
      problems: [
        problem({
          code: 'IMPORT_MISSING',
          message: 'Import is missing',
          requestId: 'request-1',
          source: 'runjs-compiler',
        }),
        problem({
          code: 'IMPORT_POLICY',
          message: 'Import is not allowed',
          requestId: 'request-1',
          source: 'runjs-compiler',
        }),
      ],
    });

    expect(store.getSnapshot().problems).toHaveLength(2);
  });

  it('marks old problems stale without counting them after the snapshot changes', () => {
    const store = new WorkspaceProblemStore();
    store.setSnapshot('workspace-1');
    store.replaceProblems({
      producer: 'canonical',
      snapshotId: 'workspace-1',
      problems: [
        problem({
          code: 'IMPORT_MISSING',
          message: 'Import is missing',
          requestId: 'request-1',
          source: 'runjs-compiler',
        }),
      ],
    });

    store.setSnapshot('workspace-2');

    expect(store.getSnapshot()).toMatchObject({
      snapshotId: 'workspace-2',
      problems: [],
      errorCount: 0,
    });
    expect(store.getSnapshot().staleProblems).toHaveLength(1);
  });

  it('rejects async responses for an obsolete snapshot', () => {
    const store = new WorkspaceProblemStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setSnapshot('workspace-2');

    expect(
      store.replaceProblems({
        producer: 'canonical',
        snapshotId: 'workspace-1',
        problems: [problem({ code: 'OLD', message: 'Old result', requestId: 'request-old', source: 'runjs-compiler' })],
      }),
    ).toBe(false);
    expect(store.getSnapshot().problems).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('builds row keys from fingerprint and normalized provenance', () => {
    const item = problem({ code: 'TS2322', message: 'Type mismatch', requestId: 'request-1', source: 'typescript' });

    expect(getWorkspaceProblemRowKey(item)).toContain(item.fingerprint);
    expect(getWorkspaceProblemRowKey(item)).toContain('typescript:typecheck:request-1');
  });
});
