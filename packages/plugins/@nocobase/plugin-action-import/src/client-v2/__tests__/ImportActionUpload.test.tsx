/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @vitest-environment jsdom

import { FlowEngine } from '@nocobase/flow-engine';
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ImportActionModel } from '../ImportActionModel';

type TestContext = ReturnType<typeof createTestContext>;

function createTestContext() {
  const importXlsx = vi.fn().mockResolvedValue({ data: { data: { successCount: 1 } } });
  const refresh = vi.fn().mockResolvedValue(undefined);
  const viewerOpen = vi.fn().mockResolvedValue(undefined);
  const resource = {
    runAction: vi.fn(),
    refresh,
    getResourceName: vi.fn(() => 'posts'),
    getSourceId: vi.fn(() => undefined),
    getDataSourceKey: vi.fn(() => 'main'),
  };
  const collection = {
    title: 'Posts',
    name: 'posts',
    dataSourceKey: 'main',
  };

  return {
    model: {
      context: {
        blockModel: { collection, resource },
        collection,
        dataSourceManager: {
          getCollectionField: vi.fn(() => ({ name: 'title', uiSchema: { title: 'Title' } })),
        },
      },
      getProps: () => ({
        importSettings: {
          explain: '',
          importColumns: [{ dataIndex: ['title'] }],
        },
        importMode: 'overwrite',
      }),
    },
    api: {
      resource: vi.fn(() => ({ importXlsx })),
    },
    viewer: { open: viewerOpen },
    t: (key: string) => key,
    importXlsx,
    refresh,
    viewerOpen,
  };
}

async function renderImportDialog(ctx: TestContext) {
  const engine = new FlowEngine();
  engine.registerModels({ ImportActionModel });
  const model = engine.createModel<ImportActionModel>({ use: 'ImportActionModel', uid: 'import-action-upload-test' });
  const step = model.getFlow('importSettings')?.getStep('import')?.serialize() as
    | { handler?: (context: TestContext) => Promise<void> }
    | undefined;

  await step?.handler?.(ctx);
  const dialog = ctx.viewerOpen.mock.calls[0][0] as {
    content: (popover: { close: () => void }) => React.ReactElement;
  };
  return render(dialog.content({ close: vi.fn() }));
}

describe('ImportActionModel upload', () => {
  it('keeps file selection through the hidden input working', async () => {
    const ctx = createTestContext();
    const { container } = await renderImportDialog(ctx);
    const file = new File(['xlsx'], 'selected.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    expect(await screen.findByText('selected.xlsx')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start import' })).not.toBeDisabled();
  });

  it('falls back when a prevented drop does not produce an upload change', async () => {
    const ctx = createTestContext();
    const { container } = await renderImportDialog(ctx);
    const file = new File(['xlsx'], 'posts.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const dropArea = container.querySelector('.ant-upload-drag') as HTMLElement;
    const dropEvent = createEvent.drop(dropArea, {
      dataTransfer: { files: [file], items: [] },
    });
    dropEvent.preventDefault();

    fireEvent(dropArea, dropEvent);

    expect(await screen.findByText('posts.xlsx')).toBeTruthy();
    const startImport = screen.getByRole('button', { name: 'Start import' });
    expect(startImport).not.toBeDisabled();
    fireEvent.click(startImport);

    await waitFor(() => expect(ctx.importXlsx).toHaveBeenCalledOnce());
    const request = ctx.importXlsx.mock.calls[0][0] as { values: FormData };
    expect(request.values.get('file')).toBe(file);
    expect(ctx.refresh).toHaveBeenCalledOnce();
  });

  it('keeps the existing MIME validation for fallback files', async () => {
    const ctx = createTestContext();
    const { container } = await renderImportDialog(ctx);
    const dropArea = container.querySelector('.ant-upload-drag') as HTMLElement;

    fireEvent.drop(dropArea, {
      dataTransfer: { files: [new File(['xlsx'], 'posts.xlsx')], items: [] },
    });
    expect(await screen.findByText('Please upload the file of Excel')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start import' })).toBeDisabled();
  });

  it('handles a file dropped on the inner rc-upload element exactly once', async () => {
    const ctx = createTestContext();
    const { container } = await renderImportDialog(ctx);
    const file = new File(['xlsx'], 'inner.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.drop(container.querySelector('.ant-upload-btn') as HTMLElement, {
      dataTransfer: { files: [file], items: [], types: ['Files'] },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Start import' }));

    await waitFor(() => expect(ctx.importXlsx).toHaveBeenCalledOnce());
    const request = ctx.importXlsx.mock.calls[0][0] as { values: FormData };
    expect(request.values.getAll('file')).toEqual([file]);
  });
});
