/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringSurface } from '@nocobase/client-v2';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runJSStudioProvider } from '../RunJSStudioProvider';

const mocks = vi.hoisted(() => {
  const state = { activeSurfaceId: undefined as string | undefined };
  const authoringSurfaces = new Map<string, CodeAuthoringSurface>();
  const authoringSurfaceRegistry = {
    activate: (surfaceId: string) => {
      if (!authoringSurfaces.has(surfaceId)) {
        throw new Error(`Unknown authoring surface: ${surfaceId}`);
      }
      state.activeSurfaceId = surfaceId;
    },
    get: (surfaceId: string) => authoringSurfaces.get(surfaceId),
    register: (surface: CodeAuthoringSurface) => {
      authoringSurfaces.set(surface.id, surface);
      return () => {
        if (authoringSurfaces.get(surface.id) === surface) {
          authoringSurfaces.delete(surface.id);
          surface.dispose?.();
        }
      };
    },
  };
  return {
    app: { aiManager: { authoringSurfaces: authoringSurfaceRegistry } },
    authoringSurfaces,
    diagnoseRunJS: vi.fn(),
    request: vi.fn(),
    state,
    t: (key: string) => key,
  };
});

vi.mock('../../../../shared/vsc-file/path-normalize', () => ({
  normalizePath: (path: string) => String(path || '').replace(/\\/g, '/'),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
    view: {},
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    authoringSurfaceId,
    onChange,
    placeholder,
    readonly,
    revealPosition,
    runButton,
    value,
  }: {
    authoringSurfaceId?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
    revealPosition?: { line: number; column: number };
    runButton?: React.ReactNode;
    value?: string;
  }) => (
    <div
      data-authoring-surface-id={authoringSurfaceId}
      data-reveal-column={revealPosition?.column}
      data-reveal-line={revealPosition?.line}
      data-testid="mock-code-editor"
    >
      <textarea
        aria-label={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readonly}
        value={value || ''}
      />
      {runButton}
    </div>
  ),
  diagnoseRunJS: mocks.diagnoseRunJS,
  useApp: () => mocks.app,
  useFullscreenOverlay: () => {
    const [placeholderEl, setPlaceholderEl] = React.useState<HTMLDivElement | null>(null);
    return {
      container: placeholderEl,
      enterFullscreen: vi.fn(),
      exitFullscreen: vi.fn(),
      isFullscreen: false,
      placeholderRef: setPlaceholderEl,
      placeholderStyle: {},
      toggleFullscreen: vi.fn(),
    };
  },
}));

vi.mock('../../locale', () => ({
  useT: () => mocks.t,
}));

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_1',
  flowKey: 'settings',
  stepKey: 'runjs',
  paramPath: ['code'],
} as const;

const repository = {
  id: 'repo-1',
  repoId: 'repo-1',
  ownerType: 'runjs-source',
  ownerId: 'owner-1',
  name: 'source',
  status: 'active',
  defaultRef: 'head',
  headCommitId: 'commit-1',
  headSeq: 1,
};

const commit = {
  id: 'commit-1',
  repoId: 'repo-1',
  hash: 'hash-1',
  seq: 1,
  parentCommitId: null,
  treeHash: 'tree-1',
  message: 'Initial import',
  authorId: '1',
  metadata: {},
  createdAt: '2026-07-02T05:50:00.000Z',
};

const openResult = {
  locator,
  locatorKind: 'flowModel.step',
  repositoryIdentity: {
    ownerType: 'runjs-source',
    ownerId: 'owner-1',
    name: 'source',
  },
  legacy: {
    code: 'return 1;',
    version: 'v2',
    label: 'JS block / Write JavaScript',
    surfaceStyle: 'value',
    language: 'typescript',
    entryPath: 'src/client/index.tsx',
    ownerFingerprint: 'owner-fingerprint-1',
  },
  ownerFingerprint: 'owner-fingerprint-1',
  source: {
    label: 'JS block / Write JavaScript',
    kind: 'flowModel.step',
    surfaceStyle: 'value',
    runtimeVersion: 'v2',
    language: 'typescript',
    ownerFingerprint: 'owner-fingerprint-1',
    metadata: {},
  },
  repository,
  files: [
    {
      path: 'src/client/index.tsx',
      content: 'return 1;',
      language: 'typescript',
      mode: '100644',
    },
  ],
  permissions: {
    canRead: true,
    canWrite: true,
    canSave: true,
  },
  history: {
    items: [commit],
  },
};

