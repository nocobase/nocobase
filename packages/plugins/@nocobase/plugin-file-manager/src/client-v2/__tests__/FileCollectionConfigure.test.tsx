/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import { describe, expect, it, vi } from 'vitest';

const listStorages = vi.fn().mockResolvedValue({
  data: {
    data: {
      data: [
        { name: 'local', title: 'Local files' },
        { name: 'archive', title: 'Archive files' },
      ],
    },
  },
});

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    api: {
      resource: () => ({
        list: listStorages,
      }),
    },
  }),
}));

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

import { FileCollectionStorageConfigureItem, normalizeStorageRecords } from '../FileCollectionConfigure';

describe('FileCollectionStorageConfigureItem', () => {
  it('normalizes flat and paginated storage list responses', () => {
    expect(normalizeStorageRecords({ data: { data: [{ name: 'local', title: 'Local files' }] } })).toEqual([
      { name: 'local', title: 'Local files' },
    ]);
    expect(
      normalizeStorageRecords({ data: { data: { data: [{ name: 'archive', title: 'Archive files' }] } } }),
    ).toEqual([{ name: 'archive', title: 'Archive files' }]);
    expect(normalizeStorageRecords({ data: { data: [{ name: '' }, null, { title: 'Missing name' }] } })).toEqual([]);
  });

  it('loads storage options and preserves the selected storage name', async () => {
    let formInstance: FormInstance | undefined;

    function FormHarness() {
      const [form] = Form.useForm();
      formInstance = form;

      return (
        <Form form={form} initialValues={{ storage: 'archive' }}>
          <FileCollectionStorageConfigureItem
            mode="edit"
            template={{ name: 'file', title: 'File collection' }}
            form={form}
            item={{ name: 'storage' }}
          />
        </Form>
      );
    }

    render(<FormHarness />);

    expect(screen.getByText('Default storage will be used when not selected')).toBeInTheDocument();
    await waitFor(() => expect(listStorages).toHaveBeenCalledWith({ paginate: false, sort: ['id'], appends: [] }));
    expect(formInstance?.getFieldValue('storage')).toBe('archive');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'File storage' }));
    expect(await screen.findByText('Local files')).toBeInTheDocument();
    expect(screen.getAllByText('Archive files').length).toBeGreaterThan(0);

    const clearButton = document.querySelector<HTMLElement>('.ant-select-clear');
    expect(clearButton).not.toBeNull();
    if (!clearButton) {
      throw new Error('Storage clear action is missing');
    }
    fireEvent.mouseDown(clearButton);
    fireEvent.click(clearButton);
    await waitFor(() => expect(formInstance?.getFieldValue('storage')).toBeNull());
  });
});
