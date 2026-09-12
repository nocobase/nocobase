/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormulaExpressionConfigureField } from '../components/FormulaExpressionConfigureField';

type VariableHybridInputProps = {
  converters: {
    formatPathToValue: (meta: { paths?: string[] }) => string | undefined;
    parseValueToPath: (value: string) => string[] | undefined;
  };
  metaTree: () => Promise<any[]>;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

const mocks = vi.hoisted(() => ({
  inputProps: undefined as VariableHybridInputProps | undefined,
  flowContext: {
    dataSourceManager: {
      collectionFieldInterfaceManager: {
        getFieldInterface: vi.fn((name: string) => {
          if (name === 'association') {
            return {
              usePathOptions: () => [
                {
                  label: 'Ignored',
                },
                {
                  value: 'name',
                  label: 'Name',
                  children: [
                    {
                      key: 'first',
                      title: 'First name',
                    },
                  ],
                },
              ],
            };
          }
          return {};
        }),
      },
    },
    fieldFormula: {
      expressionFields: ['input', 'number', 'association'],
    },
    t: vi.fn((key: string) => `t:${key}`),
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  const ReactModule = await import('react');
  return {
    ...actual,
    useFlowContext: () => mocks.flowContext,
    VariableHybridInput: (props: VariableHybridInputProps) => {
      mocks.inputProps = props;
      return ReactModule.createElement('input', {
        'aria-label': 'formula-expression',
        value: props.value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => props.onChange(event.target.value),
      });
    },
  };
});

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    get: (name: string) =>
      name === 'formula.js'
        ? {
            label: 'Formula.js',
            link: 'https://example.com/formula',
          }
        : undefined,
  },
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => `t:${key}`,
}));

function ConfigureFieldHarness() {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{
        engine: 'formula.js',
        name: 'formula',
      }}
    >
      <Form.Item hidden name="engine">
        <input />
      </Form.Item>
      <Form.Item hidden name="name">
        <input />
      </Form.Item>
      <FormulaExpressionConfigureField
        form={form}
        namePath={['options', 'expression']}
        title="Expression"
        schema={{
          required: true,
        }}
        collection={{
          fields: [
            {
              name: 'formula',
              interface: 'input',
            },
            {
              name: 'amount',
              interface: 'number',
              uiSchema: {
                title: 'Amount',
              },
            },
            {
              name: 'amount_id',
              interface: 'input',
            },
            {
              name: 'customer',
              interface: 'association',
              foreignKey: 'amount_id',
              uiSchema: {
                title: 'Customer',
              },
            },
            {
              name: 'ignored',
              interface: 'markdown',
            },
          ],
        }}
      />
    </Form>
  );
}

function ConfigureFieldWithoutReferenceHarness() {
  const [form] = Form.useForm();
  return (
    <Form
      form={form}
      initialValues={{
        engine: 'unknown',
        name: 'formula',
      }}
    >
      <Form.Item hidden name="engine">
        <input />
      </Form.Item>
      <FormulaExpressionConfigureField
        form={form}
        namePath={['options', 'expression']}
        title="Expression"
        schema={{}}
        collection={{
          fields: [],
        }}
      />
    </Form>
  );
}

describe('FormulaExpressionConfigureField', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.inputProps = undefined;
  });

  it('renders syntax reference and passes filtered variable meta tree to the expression editor', async () => {
    render(<ConfigureFieldHarness />);

    expect(
      screen.getAllByText((_, element) => element?.textContent?.includes('t:Syntax references') ?? false).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Formula.js' })).toHaveAttribute('href', 't:https://example.com/formula');
    expect(mocks.inputProps?.converters.formatPathToValue({ paths: ['amount'] })).toBe('{{amount}}');
    expect(mocks.inputProps?.converters.parseValueToPath('{{ customer.name }}')).toEqual(['customer', 'name']);
    expect(mocks.inputProps?.converters.parseValueToPath('customer.name')).toBeUndefined();

    const nodes = await mocks.inputProps?.metaTree();

    expect(nodes).toEqual([
      expect.objectContaining({
        name: 'amount',
        title: 'Amount',
        paths: ['amount'],
      }),
      expect.objectContaining({
        name: 'customer',
        title: 'Customer',
        paths: ['customer'],
        children: [
          expect.objectContaining({
            name: 'name',
            paths: ['customer', 'name'],
            parentTitles: ['Customer'],
            children: [
              expect.objectContaining({
                name: 'first',
                paths: ['customer', 'name', 'first'],
                parentTitles: ['Customer', 'Name'],
              }),
            ],
          }),
        ],
      }),
    ]);

    fireEvent.change(screen.getByLabelText('formula-expression'), {
      target: {
        value: '{{amount}}',
      },
    });
  });

  it('omits the syntax reference when the selected engine has no link', () => {
    render(<ConfigureFieldWithoutReferenceHarness />);

    expect(
      screen.queryByText((_, element) => element?.textContent?.includes('t:Syntax references') ?? false),
    ).toBeNull();
  });
});
