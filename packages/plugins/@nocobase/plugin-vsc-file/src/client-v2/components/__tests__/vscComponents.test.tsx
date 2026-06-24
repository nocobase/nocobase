/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { VscCommitHistory } from '../VscCommitHistory';
import { VscDiffViewer } from '../VscDiffViewer';
import { VscEditorTabs } from '../VscEditorTabs';
import { VscFileExplorer } from '../VscFileExplorer';
import { VscSourceControlPanel } from '../VscSourceControlPanel';

const hookMocks = vi.hoisted(() => ({
  pull: vi.fn(),
  getFile: vi.fn(),
  saveDraft: vi.fn(),
  getDraft: vi.fn(),
  diffDraft: vi.fn(),
  push: vi.fn(),
  listCommits: vi.fn(),
  diffFile: vi.fn(),
  restoreFile: vi.fn(),
  restoreCommit: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    value,
    onChange,
    placeholder,
    RightExtra,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    RightExtra?: React.ComponentType<{ viewRef: React.MutableRefObject<unknown> }>;
  }) => (
    <>
      <textarea aria-label={placeholder} onChange={(event) => onChange?.(event.target.value)} value={value || ''} />
      {RightExtra ? (
        <RightExtra viewRef={{ current: null }} />
      ) : (
        <>
          <button type="button">Snippets</button>
          <button type="button">Run</button>
        </>
      )}
    </>
  ),
}));

