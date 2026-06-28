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

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      request: mocks.request,
    },
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    value,
    onChange,
    placeholder,
    readonly,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
  }) => (
    <textarea
      aria-label={placeholder}
      readOnly={readonly}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
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
  isPublished: true,
};

const latestCommit = {
  ...commit,
  id: 'commit-2',
  seq: 2,
  message: 'Remote update',
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
  draft: null,
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

function getSubmittedMainContent(data: unknown): string {
  const input = data as { files?: Array<{ path: string; content?: string }> };
  return input.files?.find((file) => file.path === 'src/main.tsx')?.content || 'return 2;';
}

function createDeferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });

  return {
    promise,
    resolve: resolveDeferred,
    reject: rejectDeferred,
  };
}

type DraftRequestFile = {
  path: string;
  operation?: 'upsert' | 'delete';
  content?: string;
  language?: string;
  mode?: string;
};

function buildDraftResponse(files: DraftRequestFile[], draftId = 'draft-1') {
  const draftFiles = files.map((file, index) => ({
    id: `draft-file-${index + 1}`,
    draftId,
    path: file.path,
    pathHash: `path-hash-${index + 1}`,
    pathLowerHash: `path-lower-hash-${index + 1}`,
    operation: file.operation || 'upsert',
    blobHash: file.operation === 'delete' ? null : `blob-${index + 1}`,
    language: file.language || null,
    mode: file.mode || null,
    content: file.content,
  }));

  return {
    data: {
      data: {
        locator,
        locatorKind: 'flowModel.step',
        repository,
        draft: {
          id: draftId,
          baseCommitId: 'commit-1',
          status: 'active',
          files: draftFiles,
        },
        files: draftFiles,
      },
    },
  };
}