function renderEditor(extraProps: Record<string, unknown> = {}) {
  return render(
    <>
      {runJSStudioProvider.renderEditor({
        value: { code: 'return 1;', version: 'v2' },
        onChange: vi.fn(),
        locator,
        scene: 'block',
        ...extraProps,
      })}
    </>,
  );
}

async function getRegisteredSurface(): Promise<CodeAuthoringSurface> {
  await waitFor(() => expect(mocks.authoringSurfaces.size).toBe(1));
  const surface = Array.from(mocks.authoringSurfaces.values())[0];
  if (!surface) {
    throw new Error('Expected a registered authoring surface');
  }
  return surface;
}

describe('RunJS Studio authoring surface', () => {
  beforeEach(() => {
    mocks.state.activeSurfaceId = undefined;
    mocks.authoringSurfaces.clear();
    mocks.diagnoseRunJS.mockResolvedValue({
      execution: { finished: true, started: true, timeout: false },
      issues: [],
      logs: [],
    });
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({ data: { data: openResult } });
      }
      if (url === 'runJSSources:compilePreview') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code: 'compiled code',
                version: 'v2',
                sourceMap: null,
                diagnostics: [],
                filesHash: 'files-hash-2',
                entryPath: (data as { entryPath?: string })?.entryPath || 'src/client/index.tsx',
              },
            },
          },
        });
      }
      if (url === 'runJSSources:save') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: { ...repository, headCommitId: 'commit-2', headSeq: 2 },
              commit: { ...commit, id: 'commit-2', seq: 2 },
              artifact: {
                entryPath: 'src/client/index.tsx',
                filesHash: 'files-hash-2',
                runtimeCodeHash: 'runtime-hash-2',
                diagnostics: [],
              },
              ownerFingerprint: 'owner-fingerprint-2',
              writeResult: { ownerFingerprint: 'owner-fingerprint-2' },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('registers a stable application surface, forwards its id, activates it, and disposes it on unmount', async () => {
    const firstRender = renderEditor();
    const firstSurface = await getRegisteredSurface();
    const firstId = firstSurface.id;

    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-authoring-surface-id', firstId);
    fireEvent.focus(screen.getByLabelText('Edit file content'));
    expect(mocks.state.activeSurfaceId).toBe(firstId);

    firstRender.unmount();
    expect(mocks.authoringSurfaces.size).toBe(0);
    await expect(firstSurface.getSnapshot()).rejects.toThrow(/no longer available/);

    const remountedRender = renderEditor();
    const remountedSurface = await getRegisteredSurface();
    expect(remountedSurface.id).toBe(firstId);

    remountedRender.unmount();
    renderEditor({ locator: { ...locator, modelUid: 'fm_2' } });
    const otherWorkspaceSurface = await getRegisteredSurface();
    expect(otherWorkspaceSurface.id).not.toBe(firstId);
  });

  it('reads unsaved source, exposes generated declarations as read-only, and keeps virtual files out of save', async () => {
    const workspaceTypeScriptContextResolver = vi.fn(() => ({
      declarationFiles: [
        {
          path: 'types/generated-context.d.ts',
          content: 'declare const generatedContext: string;',
          language: 'typescript',
        },
      ],
    }));
    renderEditor({ workspaceTypeScriptContextResolver });
    const surface = await getRegisteredSurface();
    const initialSnapshot = await surface.getSnapshot();

    const virtualFile = initialSnapshot.files.find((file) => file.path === 'types/generated-context.d.ts');
    expect(virtualFile).toMatchObject({ kind: 'virtual', persisted: false, writable: false });
    expect(await surface.read(['types/generated-context.d.ts'])).toEqual([
      expect.objectContaining({
        content: 'declare const generatedContext: string;',
        kind: 'virtual',
        persisted: false,
        writable: false,
      }),
    ]);

    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'return unsavedValue;' },
    });
    await waitFor(async () => {
      expect(await surface.read(['src/client/index.tsx'])).toEqual([
        expect.objectContaining({ content: 'return unsavedValue;' }),
      ]);
    });
    const editedSnapshot = await surface.getSnapshot();
    expect(editedSnapshot.snapshotId).not.toBe(initialSnapshot.snapshotId);

    await expect(
      surface.prepareChanges({
        baseSnapshotId: editedSnapshot.snapshotId,
        changes: [
          {
            type: 'update',
            path: 'types/generated-context.d.ts',
            baseHash: virtualFile?.hash || '',
            content: 'declare const generatedContext: number;',
          },
        ],
      }),
    ).rejects.toThrow();

    const sourceFile = editedSnapshot.files.find((file) => file.path === 'src/client/index.tsx');
    await expect(
      surface.prepareChanges({
        baseSnapshotId: editedSnapshot.snapshotId,
        changes: [
          {
            type: 'delete',
            path: 'src/client/index.tsx',
            baseHash: sourceFile?.hash || '',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'PATH_ACCESS_DENIED',
      details: { reason: 'RunJS entry file cannot be deleted' },
    });

    const plan = await surface.prepareChanges({
      baseSnapshotId: editedSnapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: 'src/client/index.tsx',
          baseHash: sourceFile?.hash || '',
          content: "import { helper } from './helper';\nreturn helper;",
        },
        {
          type: 'create',
          path: 'src/client/helper.ts',
          content: 'export const helper = 2;',
          language: 'typescript',
        },
      ],
    });
    expect(plan.changes).toHaveLength(2);
    expect(plan.diffs.map((diff) => diff.path)).toEqual(['src/client/helper.ts', 'src/client/index.tsx']);

    let applyResult: Awaited<ReturnType<CodeAuthoringSurface['applyPreparedChanges']>> | undefined;
    await act(async () => {
      applyResult = await surface.applyPreparedChanges(plan.planId);
    });
    expect(applyResult?.changedPaths).toEqual(['src/client/helper.ts', 'src/client/index.tsx']);
    expect((await surface.list()).map((file) => file.path)).not.toContain('.nocobase/runjs-source.json');
    expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:save')).toHaveLength(0);
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      "import { helper } from './helper';\nreturn helper;",
    );

    await act(async () => {
      await surface.reveal('src/client/helper.ts', { start: { line: 1, column: 14 } });
    });
    expect(screen.getByLabelText('Edit file content')).toHaveValue('export const helper = 2;');
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-reveal-line', '1');
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-reveal-column', '14');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save version' });
    expect(within(dialog).getByText(/^2 file\(s\) changed,/)).toBeTruthy();
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Apply AI workspace changes' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.request.mock.calls.some(([request]) => request.url === 'runJSSources:save')).toBe(true);
    });
    const saveRequest = mocks.request.mock.calls
      .map(([request]) => request as { url: string; data?: { files?: Array<{ path: string }> } })
      .find((request) => request.url === 'runJSSources:save');
    expect(saveRequest?.data?.files?.map((file) => file.path).sort()).toEqual([
      'src/client/helper.ts',
      'src/client/index.tsx',
    ]);
    expect(saveRequest?.data?.files?.some((file) => file.path === 'types/generated-context.d.ts')).toBe(false);
  });

  it('keeps the internal manifest and invalid source paths unreadable through the authoring surface', async () => {
    mocks.request.mockImplementationOnce(({ url }: { url: string }) => {
      if (url !== 'runJSSources:open') {
        throw new Error(`Unexpected request: ${url}`);
      }
      return Promise.resolve({
        data: {
          data: {
            ...openResult,
            files: [
              ...openResult.files,
              {
                path: '.nocobase/runjs-source.json',
                content: '{"entry":"src/client/index.tsx"}\n',
                language: 'json',
                mode: '100644',
              },
              {
                path: 'src/.private/secret.ts',
                content: 'export const secret = true;\n',
                language: 'typescript',
                mode: '100644',
              },
              {
                path: 'private/outside.ts',
                content: 'export const outside = true;\n',
                language: 'typescript',
                mode: '100644',
              },
            ],
          },
        },
      });
    });
    renderEditor();
    const surface = await getRegisteredSurface();
    const snapshot = await surface.getSnapshot();

    expect(snapshot.files.map((file) => file.path)).not.toEqual(
      expect.arrayContaining(['.nocobase/runjs-source.json', 'src/.private/secret.ts', 'private/outside.ts']),
    );
    await expect(
      surface.read(['.nocobase/runjs-source.json', 'src/.private/secret.ts', 'private/outside.ts']),
    ).resolves.toEqual([]);
    await expect(
      surface.prepareChanges({
        baseSnapshotId: snapshot.snapshotId,
        changes: [
          {
            type: 'update',
            path: '.nocobase/runjs-source.json',
            baseHash: 'unavailable-to-ai',
            content: '{"entry":"src/client/other.tsx"}\n',
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: 'PATH_ACCESS_DENIED',
      details: { reason: 'RunJS internal manifest cannot be changed' },
    });
  });

  it('redacts unreadable RunJS paths from snapshot and validation diagnostics', async () => {
    const diagnostics = [
      {
        path: 'src/client/index.tsx',
        line: 1,
        column: 1,
        message:
          "Readable failure references .nocobase/runjs-source.json, src/.private/secret.ts, private/outside.ts, 'src/.private/My Secret.ts', src/.private/Unquoted Secret.ts, private/foo.bar Secret.ts, and \"src/.private/O'Reilly Secret.ts\".",
        severity: 'error' as const,
      },
      {
        path: '.nocobase/runjs-source.json',
        message: 'Internal manifest failure',
        severity: 'error' as const,
      },
      {
        path: 'src/.private/secret.ts',
        message: 'Hidden source failure',
        severity: 'error' as const,
      },
      {
        path: 'private/outside.ts',
        message: 'Outside source failure',
        severity: 'error' as const,
      },
      {
        message:
          'Workspace failure references src/client/index.tsx, .nocobase/runjs-source.json, src/.private/secret.ts, and private/outside.ts.',
        severity: 'warning' as const,
      },
    ];
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              files: [
                ...openResult.files,
                ...[
                  '.nocobase/runjs-source.json',
                  'src/.private/secret.ts',
                  'private/outside.ts',
                  'src/.private/My Secret.ts',
                  'src/.private/Unquoted Secret.ts',
                  'private/foo.bar Secret.ts',
                  "src/.private/O'Reilly Secret.ts",
                ].map((path) => ({ path, content: 'hidden', language: 'typescript', mode: '100644' })),
              ],
            },
          },
        });
      }
      if (url === 'runJSSources:compilePreview') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code: 'compiled code',
                version: 'v2',
                sourceMap: null,
                diagnostics,
                filesHash: 'files-hash-redacted-diagnostics',
                entryPath: 'src/client/index.tsx',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    renderEditor();
    const surface = await getRegisteredSurface();

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(async () => {
      expect((await surface.getSnapshot()).diagnostics).toHaveLength(2);
    });

    const snapshot = await surface.getSnapshot();
    const validation = await surface.validateDraft();
    const expectedMessages = [
      'Readable failure references [redacted RunJS workspace path], [redacted RunJS workspace path], [redacted RunJS workspace path], \'[redacted RunJS workspace path]\', [redacted RunJS workspace path], [redacted RunJS workspace path], and "[redacted RunJS workspace path]".',
      'Workspace failure references src/client/index.tsx, [redacted RunJS workspace path], [redacted RunJS workspace path], and [redacted RunJS workspace path].',
    ];
    expect(snapshot.diagnostics.map((diagnostic) => diagnostic.message)).toEqual(expectedMessages);
    expect(validation.diagnostics).toEqual([]);
    expect(JSON.stringify({ snapshot, validation })).not.toMatch(
      /\.nocobase\/runjs-source\.json|src\/\.private\/secret\.ts|private\/outside\.ts|My Secret\.ts|Unquoted Secret\.ts|foo\.bar Secret\.ts|O'Reilly Secret\.ts/,
    );
  });

  it('validates the complete unsaved workspace without invoking preview execution', async () => {
    const onPreview = vi.fn();
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              files: [
                ...openResult.files,
                {
                  path: 'src/client/helper.ts',
                  content: 'export const helper = 1;',
                  language: 'typescript',
                },
              ],
            },
          },
        });
      }
      if (url === 'runJSSources:compilePreview') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code: 'compiled code',
                version: 'v2',
                sourceMap: null,
                diagnostics: [
                  {
                    path: 'src/client/helper.ts',
                    line: 3,
                    column: 7,
                    message: 'Type mismatch',
                    severity: 'error',
                    code: 'TS2322',
                  },
                ],
                filesHash: 'files-hash-validation',
                entryPath: 'src/client/index.tsx',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    renderEditor({ onPreview });
    const surface = await getRegisteredSurface();

    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: "import { helper } from './helper';\nreturn helper;" },
    });
    const result = await surface.validateDraft();

    expect(result).toMatchObject({ stale: false, saved: false });
    expect(result.diagnostics).toEqual([
      {
        path: 'src/client/helper.ts',
        range: { start: { line: 3, column: 7 } },
        message: 'Type mismatch',
        severity: 'error',
        code: 'TS2322',
        source: 'runjs-compiler',
      },
    ]);
    const compileRequest = mocks.request.mock.calls
      .map(([request]) => request as { url: string; data?: { entryPath?: string; files?: Array<{ path: string }> } })
      .find((request) => request.url === 'runJSSources:compilePreview');
    expect(compileRequest?.data).toMatchObject({ entryPath: 'src/client/index.tsx' });
    expect(compileRequest?.data?.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx' }),
        expect.objectContaining({ path: 'src/client/helper.ts' }),
      ]),
    );
    expect(onPreview).not.toHaveBeenCalled();
    expect(mocks.diagnoseRunJS).not.toHaveBeenCalled();
    expect(mocks.request.mock.calls.some(([request]) => request.url === 'runJSSources:save')).toBe(false);
  });

  it('marks delayed validation stale and does not publish its diagnostics after a manual edit', async () => {
    let resolveCompile:
      | ((value: {
          data: {
            data: {
              locator: typeof locator;
              locatorKind: string;
              artifact: {
                code: string;
                version: string;
                sourceMap: null;
                diagnostics: Array<{
                  path: string;
                  line: number;
                  column: number;
                  message: string;
                  severity: string;
                }>;
                filesHash: string;
                entryPath: string;
              };
            };
          };
        }) => void)
      | undefined;
    const compilePromise = new Promise<Parameters<NonNullable<typeof resolveCompile>>[0]>((resolve) => {
      resolveCompile = resolve;
    });
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({ data: { data: openResult } });
      }
      if (url === 'runJSSources:compilePreview') {
        return compilePromise;
      }
      return Promise.resolve({ data: { data: {} } });
    });
    renderEditor();
    const surface = await getRegisteredSurface();

    const validationPromise = surface.validateDraft();
    await waitFor(() => {
      expect(mocks.request.mock.calls.some(([request]) => request.url === 'runJSSources:compilePreview')).toBe(true);
    });
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'return changedWhileCompiling;' },
    });
    resolveCompile?.({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          artifact: {
            code: 'stale code',
            version: 'v2',
            sourceMap: null,
            diagnostics: [
              {
                path: 'src/client/index.tsx',
                line: 1,
                column: 1,
                message: 'Stale diagnostic',
                severity: 'error',
              },
            ],
            filesHash: 'stale-files-hash',
            entryPath: 'src/client/index.tsx',
          },
        },
      },
    });

    await expect(validationPromise).resolves.toMatchObject({
      stale: true,
      diagnostics: [expect.objectContaining({ message: 'Stale diagnostic' })],
    });
    expect(screen.queryByText('Stale diagnostic')).toBeNull();
    expect(screen.getByLabelText('Edit file content')).toHaveValue('return changedWhileCompiling;');
  });
});
