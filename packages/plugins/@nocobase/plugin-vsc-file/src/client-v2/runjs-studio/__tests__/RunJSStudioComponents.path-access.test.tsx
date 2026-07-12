/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FilesPanel } from '../RunJSStudioComponents';

describe('FilesPanel path access', () => {
  it('fills the available sidebar height when history is collapsed', () => {
    render(
      <FilesPanel
        collapsed={false}
        exporting={false}
        files={[]}
        fillAvailableHeight
        onCollapseChange={vi.fn()}
        onCreate={vi.fn()}
        onCreateFolder={vi.fn()}
        onDelete={vi.fn()}
        onDeleteFolder={vi.fn()}
        onMoveFile={vi.fn()}
        onMoveFolder={vi.fn()}
        onOpen={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onRenameFolder={vi.fn()}
        readOnly={false}
        savedFiles={[]}
        t={(key) => key}
      />,
    );

    expect(screen.getByRole('complementary', { name: 'File resource manager' })).toHaveStyle({
      flex: '1 1 0',
      minHeight: 0,
    });
    expect(screen.getByRole('complementary', { name: 'File resource manager' })).not.toHaveStyle({
      maxHeight: '80%',
    });
  });

  it('keeps locked files viewable while disabling their mutation actions', () => {
    const lockedPath = 'src/client/js-actions/locked/index.ts';
    const editablePath = 'src/client/js-blocks/current/index.tsx';

    render(
      <FilesPanel
        activePath={editablePath}
        collapsed={false}
        exporting={false}
        files={[
          { path: lockedPath, content: '', language: 'typescript' },
          { path: editablePath, content: '', language: 'typescript' },
        ]}
        getPathAccess={(path) =>
          path === lockedPath || path === 'src/client/js-actions/locked'
            ? {
                canCreate: false,
                canDelete: false,
                canMove: false,
                canRename: false,
                canWrite: false,
                reason: 'Only the selected entry can be edited',
              }
            : {}
        }
        onCollapseChange={vi.fn()}
        onCreate={vi.fn()}
        onCreateFolder={vi.fn()}
        onDelete={vi.fn()}
        onDeleteFolder={vi.fn()}
        onMoveFile={vi.fn()}
        onMoveFolder={vi.fn()}
        onOpen={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onRenameFolder={vi.fn()}
        readOnly={false}
        savedFiles={[]}
        t={(key) => key}
      />,
    );

    const lockedFileButton = screen.getByRole('button', { name: lockedPath });
    const lockedFolderButton = screen.getByRole('button', { name: 'src/client/js-actions/locked' });
    const lockedFileName = lockedFileButton.querySelector('.ant-typography');

    expect(lockedFileButton).toBeEnabled();
    expect(screen.getAllByLabelText('Only the selected entry can be edited')).toHaveLength(2);
    expect(lockedFileButton).toHaveStyle({ color: 'rgba(0, 0, 0, 0.25)' });
    expect(lockedFileName).toHaveStyle({ color: 'rgba(0, 0, 0, 0.25)' });
    expect(lockedFolderButton).toHaveStyle({ color: 'rgba(0, 0, 0, 0.25)' });
    expect(within(lockedFolderButton).getByText('locked')).toHaveStyle({ color: 'rgba(0, 0, 0, 0.25)' });
    expect(screen.queryByRole('button', { name: `Rename ${lockedPath}` })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `Delete ${lockedPath}` })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Rename ${editablePath}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Delete ${editablePath}` })).toBeInTheDocument();
    expect(lockedFileButton.closest('li')).toHaveAttribute('draggable', 'false');
    expect(screen.getByRole('button', { name: editablePath }).closest('li')).toHaveAttribute('draggable', 'true');
  });

  it('renames an existing folder from its row action', () => {
    const folderPath = 'src/client/js-blocks/js-block12';
    const onRenameFolder = vi.fn(() => true);

    render(
      <FilesPanel
        collapsed={false}
        exporting={false}
        files={[{ path: `${folderPath}/index.tsx`, content: '', language: 'typescript' }]}
        onCollapseChange={vi.fn()}
        onCreate={vi.fn()}
        onCreateFolder={vi.fn()}
        onDelete={vi.fn()}
        onDeleteFolder={vi.fn()}
        onMoveFile={vi.fn()}
        onMoveFolder={vi.fn()}
        onOpen={vi.fn()}
        onRefresh={vi.fn()}
        onRename={vi.fn()}
        onRenameFolder={onRenameFolder}
        readOnly={false}
        savedFiles={[]}
        t={(key) => key}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: `Rename ${folderPath}` }));
    const input = screen.getByRole('textbox', { name: `Rename ${folderPath}` });
    fireEvent.change(input, { target: { value: 'js-block13' } });
    fireEvent.blur(input);

    expect(onRenameFolder).toHaveBeenCalledWith(folderPath, 'src/client/js-blocks/js-block13');
  });
});
