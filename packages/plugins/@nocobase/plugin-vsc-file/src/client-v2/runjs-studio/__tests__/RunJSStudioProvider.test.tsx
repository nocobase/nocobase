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

import enUS from '../../../locale/en-US.json';
import zhCN from '../../../locale/zh-CN.json';
import { runJSStudioProvider } from '../RunJSStudioProvider';
import { runJSManifestPath } from '../workspaceUtils';

const mocks = vi.hoisted(() => ({
  closeView: vi.fn(),
  diagnoseRunJS: vi.fn(),
  request: vi.fn(),
}));

vi.mock('../../../shared/path', () => ({
  normalizePath: (path: string) => String(path || '').replace(/\\/g, '/'),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
    view: {
      close: mocks.closeView,
    },
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
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
    toolbarLeftExtra?: React.ReactNode;
    runButton?: React.ReactNode;
  }) => (
    <div>
      <div>
        {toolbarLeftExtra}
        {runButton}
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
  defaultRef: 'published',
  headCommitId: 'commit-1',
  publishedCommitId: 'commit-1',
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
  isPublished: true,
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
    entryPath: 'src/main.tsx',
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
  },
  repository,
  files: [
    {
      path: 'src/main.tsx',
      content: 'return 1;',
      language: 'typescript',
      mode: '100644',
    },
  ],
  permissions: {
    canRead: true,
    canWrite: true,
    canPublish: true,
  },
  history: {
    commits: [commit],
    items: [commit],
  },
};

const runJSLocaleMessages = {
  'en-US': enUS,
  'zh-CN': zhCN,
} satisfies Record<string, Record<string, string>>;

