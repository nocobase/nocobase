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
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VscEditorTabs } from '../VscEditorTabs';
import { VscSourceControlPanel } from '../VscSourceControlPanel';

const hookMocks = vi.hoisted(() => ({
  getFile: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => <textarea aria-label={placeholder} onChange={(event) => onChange?.(event.target.value)} value={value || ''} />,
}));

vi.mock('../../hooks', () => ({
  useVscFileRepo: () => hookMocks,
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('vsc-file client components', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads file content and reports editor dirty files', async () => {
    const onDirtyFilesChange = vi.fn();
    hookMocks.getFile.mockResolvedValueOnce({
      path: 'README.md',
      content: '# Initial\n',
      language: 'markdown',
    });

    render(
      <VscEditorTabs
        activePath="README.md"
        baseCommitId="commit-1"
        onDirtyFilesChange={onDirtyFilesChange}
        openPaths={['README.md']}
        repoId="repo-1"
      />,
    );

    const editor = (await screen.findByLabelText('Edit file content')) as HTMLTextAreaElement;
    expect(editor.value).toBe('# Initial\n');

    fireEvent.change(editor, {
      target: {
        value: '# Edited\n',
      },
    });

    await waitFor(() => {
      expect(onDirtyFilesChange).toHaveBeenLastCalledWith([
        {
          path: 'README.md',
          operation: 'upsert',
          content: '# Edited\n',
        },
      ]);
    });
    expect(hookMocks.getFile).toHaveBeenCalledWith({
      repoId: 'repo-1',
      ref: undefined,
      path: 'README.md',
    });
  });

  it('commits supplied local changes directly through push', async () => {
    const onCommitted = vi.fn();
    const pushResult = {
      repository: {
        id: 'repo-1',
      },
      commit: {
        id: 'commit-2',
      },
      tree: {
        hash: 'tree-2',
      },
    };
    hookMocks.push.mockResolvedValueOnce(pushResult);

    render(
      <VscSourceControlPanel
        baseCommitId="commit-1"
        files={[
          {
            path: 'README.md',
            operation: 'upsert',
            content: '# Edited\n',
          },
        ]}
        onCommitted={onCommitted}
        repoId="repo-1"
      />,
    );

    expect(screen.getByText('README.md')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Commit message' }), {
      target: {
        value: 'Update README',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }));

    await waitFor(() => {
      expect(hookMocks.push).toHaveBeenCalledWith({
        repoId: 'repo-1',
        baseCommitId: 'commit-1',
        message: 'Update README',
        files: [
          {
            path: 'README.md',
            operation: 'upsert',
            content: '# Edited\n',
          },
        ],
      });
    });
    expect(onCommitted).toHaveBeenCalledWith(pushResult);
  });
});
