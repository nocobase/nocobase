/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForeignKeyConfigureField } from '../components/ForeignKeyConfigureField';

type SelectLikeProps = {
  disabled?: boolean;
  options?: Array<{
    label: React.ReactNode;
    value: string;
  }>;
  placeholder?: string;
  showSearch?: boolean;
};

const mocks = vi.hoisted(() => ({
  autoCompleteProps: [] as SelectLikeProps[],
  selectProps: [] as SelectLikeProps[],
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    AutoComplete: (props: SelectLikeProps) => {
      mocks.autoCompleteProps.push(props);
      return ReactModule.createElement('div', { 'data-testid': 'foreign-key-autocomplete' });
    },
    Select: (props: SelectLikeProps) => {
      mocks.selectProps.push(props);
      return ReactModule.createElement('div', { 'data-testid': 'foreign-key-select' });
    },
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowEngine: () => ({
      context: {
        t: (key: string) => `t:${key}`,
      },
    }),
  };
});

const collection = {
  fields: [
    {
      name: 'json_array',
      interface: 'json',
      type: 'array',
      uiSchema: {
        title: '{{ t("JSON array") }}',
      },
    },
    {
      name: 'json_set',
      interface: 'json',
      type: 'set',
      title: 'JSON set',
    },
    {
      name: 'plain_array',
      interface: 'input',
      type: 'array',
      title: 'Plain array',
    },
    {
      name: 'json_object',
      interface: 'json',
      type: 'object',
      title: 'JSON object',
    },
  ],
};

function FieldHarness({
  template,
  disabled,
  componentProps,
  withCollection = true,
}: {
  componentProps?: SelectLikeProps;
  disabled?: boolean;
  template?: string;
  withCollection?: boolean;
}) {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{
        template,
      }}
    >
      <Form.Item hidden name="template">
        <input />
      </Form.Item>
      <ForeignKeyConfigureField
        form={form}
        namePath={['foreignKey']}
        title="Foreign key"
        tooltip="Select json array field"
        schema={{
          required: true,
        }}
        disabled={disabled}
        componentProps={componentProps}
        collection={withCollection ? collection : undefined}
      />
    </Form>
  );
}

describe('ForeignKeyConfigureField', () => {
  afterEach(() => {
    cleanup();
    mocks.autoCompleteProps = [];
    mocks.selectProps = [];
  });

  it('uses AutoComplete for normal collections and lists only json array fields', () => {
    render(<FieldHarness disabled componentProps={{ placeholder: 'Choose foreign key' }} />);

    expect(screen.getByTestId('foreign-key-autocomplete')).toBeTruthy();
    expect(mocks.autoCompleteProps.at(-1)).toMatchObject({
      disabled: true,
      placeholder: 'Choose foreign key',
      showSearch: true,
      options: [
        {
          value: 'json_array',
          label: 't:JSON array',
        },
        {
          value: 'json_set',
          label: 'JSON set',
        },
      ],
    });
  });

  it('uses Select for view collections', () => {
    render(<FieldHarness template="view" />);

    expect(screen.getByTestId('foreign-key-select')).toBeTruthy();
    expect(mocks.selectProps.at(-1)?.options?.map((option) => option.value)).toEqual(['json_array', 'json_set']);
  });

  it('handles missing collection fields', () => {
    render(<FieldHarness withCollection={false} />);

    expect(mocks.autoCompleteProps.at(-1)?.options).toEqual([]);
  });
});