function getSubmittedMainContent(data: unknown): string {
  const input = data as { files?: Array<{ path: string; content?: string }> };
  return input.files?.find((file) => file.path === 'src/main.tsx')?.content || 'return 1;';
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
                entryPath: 'src/main.tsx',
              },
            },
          },
        });
      }

      if (url === 'runJSSources:publish') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: {
                ...repository,
                headCommitId: 'commit-2',
                publishedCommitId: 'commit-2',
                headSeq: 2,
              },
              commit: {
                ...commit,
                id: 'commit-2',
                seq: 2,
                message: 'Update code',
              },
              publishedRef: {
                id: 'ref-1',
                repoId: 'repo-1',
                name: 'published',
                type: 'branch',
                commitId: 'commit-2',
              },
              artifact: {
                entryPath: 'src/main.tsx',
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
                publishedCommitId: 'commit-2',
                headSeq: 2,
              },
              commit: {
                ...commit,
                id: 'commit-2',
                seq: 2,
                message: 'Import RunJS workspace',
              },
              publishedRef: {
                id: 'ref-1',
                repoId: 'repo-1',
                name: 'published',
                type: 'branch',
                commitId: 'commit-2',
              },
              artifact: {
                entryPath: 'src/main.tsx',
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
      'Code saved',
      'Saved successfully',
      'Unsaved changes',
      'Current changes',
      'Saved changes',
      'Commit message',
      'Describe this change',
      'Discard changes',
      'Discard changes and refresh',
      'Discard your changes before closing?',
      'Discard your changes before refreshing?',
      'No changes between current editor and published version',
      'Back to editor',
      'Base',
      'Saved',
      'No logs yet. Click Run to execute.',
      'Click to restore',
      'Restore {{version}}?',
      'This will copy files from this version into the editor.',
      'You can review and save after restoring.',
      'RunJS source version is out of sync',
      'The code stored in this block differs from the latest saved RunJS source. Choose which version to continue with.',
      'Recover latest version from current code',
      'Recovered latest version from current code',
      'Edit latest saved version',
      'Import',
      'Import workspace',
      'Import failed',
      'Export workspace',
      'Export failed',
      'Workspace export is ready',
      'If the download did not start automatically, click Download workspace.',
      'Download workspace',
      'Dismiss',
      'Workspace imported',
      'Workspace exported',
      'Load latest version',
      'Keep my changes on latest version',
      'Your changes are based on',
      'Local changes were reapplied to the latest version',
      'Already up to date',
      'The source owner changed outside this workspace. Load latest version before saving.',
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
    expect(screen.queryByRole('button', { name: 'src/main.tsx' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Studio' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Diff' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export workspace' })).toBeTruthy();
    expect(screen.queryByText('Entry')).toBeNull();
    expect(screen.getByLabelText('Open files').style.overflowY).toBe('hidden');
    expect(screen.getByText('No logs yet. Click Run to execute.')).toBeTruthy();
    expect(screen.getByTestId('runjs-studio-editor').style.overflow).toBe('hidden');
    expect(screen.getByTestId('runjs-studio-editor').style.minHeight).toMatch(/^(0|0px)$/);
    expect(screen.getByTestId('runjs-studio-workspace').style.minHeight).toMatch(/^(0|0px)$/);
    expect(screen.getByTestId('runjs-studio-workspace').style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    expect(screen.getByRole('button', { name: 'src/main.tsx' })).toBeTruthy();
    const filesPanel = screen.getByLabelText('File resource manager');
    expect(filesPanel.style.flex).toBe('0 1 auto');
    expect(filesPanel.style.maxHeight).toBe('80%');
    expect(filesPanel.style.minHeight).toBe('140px');
    const historyPanel = screen.getByLabelText('Commit history');
    expect(historyPanel.style.flex).toBe('1 1 220px');
    expect(historyPanel.style.minHeight).toBe('180px');
    expect(historyPanel.style.maxHeight).toBe('');
    expect(historyPanel.style.marginTop).toMatch(/^(0|0px)$/);
    expect(historyPanel.style.transition).toContain('flex-basis');
    expect(within(historyPanel).getByRole('button', { name: 'Collapse history' })).toBeTruthy();
    expect(screen.getByText(/07-02/)).toBeTruthy();

    fireEvent.click(within(historyPanel).getByRole('button', { name: 'Collapse history' }));
    expect(historyPanel.style.flex).toBe('0 0 40px');
    expect(historyPanel.style.minHeight).toBe('40px');
    expect(historyPanel.style.maxHeight).toBe('40px');
    expect(historyPanel.style.marginTop).toBe('auto');
    expect(within(historyPanel).getByRole('button', { name: 'Expand history' })).toBeTruthy();
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

  it('shows mapped runtime diagnostics as clickable file locations', async () => {
    mocks.diagnoseRunJS.mockResolvedValueOnce({
      execution: { finished: true, started: true, timeout: false },
      issues: [
        {
          type: 'runtime',
          message: 'boom',
          sourcePath: 'src/main.tsx',
          location: { start: { line: 2, column: 3 } },
        },
      ],
      logs: [],
    });
    renderEditor();

    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText(/\[error\] src\/main\.tsx:2 boom/)).toBeTruthy();
  });

  it('toggles the editor area into a diff against the published file', async () => {
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

  it('requires a commit message before Save publishes', async () => {
    const onChange = vi.fn();
    renderEditor(onChange);
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const dialog = await screen.findByRole('dialog');
    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Commit message' }), {
      target: { value: 'Update code' },
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:publish',
          data: expect.objectContaining({
            message: 'Update code',
          }),
        }),
      );
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'return 2;', version: 'v2' }));
    expect(mocks.closeView).toHaveBeenCalled();
  });

  it('exports the current published workspace as a ZIP', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Export workspace' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Export workspace' }));

    expect(await screen.findByText('Workspace export is ready')).toBeTruthy();
    const downloadLink = screen.getByRole('link', { name: 'Download workspace' }) as HTMLAnchorElement;
    expect(downloadLink.href).toBe('blob:runjs-workspace');
    expect(downloadLink.download).toBe('JS-block-Write-JavaScript.zip');
    expect(anchorClick).not.toHaveBeenCalled();
  });

  it('imports a ZIP and publishes it directly', async () => {
    const onChange = vi.fn();
    renderEditor(onChange);

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
            baseCommitId: 'commit-1',
            baseOwnerFingerprint: 'owner-fingerprint-1',
            message: 'Import RunJS workspace',
            repoId: 'repo-1',
            zipBase64: expect.stringContaining('base64'),
          }),
        }),
      );
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ code: 'return 1;', version: 'v2' }));
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

  it('offers recovery choices when the RunJS source owner is out of sync', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.reject({
          response: {
            status: 409,
            data: {
              errors: [
                {
                  code: 'RUNJS_SOURCE_OWNER_OUTDATED',
                  message: 'RunJS source owner was changed by another writer',
                  status: 409,
                },
              ],
            },
          },
        });
      }

      if (url === 'runJSSources:openLatest') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              ownerFingerprint: 'owner-fingerprint-current',
              publishedOwnerFingerprint: 'owner-fingerprint-1',
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
    fireEvent.click(screen.getByRole('button', { name: 'Edit latest saved version' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:openLatest',
        }),
      );
    });
    expect(await screen.findByLabelText('Edit file content')).toBeTruthy();
  });
});
