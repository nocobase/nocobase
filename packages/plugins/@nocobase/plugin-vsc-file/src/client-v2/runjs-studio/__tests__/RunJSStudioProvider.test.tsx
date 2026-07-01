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
  request: vi.fn(),
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

const runJSLocaleMessages = {
  'en-US': enUS,
  'zh-CN': zhCN,
} satisfies Record<string, Record<string, string>>;

function getSubmittedMainContent(data: unknown): string {
  const input = data as { files?: Array<{ path: string; content?: string }> };
  return input.files?.find((file) => file.path === 'src/main.tsx')?.content || 'return 1;';
}

function renderEditor(onChange = vi.fn()) {
  return render(
    <>
      {runJSStudioProvider.renderEditor({
        value: { code: 'return 1;', version: 'v2' },
        onChange,
        locator,
        scene: 'block',
      })}
    </>,
  );
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
    ] as const;

    for (const [locale, messages] of Object.entries(runJSLocaleMessages)) {
      for (const key of requiredKeys) {
        expect(messages[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('renders the workspace directly without launcher or draft actions', async () => {
    renderEditor();

    expect(await screen.findByRole('button', { name: 'Expand files' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'src/main.tsx' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Studio' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save Draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Run' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Diff' })).toBeTruthy();
    expect(screen.queryByText('Entry')).toBeNull();
    expect(screen.getByLabelText('Open files').style.overflowY).toBe('hidden');
    expect(screen.getByText('No logs yet. Click Run to execute.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Expand files' }));
    expect(screen.getByRole('button', { name: 'src/main.tsx' })).toBeTruthy();
    expect(screen.getByLabelText('Commit history').style.marginTop).toBe('auto');
  });

  it('toggles the editor area into a diff against the published file', async () => {
    renderEditor();
    const editor = (await screen.findByLabelText('Edit file content')) as HTMLTextAreaElement;

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Diff' }));

    const diffOutput = screen.getByLabelText('Diff output');
    expect(within(diffOutput).getByText('Saved')).toBeTruthy();
    expect(within(diffOutput).getByText('Base')).toBeTruthy();
    expect(within(diffOutput).getByText('Current draft')).toBeTruthy();
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

  it('uses a discard-only confirmation when cancelling dirty edits', async () => {
    renderEditor();
    const editor = await screen.findByLabelText('Edit file content');

    fireEvent.change(editor, { target: { value: 'return 2;' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Discard your changes before closing?')).toBeTruthy();
    expect(within(dialog).queryByText('Save Draft')).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Discard changes' })).toBeTruthy();
  });
});
