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
import { formatRunJSSourceRequestErrorMessage } from '../useRunJSSourceResource';
import { runJSManifestPath } from '../workspaceUtils';

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

function buildOpenResultWithDraft(baseContent: string, draftContent: string) {
  const draftFile = {
    id: 'draft-file-1',
    draftId: 'draft-1',
    path: 'src/main.tsx',
    pathHash: 'path-hash',
    pathLowerHash: 'path-lower-hash',
    operation: 'upsert',
    blobHash: 'blob-2',
    language: 'typescript',
    mode: '100644',
    content: draftContent,
  };

  return {
    ...openResult,
    files: [
      {
        ...openResult.files[0],
        content: baseContent,
      },
    ],
    draft: {
      id: 'draft-1',
      baseCommitId: 'commit-1',
      status: 'active',
      files: [draftFile],
    },
  };
}

const requiredRunJSPolishLocaleKeys = [
  'Open Studio',
  'Save draft',
  'Publish',
  'Run preview',
  'Draft saved',
  'Unsaved changes',
  'Conflict',
  'Compile failed',
  'Restore as draft',
  'No changes to publish',
  'Commit message',
  'Files changed',
  'Discard draft',
  'Keep my changes and rebase',
  'This JavaScript source changed while you were editing.',
  'No published versions yet',
  'No changes between draft and published',
  'No files in this workspace',
  'You can view this JavaScript source, but you do not have permission to edit it',
  'You do not have permission to access this JavaScript source.',
  'This JavaScript source no longer exists',
  'This JavaScript source could not be located.',
  'This JavaScript source type is not supported in Studio.',
  'Copy technical details',
  'View diagnostics',
  'A newer version was published while you were editing.',
  'Your draft is based on an older version.',
  'Only relative imports inside this workspace are supported.',
  'Imported file was not found in this workspace.',
  'Dynamic imports are not supported in RunJS sources.',
  'The entry file was not found in this workspace.',
  'Commit message must be between 3 and 200 characters.',
] as const;

