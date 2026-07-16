/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Expression } from '../components/Expression';

type SlateVariableEditorProps = {
  metaTree: () => Promise<any[]>;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

const mocks = vi.hoisted(() => ({
  editorProps: undefined as SlateVariableEditorProps | undefined,
  field: {
    setValue: vi.fn(),
  } as {
    setValue?: ReturnType<typeof vi.fn>;
  },
  flowContext: {
    t: vi.fn((key: string) => `t:${key}`),
  },
  flowEngine: {
    context: {
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
                    value: 'title',
                    label: 'Title',
                    children: [
                      {
                        key: 'subTitle',
                        title: 'Sub title',
                      },
                    ],
                  },
                  {
                    value: 'nested',
                    label: 'Nested',
                    children: async () => [
                      {
                        value: 'name',
                        label: 'Name',
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
        expressionFields: ['input', 'association'],
      },
    },
  },
}));

vi.mock('@formily/react', () => ({
  useField: () => mocks.field,
}));

vi.mock('@nocobase/flow-engine', async () => {
  const ReactModule = await import('react');
  return {
    SlateVariableEditor: (props: SlateVariableEditorProps) => {
      mocks.editorProps = props;
      return ReactModule.createElement(
        'button',
        {
          type: 'button',
          onClick: () => props.onChange('total + 1'),
        },
        props.placeholder,
      );
    },
    useFlowContext: () => mocks.flowContext,
    useFlowEngine: () => mocks.flowEngine,
  };
});

describe('Expression', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.editorProps = undefined;
    mocks.field = {
      setValue: vi.fn(),
    };
  });

  it('filters current fields by registered expression interfaces and maps path options', async () => {
    render(
      <Expression
        value="amount"
        useCurrentFields={() => [
          {
            name: 'amount',
            interface: 'input',
            uiSchema: {
              title: 'Amount',
            },
          },
          {
            name: 'customer',
            interface: 'association',
            uiSchema: {
              title: 'Customer',
            },
          },
          {
            name: 'ignored',
            interface: 'markdown',
          },
        ]}
      />,
    );

    const nodes = await mocks.editorProps?.metaTree();

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
            name: 'title',
            paths: ['customer', 'title'],
            parentTitles: ['Customer'],
            children: [
              expect.objectContaining({
                name: 'subTitle',
                paths: ['customer', 'title', 'subTitle'],
                parentTitles: ['Customer', 'Title'],
              }),
            ],
          }),
          expect.objectContaining({
            name: 'nested',
            children: expect.any(Function),
          }),
        ],
      }),
    ]);

    const nestedChildren = await (nodes?.[1].children[1].children as () => Promise<any[]>)();
    expect(nestedChildren).toEqual([
      expect.objectContaining({
        name: 'name',
        paths: ['customer', 'nested', 'name'],
        parentTitles: ['Customer', 'Nested'],
      }),
    ]);
  });

  it('updates formily field value when the expression changes', () => {
    const onChange = vi.fn();

    render(<Expression value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('t:Input text, use {{ to insert variables'));

    expect(onChange).toHaveBeenCalledWith('total + 1');
    expect(mocks.field.setValue).toHaveBeenCalledWith('total + 1');
  });

  it('does not require a formily setValue handler', () => {
    const onChange = vi.fn();
    mocks.field = {};

    render(<Expression value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('t:Input text, use {{ to insert variables'));

    expect(onChange).toHaveBeenCalledWith('total + 1');
  });

  it('falls back to an empty meta tree when current fields cannot be resolved', async () => {
    render(
      <Expression
        useCurrentFields={() => {
          throw new Error('failed');
        }}
      />,
    );

    await expect(mocks.editorProps?.metaTree()).resolves.toEqual([]);
  });

  it('ignores non-array current field results', async () => {
    render(<Expression useCurrentFields={() => 'not fields'} />);

    await expect(mocks.editorProps?.metaTree()).resolves.toEqual([]);
  });
});
