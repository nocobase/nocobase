/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runJSStudioProvider } from '../RunJSStudioProvider';
import type { RunJSSourceLocator } from '../types';
import { RunJSSourceRequestError } from '../useRunJSSourceResource';
import { runJSManifestPath } from '../workspaceUtils';

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

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_1',
  flowKey: 'settings',
  stepKey: 'runjs',
  paramPath: ['code'],
} satisfies RunJSSourceLocator;

const registryLocator = {
  kind: 'flowModel.flowRegistry.runjs',
  modelUid: 'fm_1',
  flowKey: 'eventFlow',
  stepKey: 'runjs',
  sourcePath: ['defaultParams', 'code'],
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
      const requestLocator = (data as { locator?: RunJSSourceLocator } | undefined)?.locator ?? locator;
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              locator: requestLocator,
              locatorKind: requestLocator.kind,
              source: { ...openResult.source, kind: requestLocator.kind },
            },
          },
        });
      }

      if (url === 'runJSSources:compilePreview') {
        const code = getSubmittedMainContent(data);
        return Promise.resolve({
          data: {
            data: {
              locator: requestLocator,
              locatorKind: requestLocator.kind,
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
              locator: requestLocator,
              locatorKind: requestLocator.kind,
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
              locator: requestLocator,
              locatorKind: requestLocator.kind,
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
              locator: requestLocator,
              locatorKind: requestLocator.kind,
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
              locator: requestLocator,
              locatorKind: requestLocator.kind,
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

  afterEach(() => {
    vi.clearAllMocks();
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

    const onPersistedChange = vi.fn();
    renderEditor(vi.fn(), { onPersistedChange });
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
    expect(onPersistedChange).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'FlowModel step', sourceLocator: locator },
    { name: 'Dynamic Flow registry RunJS', sourceLocator: registryLocator },
  ])('opens, edits, and saves $name code with its runtime version', async ({ sourceLocator }) => {
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
              locator: sourceLocator,
              locatorKind: sourceLocator.kind,
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
    renderEditor(onChange, { onPersistedChange, sourceLocator });
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    await waitFor(() => {
      expect(
        mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:compilePreview'),
      ).toHaveLength(1);
    });
    mocks.request.mockClear();
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
      }),
    );
    if (sourceLocator.kind === 'flowModel.step') {
      expect(onPersistedChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceRef: {
            type: 'vsc-file',
            repoId: 'repo-1',
            commitId: 'commit-2',
            entry: 'src/client/index.tsx',
          },
        }),
      );
    }
    expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:compilePreview')).toHaveLength(
      0,
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(mocks.closeView).toHaveBeenCalled();
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

  it('uses a discard-only confirmation when cancelling dirty edits', async () => {
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Discard your changes before closing?')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Discard changes' })).toBeTruthy();
  });
});
