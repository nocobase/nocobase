/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, type FormInstance } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  compileFileCollectionTitle,
  FileCollectionSelect,
  normalizeFileCollectionResponse,
} from '../FileCollectionSelect';

const fileCollectionsResponse = {
  data: {
    data: [
      { name: 'attachments', title: '{{t("Attachment", { ns: "file-manager" })}}' },
      { name: 'publicFiles', title: 'Public files' },
    ],
  },
};
const apiRequest = vi.fn(() => Promise.resolve(fileCollectionsResponse));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        request: apiRequest,
      },
    }),
    useFlowEngine: () => ({
      context: {
        t: (key: string, options?: { ns?: string | string[] }) => {
          if (key === 'Attachment' && options?.ns === 'file-manager') {
            return '附件';
          }
          if (key === 'External files' && options?.ns === 'plugin-files') {
            return '外部文件';
          }
          return key;
        },
      },
    }),
  };
});

function TestForm(props: {
  initialTarget?: string;
  onFormReady?: (form: FormInstance) => void;
  onValuesChange?: (changedValues: Record<string, unknown>, values: Record<string, unknown>) => void;
}) {
  const [form] = Form.useForm();
  props.onFormReady?.(form);
  return (
    <Form form={form} initialValues={{ target: props.initialTarget }} onValuesChange={props.onValuesChange}>
      <FileCollectionSelect
        name="target"
        namePath={['target']}
        schema={{ required: true }}
        context={{}}
        fieldInterface={{}}
        title="上传到文件表"
      />
    </Form>
  );
}

describe('FileCollectionSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue(fileCollectionsResponse);
  });

  it('normalizes list responses', () => {
    expect(normalizeFileCollectionResponse({ data: { data: [{ name: 'attachments' }] } })).toEqual([
      { name: 'attachments' },
    ]);
    expect(normalizeFileCollectionResponse({ data: [{ name: 'files' }] })).toEqual([{ name: 'files' }]);
    expect(normalizeFileCollectionResponse(undefined)).toEqual([]);
  });

  it('preserves translation namespace options in file collection titles', () => {
    const t = vi.fn((key: string, options?: Record<string, unknown>) => `${key}:${String(options?.ns || '')}`);

    expect(compileFileCollectionTitle('{{t("External files", { ns: "plugin-files" })}}', t)).toBe(
      'External files:plugin-files',
    );
    expect(t).toHaveBeenCalledWith('External files', { ns: 'plugin-files' });
  });

  it('loads file collections and selects an option', async () => {
    const onValuesChange = vi.fn();
    render(<TestForm onValuesChange={onValuesChange} />);

    expect(screen.getByText('上传到文件表')).toBeTruthy();

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith({
        url: 'collections:listFileCollections',
        params: {
          paginate: false,
        },
      }),
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Public files'));
    expect(onValuesChange).toHaveBeenCalledWith({ target: 'publicFiles' }, { target: 'publicFiles' });
  });

  it('defaults to attachments only after the endpoint returns it', async () => {
    let form: FormInstance | undefined;
    render(<TestForm onFormReady={(instance) => (form = instance)} />);

    await waitFor(() => expect(form?.getFieldValue('target')).toBe('attachments'));
  });

  it('leaves the target empty when attachments is not returned by the endpoint', async () => {
    apiRequest.mockResolvedValueOnce({
      data: {
        data: [{ name: 'publicFiles', title: 'Public files' }],
      },
    });
    let form: FormInstance | undefined;
    render(<TestForm onFormReady={(instance) => (form = instance)} />);

    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
    expect(form?.getFieldValue('target')).toBeUndefined();
  });

  it('keeps an existing target when it is not returned by the endpoint', async () => {
    apiRequest.mockResolvedValueOnce({
      data: {
        data: [{ name: 'publicFiles', title: 'Public files' }],
      },
    });
    let form: FormInstance | undefined;
    render(<TestForm initialTarget="attachments" onFormReady={(instance) => (form = instance)} />);

    await waitFor(() => expect(form?.getFieldValue('target')).toBe('attachments'));
  });
});
