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

import enUS from '../../../../locale/en-US.json';
import zhCN from '../../../../locale/zh-CN.json';
import { runJSStudioProvider } from '../RunJSStudioProvider';
import { runJSStudioToolbarRegistry } from '../RunJSStudioToolbarRegistry';
import { runJSManifestPath } from '../workspaceUtils';

const mocks = vi.hoisted(() => ({
  closeView: vi.fn(),
  diagnoseRunJS: vi.fn(),
  request: vi.fn(),
  view: {} as {
    beforeClose?: (payload?: unknown) => boolean | void | Promise<boolean | void>;
    close?: () => boolean | void | Promise<boolean | void>;
  },
}));

vi.mock('../../../../shared/vsc-file/path-normalize', () => ({
  normalizePath: (path: string) => String(path || '').replace(/\\/g, '/'),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
    view: mocks.view,
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    value,
    onChange,
    placeholder,
    readonly,
    toolbarLeftExtra,
    runButton,
    fullscreenControl,
    enableLinter,
    language,
    typescriptProject,
    jsonSchema,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
    toolbarLeftExtra?: React.ReactNode;
    runButton?: React.ReactNode;
    fullscreenControl?: { isFullscreen: boolean; toggleFullscreen: () => void };
    enableLinter?: boolean;
    language?: string;
    typescriptProject?: {
      declarationFiles?: Array<{ content: string; path: string }>;
      runJSContext?: { globalContextType?: string; modelUse?: string };
    };
    jsonSchema?: { uri?: string };
  }) => (
    <div
      data-enable-linter={String(Boolean(enableLinter))}
      data-json-schema-uri={jsonSchema?.uri}
      data-language={language}
      data-runjs-declaration-files={typescriptProject?.declarationFiles?.map((file) => file.path).join(',')}
      data-runjs-global-context-type={typescriptProject?.runJSContext?.globalContextType}
      data-runjs-model-use={typescriptProject?.runJSContext?.modelUse}
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

const runJSLocaleMessages = {
  'en-US': enUS,
  'zh-CN': zhCN,
} satisfies Record<string, Record<string, string>>;

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

describe('runJSStudioProvider', () => {
  beforeEach(() => {
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

      if (url === 'runJSSources:save') {
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

      if (url === 'runJSSources:exportZip') {
        return Promise.resolve({
          data: new Blob(['zip'], { type: 'application/zip' }),
        });
      }

      if (url === 'runJSSources:importZip') {
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
                message: 'Import RunJS workspace',
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
              import: {
                fileCount: 2,
                filesHash: 'files-hash-2',
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
    Reflect.deleteProperty(navigator, 'userActivation');
    vi.clearAllMocks();
  });

  it('keeps locale keys for the simplified editor in sync', () => {
    expect(runJSManifestPath).toBe('.nocobase/runjs-source.json');

    const requiredKeys = [
      'File resource manager',
      'Console logs',
      'Run',
      'Save',
      'Saved successfully',
      'Unsaved changes',
      'Current changes',
      'Load more',
      'Saved changes',
      'Save version',
      'Version message',
      'Version history',
      'Compile diagnostics',
      'Describe this version',
      'Discard changes',
      'Discard changes and refresh',
      'Discard your changes before closing?',
      'Discard your changes before refreshing?',
      'No changes between current editor and saved version',
      'No versions yet',
      'Back to editor',
      'Base',
      'Saved',
      'No logs yet. Click Run to execute.',
      'Click to restore',
      'Restore {{version}}?',
      'This will copy files from this version into the editor.',
      'It will not create a version until you save.',
      'You can review and save after restoring.',
      'RunJS source version is out of sync',
      'The code stored in this block differs from the latest saved RunJS source. Recover the versioned source from the current code before continuing.',
      'Recover latest version from current code',
      'Recovered latest version from current code',
      'Import',
      'Import workspace',
      'Import failed',
      'Export workspace',
      'Export failed',
      'Folder already exists',
      'Folder is not empty',
      'Folder path',
      'Folder path must be under src',
      'Fix compile errors before saving.',
      'New folder',
      'No compile diagnostics',
      'Workspace export is ready',
      'If the download did not start automatically, click Download workspace.',
      'Download workspace',
      'Dismiss',
      'Workspace imported',
      'Workspace exported',
      'RunJS entry file under src/client was not found',
    ] as const;

    for (const [locale, messages] of Object.entries(runJSLocaleMessages)) {
      for (const key of requiredKeys) {
        expect(messages[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
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
    expect(screen.getByRole('button', { name: 'Diff' })).toBeTruthy();
    expect(screen.getByTestId('mock-code-editor').getAttribute('data-runjs-model-use')).toBe('JSBlockModel');
    expect(screen.queryByRole('button', { name: 'Import workspace' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export workspace' })).toBeNull();
    expect(screen.queryByText('Entry')).toBeNull();
    expect(screen.getByLabelText('Open files').style.overflowY).toBe('hidden');
    expect(screen.getByText('No logs yet. Click Run to execute.')).toBeTruthy();
    expect(screen.getByTestId('runjs-studio-editor').style.overflow).toBe('hidden');
    expect(screen.getByTestId('runjs-studio-editor').style.minHeight).toMatch(/^(0|0px)$/);
    expect(screen.getByTestId('runjs-studio-workspace').style.minHeight).toMatch(/^(0|0px)$/);
    expect(screen.getByTestId('runjs-studio-workspace').style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    expect(screen.getByRole('button', { name: 'src/client/index.tsx' })).toBeTruthy();
    const filesPanel = screen.getByLabelText('File resource manager');
    expect(filesPanel.style.flex).toBe('0 1 auto');
    expect(filesPanel.style.maxHeight).toBe('80%');
    expect(filesPanel.style.minHeight).toBe('140px');
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
    expect(historyPanel.style.flex).toBe('1 1 220px');
    expect(historyPanel.style.minHeight).toBe('180px');
    expect(historyPanel.style.maxHeight).toBe('');
    expect(historyPanel.style.marginTop).toMatch(/^(0|0px)$/);
    expect(historyPanel.style.transition).toContain('flex-basis');
    expect(within(historyPanel).getByRole('button', { name: 'Collapse history' })).toBeTruthy();
    expect(within(historyPanel).queryByText('Click to restore')).toBeNull();
    expect(screen.getByText(/07-02/)).toBeTruthy();

    fireEvent.click(within(historyPanel).getByRole('button', { name: 'Collapse history' }));
    expect(historyPanel.style.flex).toBe('0 0 40px');
    expect(historyPanel.style.minHeight).toBe('40px');
    expect(historyPanel.style.maxHeight).toBe('40px');
    expect(historyPanel.style.marginTop).toBe('auto');
    expect(within(historyPanel).getByRole('button', { name: 'Expand history' })).toBeTruthy();
  });

  it('falls through to the next editor when opening Studio fails', async () => {
    mocks.request.mockRejectedValueOnce(new Error('Studio unavailable'));

    renderEditor(vi.fn(), {
      renderNext: () => <div>Legacy inline editor</div>,
    });

    expect(await screen.findByText('Legacy inline editor')).toBeTruthy();
    expect(screen.queryByText('Studio unavailable')).toBeNull();
  });

  it('delegates save to the host without rendering or clearing a local footer in embedded mode', async () => {
    const onEmbeddedEditorControllerChange = vi.fn();
    renderEditor(vi.fn(), {
      editorChrome: 'embedded',
      onEmbeddedEditorControllerChange,
    });

    expect(await screen.findByTestId('runjs-studio-workspace')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

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

  it('uses the drawer viewport height instead of the legacy compact editor height', async () => {
    renderEditor(vi.fn(), {
      height: '200px',
      minHeight: 'calc(100vh - 42px)',
    });

    await screen.findByLabelText('Edit file content');
    expect(screen.getByTestId('runjs-studio-editor').style.height).toBe('calc(100vh - 42px)');
    expect(screen.getByTestId('runjs-studio-editor').style.maxHeight).toBe('calc(100vh - 42px)');
  });

  it('keeps the files panel expandable while the workspace is fullscreen', async () => {
    renderEditor();

    fireEvent.click(await screen.findByRole('button', { name: 'Fullscreen' }));
    expect(await screen.findByRole('button', { name: 'Exit fullscreen' })).toBeTruthy();
    expect(screen.getByTestId('runjs-studio-workspace').style.height).toBe('100%');

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));

    const filesPanel = await screen.findByLabelText('File resource manager');
    expect(within(filesPanel).getByRole('button', { name: 'src/client/index.tsx' })).toBeTruthy();
  });

  it('does not run the JavaScript linter for JSON workspace files', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              files: [
                {
                  path: 'src/client/index.tsx',
                  content: 'return 1;',
                  language: 'typescriptreact',
                },
                {
                  path: 'src/client/settings.json',
                  content: `${JSON.stringify(
                    {
                      type: 'object',
                      properties: {
                        region: {
                          type: 'string',
                          title: 'Region',
                          'x-component': 'Input',
                        },
                      },
                    },
                    null,
                    2,
                  )}\n`,
                  language: 'json',
                },
              ],
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

    renderEditor();

    await screen.findByLabelText('Edit file content');
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-enable-linter', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    const filesPanel = screen.getByLabelText('File resource manager');
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'src/client/settings.json' }));

    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-language', 'json');
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute('data-enable-linter', 'false');
    expect((screen.getByLabelText('Edit file content') as HTMLTextAreaElement).value).toContain('"type": "object"');
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

  it('forwards workspace-derived TypeScript declarations to source editors', async () => {
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
    const workspaceTypeScriptContextResolver = vi.fn(() => ({
      declarationFiles: [
        {
          path: '.light-extension/types/__active-entry-context.d.ts',
          content: 'type LightExtensionActiveEntryContext = RunJSContext & { settings: { title?: string } };',
        },
      ],
      globalContextType: 'LightExtensionActiveEntryContext',
    }));

    renderEditor(vi.fn(), { workspaceTypeScriptContextResolver });

    await screen.findByLabelText('Edit file content');
    expect(workspaceTypeScriptContextResolver).toHaveBeenCalledWith(
      'src/client/index.tsx',
      expect.arrayContaining([expect.objectContaining({ path: 'src/client/entry.json' })]),
    );
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
      'data-runjs-global-context-type',
      'LightExtensionActiveEntryContext',
    );
    expect(screen.getByTestId('mock-code-editor')).toHaveAttribute(
      'data-runjs-declaration-files',
      '.light-extension/types/__active-entry-context.d.ts',
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

  it('creates files and folders under the clicked source folder', async () => {
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));

    const filesPanel = screen.getByLabelText('File resource manager');
    fireEvent.mouseEnter(within(filesPanel).getByText('src'));
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New file src' }));

    const fileNameInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/helper.ts' });
    expect(fileNameInput).toHaveValue('helper.ts');
    fireEvent.change(fileNameInput, { target: { value: 'root-helper.ts' } });
    fireEvent.blur(fileNameInput);

    expect(within(filesPanel).getByRole('button', { name: 'src/root-helper.ts' })).toBeTruthy();

    fireEvent.mouseEnter(within(filesPanel).getByText('src'));
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New folder src' }));

    const folderNameInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/folder' });
    expect(folderNameInput).toHaveValue('folder');
    fireEvent.change(folderNameInput, { target: { value: 'shared' } });
    fireEvent.blur(folderNameInput);

    expect(within(filesPanel).getByRole('button', { name: 'src/shared' })).toBeTruthy();
  });

  it('moves folders and their children into the dropped folder', async () => {
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));

    const filesPanel = screen.getByLabelText('File resource manager');
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New folder' }));

    const widgetsInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/client/folder' });
    fireEvent.change(widgetsInput, { target: { value: 'widgets' } });
    fireEvent.blur(widgetsInput);

    fireEvent.mouseEnter(within(filesPanel).getByText('widgets'));
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New file src/client/widgets' }));

    const nestedFileInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/client/widgets/helper.ts' });
    fireEvent.blur(nestedFileInput);

    fireEvent.mouseEnter(within(filesPanel).getByText('src'));
    fireEvent.click(within(filesPanel).getByRole('button', { name: 'New folder src' }));

    const sharedInput = within(filesPanel).getByRole('textbox', { name: 'Rename src/folder' });
    fireEvent.change(sharedInput, { target: { value: 'shared' } });
    fireEvent.blur(sharedInput);

    const dataTransfer = createDataTransfer();
    const widgetsRow = within(filesPanel).getByRole('button', { name: 'src/client/widgets' }).closest('.ant-list-item');
    const sharedRow = within(filesPanel).getByRole('button', { name: 'src/shared' }).closest('.ant-list-item');
    expect(widgetsRow).toBeTruthy();
    expect(sharedRow).toBeTruthy();

    fireEvent.dragStart(widgetsRow as HTMLElement, { dataTransfer });
    fireEvent.dragOver(sharedRow as HTMLElement, { dataTransfer });
    fireEvent.drop(sharedRow as HTMLElement, { dataTransfer });

    expect(within(filesPanel).getByRole('button', { name: 'src/shared/widgets' })).toBeTruthy();
    expect(within(filesPanel).getByRole('button', { name: 'src/shared/widgets/helper.ts' })).toBeTruthy();
    expect(within(filesPanel).queryByRole('button', { name: 'src/client/widgets/helper.ts' })).toBeNull();
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

    const dialog = await screen.findByRole('dialog', { name: 'Save failed' });
    const diagnostics = within(dialog).getByLabelText('Compile diagnostics');
    expect(diagnostics.textContent).toContain('RUNJS_ENTRY_NOT_FOUND');
    expect(diagnostics.textContent).toContain('src/client/index.tsx');
    expect(diagnostics.textContent).toContain('RunJS entry file under src/client was not found');
    expect(within(dialog).queryByRole('textbox', { name: 'Version message' })).toBeNull();
  });

  it('compiles on Run and appends client-side preview logs', async () => {
    mocks.diagnoseRunJS.mockResolvedValueOnce({
      execution: { finished: true, started: true, timeout: false },
      issues: [],
      logs: [{ level: 'log', message: 'hello!' }],
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:compilePreview',
        }),
      );
    });
    expect(mocks.diagnoseRunJS).toHaveBeenCalledWith('return 1;', expect.anything(), {
      sourceMap: previewSourceMap,
      version: 'v2',
    });
    expect(await screen.findByText(/\[log\] hello!/)).toBeTruthy();
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
                { path: 'src/client/index.tsx', content: 'ctx.render("tsx");', language: 'typescriptreact' },
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

    renderEditor();

    await screen.findByLabelText('Edit file content');
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

    renderEditor();

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
  });

  it('shows mapped runtime diagnostics as clickable file locations', async () => {
    mocks.diagnoseRunJS.mockResolvedValueOnce({
      execution: { finished: true, started: true, timeout: false },
      issues: [
        {
          type: 'runtime',
          message: 'boom',
          sourcePath: 'src/client/index.tsx',
          location: { start: { line: 2, column: 3 } },
        },
      ],
      logs: [],
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    const location = await screen.findByRole('button', {
      name: '[error] src/client/index.tsx:2:3 boom',
    });
    fireEvent.click(location);
    expect(screen.getByLabelText('Edit file content')).toBeTruthy();
  });

  it('toggles the editor area into a diff against the saved file', async () => {
    renderEditor();
    const editor = (await screen.findByLabelText('Edit file content')) as HTMLTextAreaElement;

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Diff' }));

    const diffOutput = screen.getByLabelText('Diff output');
    expect(within(diffOutput).getByText('Saved')).toBeTruthy();
    expect(within(diffOutput).getByText('Base')).toBeTruthy();
    expect(within(diffOutput).getByText('Current editor')).toBeTruthy();
    expect(within(diffOutput).getByText('Unsaved changes')).toBeTruthy();
    expect(within(diffOutput).getByText('return 1;')).toBeTruthy();
    expect(within(diffOutput).getByText('return 2;')).toBeTruthy();
    expect(screen.queryByLabelText('Edit file content')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Back to editor' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Diff' }));
    expect((screen.getByLabelText('Edit file content') as HTMLTextAreaElement).value).toBe('return 2;');
  });

  it('shows compile diagnostics instead of the version message dialog when Save preflight fails', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
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
                code: 'return ;',
                version: 'v2',
                sourceMap: previewSourceMap,
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
                filesHash: 'files-hash-error',
                entryPath: 'src/client/index.tsx',
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

    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return ;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog', { name: 'Save failed' });
    expect(within(dialog).queryByRole('textbox', { name: 'Version message' })).toBeNull();
    expect(within(dialog).getByText('Compile failed')).toBeTruthy();
    expect(within(dialog).getByText('TS1005')).toBeTruthy();
    expect(within(dialog).getByText("';' expected")).toBeTruthy();
    const diagnostics = within(dialog).getByLabelText('Compile diagnostics');
    expect(diagnostics.style.overflow).toBe('auto');
    expect(diagnostics.style.maxHeight).toBe('min(520px, calc(100vh - 260px))');
    expect(within(dialog).getByRole('button', { name: 'Copy technical details' })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: /Open problem source.*Line 1.*Column 8/ }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Save failed' })).toBeNull());
    expect(screen.getByLabelText('Edit file content')).toBeTruthy();
  });

  it('limits keyboard shortcuts to the active Studio and ignores dialog inputs', async () => {
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true });
    expect(screen.queryByRole('dialog', { name: 'Save version' })).toBeNull();

    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
    const dialog = await screen.findByRole('dialog', { name: 'Save version' });
    const versionMessage = within(dialog).getByRole('textbox', { name: 'Version message' }) as HTMLInputElement;
    fireEvent.change(versionMessage, { target: { value: 'Keep this message' } });
    fireEvent.keyDown(versionMessage, { key: 's', ctrlKey: true });

    expect(versionMessage.value).toBe('Keep this message');
    expect(mocks.request.mock.calls.filter(([request]) => request.url === 'runJSSources:compilePreview')).toHaveLength(
      1,
    );
  });

  it('requires a version message before saving a version', async () => {
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
          url: 'runJSSources:save',
          data: expect.objectContaining({
            message: 'Update code',
          }),
        }),
      );
    });
    const saveRequest = mocks.request.mock.calls
      .map(([request]) => request as { url: string; data?: Record<string, unknown> })
      .find((request) => request.url === 'runJSSources:save');
    expect(saveRequest?.data).not.toHaveProperty('baseCommitId');
    expect(saveRequest?.data).not.toHaveProperty('baseOwnerFingerprint');
    expect(onPersistedChange).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'return 2;',
        version: 'v2',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'repo-1',
          commitId: 'commit-2',
          entry: 'src/client/index.tsx',
        },
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(mocks.closeView).toHaveBeenCalled();
  });

  it('does not add a step sourceRef to nested RunJS values', async () => {
    const onChange = vi.fn();
    renderEditor(onChange, {
      locator: {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'fm_1',
        containerFlowKey: 'settings',
        containerStepKey: 'runjs',
        valuePath: ['variables', 0, 'runjs'],
        scene: 'custom-variable',
      },
    });
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 3;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Version message' }), {
      target: { value: 'Update nested code' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const savedValue = onChange.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(savedValue).toMatchObject({ code: 'return 3;', version: 'v2' });
    expect(savedValue).not.toHaveProperty('sourceRef');
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

  it('loads older history pages without duplicating commits', async () => {
    const initialCommits = Array.from({ length: 50 }, (_, index) => createHistoryCommit(100 - index));
    const olderCommit = createHistoryCommit(50);
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              history: {
                items: initialCommits,
              },
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
              items: [initialCommits[49], olderCommit],
              nextBeforeSeq: olderCommit.seq,
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });

    renderEditor();
    fireEvent.click(await screen.findByRole('button', { name: 'Expand files' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:listHistory',
          data: expect.objectContaining({
            repoId: 'repo-1',
            limit: 50,
            beforeSeq: 51,
          }),
        }),
      );
    });
    expect(await screen.findByText('History v50')).toBeTruthy();
    expect(screen.getAllByText('History v51')).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull());
  });

  it('refreshes history without adding an editor version baseline to save requests', async () => {
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
        .find((request) => request.url === 'runJSSources:save');
      expect(saveRequest?.data).not.toHaveProperty('baseCommitId');
      expect(saveRequest?.data).not.toHaveProperty('baseOwnerFingerprint');
    });
  });

  it('exports the current saved workspace as a ZIP', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:runjs-workspace'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:exportZip') {
        return Promise.resolve({
          data: new Blob(['zip'], { type: 'application/zip' }),
        });
      }
      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    fireEvent.click(
      within(screen.getByLabelText('File resource manager')).getByRole('button', { name: 'Export workspace' }),
    );

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:exportZip',
          responseType: 'blob',
        }),
      );
    });
    expect(await screen.findByText(/\[info\] Workspace exported/)).toBeTruthy();
  });

  it('shows a manual download link when automatic export download is blocked', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:runjs-workspace'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: {
        isActive: false,
      },
    });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    fireEvent.click(
      within(screen.getByLabelText('File resource manager')).getByRole('button', { name: 'Export workspace' }),
    );

    expect(await screen.findByText('Workspace export is ready')).toBeTruthy();
    const downloadLink = screen.getByRole('link', { name: 'Download workspace' }) as HTMLAnchorElement;
    expect(downloadLink.href).toBe('blob:runjs-workspace');
    expect(downloadLink.download).toBe('JS-block-Write-JavaScript.zip');
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('imports a ZIP and saves it directly', async () => {
    const onChange = vi.fn();
    const onPersistedChange = vi.fn();
    renderEditor(onChange, { onPersistedChange });

    await screen.findByLabelText('Edit file content');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(['zip'], 'workspace.zip', { type: 'application/zip' })],
      },
    });

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:importZip',
          data: expect.objectContaining({
            message: 'Import RunJS workspace',
            repoId: 'repo-1',
            zipBase64: expect.stringContaining('base64'),
          }),
        }),
      );
    });
    const importRequest = mocks.request.mock.calls
      .map(([request]) => request as { url: string; data?: Record<string, unknown> })
      .find((request) => request.url === 'runJSSources:importZip');
    expect(importRequest?.data).not.toHaveProperty('baseCommitId');
    expect(importRequest?.data).not.toHaveProperty('baseOwnerFingerprint');
    expect(onPersistedChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'return 1;', version: 'v2' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/\[info\] Workspace imported/)).toBeTruthy();
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
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              ownerFingerprint: 'owner-fingerprint-current',
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

    renderEditor();

    expect(await screen.findByText('RunJS source version is out of sync')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recover latest version from current code' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Edit latest saved version' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Recover latest version from current code' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:restoreFromCode',
        }),
      );
    });
    expect(await screen.findByLabelText('Edit file content')).toBeTruthy();
  });
});