const runJSLocaleMessages = {
  'en-US': enUS,
  'zh-CN': zhCN,
} satisfies Record<string, Record<string, string>>;

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

  it('keeps the RunJS Studio polish locale keys in sync', () => {
    expect(runJSManifestPath).toBe('.nocobase/runjs-source.json');

    expect(requiredRunJSPolishLocaleKeys).toMatchInlineSnapshot(`
      [
        "Open Studio",
        "Save draft",
        "Publish",
        "Run preview",
        "Draft saved",
        "Unsaved changes",
        "Conflict",
        "Compile failed",
        "Restore as draft",
        "No changes to publish",
        "Commit message",
        "Files changed",
        "Discard draft",
        "Keep my changes and rebase",
        "This JavaScript source changed while you were editing.",
        "No published versions yet",
        "No changes between draft and published",
        "No files in this workspace",
        "You can view this JavaScript source, but you do not have permission to edit it",
        "You do not have permission to access this JavaScript source.",
        "This JavaScript source no longer exists",
        "This JavaScript source could not be located.",
        "This JavaScript source type is not supported in Studio.",
        "Copy technical details",
        "View diagnostics",
        "A newer version was published while you were editing.",
        "Your draft is based on an older version.",
        "Only relative imports inside this workspace are supported.",
        "Imported file was not found in this workspace.",
        "Dynamic imports are not supported in RunJS sources.",
        "The entry file was not found in this workspace.",
        "Commit message must be between 3 and 200 characters.",
      ]
    `);

    for (const [locale, messages] of Object.entries(runJSLocaleMessages)) {
      const missing = requiredRunJSPolishLocaleKeys.filter((key) => !messages[key]);
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });

  it('maps common RunJS source request errors to friendly messages', () => {
    const t = (key: string) => key;

    expect(
      formatRunJSSourceRequestErrorMessage('BASE_COMMIT_OUTDATED', '409 Active draft base is no longer current', t),
    ).toBe('A newer version was published while you were editing.');
    expect(
      formatRunJSSourceRequestErrorMessage('DRAFT_BASE_OUTDATED', 'RunJS draft base is no longer current', t),
    ).toBe('Your draft is based on an older version.');
    expect(
      formatRunJSSourceRequestErrorMessage('RUNJS_IMPORT_NOT_ALLOWED', 'Import "@nocobase/client" is not allowed', t),
    ).toBe('Only relative imports inside this workspace are supported.');
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_IMPORT_NOT_FOUND', 'Cannot resolve "./helper"', t)).toBe(
      'Imported file was not found in this workspace.',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_DYNAMIC_IMPORT_UNSUPPORTED', 'dynamic import()', t)).toBe(
      'Dynamic imports are not supported in RunJS sources.',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_ENTRY_NOT_FOUND', 'entry missing', t)).toBe(
      'The entry file was not found in this workspace.',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_COMMIT_MESSAGE_INVALID', 'message too short', t)).toBe(
      'Commit message must be between 3 and 200 characters.',
    );
    expect(formatRunJSSourceRequestErrorMessage('PERMISSION_DENIED', 'Forbidden', t)).toBe(
      'You do not have permission to access this JavaScript source.',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_SOURCE_READONLY', 'Readonly', t)).toBe(
      'You can view this JavaScript source, but you do not have permission to edit it',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_SOURCE_LOCATOR_INVALID', 'invalid locator', t)).toBe(
      'This JavaScript source could not be located.',
    );
    expect(formatRunJSSourceRequestErrorMessage('RUNJS_SOURCE_KIND_UNSUPPORTED', 'unsupported kind', t)).toBe(
      'This JavaScript source type is not supported in Studio.',
    );
    expect(formatRunJSSourceRequestErrorMessage(undefined, 'Fallback message', t)).toBe('Fallback message');
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

  it('exposes accessible names for main actions and announces console updates politely', async () => {
    const { container } = render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
        })}
      </>,
    );

    expect(screen.getByRole('button', { name: 'Open Studio' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));

    expect(await screen.findByLabelText('Edit file content')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More actions' })).toBeTruthy();

    const previewButtons = screen.getAllByRole('button', { name: 'Run Preview' });
    fireEvent.click(previewButtons[previewButtons.length - 1]);

    await waitFor(() => {
      expect(mocks.request.mock.calls.some(([input]) => input?.url === 'runJSSources:compilePreview')).toBe(true);
    });
    expect(container.querySelector('[aria-label="Console"] [aria-live="polite"]')).toBeTruthy();
  });

  it('shows workspace request errors as friendly inline alert cards', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.reject({
          response: {
            status: 404,
            data: {
              errors: [
                {
                  code: 'RUNJS_SOURCE_NOT_FOUND',
                  message: '404 runjs source owner lookup failed',
                  status: 404,
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

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('This JavaScript source no longer exists')).toBeTruthy();
    expect(within(alert).getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(within(alert).getByRole('button', { name: 'Copy technical details' })).toBeTruthy();
    expect(screen.queryByText('404 runjs source owner lookup failed')).toBeNull();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
    });
    fireEvent.click(within(alert).getByRole('button', { name: 'Copy technical details' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        ['message: 404 runjs source owner lookup failed', 'code: RUNJS_SOURCE_NOT_FOUND', 'status: 404'].join('\n'),
      );
    });
  });

  it('disables publishing when the workspace has no publish permission', async () => {
    mocks.request.mockImplementation(({ url }: { url: string }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              permissions: {
                canRead: true,
                canWrite: true,
                canPublish: false,
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

    const publishButton = screen.getByRole('button', { name: 'Publish' });
    expect(publishButton).toBeDisabled();
    fireEvent.click(publishButton);

    expect(screen.queryByRole('dialog', { name: 'Publish JavaScript' })).toBeNull();
  });

  it('shows action request failures as inline alert cards with technical details', async () => {
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
                code: 'return 2;',
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
            status: 400,
            data: {
              errors: [
                {
                  code: 'RUNJS_COMMIT_MESSAGE_INVALID',
                  message: 'commit message failed server validation',
                  status: 400,
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
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
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

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('Publish failed')).toBeTruthy();
    expect(within(alert).getByText('Commit message must be between 3 and 200 characters.')).toBeTruthy();
    fireEvent.click(within(alert).getByRole('button', { name: 'Copy technical details' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        ['message: commit message failed server validation', 'code: RUNJS_COMMIT_MESSAGE_INVALID', 'status: 400'].join(
          '\n',
        ),
      );
    });
  });

  it('offers diagnostics actions when publish preview compilation fails', async () => {
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
                code: 'return 1;',
                version: 'v2',
                diagnostics: [
                  {
                    severity: 'error',
                    message: 'Missing semicolon',
                    path: 'src/main.tsx',
                    line: 2,
                    column: 3,
                    code: 'TS1005',
                  },
                ],
                filesHash: 'files-hash-2',
                entryPath: 'src/main.tsx',
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
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText,
      },
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
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    const dialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    await within(dialog).findByText('Compile failed');
    const alert = within(dialog)
      .getAllByRole('alert')
      .find((item) => within(item).queryByText('Compile failed'));
    if (!alert) {
      throw new Error('Compile failed alert not found');
    }
    expect(within(alert).getByText('Compile failed')).toBeTruthy();
    expect(within(alert).getByRole('button', { name: 'View diagnostics' })).toBeTruthy();
    fireEvent.click(within(alert).getByRole('button', { name: 'Copy technical details' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('[error] src/main.tsx:2:3 (TS1005) Missing semicolon');
    });

    fireEvent.click(within(alert).getByRole('button', { name: 'View diagnostics' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Publish JavaScript' })).toBeNull();
    });
    expect(screen.getByText((content) => content.includes('Missing semicolon'))).toBeTruthy();
  });

  it('focuses the file dialog input and restores focus to the opener on close', async () => {
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

    const newFileButton = screen.getByLabelText('New file');
    newFileButton.focus();
    fireEvent.click(newFileButton);
    const fileDialog = await screen.findByRole('dialog', { name: 'New file' });
    await waitFor(() => {
      expect(within(fileDialog).getByLabelText('File path')).toHaveFocus();
    });
    fireEvent.click(within(fileDialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(newFileButton).toHaveFocus();
    });
  });

  it('focuses the publish modal input and restores focus to the opener on close', async () => {
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
    const publishButton = screen.getByRole('button', { name: 'Publish' });
    publishButton.focus();
    fireEvent.click(publishButton);
    const publishDialog = await screen.findByRole('dialog', { name: 'Publish JavaScript' });
    await waitFor(() => {
      expect(within(publishDialog).getByLabelText('Commit message')).toHaveFocus();
    });
    fireEvent.click(within(publishDialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(publishButton).toHaveFocus();
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
    const helperTab = screen.getByRole('tab', { name: /src\/utils\/helper\.ts/ });
    expect(helperTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(helperTab, { key: 'Home' });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /src\/main\.tsx/ })).toHaveFocus();
      expect(screen.getByRole('tab', { name: /src\/main\.tsx/ })).toHaveAttribute('aria-selected', 'true');
    });

    fireEvent.keyDown(screen.getByRole('tab', { name: /src\/main\.tsx/ }), { key: 'ArrowRight' });
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /src\/utils\/helper\.ts/ })).toHaveFocus();
      expect(screen.getByRole('tab', { name: /src\/utils\/helper\.ts/ })).toHaveAttribute('aria-selected', 'true');
    });

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

  it('runs the preview callback with compiled code without publishing local form changes', async () => {
    const onChange = vi.fn();
    const onPreview = vi.fn();

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator,
          onChange,
          onPreview,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'return preview;',
      },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Run Preview' })[1]);

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith({
        code: 'return preview;',
        version: 'v2',
      });
    });
    expect(onChange).not.toHaveBeenCalled();
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

    expect((await screen.findAllByText('1 file(s) changed, +2 -1')).length).toBeGreaterThan(0);
    expect(screen.getByText('src/main.tsx +2 -1')).toBeTruthy();
    expect(screen.getByText('Commit v1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /View files/ }));
    expect(screen.getByRole('button', { name: /Copy file/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Back to history' }));
    expect(await screen.findByText('Select a version')).toBeTruthy();
  });

  it('keeps the latest selected history version when an earlier load resolves late', async () => {
    const firstVersion = createDeferred<unknown>();
    const newerCommit = {
      ...latestCommit,
      parentCommitId: commit.id,
    };
    const newerRepository = {
      ...repository,
      headCommitId: newerCommit.id,
      publishedCommitId: newerCommit.id,
      headSeq: newerCommit.seq,
    };
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: unknown }) => {
      const commitId = (data as { commitId?: string } | undefined)?.commitId;
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: {
              ...openResult,
              repository: newerRepository,
              history: {
                commits: [newerCommit, commit],
                items: [newerCommit, commit],
              },
            },
          },
        });
      }
      if (url === 'runJSSources:getVersion') {
        if (commitId === commit.id) {
          return firstVersion.promise;
        }

        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              repository: newerRepository,
              commit: newerCommit,
              files: [
                {
                  path: 'src/main.tsx',
                  content: 'return 2;',
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
              repository: newerRepository,
              fromCommitId: commit.id,
              toCommitId: newerCommit.id,
              fromIsPublished: false,
              toIsPublished: true,
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

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 2;', version: 'v2' },
          locator,
        })}
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Studio' }));
    await screen.findByLabelText('Edit file content');
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    fireEvent.click(await screen.findByText('v1 Initial import'));
    fireEvent.click(await screen.findByText('v2 Remote update'));

    expect(await screen.findByText('Commit v2')).toBeTruthy();
    firstVersion.resolve({
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

    await waitFor(() => {
      expect(screen.getByText('Commit v2')).toBeTruthy();
      expect(screen.queryByText('Commit v1')).toBeNull();
    });
    expect(
      mocks.request.mock.calls.some(
        ([input]) => input?.url === 'runJSSources:diffVersion' && input?.data?.commitId === commit.id,
      ),
    ).toBe(false);
  });

  it('clears version loading when workspace refresh cancels a history version load', async () => {
    const firstVersion = createDeferred<unknown>();
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:getVersion') {
        return firstVersion.promise;
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
    fireEvent.click(await screen.findByText('v1 Initial import'));

    await waitFor(() => {
      expect(screen.queryByText('Select a version')).toBeNull();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
    expect(await screen.findByText('Select a version')).toBeTruthy();

    firstVersion.resolve({
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

    await waitFor(() => {
      expect(screen.getByText('Select a version')).toBeTruthy();
    });
  });

  it('navigates draft diff changes with previous and next controls', async () => {
    const openedWithDraft = buildOpenResultWithDraft(
      'const one = 1;\nconst two = 2;\nconst three = 3;',
      'const one = 10;\nconst two = 2;\nconst three = 30;',
    );
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openedWithDraft,
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
                    pathHash: 'path-hash-main',
                    additions: 2,
                    deletions: 2,
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

    const previous = await screen.findByRole('button', { name: /Previous change/ });
    const next = await screen.findByRole('button', { name: /Next change/ });
    expect(previous).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Previous change/ })).not.toBeDisabled();
    });
  });

  it('shows only the diff error card when refreshing a previously rendered diff fails', async () => {
    const openedWithDraft = buildOpenResultWithDraft('return 1;', 'return 2;');
    let diffRequestCount = 0;
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openedWithDraft,
          },
        });
      }
      if (url === 'runJSSources:diffDraft') {
        diffRequestCount += 1;
        if (diffRequestCount > 1) {
          return Promise.reject({
            response: {
              status: 503,
              data: {
                errors: [
                  {
                    message: 'Diff service unavailable',
                    status: 503,
                  },
                ],
              },
            },
          });
        }

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
                    pathHash: 'path-hash-main',
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
    expect(await screen.findByLabelText('Diff output')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh diff' }));

    await waitFor(() => {
      expect(mocks.request.mock.calls.filter(([input]) => input?.url === 'runJSSources:diffDraft')).toHaveLength(2);
    });
    expect(await screen.findByText('Diff service unavailable')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Copy details/ })).toBeTruthy();
    expect(screen.queryByLabelText('Diff output')).toBeNull();
    expect(screen.queryByText('No changes between draft and published')).toBeNull();
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

  it('restores a history version as draft after confirmation', async () => {
    mocks.request.mockImplementation(({ url }: { url: string; data?: unknown }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({
          data: {
            data: openResult,
          },
        });
      }
      if (url === 'runJSSources:restoreAsDraft') {
        return Promise.resolve(buildDraftResponse([{ path: 'src/main.tsx', content: 'return restored;' }]));
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
              fromCommitId: null,
              toCommitId: commit.id,
              fromIsPublished: false,
              toIsPublished: true,
              diff: {
                files: [],
                summary: {
                  added: 0,
                  modified: 0,
                  deleted: 0,
                  unchanged: 1,
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
    const dialog = await screen.findByRole('dialog', { name: 'Restore v1 as draft?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore as draft' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Edit file content')).toHaveValue('return restored;');
      expect(screen.getByText('Draft restored from v1')).toBeTruthy();
    });
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
    const dialog = await screen.findByRole('dialog', { name: 'Restore v1 as draft?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore as draft' }));
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
