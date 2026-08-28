/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import ActionTriggerConfig from '../ActionTriggerConfig';

const appendsSelectState = vi.hoisted(() => ({
  propsList: [] as Array<{
    collection?: string;
    value?: string[];
  }>,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  AppendsSelect: (props: { collection?: string; value?: string[] }) => {
    appendsSelectState.propsList.push(props);
    return <div data-testid="appends-select">{JSON.stringify(props.value ?? [])}</div>;
  },
  CollectionCascader: () => <div data-testid="collection-cascader" />,
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../ActionTrigger', () => ({
  COLLECTION_TRIGGER_ACTION: {
    CREATE: 'create',
    UPDATE: 'update',
  },
}));

function LazyConfigForm() {
  const [form] = Form.useForm();

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      form.setFieldsValue({
        config: {
          collection: 'posts',
          appends: ['createdBy'],
          global: false,
        },
      });
    });

    return () => window.clearTimeout(timer);
  }, [form]);

  return (
    <Form form={form}>
      <ActionTriggerConfig />
    </Form>
  );
}

describe('ActionTriggerConfig', () => {
  it('keeps hydrated appends when the saved collection value is loaded after mount', async () => {
    appendsSelectState.propsList = [];

    render(<LazyConfigForm />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve));
    });

    await waitFor(() => {
      expect(screen.getByTestId('appends-select')).toHaveTextContent('["createdBy"]');
    });
    expect(appendsSelectState.propsList.at(-1)).toMatchObject({
      collection: 'posts',
      value: ['createdBy'],
    });
  });
});