vi.mock('../../hooks', () => ({
  useVscFileRepo: () => ({
    ...hookMocks,
    loading: {},
    errors: {},
    isLoading: () => false,
    getError: () => null,
    clearError: vi.fn(),
  }),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

const fileEntry = {
  path: 'src/index.ts',
  pathHash: 'path-hash',
  pathLowerHash: 'path-lower-hash',
  blobHash: 'blob-hash',
  size: 17,
  language: 'typescript',
  mode: '100644',
};

const emptyDiff = {
  files: [],
  summary: {
    added: 0,
    modified: 0,
    deleted: 0,
    unchanged: 0,
    renamed: 0,
  },
};

describe('vsc client-v2 components', () => {
  beforeEach(() => {
    hookMocks.pull.mockResolvedValue({
      repository: { id: 'repo-1' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-hash' },
      unchanged: false,
      files: [fileEntry],
    });
    hookMocks.getFile.mockResolvedValue({
      ...fileEntry,
      content: 'export const value = 1;',
    });
    hookMocks.saveDraft.mockResolvedValue({
      draft: {
        id: 'draft-1',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [],
    });
    hookMocks.getDraft.mockResolvedValue(null);
    hookMocks.diffDraft.mockResolvedValue(emptyDiff);
    hookMocks.push.mockResolvedValue({
      repository: { id: 'repo-1' },
      commit: { id: 'commit-2' },
      tree: { hash: 'tree-2' },
    });
    hookMocks.listCommits.mockResolvedValue([
      {
        id: 'commit-1',
        repoId: 'repo-1',
        hash: 'hash-1',
        seq: 1,
        parentCommitId: null,
        treeHash: 'tree-1',
        message: 'Initial commit',
        authorId: null,
        metadata: {},
      },
    ]);
    hookMocks.diffFile.mockResolvedValue({
      tooLarge: false,
      additions: 0,
      deletions: 0,
      hunks: [],
    });
    hookMocks.restoreFile.mockResolvedValue({});
    hookMocks.restoreCommit.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading and empty repository states in the file explorer', async () => {
    const deferred = createDeferred<unknown>();
    hookMocks.pull.mockReturnValueOnce(deferred.promise);

    render(<VscFileExplorer repoId="repo-1" />);

    expect(screen.getByText('Loading files')).toBeTruthy();

    deferred.resolve({
      repository: { id: 'repo-1' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [],
    });

    expect(await screen.findByText('Empty repository')).toBeTruthy();
    expect(hookMocks.pull).toHaveBeenCalledWith({
      repoId: 'repo-1',
      ref: undefined,
      includeContent: 'none',
    });
  });

  it('opens a pulled file from the explorer', async () => {
    const onFileOpen = vi.fn();

    render(<VscFileExplorer repoId="repo-1" onFileOpen={onFileOpen} />);

    fireEvent.click(await screen.findByRole('button', { name: /src\/index\.ts/ }));

    expect(onFileOpen).toHaveBeenCalledWith(expect.objectContaining({ path: 'src/index.ts' }));
  });

  it('renders file explorer errors', async () => {
    hookMocks.pull.mockRejectedValueOnce(new Error('Repository unavailable'));

    render(<VscFileExplorer repoId="repo-1" />);

    expect(await screen.findByText('Repository unavailable')).toBeTruthy();
  });

  it('lazy-loads file content and saves draft changes from editor tabs', async () => {
    const onDirtyFilesChange = vi.fn();

    render(
      <VscEditorTabs
        baseCommitId="commit-1"
        onDirtyFilesChange={onDirtyFilesChange}
        openPaths={['src/index.ts']}
        repoId="repo-1"
      />,
    );

    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'export const value = 2;',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => {
      expect(hookMocks.saveDraft).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ],
      });
    });
    expect(onDirtyFilesChange).toHaveBeenLastCalledWith([
      {
        path: 'src/index.ts',
        operation: 'upsert',
        content: 'export const value = 2;',
      },
    ]);
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Snippets' })).toBeNull();
  });

  it('ignores stale explorer responses after the repository changes', async () => {
    const firstPull = createDeferred<{
      repository: { id: string };
      commit: null;
      tree: null;
      unchanged: boolean;
      files: (typeof fileEntry)[];
    }>();
    hookMocks.pull.mockReturnValueOnce(firstPull.promise);
    hookMocks.pull.mockResolvedValueOnce({
      repository: { id: 'repo-2' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [
        {
          ...fileEntry,
          path: 'current.ts',
        },
      ],
    });

    const onPulled = vi.fn();
    const { rerender } = render(<VscFileExplorer onPulled={onPulled} repoId="repo-1" />);
    rerender(<VscFileExplorer onPulled={onPulled} repoId="repo-2" />);

    expect(await screen.findByRole('button', { name: 'current.ts' })).toBeTruthy();

    firstPull.resolve({
      repository: { id: 'repo-1' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [
        {
          ...fileEntry,
          path: 'stale.ts',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'stale.ts' })).toBeNull();
      expect(onPulled).not.toHaveBeenCalledWith(expect.objectContaining({ repository: { id: 'repo-1' } }));
    });
  });

  it('reloads editor content and clears dirty files when the base commit changes', async () => {
    const onDirtyFilesChange = vi.fn();
    const { rerender } = render(
      <VscEditorTabs
        baseCommitId="commit-1"
        onDirtyFilesChange={onDirtyFilesChange}
        openPaths={['src/index.ts']}
        repoId="repo-1"
      />,
    );

    const editor = await screen.findByLabelText('Edit file content');
    fireEvent.change(editor, {
      target: {
        value: 'export const value = 2;',
      },
    });
    await waitFor(() => {
      expect(onDirtyFilesChange).toHaveBeenLastCalledWith([
        {
          path: 'src/index.ts',
          operation: 'upsert',
          content: 'export const value = 2;',
        },
      ]);
    });

    hookMocks.getFile.mockResolvedValueOnce({
      ...fileEntry,
      content: 'export const value = 2;',
    });
    rerender(
      <VscEditorTabs
        baseCommitId="commit-2"
        onDirtyFilesChange={onDirtyFilesChange}
        openPaths={['src/index.ts']}
        repoId="repo-1"
      />,
    );

    await waitFor(() => {
      expect(hookMocks.getFile).toHaveBeenLastCalledWith({
        repoId: 'repo-1',
        ref: undefined,
        path: 'src/index.ts',
      });
    });
    await waitFor(() => {
      expect(onDirtyFilesChange).toHaveBeenLastCalledWith([]);
    });
    expect((screen.getByLabelText('Edit file content') as HTMLTextAreaElement).value).toBe('export const value = 2;');
  });

  it('renders the no changes source control state', async () => {
    render(<VscSourceControlPanel baseCommitId="commit-1" repoId="repo-1" />);

    expect(await screen.findByText('No changes')).toBeTruthy();
    expect(hookMocks.diffDraft).toHaveBeenCalledWith({ repoId: 'repo-1' });
    expect(hookMocks.getDraft).toHaveBeenCalledWith({ repoId: 'repo-1' });
  });

  it('commits local source control changes', async () => {
    render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        repoId="repo-1"
      />,
    );

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Update source',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        message: 'Update source',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ],
      });
    });
  });

  it('marks a saved draft committed when source control commits', async () => {
    hookMocks.getDraft.mockResolvedValueOnce(null);
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-1',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [],
    });

    render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        repoId="repo-1"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => {
      expect(hookMocks.saveDraft).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ],
      });
    });

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit saved draft',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo-1',
          draftId: 'draft-1',
          message: 'Commit saved draft',
        }),
      );
    });
  });

  it('commits a persisted active draft without local draft files', async () => {
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-persisted',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-file-1',
          draftId: 'draft-persisted',
          path: 'src/index.ts',
          pathHash: 'path-hash',
          pathLowerHash: 'path-lower-hash',
          operation: 'upsert',
          blobHash: 'blob-persisted',
        },
      ],
    });
    hookMocks.diffDraft.mockResolvedValueOnce({
      ...emptyDiff,
      files: [
        {
          status: 'modified',
          path: 'src/index.ts',
          pathHash: 'path-hash',
          tooLarge: false,
        },
      ],
    });

    render(<VscSourceControlPanel baseCommitId="commit-1" repoId="repo-1" />);

    expect(await screen.findByText('src/index.ts')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit persisted draft',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        message: 'Commit persisted draft',
        draftId: 'draft-persisted',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            blobHash: 'blob-persisted',
          },
        ],
      });
    });
  });

  it('merges persisted draft files with local source control changes before committing', async () => {
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-merged',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-file-1',
          draftId: 'draft-merged',
          path: 'README.md',
          pathHash: 'readme-hash',
          pathLowerHash: 'readme-lower-hash',
          operation: 'upsert',
          blobHash: 'readme-blob',
        },
      ],
    });
    hookMocks.diffDraft.mockResolvedValueOnce({
      ...emptyDiff,
      files: [
        {
          status: 'modified',
          path: 'README.md',
          pathHash: 'readme-hash',
          tooLarge: false,
        },
      ],
    });
    hookMocks.saveDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-merged',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-file-1',
          draftId: 'draft-merged',
          path: 'README.md',
          pathHash: 'readme-hash',
          pathLowerHash: 'readme-lower-hash',
          operation: 'upsert',
          blobHash: 'readme-blob',
        },
        {
          id: 'draft-file-2',
          draftId: 'draft-merged',
          path: 'src/index.ts',
          pathHash: 'path-hash',
          pathLowerHash: 'path-lower-hash',
          operation: 'upsert',
          blobHash: 'index-blob',
        },
      ],
    });
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-merged',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-file-1',
          draftId: 'draft-merged',
          path: 'README.md',
          pathHash: 'readme-hash',
          pathLowerHash: 'readme-lower-hash',
          operation: 'upsert',
          blobHash: 'readme-blob',
        },
        {
          id: 'draft-file-2',
          draftId: 'draft-merged',
          path: 'src/index.ts',
          pathHash: 'path-hash',
          pathLowerHash: 'path-lower-hash',
          operation: 'upsert',
          blobHash: 'index-blob',
        },
      ],
    });

    render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        repoId="repo-1"
      />,
    );

    expect(await screen.findByText('README.md')).toBeTruthy();
    expect(screen.getByText('src/index.ts')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => {
      expect(hookMocks.saveDraft).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit merged draft',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        message: 'Commit merged draft',
        draftId: 'draft-merged',
        files: [
          {
            path: 'README.md',
            operation: 'upsert',
            blobHash: 'readme-blob',
          },
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ],
      });
    });
  });

  it('ignores stale source control draft state after a baseline change', async () => {
    const firstDiff = createDeferred<typeof emptyDiff>();
    const firstDraft = createDeferred<{
      draft: {
        id: string;
        repoId: string;
        userId: string;
        baseCommitId: string;
        status: 'active';
        activeKey: string;
      };
      files: Array<{
        id: string;
        draftId: string;
        path: string;
        pathHash: string;
        pathLowerHash: string;
        operation: 'upsert';
        blobHash: string;
      }>;
    }>();
    hookMocks.diffDraft.mockReturnValueOnce(firstDiff.promise);
    hookMocks.getDraft.mockReturnValueOnce(firstDraft.promise);
    hookMocks.diffDraft.mockResolvedValueOnce({
      ...emptyDiff,
      files: [
        {
          status: 'modified',
          path: 'current.md',
          pathHash: 'current-hash',
          tooLarge: false,
        },
      ],
    });
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-current',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-2',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-current-file',
          draftId: 'draft-current',
          path: 'current.md',
          pathHash: 'current-hash',
          pathLowerHash: 'current-lower-hash',
          operation: 'upsert',
          blobHash: 'current-blob',
        },
      ],
    });

    const { rerender } = render(<VscSourceControlPanel baseCommitId="commit-1" repoId="repo-1" />);
    rerender(<VscSourceControlPanel baseCommitId="commit-2" repoId="repo-1" />);

    expect(await screen.findByText('current.md')).toBeTruthy();

    firstDiff.resolve({
      ...emptyDiff,
      files: [
        {
          status: 'modified',
          path: 'stale.md',
          pathHash: 'stale-hash',
          tooLarge: false,
        },
      ],
    });
    firstDraft.resolve({
      draft: {
        id: 'draft-stale',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-stale-file',
          draftId: 'draft-stale',
          path: 'stale.md',
          pathHash: 'stale-hash',
          pathLowerHash: 'stale-lower-hash',
          operation: 'upsert',
          blobHash: 'stale-blob',
        },
      ],
    });

    await waitFor(() => {
      expect(screen.queryByText('stale.md')).toBeNull();
    });
    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit current draft',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-2',
        message: 'Commit current draft',
        draftId: 'draft-current',
        files: [
          {
            path: 'current.md',
            operation: 'upsert',
            blobHash: 'current-blob',
          },
        ],
      });
    });
  });

  it('ignores active drafts that belong to a different base commit', async () => {
    hookMocks.diffDraft.mockResolvedValueOnce({
      ...emptyDiff,
      files: [
        {
          status: 'modified',
          path: 'stale.md',
          pathHash: 'stale-hash',
          tooLarge: false,
        },
      ],
    });
    hookMocks.getDraft.mockResolvedValueOnce({
      draft: {
        id: 'draft-stale-base',
        repoId: 'repo-1',
        userId: 'user-1',
        baseCommitId: 'commit-1',
        status: 'active',
        activeKey: 'repo-1:user-1',
      },
      files: [
        {
          id: 'draft-stale-base-file',
          draftId: 'draft-stale-base',
          path: 'stale.md',
          pathHash: 'stale-hash',
          pathLowerHash: 'stale-lower-hash',
          operation: 'upsert',
          blobHash: 'stale-blob',
        },
      ],
    });

    render(<VscSourceControlPanel baseCommitId="commit-2" repoId="repo-1" />);

    expect(await screen.findByText('No changes')).toBeTruthy();
    expect(screen.queryByText('stale.md')).toBeNull();
    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit stale draft',
      },
    });
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled();
  });

  it('does not send a stale external draft id when the current active draft is missing', async () => {
    render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        draftId="draft-stale"
        repoId="repo-1"
      />,
    );

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit without stale draft',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        message: 'Commit without stale draft',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ],
      });
    });
  });

  it('does not send an externally supplied draft id after the baseline changes', async () => {
    const { rerender } = render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        draftId="draft-from-commit-1"
        repoId="repo-1"
      />,
    );

    rerender(
      <VscSourceControlPanel
        baseCommitId="commit-2"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 3;',
          },
        ]}
        draftId="draft-from-commit-1"
        repoId="repo-1"
      />,
    );

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit after external switch',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-2',
        message: 'Commit after external switch',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 3;',
          },
        ],
      });
    });
  });

  it('drops an internally saved draft id when source control baseline changes', async () => {
    const { rerender } = render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 2;',
          },
        ]}
        repoId="repo-1"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => {
      expect(hookMocks.saveDraft).toHaveBeenCalled();
    });

    rerender(
      <VscSourceControlPanel
        baseCommitId="commit-2"
        draftFiles={[
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 3;',
          },
        ]}
        repoId="repo-2"
      />,
    );

    fireEvent.change(screen.getByLabelText('Commit message'), {
      target: {
        value: 'Commit after switch',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-2',
        baseCommitId: 'commit-2',
        message: 'Commit after switch',
        files: [
          {
            path: 'src/index.ts',
            operation: 'upsert',
            content: 'export const value = 3;',
          },
        ],
      });
    });
  });

  it('loads commit history', async () => {
    render(<VscCommitHistory repoId="repo-1" />);

    expect(await screen.findByText('Initial commit')).toBeTruthy();
    expect(hookMocks.listCommits).toHaveBeenCalledWith({ repoId: 'repo-1' });
  });

  it('ignores stale commit history responses after the repository changes', async () => {
    const firstCommits = createDeferred<
      Array<{
        id: string;
        repoId: string;
        hash: string;
        seq: number;
        parentCommitId: null;
        treeHash: string;
        message: string;
        authorId: null;
        metadata: Record<string, unknown>;
      }>
    >();
    hookMocks.listCommits.mockReturnValueOnce(firstCommits.promise);
    hookMocks.listCommits.mockResolvedValueOnce([
      {
        id: 'commit-current',
        repoId: 'repo-2',
        hash: 'hash-current',
        seq: 2,
        parentCommitId: null,
        treeHash: 'tree-current',
        message: 'Current commit',
        authorId: null,
        metadata: {},
      },
    ]);

    const { rerender } = render(<VscCommitHistory repoId="repo-1" />);
    rerender(<VscCommitHistory repoId="repo-2" />);

    expect(await screen.findByText('Current commit')).toBeTruthy();

    firstCommits.resolve([
      {
        id: 'commit-stale',
        repoId: 'repo-1',
        hash: 'hash-stale',
        seq: 1,
        parentCommitId: null,
        treeHash: 'tree-stale',
        message: 'Stale commit',
        authorId: null,
        metadata: {},
      },
    ]);

    await waitFor(() => {
      expect(screen.queryByText('Stale commit')).toBeNull();
    });
  });

  it('selects commits with a semantic button', async () => {
    const onCommitSelected = vi.fn();

    render(<VscCommitHistory onCommitSelected={onCommitSelected} repoId="repo-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Initial commit' }));

    expect(onCommitSelected).toHaveBeenCalledWith(expect.objectContaining({ id: 'commit-1' }));
  });

  it('restores a commit after confirmation', async () => {
    render(<VscCommitHistory repoId="repo-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Restore commit 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(hookMocks.restoreCommit).toHaveBeenCalledWith({
        repoId: 'repo-1',
        sourceCommitId: 'commit-1',
      });
    });
  });

  it('restores a file after confirmation', async () => {
    render(
      <VscDiffViewer
        from={{ type: 'commit', commitId: 'commit-1', path: 'src/index.ts' }}
        repoId="repo-1"
        restorePath="src/index.ts"
        restoreSourceCommitId="commit-1"
        to={{ type: 'commit', commitId: 'commit-2', path: 'src/index.ts' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Restore file' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Restore' }));

    await waitFor(() => {
      expect(hookMocks.restoreFile).toHaveBeenCalledWith({
        repoId: 'repo-1',
        sourceCommitId: 'commit-1',
        path: 'src/index.ts',
      });
    });
  });

  it('ignores stale diff responses after selected endpoints change', async () => {
    const firstDiff = createDeferred<{
      tooLarge: boolean;
      hunks: Array<{
        oldStart: number;
        oldLines: number;
        newStart: number;
        newLines: number;
        lines: Array<{ type: 'context' | 'delete' | 'insert'; content: string }>;
      }>;
    }>();
    hookMocks.diffFile.mockReturnValueOnce(firstDiff.promise);
    hookMocks.diffFile.mockResolvedValueOnce({
      tooLarge: false,
      hunks: [
        {
          oldStart: 1,
          oldLines: 0,
          newStart: 1,
          newLines: 1,
          lines: [{ type: 'insert', content: 'current diff' }],
        },
      ],
    });

    const { rerender } = render(
      <VscDiffViewer
        from={{ type: 'commit', commitId: 'commit-1', path: 'src/old.ts' }}
        repoId="repo-1"
        to={{ type: 'commit', commitId: 'commit-2', path: 'src/old.ts' }}
      />,
    );

    rerender(
      <VscDiffViewer
        from={{ type: 'commit', commitId: 'commit-1', path: 'src/current.ts' }}
        repoId="repo-1"
        to={{ type: 'commit', commitId: 'commit-2', path: 'src/current.ts' }}
      />,
    );

    expect(await screen.findByText('+ current diff')).toBeTruthy();

    firstDiff.resolve({
      tooLarge: false,
      hunks: [
        {
          oldStart: 1,
          oldLines: 0,
          newStart: 1,
          newLines: 1,
          lines: [{ type: 'insert', content: 'stale diff' }],
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Diff output').textContent).toContain('current diff');
      expect(screen.getByLabelText('Diff output').textContent).not.toContain('stale diff');
    });
  });

  it('renders large diff state', async () => {
    hookMocks.diffFile.mockResolvedValueOnce({
      tooLarge: true,
      hunks: [],
    });

    render(
      <VscDiffViewer
        from={{ type: 'commit', commitId: 'commit-1', path: 'src/index.ts' }}
        repoId="repo-1"
        to={{ type: 'commit', commitId: 'commit-2', path: 'src/index.ts' }}
      />,
    );

    expect(await screen.findByText('Diff is too large to render')).toBeTruthy();
    expect(hookMocks.diffFile).toHaveBeenCalledWith({
      repoId: 'repo-1',
      from: { type: 'commit', commitId: 'commit-1', path: 'src/index.ts' },
      to: { type: 'commit', commitId: 'commit-2', path: 'src/index.ts' },
    });
  });
});

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => {};
  let rejectPromise: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}
