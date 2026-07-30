/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runJSStudioProvider } from '../runjs-studio/RunJSStudioProvider';
import { runJSStudioToolbarRegistry } from '../runjs-studio/RunJSStudioToolbarRegistry';
import type { RunJSSourceActionInput, RunJSSourceLocator } from '../runjs-studio/types';
import { runJSSourceActionNames, RunJSSourceRequestError } from '../runjs-studio/useRunJSSourceResource';
import { runJSManifestPath } from '../runjs-studio/workspaceUtils';

const mocks = vi.hoisted(() => {
  const flowEngine = { getModel: vi.fn() };
  const model = { uid: 'fm_1', flowEngine };
  flowEngine.getModel.mockReturnValue(model);
  return {
    authoringSurfaces: new Map<string, { id: string; dispose?: () => void }>(),
    closeView: vi.fn(),
    diagnoseRunJS: vi.fn(),
    flowEngine,
    model,
    renderErrorReporters: new Set<(diagnostic: { key: string; message: string }) => void>(),
    request: vi.fn(),
    view: {} as {
      beforeClose?: (payload?: unknown) => boolean | void | Promise<boolean | void>;
      close?: () => boolean | void | Promise<boolean | void>;
    },
  };
});

vi.mock('../../shared/path-normalize', () => ({
  normalizePath: (path: string) => String(path || '').replace(/\\/g, '/'),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
    engine: mocks.flowEngine,
    model: mocks.model,
    view: mocks.view,
  }),
  subscribeRunJSRenderDiagnostics: (
    _target: unknown,
    reporter: (diagnostic: { key: string; message: string }) => void,
  ) => {
    mocks.renderErrorReporters.add(reporter);
    return () => mocks.renderErrorReporters.delete(reporter);
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    authoringSurfaceId,
    value,
    onChange,
    placeholder,
    readonly,
    toolbarLeftExtra,
    runButton,
    fullscreenControl,
    diagnostics,
    enableLinter,
    language,
    jsonSchema,
  }: {
    authoringSurfaceId?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
    toolbarLeftExtra?: React.ReactNode;
    runButton?: React.ReactNode;
    fullscreenControl?: { isFullscreen: boolean; toggleFullscreen: () => void };
    diagnostics?: Array<{ message: string }>;
    enableLinter?: boolean;
    language?: string;
    jsonSchema?: { uri?: string };
  }) => (
    <div
      data-authoring-surface-id={authoringSurfaceId}
      data-diagnostic-messages={diagnostics?.map((diagnostic) => diagnostic.message).join('|')}
      data-enable-linter={String(Boolean(enableLinter))}
      data-json-schema-uri={jsonSchema?.uri}
      data-language={language}
      data-testid="mock-code-editor"
    >
      <div>
        {toolbarLeftExtra}
        {runButton}
        {fullscreenControl ? (
          <button onClick={fullscreenControl.toggleFullscreen} type="button">
            {fullscreenControl.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        ) : null}
      </div>
      <textarea
        aria-label={placeholder}
        readOnly={readonly}
        value={value || ''}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  ),
  useApp: () => ({
    name: 'test-app',
    aiManager: {
      authoringSurfaces: {
        register: (surface: { id: string; dispose?: () => void }) => {
          mocks.authoringSurfaces.set(surface.id, surface);
          return () => {
            if (mocks.authoringSurfaces.get(surface.id) === surface) {
              mocks.authoringSurfaces.delete(surface.id);
              surface.dispose?.();
            }
          };
        },
      },
    },
  }),
  diagnoseRunJS: mocks.diagnoseRunJS,
  useFullscreenOverlay: () => {
    const [placeholderEl, setPlaceholderEl] = React.useState<HTMLDivElement | null>(null);
    const [overlayEl, setOverlayEl] = React.useState<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
      if (!isFullscreen) {
        setOverlayEl(null);
        return undefined;
      }

      const el = document.createElement('div');
      document.body.appendChild(el);
      setOverlayEl(el);

      return () => {
        el.remove();
      };
    }, [isFullscreen]);

    return {
      isFullscreen,
      toggleFullscreen: () => setIsFullscreen((current) => !current),
      enterFullscreen: () => setIsFullscreen(true),
      exitFullscreen: () => setIsFullscreen(false),
      placeholderRef: setPlaceholderEl,
      placeholderStyle: { height: 320 },
      container: isFullscreen ? overlayEl : placeholderEl,
    };
  },
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_1',
  flowKey: 'settings',
  stepKey: 'runjs',
  paramPath: ['code'],
} satisfies RunJSSourceLocator;

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

function createHistoryCommit(seq: number) {
  return {
    ...commit,
    id: `commit-${seq}`,
    hash: `hash-${seq}`,
    seq,
    parentCommitId: seq > 1 ? `commit-${seq - 1}` : null,
    treeHash: `tree-${seq}`,
    message: `History v${seq}`,
  };
}

