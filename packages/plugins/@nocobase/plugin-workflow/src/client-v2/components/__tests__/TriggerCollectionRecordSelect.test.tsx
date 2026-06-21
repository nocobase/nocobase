/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { TriggerCollectionRecordSelect } from '../collection';

const remoteSelectState = vi.hoisted(() => ({
  props: null as null | {
    value?: unknown;
    onChange?: (value?: unknown) => void;
    request: () => Promise<any[]>;
    onLoaded?: (items: any[]) => void;
    mapOptions: (item: any, index: number) => { label: React.ReactNode; value: any };
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  RemoteSelect: (props: any) => {
    remoteSelectState.props = props;
    return <div data-testid="remote-select" />;
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      dataSourceManager: {
        getDataSource: () => ({
          collectionManager: {
            getCollection: () => ({
              filterTargetKey: 'name',
              titleCollectionField: { name: 'title' },
            }),
          },
        }),
      },
      api: {
        resource: () => ({
          list: async () => ({
            data: {
              data: [
                { name: 'admin', title: '{{t("Admin")}}' },
                { name: 'root', title: '{{t("Root")}}' },
              ],
            },
          }),
        }),
      },
    },
  }),
}));

vi.mock('../../canvas/contexts', () => ({
  useCurrentWorkflowContext: () => ({
    config: { collection: 'roles' },
  }),
}));

vi.mock('../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => {
    const matched = key.match(/^{{t\("(.+)"\)}}$/);
    return matched?.[1] ?? key;
  },
}));

describe('TriggerCollectionRecordSelect', () => {
  it('compiles server-returned title templates before rendering remote select options', async () => {
    render(<TriggerCollectionRecordSelect />);

    expect(screen.getByTestId('remote-select')).toBeInTheDocument();

    const items = await remoteSelectState.props?.request();
    const options = items?.map((item, index) => remoteSelectState.props?.mapOptions(item, index));

    expect(options).toEqual([
      { label: 'Admin', value: 'admin' },
      { label: 'Root', value: 'root' },
    ]);
  });

  it('stores the full selected record instead of only its primary key', async () => {
    const onChange = vi.fn();
    render(<TriggerCollectionRecordSelect onChange={onChange} />);

    const items = await remoteSelectState.props?.request();
    remoteSelectState.props?.onLoaded?.(items ?? []);
    remoteSelectState.props?.onChange?.('admin');

    expect(onChange).toHaveBeenCalledWith({
      name: 'admin',
      title: '{{t("Admin")}}',
    });
  });

  it('converts an object-form value back to the primary key for select display', () => {
    render(<TriggerCollectionRecordSelect value={{ name: 'admin', title: '{{t("Admin")}}' }} />);

    expect(remoteSelectState.props?.value).toBe('admin');
  });

  it('writes the full selected record into the parent form field value', async () => {
    let formInstance: ReturnType<typeof Form.useForm>[0] | null = null;

    function Wrapper() {
      const [form] = Form.useForm();
      formInstance = form;

      return (
        <Form form={form} initialValues={{ data: null }}>
          <Form.Item name="data">
            <TriggerCollectionRecordSelect />
          </Form.Item>
        </Form>
      );
    }

    render(<Wrapper />);

    const items = await remoteSelectState.props?.request();
    await act(async () => {
      remoteSelectState.props?.onLoaded?.(items ?? []);
      remoteSelectState.props?.onChange?.('admin');
    });

    await waitFor(() => {
      expect(formInstance?.getFieldValue('data')).toEqual({
        name: 'admin',
        title: '{{t("Admin")}}',
      });
    });
  });
});