describe('runJSStudioProvider', () => {
  beforeEach(() => {
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft' || url === 'runJSSources:rebaseDraft') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              draft: {
                id: 'draft-1',
                baseCommitId: 'commit-1',
                status: 'active',
                files: [
                  {
                    id: 'draft-file-1',
                    draftId: 'draft-1',
                    path: 'src/main.tsx',
                    pathHash: 'path-hash',
                    pathLowerHash: 'path-lower-hash',
                    operation: 'upsert',
                    blobHash: 'blob-2',
                    language: 'typescript',
                    mode: '100644',
                    content: 'return 2;',
                  },
                ],
              },
              files: [
                {
                  id: 'draft-file-1',
                  draftId: 'draft-1',
                  path: 'src/main.tsx',
                  pathHash: 'path-hash',
                  pathLowerHash: 'path-lower-hash',
                  operation: 'upsert',
                  blobHash: 'blob-2',
                  language: 'typescript',
                  mode: '100644',
                  content: 'return 2;',
                },
              ],
            },
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
                  path: 'src/main.tsx',
                  content: 'return 1;',
                  language: 'typescript',
                  mode: '100644',
                },
              ],
            },
          },
        });
      }
      if (url === 'runJSSources:diffVersion') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              fromCommitId: null,
              toCommitId: 'commit-1',
              fromIsPublished: false,
              toIsPublished: true,
              diff: {
                files: [
                  {
                    status: 'modified',
                    path: 'src/main.tsx',
                    pathHash: 'path-hash',
                    additions: 2,
                    deletions: 1,
                    tooLarge: false,
                  },
                ],
                summary: {
                  added: 0,
                  modified: 1,
                  deleted: 0,
                  unchanged: 0,
                  renamed: 0,
                },
              },
            },
          },
        });
      }
      if (url === 'runJSSources:diffDraft') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              diff: {
                files: [
                  {
                    status: 'modified',
                    path: 'src/main.tsx',
                    pathHash: 'path-hash',
                    additions: 1,
                    deletions: 1,
                    tooLarge: false,
                  },
                ],
                summary: {
                  added: 0,
                  modified: 1,
                  deleted: 0,
                  unchanged: 0,
                  renamed: 0,
                },
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
    vi.clearAllMocks();
  });

  it('renders a compact entry card and opens the RunJS Studio workspace', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    expect(screen.getByRole('button', { name: 'Open Studio' })).toBeTruthy();
    expect(screen.queryByLabelText('Edit file content')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));

    expect(await screen.findByLabelText('Edit file content')).toHaveValue('return 1;');
    expect(mocks.request).toHaveBeenCalledWith({
      url: 'runJSSources:open',
      method: 'post',
      data: {
        locator,
      },
    });
  });

  it('reloads workspace state when the RunJS source locator changes', async () => {
    const secondLocator = {
      ...locator,
      modelUid: 'fm_2',
    };
    const secondRepository = {
      ...repository,
      id: 'repo-2',
      repoId: 'repo-2',
    };
    const secondOpenResult = {
      ...openResult,
      locator: secondLocator,
      repository: secondRepository,
      legacy: {
        ...openResult.legacy,
        code: 'return second;',
        ownerFingerprint: 'owner-fingerprint-2',
      },
      ownerFingerprint: 'owner-fingerprint-2',
      files: [
        {
          path: 'src/main.tsx',
          content: 'return second;',
          language: 'typescript',
          mode: '100644',
        },
      ],
    };
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        const requestLocator = (data as { locator?: { modelUid?: string } } | undefined)?.locator;
        return Promise.resolve({
          data: {
            data: requestLocator?.modelUid === 'fm_2' ? secondOpenResult : openResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        return Promise.resolve(buildDraftResponse((data as { files: DraftRequestFile[] }).files));
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    const { rerender } = render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    expect(await screen.findByLabelText('Edit file content')).toHaveValue('return 1;');

    rerender(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return second;', version: 'v2' },
          locator: secondLocator,
        })}
      </>,
    );

    await waitFor(() => {
      expect(mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:open')).toHaveLength(2);
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return second;');
    });

    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: {
        value: 'return second edited;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:saveDraft',
        method: 'post',
        data: {
          locator: secondLocator,
          repoId: 'repo-2',
          baseCommitId: 'commit-1',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'return second edited;',
              language: 'typescript',
              mode: '100644',
            },
          ],
        },
      });
    });
  });

  it('saves draft changes from the workspace editor', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:saveDraft',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
          baseCommitId: 'commit-1',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'return 2;',
              language: 'typescript',
              mode: '100644',
            },
          ],
        },
      });
    });
  });

  it('clears saved draft-only files when saving back to the published base', async () => {
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        return Promise.resolve(buildDraftResponse((data as { files: DraftRequestFile[] }).files));
      }
      if (url === 'runJSSources:discardDraft') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              draft: null,
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByLabelText('New file'));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'New file' })).getByRole('button', {
        name: 'Create',
      }),
    );
    await screen.findByRole('button', { name: 'src/helper.ts' });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:saveDraft',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
          baseCommitId: 'commit-1',
          files: [
            {
              path: 'src/helper.ts',
              operation: 'upsert',
              content: '',
              language: 'typescript',
              mode: undefined,
            },
          ],
        },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /delete Delete/ }));
    const deleteButtons = await screen.findAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:discardDraft',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
        },
      });
    });
  });

  it('supports keyboard file selection in the files panel', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByLabelText('New file'));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'New file' })).getByRole('button', {
        name: 'Create',
      }),
    );

    const helperFile = await screen.findByRole('button', { name: 'src/helper.ts' });

    await waitFor(() => {
      expect(screen.getByLabelText('Edit file content')).toHaveValue('');
      expect(helperFile).toHaveAttribute('aria-pressed', 'true');
    });

    fireEvent.keyDown(helperFile, { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return 1;');
      expect(screen.getByRole('button', { name: 'src/main.tsx' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('keeps dirty edits until refresh is explicitly confirmed', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByLabelText('Refresh workspace'));

    expect(await screen.findByText('Save your draft before refreshing?')).toBeTruthy();
    expect(mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:open')).toHaveLength(1);
    expect(editor).toHaveValue('return 2;');

    fireEvent.click(screen.getByRole('button', { name: 'Refresh without saving' }));

    await waitFor(() => {
      expect(mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:open')).toHaveLength(2);
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return 1;');
    });
  });

  it('renders open-file tabs and closes a nested file tab without deleting the file', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByLabelText('New file'));
    const dialog = await screen.findByRole('dialog', { name: 'New file' });
    fireEvent.change(within(dialog).getByLabelText('File path'), {
      target: {
        value: 'src/utils/helper.ts',
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('utils')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /src\/utils\/helper\.ts/ })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'src/main.tsx' }));

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /src\/main\.tsx/ })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /src\/utils\/helper\.ts/ })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close file src/utils/helper.ts' }));

    expect(screen.queryByRole('tab', { name: /src\/utils\/helper\.ts/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'src/utils/helper.ts' })).toBeTruthy();
  });

  it('sets another file as entry and compiles that entry with a manifest update', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByLabelText('New file'));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'New file' })).getByRole('button', {
        name: 'Create',
      }),
    );
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: {
        value: 'return helper;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Set as entry' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Run Preview' })[1]);

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:compilePreview',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
          baseCommitId: 'commit-1',
          draftId: undefined,
          files: expect.arrayContaining([
            expect.objectContaining({
              path: '.nocobase/runjs-source.json',
              content: expect.stringContaining('"entry": "src/helper.ts"'),
            }),
            expect.objectContaining({
              path: 'src/helper.ts',
              content: 'return helper;',
            }),
          ]),
          entryPath: 'src/helper.ts',
          version: 'v2',
        },
      });
    });
  });

  it('resizes the console with keyboard controls', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');

    const resizeHandle = screen.getByLabelText('Resize console');
    fireEvent.keyDown(resizeHandle, { key: 'ArrowUp' });

    expect(screen.getByLabelText('Console')).toHaveStyle({ height: '200px' });
  });

  it('compiles and publishes the current workspace files', async () => {
    const onChange = vi.fn();

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
          onChange,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    const dialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: {
        value: 'Update code',
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:publish',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
          baseCommitId: 'commit-1',
          basePublishedCommitId: 'commit-1',
          baseOwnerFingerprint: 'owner-fingerprint-1',
          message: 'Update code',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'return 2;',
              language: 'typescript',
              mode: '100644',
            },
          ],
          draftId: undefined,
          entryPath: 'src/main.tsx',
          version: 'v2',
        },
      });
    });
    expect(onChange).toHaveBeenCalledWith({
      code: 'return 2;',
      version: 'v2',
    });
  });

  it('keeps newer local edits when save draft resolves late', async () => {
    const saveDraft = createDeferred<unknown>();
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        return saveDraft.promise;
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    fireEvent.change(editor, {
      target: {
        value: 'return 3;',
      },
    });

    saveDraft.resolve({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          repository,
          draft: {
            id: 'draft-1',
            baseCommitId: 'commit-1',
            status: 'active',
            files: [
              {
                id: 'draft-file-1',
                draftId: 'draft-1',
                path: 'src/main.tsx',
                pathHash: 'path-hash',
                pathLowerHash: 'path-lower-hash',
                operation: 'upsert',
                blobHash: 'blob-2',
                language: 'typescript',
                mode: '100644',
                content: 'return 2;',
              },
            ],
          },
          files: [
            {
              id: 'draft-file-1',
              draftId: 'draft-1',
              path: 'src/main.tsx',
              pathHash: 'path-hash',
              pathLowerHash: 'path-lower-hash',
              operation: 'upsert',
              blobHash: 'blob-2',
              language: 'typescript',
              mode: '100644',
              content: 'return 2;',
            },
          ],
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return 3;');
    });
  });

  it('blocks overlapping save draft requests until the in-flight save settles', async () => {
    const firstSave = createDeferred<unknown>();
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        const saveDraftCalls = mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:saveDraft');
        if (saveDraftCalls.length === 1) {
          return firstSave.promise;
        }

        return Promise.resolve(buildDraftResponse((data as { files: DraftRequestFile[] }).files, 'draft-2'));
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    fireEvent.change(editor, {
      target: {
        value: 'return 3;',
      },
    });
    fireEvent.keyDown(document, { key: 's', ctrlKey: true });

    await waitFor(() => {
      expect(mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:saveDraft')).toHaveLength(1);
    });

    firstSave.resolve(buildDraftResponse([{ path: 'src/main.tsx', content: 'return 2;', language: 'typescript' }]));

    await waitFor(() => {
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return 3;');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => {
      const saveDraftCalls = mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:saveDraft');
      expect(saveDraftCalls).toHaveLength(2);
      expect(saveDraftCalls[1][0]).toMatchObject({
        data: {
          files: [
            {
              path: 'src/main.tsx',
              content: 'return 3;',
            },
          ],
        },
      });
    });
  });

  it('ignores stale preview diagnostics when files change before preview resolves', async () => {
    const preview = createDeferred<unknown>();
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:compilePreview') {
        return preview.promise;
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    fireEvent.change(editor, {
      target: {
        value: 'return 3;',
      },
    });
    preview.resolve({
      data: {
        data: {
          locator,
          locatorKind: 'flowModel.step',
          artifact: {
            code: 'return 2;',
            version: 'v2',
            diagnostics: [
              {
                severity: 'error',
                message: 'Old compile error',
                path: 'src/main.tsx',
              },
            ],
            filesHash: 'files-hash-2',
            entryPath: 'src/main.tsx',
          },
        },
      },
    });

    await waitFor(() => {
      expect(screen.queryByText('Compile failed')).toBeNull();
      expect(screen.queryByText('Old compile error')).toBeNull();
    });
  });

  it('auto-loads draft diff only once per unchanged diff inputs', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('tab', { name: 'Diff' }));

    const countDiffRequests = () =>
      mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:diffDraft').length;

    await waitFor(() => {
      expect(countDiffRequests()).toBe(1);
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(countDiffRequests()).toBe(1);
  });

  it('recompiles before publish when files changed after preview', async () => {
    const onChange = vi.fn();

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
          onChange,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'runJSSources:compilePreview',
        }),
      );
    });

    fireEvent.change(editor, {
      target: {
        value: 'return 3;',
      },
    });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: {
        value: 'Update code',
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        code: 'return 3;',
        version: 'v2',
      });
    });
  });

  it('blocks editor changes while publish is in flight', async () => {
    const publishRequest = createDeferred<unknown>();
    const onChange = vi.fn();
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              files: [
                {
                  path: 'src/main.tsx',
                  content: 'return 1;',
                  language: 'typescript',
                  mode: '100644',
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
                code: getSubmittedMainContent(data),
                version: 'v2',
                diagnostics: [],
                filesHash: 'files-hash-2',
                entryPath: 'src/main.tsx',
              },
            },
          },
        });
      }
      if (url === 'runJSSources:publish') {
        return publishRequest.promise;
      }

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
          onChange,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: {
        value: 'Update code',
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(mocks.request.mock.calls.some(([input]) => input?.url === 'runJSSources:publish')).toBe(true);
    });

    fireEvent.change(editor, {
      target: {
        value: 'return 3;',
      },
    });

    expect(editor).toHaveValue('return 2;');

    publishRequest.resolve({
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

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        code: 'return 2;',
        version: 'v2',
      });
    });
  });

  it('renders selected history version diff details', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    fireEvent.click(await screen.findByRole('button', { name: 'View diff' }));

    expect(await screen.findByText('1 file(s) changed, +2 -1')).toBeTruthy();
    expect(screen.getByText('src/main.tsx +2 -1')).toBeTruthy();
  });

  it('disables history restore while local edits are unsaved', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return unsaved;',
      },
    });
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore as draft' })).toBeDisabled();
    });
    expect(mocks.request.mock.calls.some(([input]) => input?.url === 'runJSSources:restoreAsDraft')).toBe(false);
  });

  it('keeps local edits when history restore resolves late', async () => {
    const restoreDraft = createDeferred<unknown>();
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:restoreAsDraft') {
        return restoreDraft.promise;
      }
      if (url === 'runJSSources:getVersion') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              commit,
              files: openResult.files,
            },
          },
        });
      }
      if (url === 'runJSSources:diffVersion') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository,
              commit,
              diff: {
                files: [],
                summary: {
                  files: 0,
                  additions: 0,
                  deletions: 0,
                  modified: 0,
                  added: 0,
                  deleted: 0,
                  renamed: 0,
                  unchanged: 1,
                },
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore as draft' }));
    await waitFor(() => {
      const restoreCalls = mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:restoreAsDraft');
      expect(restoreCalls).toHaveLength(1);
      expect(restoreCalls[0][0].data).toMatchObject({
        locator,
        repoId: repository.repoId,
        sourceCommitId: commit.id,
        baseCommitId: commit.id,
      });
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Code' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return local;',
      },
    });

    restoreDraft.resolve(buildDraftResponse([{ path: 'src/main.tsx', content: 'return restored;' }]));

    await waitFor(() => {
      expect(editor).toHaveValue('return local;');
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(editor).toHaveValue('return local;');
    expect(screen.getAllByText(/Unsaved changes/).length).toBeGreaterThan(0);
  });

  it('shows conflict changes against the latest published files', async () => {
    const latestOpenResult = {
      ...openResult,
      repository: {
        ...repository,
        headCommitId: 'commit-2',
        publishedCommitId: 'commit-2',
        headSeq: 2,
      },
      ownerFingerprint: 'owner-fingerprint-2',
      files: [
        {
          path: 'src/main.tsx',
          content: 'return remote;',
          language: 'typescript',
          mode: '100644',
        },
        {
          path: 'src/remote.ts',
          content: 'export const remote = true;',
          language: 'typescript',
          mode: '100644',
        },
      ],
      history: {
        commits: [latestCommit, commit],
        items: [latestCommit, commit],
      },
    };
    let openCallCount = 0;
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        openCallCount += 1;
        return Promise.resolve({
          data: {
            data: openCallCount === 1 ? openResult : latestOpenResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft' || url === 'runJSSources:rebaseDraft') {
        return Promise.reject({
          response: {
            status: 409,
            data: {
              errors: [
                {
                  code: 'DRAFT_BASE_OUTDATED',
                  message: 'RunJS draft base is no longer current',
                  status: 409,
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return local;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByRole('dialog', { name: 'Conflict' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'View changes' }));

    expect(await screen.findByText('1 file(s) changed, +1 -1')).toBeTruthy();
    expect(screen.queryByText(/src\/remote\.ts \+0 -1/)).toBeNull();
  });

  it('rebases only the user patch over latest files when keeping conflict changes', async () => {
    const latestOpenResult = {
      ...openResult,
      repository: {
        ...repository,
        headCommitId: 'commit-2',
        publishedCommitId: 'commit-2',
        headSeq: 2,
      },
      ownerFingerprint: 'owner-fingerprint-2',
      files: [
        {
          path: 'src/main.tsx',
          content: 'return remote;',
          language: 'typescript',
          mode: '100644',
        },
        {
          path: 'src/remote.ts',
          content: 'export const remote = true;',
          language: 'typescript',
          mode: '100644',
        },
      ],
      history: {
        commits: [latestCommit, commit],
        items: [latestCommit, commit],
      },
    };
    let openCallCount = 0;
    let saveDraftCallCount = 0;
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        openCallCount += 1;
        return Promise.resolve({
          data: {
            data: openCallCount === 1 ? openResult : latestOpenResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        saveDraftCallCount += 1;
        if (saveDraftCallCount === 1) {
          return Promise.reject({
            response: {
              status: 409,
              data: {
                errors: [
                  {
                    code: 'DRAFT_BASE_OUTDATED',
                    message: 'RunJS draft base is no longer current',
                    status: 409,
                  },
                ],
              },
            },
          });
        }
      }

      if (url === 'runJSSources:rebaseDraft') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: latestOpenResult.repository,
              draft: {
                id: 'draft-2',
                baseCommitId: 'commit-2',
                status: 'active',
                files: (data as { files: unknown[] }).files,
              },
              files: (data as { files: unknown[] }).files,
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return local;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByRole('dialog', { name: 'Conflict' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my changes and rebase' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:rebaseDraft',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
          baseCommitId: 'commit-2',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'return local;',
              language: 'typescript',
              mode: '100644',
            },
          ],
        },
      });
    });
  });

  it('clears a stale draft when conflict rebase has no remaining patch', async () => {
    const latestOpenResult = {
      ...openResult,
      repository: {
        ...repository,
        headCommitId: 'commit-2',
        publishedCommitId: 'commit-2',
        headSeq: 2,
      },
      ownerFingerprint: 'owner-fingerprint-2',
      files: [
        {
          path: 'src/main.tsx',
          content: 'return local;',
          language: 'typescript',
          mode: '100644',
        },
      ],
      history: {
        commits: [latestCommit, commit],
        items: [latestCommit, commit],
      },
    };
    let openCallCount = 0;
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        openCallCount += 1;
        return Promise.resolve({
          data: {
            data: openCallCount === 1 ? openResult : latestOpenResult,
          },
        });
      }
      if (url === 'runJSSources:saveDraft') {
        return Promise.reject({
          response: {
            status: 409,
            data: {
              errors: [
                {
                  code: 'DRAFT_BASE_OUTDATED',
                  message: 'RunJS draft base is no longer current',
                  status: 409,
                },
              ],
            },
          },
        });
      }
      if (url === 'runJSSources:discardDraft') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: latestOpenResult.repository,
              draft: null,
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return local;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));

    expect(await screen.findByRole('dialog', { name: 'Conflict' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my changes and rebase' }));

    await waitFor(() => {
      expect(mocks.request).toHaveBeenCalledWith({
        url: 'runJSSources:discardDraft',
        method: 'post',
        data: {
          locator,
          repoId: 'repo-1',
        },
      });
    });
    expect(mocks.request.mock.calls.some(([input]) => input?.url === 'runJSSources:rebaseDraft')).toBe(false);
  });

  it('does not offer rebase actions for owner fingerprint conflicts', async () => {
    const latestOpenResult = {
      ...openResult,
      ownerFingerprint: 'owner-fingerprint-external',
      source: {
        ...openResult.source,
        ownerFingerprint: 'owner-fingerprint-external',
      },
    };
    let openCallCount = 0;
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        openCallCount += 1;
        return Promise.resolve({
          data: {
            data: openCallCount === 1 ? openResult : latestOpenResult,
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
                code: getSubmittedMainContent(data),
                version: 'v2',
                diagnostics: [],
                filesHash: 'files-hash-2',
                entryPath: 'src/main.tsx',
              },
            },
          },
        });
      }
      if (url === 'runJSSources:publish') {
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

      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: {
        value: 'Update code',
      },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publish' }));

    expect(
      await screen.findByText('The source owner changed outside this workspace. Refresh before rebasing.'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Keep my changes and rebase' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'View changes' })).toBeNull();
  });

  it('guards browser page leave while local changes are unsaved', async () => {
    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return 2;',
      },
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