const previewSourceMap = JSON.stringify({
  version: 1,
  kind: 'runjs-line-map',
  sourceURL: 'nocobase-runjs://bundle/test.js',
  generatedCodeLineOffset: 2,
  mappings: [],
});

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
    metadata: {
      modelUse: 'JSBlockModel',
    },
  },
  repository,
  files: [
    {
      path: 'src/client/index.tsx',
      content: 'return 1;',
      blobHash: 'a'.repeat(64),
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

function getSubmittedMainContent(data: unknown): string {
  const input = data as { files?: Array<{ path: string; content?: string }> };
  return input.files?.find((file) => file.path === 'src/client/index.tsx')?.content || 'return 1;';
}

function renderEditor(onChange = vi.fn(), extraProps: Record<string, unknown> = {}) {
  return render(
    <>
      {runJSStudioProvider.renderEditor({
        value: { code: 'return 1;', version: 'v2' },
        onChange,
        locator,
        scene: 'block',
        ...extraProps,
      })}
    </>,
  );
}

function createDataTransfer() {
  return {
    data: new Map<string, string>(),
    effectAllowed: '',
    getData(type: string) {
      return this.data.get(type) || '';
    },
    setData(type: string, value: string) {
      this.data.set(type, value);
    },
  };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

describe('runJSStudioProvider', () => {
  beforeEach(() => {
    mocks.authoringSurfaces.clear();
    mocks.renderErrorReporters.clear();
    mocks.view.close = mocks.closeView;
    Reflect.deleteProperty(mocks.view, 'beforeClose');
    mocks.diagnoseRunJS.mockResolvedValue({
      execution: { finished: true, started: true, timeout: false },
      issues: [],
      logs: [],
    });
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }

      if (url === 'runJSSources:compilePreview') {
        const code = getSubmittedMainContent(data);
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code,
                version: 'v2',
                sourceMap: previewSourceMap,
                diagnostics: [],
                filesHash: 'files-hash-2',
                entryPath: 'src/client/index.tsx',
              },
            },
          },
        });
      }

      if (url === 'runJSSources:saveChanges') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: {
                ...repository,
                headCommitId: 'commit-2',
                headSeq: 2,
              },
              commit: {
                ...commit,
                id: 'commit-2',
                seq: 2,
                message: 'Update code',
              },
              artifact: {
                entryPath: 'src/client/index.tsx',
                filesHash: 'files-hash-2',
                runtimeCodeHash: 'runtime-hash-2',
                diagnostics: [],
              },
              ownerFingerprint: 'owner-fingerprint-2',
              writeResult: {
                ownerFingerprint: 'owner-fingerprint-2',
              },
            },
          },
        });
      }

      if (url === 'runJSSources:importZip') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              files: [
                {
                  path: runJSManifestPath,
                  content: '{"entry":"src/main.tsx","runtimeVersion":"v3"}\n',
                  language: 'json',
                },
                {
                  path: 'src/main.tsx',
                  content: 'ctx.render("Imported draft");',
                  language: 'typescript',
                },
              ],
              manifest: {
                entryPath: 'src/main.tsx',
                runtimeVersion: 'v3',
              },
              entryPath: 'src/main.tsx',
              fileCount: 2,
              diagnostics: [],
            },
          },
        });
      }

      if (url === 'runJSSources:getVersion') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              commit,
              files: [
                {
                  path: 'src/client/index.tsx',
                  content: 'return restored;',
                  language: 'typescript',
                  mode: '100644',
                },
              ],
            },
          },
        });
      }

      if (url === 'runJSSources:listHistory') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              items: [commit],
              nextBeforeSeq: null,
            },
          },
        });
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });
  });

  it('exposes the typed incremental save action without changing the Studio save route', () => {
    const input: RunJSSourceActionInput<'saveChanges'> = {
      locator,
      repoId: repository.id,
      baseCommitId: repository.headCommitId,
      baseOwnerFingerprint: openResult.ownerFingerprint,
      message: 'Update one RunJS file',
      changes: [
        {
          operation: 'upsert',
          path: 'src/client/index.tsx',
          expectedBlobHash: 'a'.repeat(64),
          content: 'return 2;',
        },
      ],
    };

    expect(runJSSourceActionNames).toContain('saveChanges');
    expect(input.changes).toEqual([
      expect.objectContaining({
        operation: 'upsert',
        expectedBlobHash: 'a'.repeat(64),
      }),
    ]);
  });

  it('opens the permission-protected commit diff from version history', async () => {
    const historyCommit = createHistoryCommit(2);
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              history: { items: [historyCommit, commit] },
            },
          },
        });
      }
      if (url === 'runJSSources:diff') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              fromCommitId: commit.id,
              toCommitId: historyCommit.id,
              files: [
                {
                  status: 'modified',
                  path: 'src/client/index.tsx',
                  pathHash: 'path-1',
                  additions: 2,
                  deletions: 1,
                  tooLarge: false,
                },
              ],
              summary: { added: 0, modified: 1, deleted: 0, unchanged: 0, renamed: 0 },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderEditor();
    await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    fireEvent.click(screen.getByRole('button', { name: 'Changes v2' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:diff',
          data: {
            locator,
            repoId: repository.id,
            fromCommitId: commit.id,
            toCommitId: historyCommit.id,
          },
        }),
      );
    });
    expect(await screen.findByRole('dialog', { name: /Commit changes.*v2/ })).toBeTruthy();
    expect(screen.getByText('src/client/index.tsx')).toBeTruthy();
    expect(screen.getByText('Modified · +2 · -1')).toBeTruthy();
  });

  it('handles only flow model step locators and prefers sourceLocator', () => {
    expect(runJSStudioProvider.canHandle?.({ value: { code: '', version: 'v2' }, locator })).toBe(true);

    const nonStepLocators = [
      {
        kind: 'flowModel.flowRegistry.runjs' as const,
        modelUid: 'fm_1',
        flowKey: 'eventFlow',
        stepKey: 'runjs',
        sourcePath: ['params', 'code'],
      },
      { kind: 'chart.option' as const, modelUid: 'chart-1' },
      { kind: 'chart.events' as const, modelUid: 'chart-1' },
    ];
    for (const nonStepLocator of nonStepLocators) {
      expect(runJSStudioProvider.canHandle?.({ value: { code: '', version: 'v2' }, locator: nonStepLocator })).toBe(
        false,
      );
    }

    expect(
      runJSStudioProvider.canHandle?.({
        value: { code: '', version: 'v2' },
        locator,
        sourceLocator: { kind: 'chart.option', modelUid: 'chart-1' },
      }),
    ).toBe(false);
    expect(
      runJSStudioProvider.canHandle?.({
        value: { code: '', version: 'v2' },
        locator: { kind: 'chart.option', modelUid: 'chart-1' },
        sourceLocator: locator,
      }),
    ).toBe(true);
  });

  it('passes host source metadata to shared toolbar contributions', async () => {
    const unregister = runJSStudioToolbarRegistry.register({
      key: 'test-source-metadata',
      component: ({ context }) => (
        <>
          <span data-testid="toolbar-source-kind">{String(context.sourceMetadata?.lightExtensionKind || '')}</span>
          <span data-testid="toolbar-source-entry">{String(context.sourceBinding?.entryId || '')}</span>
        </>
      ),
    });

    try {
      renderEditor(vi.fn(), {
        value: {
          code: 'return 1;',
          version: 'v2',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_origin',
            entryId: 'lee_origin',
            kind: 'js-field',
          },
        },
        sourceMetadata: {
          lightExtensionKind: 'js-field',
        },
      });

      expect(await screen.findByTestId('toolbar-source-kind')).toHaveTextContent('js-field');
      expect(screen.getByTestId('toolbar-source-entry')).toHaveTextContent('lee_origin');
    } finally {
      unregister();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the workspace with empty initial code when the RunJS value has no code', async () => {
    renderEditor(vi.fn(), {
      value: { version: 'v2' },
    });

    expect(await screen.findByRole('button', { name: 'Expand files' })).toBeTruthy();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'runJSSources:open',
        data: {
          locator,
          initialSource: {
            code: '',
            version: 'v2',
          },
        },
      }),
    );
  });

  it('renders the workspace directly without the launcher', async () => {
    renderEditor();

    expect(await screen.findByRole('button', { name: 'Expand files' })).toBeTruthy();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'runJSSources:open',
        data: {
          locator,
          initialSource: {
            code: 'return 1;',
            version: 'v2',
          },
        },
      }),
    );
    expect(screen.queryByRole('button', { name: 'src/client/index.tsx' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Studio' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Check' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Import workspace' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export workspace' })).toBeNull();
    expect(screen.queryByText('Entry')).toBeNull();
    expect(screen.getByText('No messages yet. Click Run to preview.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    expect(screen.getByRole('button', { name: 'src/client/index.tsx' })).toBeTruthy();
    const filesPanel = screen.getByLabelText('File resource manager');
    expect(within(filesPanel).getByText('Files')).toBeTruthy();
    expect(within(filesPanel).getByRole('button', { name: 'Import workspace' })).toBeTruthy();
    expect(within(filesPanel).getByRole('button', { name: 'Export workspace' })).toBeTruthy();
    expect(within(filesPanel).getByText('TSX')).toBeTruthy();
    expect(within(filesPanel).getByText('client')).toBeTruthy();
    fireEvent.mouseEnter(within(filesPanel).getByText('index.tsx'));
    expect(within(filesPanel).queryByRole('button', { name: /Set as entry/ })).toBeNull();
    fireEvent.mouseEnter(within(filesPanel).getByText('src'));
    expect(within(filesPanel).getByRole('button', { name: 'New file src' })).toBeTruthy();
    expect(within(filesPanel).getByRole('button', { name: 'New folder src' })).toBeTruthy();
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'src' }));
    expect(within(filesPanel).queryByText('client')).toBeNull();
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'src' }));
    expect(within(filesPanel).getByText('client')).toBeTruthy();
    fireEvent.mouseEnter(within(filesPanel).getByText('client'));
    expect(within(filesPanel).getByRole('button', { name: 'New file src/client' })).toBeTruthy();
    expect(within(filesPanel).getByRole('button', { name: 'New folder src/client' })).toBeTruthy();
    const historyPanel = screen.getByLabelText('Version history');
    expect(within(historyPanel).queryByText('Click to restore')).toBeNull();
    expect(screen.getByText(/07-02/)).toBeTruthy();
  });

  it('replaces the local draft from ZIP inspection without saving', async () => {
    const onChange = vi.fn();
    renderEditor(onChange);

    const editor = await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.change(editor, { target: { value: 'return dirty;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    fireEvent.click(
      within(screen.getByLabelText('File resource manager')).getByRole('button', { name: 'Import workspace' }),
    );

    expect(
      await screen.findByText(
        'Importing will replace the current local draft. Nothing will be saved until you click Save.',
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    const importInput = screen
      .getAllByLabelText('Import workspace')
      .find((element) => element instanceof HTMLInputElement);
    if (!importInput) {
      throw new Error('Import input not found');
    }
    fireEvent.change(importInput, {
      target: { files: [new File(['draft'], 'draft.zip', { type: 'application/zip' })] },
    });

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:importZip',
          data: {
            locator,
            zipBase64: expect.stringContaining('base64,'),
          },
        }),
      );
    });
    expect(await screen.findByRole('textbox', { name: 'Edit file content' })).toHaveValue(
      'ctx.render("Imported draft");',
    );
    expect(screen.getByText('Workspace imported as a local draft')).toBeTruthy();
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ version: 'v3' }));
    expect(mocks.request.mock.calls.some(([request]) => request.url === 'runJSSources:saveChanges')).toBe(false);
  });

  it('falls through to the next editor when opening Studio fails', async () => {
    mocks.request.mockRejectedValueOnce(new Error('Studio unavailable'));

    renderEditor(vi.fn(), {
      renderNext: () => <div>Legacy inline editor</div>,
    });

    expect(await screen.findByText('Legacy inline editor')).toBeTruthy();
    expect(screen.queryByText('Studio unavailable')).toBeNull();
  });

  it('reports dirty state through the embedded host controller', async () => {
    const onEmbeddedEditorControllerChange = vi.fn();
    renderEditor(vi.fn(), {
      editorChrome: 'embedded',
      onEmbeddedEditorControllerChange,
    });

    expect(await screen.findByTestId('runjs-studio-workspace')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Edit file content' }), {
      target: { value: 'return 2;' },
    });

    await waitFor(() => {
      expect(onEmbeddedEditorControllerChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ dirty: true, saving: false }),
      );
    });

    expect(mocks.closeView).not.toHaveBeenCalled();
  });

  it('ignores a run response after the workspace changes', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) throw new Error('Default request mock is unavailable');
    const preview = deferred<unknown>();
    const onPreview = vi.fn();
    mocks.request.mockImplementation((request) =>
      request.url === 'runJSSources:compilePreview' ? preview.promise : defaultRequest(request),
    );
    renderEditor(vi.fn(), { onPreview });

    const editor = await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'runJSSources:compilePreview' })),
    );
    fireEvent.change(editor, { target: { value: 'return 3;' } });

    preview.resolve({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          artifact: {
            code: 'return 2;',
            version: 'v2',
            sourceMap: previewSourceMap,
            diagnostics: [],
            filesHash: 'files-hash-stale',
            entryPath: 'src/client/index.tsx',
          },
        },
      },
    });
    await act(async () => {
      await preview.promise;
      await Promise.resolve();
    });

    expect(onPreview).not.toHaveBeenCalled();
    expect(editor).toHaveValue('return 3;');
    expect(screen.getByRole('button', { name: 'Run' })).not.toBeDisabled();
  });

  it('ignores a run response after switching to another locator', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) throw new Error('Default request mock is unavailable');
    const preview = deferred<unknown>();
    const onPreview = vi.fn();
    const nextLocator = { ...locator, modelUid: 'fm_2' };
    const nextOpenResult = {
      ...openResult,
      locator: nextLocator,
      files: [{ ...openResult.files[0], content: 'return next;' }],
      legacy: { ...openResult.legacy, code: 'return next;' },
    };
    mocks.request.mockImplementation((request: { data?: { locator?: { modelUid?: string } }; url: string }) => {
      if (request.url === 'runJSSources:compilePreview') return preview.promise;
      if (request.url === 'runJSSources:open' && request.data?.locator?.modelUid === nextLocator.modelUid) {
        return Promise.resolve({ data: { data: nextOpenResult } });
      }
      return defaultRequest(request);
    });
    const rendered = renderEditor(vi.fn(), { onPreview });

    await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'runJSSources:compilePreview' })),
    );

    rendered.rerender(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return next;', version: 'v2' },
          onChange: vi.fn(),
          locator: nextLocator,
          onPreview,
          scene: 'block',
        })}
      </>,
    );
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Edit file content' })).toHaveValue('return next;'));

    preview.resolve({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          artifact: {
            code: 'return 1;',
            version: 'v2',
            sourceMap: previewSourceMap,
            diagnostics: [],
            filesHash: 'files-hash-stale-locator',
            entryPath: 'src/client/index.tsx',
          },
        },
      },
    });
    await act(async () => {
      await preview.promise;
      await Promise.resolve();
    });

    expect(onPreview).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Edit file content' })).toHaveValue('return next;');
  });

  it('ignores a save response after switching to another locator', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) throw new Error('Default request mock is unavailable');
    const pendingSave = deferred<unknown>();
    const onPersistedChange = vi.fn();
    const nextLocator = { ...locator, modelUid: 'fm_2' };
    const nextOpenResult = {
      ...openResult,
      locator: nextLocator,
      repository: { ...repository, id: 'repo-2', repoId: 'repo-2' },
      files: [{ ...openResult.files[0], content: 'return next;' }],
      legacy: { ...openResult.legacy, code: 'return next;' },
    };
    mocks.request.mockImplementation((request: { data?: { locator?: { modelUid?: string } }; url: string }) => {
      if (request.url === 'runJSSources:saveChanges') return pendingSave.promise;
      if (request.url === 'runJSSources:open' && request.data?.locator?.modelUid === nextLocator.modelUid) {
        return Promise.resolve({ data: { data: nextOpenResult } });
      }
      return defaultRequest(request);
    });
    let controller:
      | { dirty: boolean; requestSave: () => Promise<'cancelled' | 'saved' | 'unchanged'>; saving: boolean }
      | undefined;
    const onEmbeddedEditorControllerChange = (next: typeof controller | null) => {
      if (next) controller = next;
    };
    const rendered = renderEditor(vi.fn(), {
      editorChrome: 'embedded',
      onEmbeddedEditorControllerChange,
      onPersistedChange,
    });

    const editor = await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.change(editor, { target: { value: 'return 2;' } });
    await waitFor(() => expect(controller?.dirty).toBe(true));
    const saveResult = controller?.requestSave();
    if (!saveResult) throw new Error('Embedded save controller was not registered');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Save old workspace' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(controller?.saving).toBe(true));

    rendered.rerender(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return next;', version: 'v2' },
          onChange: vi.fn(),
          onEmbeddedEditorControllerChange,
          onPersistedChange,
          locator: nextLocator,
          editorChrome: 'embedded',
          scene: 'block',
        })}
      </>,
    );
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Edit file content' })).toHaveValue('return next;'));

    const saveResponse = await defaultRequest({ url: 'runJSSources:saveChanges' });
    await act(async () => {
      pendingSave.resolve(saveResponse);
      await pendingSave.promise;
      await Promise.resolve();
    });

    await expect(saveResult).resolves.toBe('cancelled');
    expect(onPersistedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Edit file content' })).toHaveValue('return next;');
  });

  it('keeps an embedded save pending when newer local edits exist', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) throw new Error('Default request mock is unavailable');
    const saveResponse = await defaultRequest({ url: 'runJSSources:saveChanges' });
    const pendingSave = deferred<unknown>();
    let saveRequestCount = 0;
    mocks.request.mockImplementation((request) => {
      if (request.url === 'runJSSources:getVersion') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: { ...repository, headCommitId: 'commit-2', headSeq: 2 },
              commit: { id: 'commit-2' },
              files: [
                {
                  ...openResult.files[0],
                  blobHash: 'b'.repeat(64),
                  content: 'return 2;',
                },
              ],
            },
          },
        });
      }
      if (request.url !== 'runJSSources:saveChanges') return defaultRequest(request);
      saveRequestCount += 1;
      return saveRequestCount === 1 ? pendingSave.promise : defaultRequest(request);
    });
    let controller:
      | { dirty: boolean; requestSave: () => Promise<'cancelled' | 'saved' | 'unchanged'>; saving: boolean }
      | undefined;
    renderEditor(vi.fn(), {
      editorChrome: 'embedded',
      onEmbeddedEditorControllerChange: (next: typeof controller | null) => {
        if (next) controller = next;
      },
    });

    const editor = await screen.findByRole('textbox', { name: 'Edit file content' });
    fireEvent.change(editor, { target: { value: 'return 2;' } });
    await waitFor(() => expect(controller?.dirty).toBe(true));
    const result = controller?.requestSave();
    if (!result) throw new Error('Embedded save controller was not registered');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Save older snapshot' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(controller?.saving).toBe(true));

    fireEvent.change(editor, { target: { value: 'return 3;' } });
    await act(async () => {
      pendingSave.resolve(saveResponse);
      await pendingSave.promise;
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() => expect(controller).toEqual(expect.objectContaining({ dirty: true, saving: false })));
    let settled = false;
    result
      .then(() => {
        settled = true;
      })
      .catch(() => {
        settled = true;
      });
    await Promise.resolve();
    expect(settled).toBe(false);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      const saveRequests = mocks.request.mock.calls
        .map(([request]) => request as { url: string; data?: Record<string, unknown> })
        .filter((request) => request.url === 'runJSSources:saveChanges');
      expect(saveRequests).toHaveLength(2);
      expect(saveRequests[1]?.data).toEqual(
        expect.objectContaining({
          baseCommitId: 'commit-2',
          baseOwnerFingerprint: 'owner-fingerprint-2',
          changes: expect.arrayContaining([
            expect.objectContaining({
              path: 'src/client/index.tsx',
              content: 'return 3;',
              expectedBlobHash: 'b'.repeat(64),
            }),
          ]),
        }),
      );
    });

    let saveResult: 'cancelled' | 'saved' | 'unchanged' | undefined;
    await act(async () => {
      saveResult = await result;
    });
    expect(saveResult).toBe('saved');
  });

  it('forwards the host workspace JSON schema resolver to entry.json editors', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              files: [
                ...openResult.files,
                {
                  path: 'src/client/entry.json',
                  content: '{"schemaVersion":1,"key":"welcome"}\n',
                  language: 'json',
                  mode: '100644',
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    const workspaceJsonSchemaResolver = vi.fn((path: string) =>
      path === 'src/client/entry.json'
        ? {
            uri: 'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
            schema: { type: 'object' },
          }
        : undefined,
    );

    renderEditor(vi.fn(), { workspaceJsonSchemaResolver });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    const filesPanel = screen.getByLabelText('File resource manager');
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'src/client/entry.json' }));

    expect(workspaceJsonSchemaResolver).toHaveBeenCalledWith(
      'src/client/entry.json',
      expect.arrayContaining([expect.objectContaining({ path: 'src/client/entry.json' })]),
    );
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
      'data-json-schema-uri',
      'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
    );
  });

  it('creates folders under src/client and moves files into them', async () => {
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));

    const filesPanel = screen.getByLabelText('File resource manager');
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New file' }));

    const fileNameInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/client/helper.ts' });
    expect(fileNameInput).toHaveValue('helper.ts');
    fireEvent.change(fileNameInput, { target: { value: 'helper2.ts' } });
    fireEvent.blur(fileNameInput);

    expect(within(filesPanel).getByRole('button', { name: 'src/client/helper2.ts' })).toBeTruthy();

    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New folder' }));

    const folderNameInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/client/folder' });
    expect(folderNameInput).toHaveValue('folder');
    fireEvent.change(folderNameInput, { target: { value: 'widgets' } });
    fireEvent.blur(folderNameInput);

    expect(within(filesPanel).getByText('widgets')).toBeTruthy();

    const dataTransfer = createDataTransfer();
    const fileRow = within(filesPanel).getByRole('button', { name: 'src/client/index.tsx' }).closest('.ant-list-item');
    const folderRow = within(filesPanel).getByText('widgets').closest('.ant-list-item');
    expect(fileRow).toBeTruthy();
    expect(folderRow).toBeTruthy();

    fireEvent.dragStart(fileRow as HTMLElement, { dataTransfer });
    fireEvent.dragOver(folderRow as HTMLElement, { dataTransfer });
    fireEvent.drop(folderRow as HTMLElement, { dataTransfer });

    expect(within(filesPanel).getByRole('button', { name: 'src/client/widgets/index.tsx' })).toBeTruthy();
  });

  it('allows moving convention folders and reports convention diagnostics on Save', async () => {
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));

    const filesPanel = screen.getByLabelText('File resource manager');
    const clientRow = within(filesPanel).getByRole('button', { name: 'src/client' }).closest('.ant-list-item');
    expect(clientRow).toHaveAttribute('draggable', 'true');

    fireEvent.mouseEnter(within(filesPanel).getByText('src'));
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New folder src' }));

    const sharedInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/folder' });
    fireEvent.change(sharedInput, { target: { value: 'shared' } });
    fireEvent.blur(sharedInput);

    const dataTransfer = createDataTransfer();
    const sharedRow = within(filesPanel).getByRole('button', { name: 'src/shared' }).closest('.ant-list-item');
    expect(sharedRow).toBeTruthy();

    fireEvent.dragStart(clientRow as HTMLElement, { dataTransfer });
    fireEvent.dragOver(sharedRow as HTMLElement, { dataTransfer });
    fireEvent.drop(sharedRow as HTMLElement, { dataTransfer });

    expect(within(filesPanel).getByRole('button', { name: 'src/shared/client/index.tsx' })).toBeTruthy();
    expect(within(filesPanel).queryByRole('button', { name: 'src/client/index.tsx' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const diagnosticsOutput = await screen.findByTestId('runjs-save-diagnostics', undefined, { timeout: 1000 });
    const dialog = diagnosticsOutput.closest('[role="dialog"]');
    if (!dialog) throw new Error('Save diagnostics dialog is unavailable');
    const diagnostics = within(dialog).getByLabelText('Compile diagnostics');
    expect(diagnostics.textContent).toContain('[error] src/client/index.tsx (RUNJS_ENTRY_NOT_FOUND)');
    expect(diagnostics.textContent).toContain('RunJS entry file under src/client was not found');
    expect(within(dialog).queryByRole('textbox', { name: 'Version message' })).toBeNull();
  });

  it('runs the compiled artifact through the host preview when available', async () => {
    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() =>
      expect(onPreview).toHaveBeenCalledWith({
        code: 'return 1;',
        version: 'v2',
      }),
    );
    expect(mocks.diagnoseRunJS).not.toHaveBeenCalled();
    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
  });

  it('replaces a completed host preview with a failure when its React render error arrives later', async () => {
    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
    expect(mocks.renderErrorReporters.size).toBe(1);
    act(() => {
      for (const reporter of mocks.renderErrorReporters) {
        reporter({
          key: 'rawData.some is not a function\nstack\n at CustomerList',
          message: 'rawData.some is not a function',
        });
      }
    });

    const errorEntry = await screen.findByText(/\[error\] rawData\.some is not a function/);
    const failedEntry = await screen.findByText(/\[error\] Run failed/);
    expect(errorEntry.compareDocumentPosition(failedEntry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText(/\[info\] Run completed/)).toBeNull();
    expect(mocks.diagnoseRunJS).not.toHaveBeenCalled();
  });

  it('invalidates an old render-error subscription after the draft changes', async () => {
    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
    const oldReporter = Array.from(mocks.renderErrorReporters)[0];
    expect(oldReporter).toBeTypeOf('function');

    fireEvent.change(editor, { target: { value: 'return 2;' } });

    expect(mocks.renderErrorReporters.size).toBe(0);
    act(() => {
      oldReporter({ key: 'old-draft-error', message: 'old draft render error' });
    });
    expect(screen.queryByText(/old draft render error/)).toBeNull();
    expect(screen.queryByText(/\[error\] Run failed/)).toBeNull();
  });

  it('ignores an old render-error subscription after a newer run starts', async () => {
    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
    const oldReporter = Array.from(mocks.renderErrorReporters)[0];

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    await waitFor(() => expect(onPreview).toHaveBeenCalledTimes(2));
    expect(mocks.renderErrorReporters.size).toBe(1);

    act(() => {
      oldReporter({ key: 'old-run-error', message: 'old run render error' });
    });
    expect(screen.queryByText(/old run render error/)).toBeNull();
    expect(screen.queryByText(/\[error\] Run failed/)).toBeNull();
    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
  });

  it('unsubscribes from render diagnostics when the Studio unmounts', async () => {
    const rendered = renderEditor(vi.fn(), { onPreview: vi.fn() });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText(/\[info\] Run completed/)).toBeTruthy();
    expect(mocks.renderErrorReporters.size).toBe(1);

    rendered.unmount();

    expect(mocks.renderErrorReporters.size).toBe(0);
  });

  it('runs the compiled artifact in the current Flow context without a host preview', async () => {
    mocks.diagnoseRunJS.mockResolvedValueOnce({
      execution: { finished: true, started: true, timeout: false },
      issues: [],
      logs: [{ level: 'log', message: 'hello!' }],
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() =>
      expect(mocks.diagnoseRunJS).toHaveBeenCalledWith('return 1;', expect.anything(), {
        sourceMap: previewSourceMap,
        version: 'v2',
      }),
    );
    expect(await screen.findByText(/\[log\] hello!/)).toBeTruthy();
  });

  it('marks the run as failed when the runtime diagnostics contain a render error', async () => {
    mocks.diagnoseRunJS.mockResolvedValueOnce({
      execution: { finished: true, started: true, timeout: false },
      issues: [{ type: 'runtime', ruleId: 'render-error', message: 'rawData.some is not a function' }],
      logs: [{ level: 'error', message: 'rawData.some is not a function' }],
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText(/\[error\] rawData\.some is not a function/)).toBeTruthy();
    expect(await screen.findByText(/\[error\] Run failed/)).toBeTruthy();
    expect(screen.queryByText(/\[info\] Run completed/)).toBeNull();
  });

  it('shows authoritative TypeScript diagnostics after draft changes without requiring Run', async () => {
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({ data: { data: openResult } });
      }
      if (url === 'runJSSources:compilePreview') {
        const code = getSubmittedMainContent(data);
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code,
                version: 'v2',
                sourceMap: previewSourceMap,
                diagnostics: code.includes('sdfsdf')
                  ? [
                      {
                        path: 'src/client/index.tsx',
                        line: 1,
                        column: 1,
                        severity: 'error',
                        message: "Cannot find name 'sdfsdf'.",
                        ruleId: 'runjs-typescript',
                      },
                    ]
                  : [],
                filesHash: 'files-hash-live-diagnostics',
                entryPath: 'src/client/index.tsx',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    renderEditor();

    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, { target: { value: 'sdfsdf();' } });

    await waitFor(() =>
      expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
        'data-diagnostic-messages',
        "Cannot find name 'sdfsdf'.",
      ),
    );
    expect(
      mocks.request.mock.calls.find(([request]) => request.url === 'runJSSources:compilePreview')?.[0].data.files,
    ).toEqual([
      expect.objectContaining({
        path: 'src/client/index.tsx',
        expectedBlobHash: 'a'.repeat(64),
      }),
    ]);
    expect(screen.queryByText(/Compile failed/)).toBeNull();

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([request]) =>
            request.url === 'runJSSources:compilePreview' && getSubmittedMainContent(request.data) === 'return 2;',
        ),
      ).toBe(true),
    );
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-diagnostic-messages', '');
  });

  it('does not restore diagnostics from an older draft request that finishes late', async () => {
    const stalePreview = deferred<{ data: { data: Record<string, unknown> } }>();
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({ data: { data: openResult } });
      }
      if (url === 'runJSSources:compilePreview') {
        const code = getSubmittedMainContent(data);
        if (code.includes('staleMissing')) {
          return stalePreview.promise;
        }
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code,
                version: 'v2',
                sourceMap: previewSourceMap,
                diagnostics: code.includes('currentMissing')
                  ? [
                      {
                        path: 'src/client/index.tsx',
                        line: 1,
                        column: 1,
                        severity: 'error',
                        message: "Cannot find name 'currentMissing'.",
                      },
                    ]
                  : [],
                filesHash: 'files-hash-current-diagnostics',
                entryPath: 'src/client/index.tsx',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
    renderEditor();

    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, { target: { value: 'staleMissing();' } });
    await waitFor(() =>
      expect(
        mocks.request.mock.calls.some(
          ([request]) =>
            request.url === 'runJSSources:compilePreview' &&
            getSubmittedMainContent(request.data) === 'staleMissing();',
        ),
      ).toBe(true),
    );

    fireEvent.change(editor, { target: { value: 'currentMissing();' } });
    await waitFor(() =>
      expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
        'data-diagnostic-messages',
        "Cannot find name 'currentMissing'.",
      ),
    );

    await act(async () => {
      stalePreview.resolve({
        data: {
          data: {
            locator,
            locatorKind: 'flowModel.step',
            artifact: {
              code: 'staleMissing();',
              version: 'v2',
              sourceMap: previewSourceMap,
              diagnostics: [
                {
                  path: 'src/client/index.tsx',
                  line: 1,
                  column: 1,
                  severity: 'error',
                  message: "Cannot find name 'staleMissing'.",
                },
              ],
              filesHash: 'files-hash-stale-diagnostics',
              entryPath: 'src/client/index.tsx',
            },
          },
        },
      });
      await stalePreview.promise;
    });

    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
      'data-diagnostic-messages',
      "Cannot find name 'currentMissing'.",
    );
  });

  it('resolves the fixed src/client index entry by extension priority', async () => {
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              legacy: {
                ...openResult.legacy,
                entryPath: 'src/client/legacy.ts',
              },
              files: [
                { path: 'src/client/index.js', content: 'ctx.render("js");', language: 'javascript' },
                { path: 'src/client/index.ts', content: 'ctx.render("ts");', language: 'typescript' },
                { path: 'src/client/index.jsx', content: 'ctx.render("jsx");', language: 'javascriptreact' },
                { path: 'src/client/index.tsx', content: 'ctx.render("tsx");', language: 'typescript' },
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
                code: 'ctx.render("tsx");',
                version: 'v2',
                sourceMap: previewSourceMap,
                diagnostics: [],
                filesHash: 'files-hash-priority',
                entryPath: (data as { entryPath?: string }).entryPath,
              },
            },
          },
        });
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    await screen.findByLabelText('Edit file content');
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-language', 'tsx');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:compilePreview',
          data: expect.objectContaining({
            entryPath: 'src/client/index.tsx',
          }),
        }),
      );
    });
    expect(onPreview).toHaveBeenCalledWith({
      code: 'ctx.render("tsx");',
      version: 'v2',
    });
  });

  it('keeps an existing manifest entry when no fixed src/client index exists', async () => {
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              legacy: {
                ...openResult.legacy,
                entryPath: 'src/main.tsx',
              },
              files: [
                {
                  path: runJSManifestPath,
                  content: `${JSON.stringify({ entry: 'src/main.tsx', runtimeVersion: 'v2' }, null, 2)}\n`,
                  language: 'json',
                },
                { path: 'src/main.tsx', content: 'ctx.render("main");', language: 'typescriptreact' },
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
                code: 'ctx.render("main");',
                version: 'v2',
                sourceMap: previewSourceMap,
                diagnostics: [],
                filesHash: 'files-hash-main',
                entryPath: (data as { entryPath?: string }).entryPath,
              },
            },
          },
        });
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    const onPreview = vi.fn();
    renderEditor(vi.fn(), { onPreview });

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:compilePreview',
          data: expect.objectContaining({
            entryPath: 'src/main.tsx',
          }),
        }),
      );
    });
    expect(onPreview).toHaveBeenCalledWith({
      code: 'ctx.render("main");',
      version: 'v2',
    });
  });

  it('shows authoritative Save diagnostics without closing the version dialog', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) throw new Error('Default request mock is unavailable');
    const compileFailure = new RunJSSourceRequestError({
      action: 'saveChanges',
      code: 'RUNJS_COMPILE_FAILED',
      message: 'Compile failed',
      rawMessage: 'RunJS source could not be compiled',
      status: 422,
      details: {
        diagnostics: [
          {
            severity: 'error',
            message: "';' expected",
            path: 'src/client/index.tsx',
            line: 1,
            column: 8,
            code: 'TS1005',
          },
        ],
      },
    });
    mocks.request.mockImplementation((request) => {
      if (request.url === 'runJSSources:saveChanges') throw compileFailure;
      return defaultRequest(request);
    });

    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return ;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const saveDialog = await screen.findByRole('dialog', { name: 'Save version' });
    const versionMessage = within(saveDialog).getByRole('textbox', { name: 'Version message' });
    fireEvent.change(versionMessage, { target: { value: 'Keep invalid draft' } });
    expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:compilePreview')).toHaveLength(
      0,
    );
    fireEvent.click(within(saveDialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:saveChanges',
        }),
      );
    });
    expect(await within(saveDialog).findByText('Compile failed')).toBeTruthy();
    expect(within(saveDialog).getByText(/\[error\] src\/client\/index\.tsx:1:8 \(TS1005\) ';' expected/)).toBeTruthy();
    expect(within(saveDialog).getByRole('textbox', { name: 'Version message' })).toHaveValue('Keep invalid draft');
  });

  it('requires a version message before saving a version', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) {
      throw new Error('Expected the default request mock implementation');
    }
    let saved = false;
    mocks.request.mockImplementation((options: { url: string; data?: unknown }) => {
      if (options.url === 'runJSSources:saveChanges') {
        saved = true;
        return defaultRequest(options);
      }
      if (options.url === 'runJSSources:open' && saved) {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              legacy: {
                ...openResult.legacy,
                code: 'return canonicalSavedRuntime;',
                version: 'v3',
              },
              files: openResult.files.map((file) =>
                file.path === 'src/client/index.tsx' ? { ...file, content: 'return 2;' } : file,
              ),
            },
          },
        });
      }
      return defaultRequest(options);
    });
    const onChange = vi.fn();
    const onPersistedChange = vi.fn();
    renderEditor(onChange, { onPersistedChange });
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog');
    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    const versionMessage = within(dialog).getByRole('textbox', { name: 'Version message' });
    fireEvent.change(versionMessage, { target: { value: 'a' } });
    expect(saveButton).toBeDisabled();
    fireEvent.change(versionMessage, { target: { value: 'ab' } });
    expect(saveButton).toBeDisabled();
    fireEvent.change(versionMessage, { target: { value: 'abc' } });
    expect(saveButton).toBeEnabled();

    fireEvent.change(versionMessage, {
      target: { value: 'Update code' },
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:saveChanges',
          data: expect.objectContaining({
            message: 'Update code',
          }),
        }),
      );
    });
    const saveRequest = mocks.request.mock.calls
      .map(([request]) => request as { url: string; data?: Record<string, unknown> })
      .find((request) => request.url === 'runJSSources:saveChanges');
    expect(saveRequest?.data).toMatchObject({
      baseCommitId: 'commit-1',
      baseOwnerFingerprint: 'owner-fingerprint-1',
      changes: [
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'return 2;',
          expectedBlobHash: 'a'.repeat(64),
        }),
      ],
    });
    expect(onPersistedChange).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'return canonicalSavedRuntime;',
        version: 'v3',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'repo-1',
          commitId: 'commit-2',
          entry: 'src/client/index.tsx',
        },
      }),
    );
    expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:compilePreview')).toHaveLength(
      0,
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(mocks.closeView).toHaveBeenCalled();
  });

  it('does not persist a new source reference when canonical post-Save readback fails', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) {
      throw new Error('Expected the default request mock implementation');
    }
    let saved = false;
    mocks.request.mockImplementation((options: { url: string; data?: unknown }) => {
      if (options.url === 'runJSSources:saveChanges') {
        saved = true;
        return defaultRequest(options);
      }
      if (options.url === 'runJSSources:open' && saved) {
        return Promise.reject(new Error('canonical readback unavailable'));
      }
      return defaultRequest(options);
    });
    const onPersistedChange = vi.fn();
    renderEditor(vi.fn(), { onPersistedChange });
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save version' });
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Update code' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Save failed')).toBeTruthy();
    expect(onPersistedChange).not.toHaveBeenCalled();
    expect(mocks.closeView).not.toHaveBeenCalled();
  });

  it('opens latest, three-way merges, and saves a fresh delta after a stale Head', async () => {
    const defaultRequest = mocks.request.getMockImplementation();
    if (!defaultRequest) {
      throw new Error('Expected the default request mock implementation');
    }
    let saveCount = 0;
    mocks.request.mockImplementation((options: { url: string; data?: unknown }) => {
      if (options.url === 'runJSSources:saveChanges' && saveCount++ === 0) {
        return Promise.reject({
          response: {
            status: 409,
            data: {
              errors: [
                {
                  code: 'BASE_COMMIT_OUTDATED',
                  message: 'RunJS workspace Head changed after it was opened',
                  status: 409,
                },
              ],
            },
          },
        });
      }
      if (options.url === 'runJSSources:openLatest') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              repository: {
                ...repository,
                headCommitId: 'commit-remote',
                headSeq: 2,
              },
              files: [
                ...openResult.files,
                {
                  path: 'src/client/remote-helper.ts',
                  content: 'export const remote = true;',
                  language: 'typescript',
                  mode: '100644',
                },
              ],
            },
          },
        });
      }
      return defaultRequest(options);
    });

    renderEditor();
    fireEvent.change(await screen.findByLabelText('Edit file content'), { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Merge remote workspace' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:saveChanges')).toHaveLength(
        2,
      );
    });
    const requests = mocks.request.mock.calls.map(
      ([request]) => request as { url: string; data?: Record<string, unknown> },
    );
    const openLatestIndex = requests.findIndex((request) => request.url === 'runJSSources:openLatest');
    const recoveryPreviewIndex = requests.findIndex(
      (request, index) => index > openLatestIndex && request.url === 'runJSSources:compilePreview',
    );
    const saveRequests = requests.filter((request) => request.url === 'runJSSources:saveChanges');
    expect(openLatestIndex).toBeGreaterThan(-1);
    expect(recoveryPreviewIndex).toBe(-1);
    expect(saveRequests[0].data).toMatchObject({
      baseCommitId: 'commit-1',
      baseOwnerFingerprint: 'owner-fingerprint-1',
    });
    expect(saveRequests[1].data).toMatchObject({
      baseCommitId: 'commit-remote',
      baseOwnerFingerprint: 'owner-fingerprint-1',
      changes: [
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'return 2;',
          expectedBlobHash: 'a'.repeat(64),
        }),
      ],
    });
  });

  it('confirms and restores a history version even when the editor is dirty', async () => {
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return dirty;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    const historyButton = screen.getByText('Initial import').closest('button');
    expect(historyButton).toBeTruthy();
    fireEvent.click(historyButton as HTMLButtonElement);

    const dialog = await screen.findByRole('dialog', { name: 'Restore v1?' });
    expect(within(dialog).getByText('Target version: v1')).toBeInTheDocument();
    expect(within(dialog).getByText('Initial import')).toBeInTheDocument();
    expect(within(dialog).getByText('It will not create a version until you save.')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:getVersion',
        }),
      );
    });
    expect(screen.getByLabelText('Edit file content')).toHaveValue('return restored;');
    expect(screen.getByText('Restored from v1')).toBeTruthy();
  });

  it('keeps the original open baseline when history refreshes before save', async () => {
    const baseRequest = mocks.request.getMockImplementation();
    if (!baseRequest) {
      throw new Error('Expected the default request mock implementation');
    }
    mocks.request.mockImplementation((options: { url: string; data?: unknown }) => {
      if (options.url === 'runJSSources:listHistory') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: {
                ...repository,
                headCommitId: 'commit-2',
                headSeq: 2,
              },
              items: [createHistoryCommit(2), commit],
              nextBeforeSeq: null,
            },
          },
        });
      }
      return baseRequest(options);
    });

    renderEditor();
    fireEvent.click(await screen.findByRole('button', { name: 'Expand files' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh history' }));
    await waitFor(() =>
      expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'runJSSources:listHistory' })),
    );

    fireEvent.change(screen.getByLabelText('Edit file content'), { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Update after history refresh' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      const saveRequest = mocks.request.mock.calls
        .map(([request]) => request as { url: string; data?: Record<string, unknown> })
        .find((request) => request.url === 'runJSSources:saveChanges');
      expect(saveRequest?.data).toMatchObject({
        baseCommitId: 'commit-1',
        baseOwnerFingerprint: 'owner-fingerprint-1',
      });
    });
  });

  it('uses a discard-only confirmation when cancelling dirty edits', async () => {
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Discard your changes before closing?')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Discard changes' })).toBeTruthy();
  });

  it('guards title-bar close with the existing dirty confirmation', async () => {
    mocks.closeView.mockImplementationOnce(async () => mocks.view.beforeClose?.({}));
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    await waitFor(() => expect(mocks.view.beforeClose).toBeTypeOf('function'));
    let canClose: boolean | void | undefined;
    await act(async () => {
      canClose = await mocks.view.beforeClose?.({});
    });
    expect(canClose).toBe(false);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Discard your changes before closing?')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Discard changes' }));

    await waitFor(() => expect(mocks.closeView).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('only offers recovery from current host code when versioned source diverges', async () => {
    const recovery = deferred<unknown>();
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.reject({
          response: {
            status: 409,
            data: {
              errors: [
                {
                  code: 'RUNJS_SOURCE_OWNER_OUTDATED',
                  message: 'RunJS host code differs from the versioned source',
                  status: 409,
                },
              ],
            },
          },
        });
      }

      if (url === 'runJSSources:restoreFromCode') {
        return recovery.promise;
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    renderEditor();

    expect(await screen.findByText('RunJS source version is out of sync')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recover latest version from current code' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit latest saved version' })).toBeNull();
    const recoveryButton = screen.getByRole('button', { name: 'Recover latest version from current code' });
    fireEvent.click(recoveryButton);

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:restoreFromCode',
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Recover latest version from current code' })).toHaveClass(
        'ant-btn-loading',
      );
    });
    await act(async () => {
      recovery.resolve({
        data: {
          data: {
            ...openResult,
            ownerFingerprint: 'owner-fingerprint-current',
          },
        },
      });
      await recovery.promise;
    });
    expect(await screen.findByLabelText('Edit file content')).toBeTruthy();
  });
});
