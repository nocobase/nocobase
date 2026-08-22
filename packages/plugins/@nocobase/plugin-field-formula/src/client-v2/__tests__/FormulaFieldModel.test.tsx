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
import { dayjs } from '@nocobase/utils/client';

import { FormulaFieldModel, FormulaResult } from '../models/FormulaFieldModel';

vi.mock('@nocobase/client-v2', () => ({
  FieldModel: class FieldModel {
    static registerFlow = vi.fn();
  },
  getDisplayNumber: ({ value }: any) => {
    if (value == null) return '';
    return String(value);
  },
  resolveDynamicNamePath: (path: string | Array<string | number>, fieldIndex?: unknown) => {
    const segs = Array.isArray(path) ? path : String(path).split('.').filter(Boolean);
    const entries = (Array.isArray(fieldIndex) ? fieldIndex : [])
      .map((item) => {
        const [name, indexStr] = String(item).split(':');
        const index = Number(indexStr);
        return name && !Number.isNaN(index) ? { name, index } : null;
      })
      .filter(Boolean) as Array<{ name: string; index: number }>;
    const resolved: Array<string | number> = [];
    let idxPtr = 0;

    for (const seg of segs) {
      resolved.push(seg);
      if (typeof seg === 'string' && entries[idxPtr]?.name === seg) {
        resolved.push(entries[idxPtr].index);
        idxPtr++;
      }
    }

    return resolved;
  },
}));

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    get: () => ({
      evaluate: (expression: string, scope: Record<string, any>) => {
        if (expression === 'throws') {
          throw new Error('failed');
        }
        return scope?.[expression];
      },
    }),
  },
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  class MockDisplayItemModel extends actual.DisplayItemModel {
    static bindModelToInterface = vi.fn();
  }
  class MockEditableItemModel extends actual.EditableItemModel {
    static bindModelToInterface = vi.fn();
  }
  class MockFilterableItemModel extends actual.FilterableItemModel {
    static bindModelToInterface = vi.fn();
  }
  return {
    ...actual,
    DisplayItemModel: MockDisplayItemModel,
    EditableItemModel: MockEditableItemModel,
    FilterableItemModel: MockFilterableItemModel,
  };
});

vi.mock('../locale', () => ({
  tExpr: (value: string) => value,
}));

const collectionField = {
  options: {
    dataType: 'integer',
    engine: 'math.js',
    expression: 'number',
  },
};

function FormulaHarness({ onForm }: { onForm: (form: any) => void }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    onForm(form);
  }, [form, onForm]);

  return (
    <Form
      form={form}
      initialValues={{
        o2m_orders: [
          {
            number: 100,
            formula: 100,
          },
        ],
      }}
    >
      <Form.Item hidden name={['o2m_orders', 0, 'number']}>
        <input />
      </Form.Item>
      <Form.Item hidden name={['o2m_orders', 0, 'formula']}>
        <input />
      </Form.Item>
      <FormulaResult
        value={100}
        collectionField={collectionField}
        form={form}
        id={['o2m_orders', 0]}
        context={{
          fieldPath: 'o2m_orders.formula',
          fieldIndex: ['o2m_orders:0'],
        }}
      />
    </Form>
  );
}

function DateFormulaHarness({ onSetFieldValueSpy }: { onSetFieldValueSpy: (spy: any) => void }) {
  const [form] = Form.useForm();
  const setFieldValueSpyRef = React.useRef<any>();
  const dateValue = dayjs('2026-06-03 00:00:00');

  if (!setFieldValueSpyRef.current) {
    setFieldValueSpyRef.current = vi.spyOn(form, 'setFieldValue');
    onSetFieldValueSpy(setFieldValueSpyRef.current);
  }

  return (
    <Form
      form={form}
      initialValues={{
        date: '2026-06-03 00:00:00',
        formula: dateValue,
      }}
    >
      <Form.Item hidden name="date">
        <input />
      </Form.Item>
      <Form.Item hidden name="formula" getValueProps={() => ({ value: '' })}>
        <input />
      </Form.Item>
      <FormulaResult
        value={dateValue}
        collectionField={{
          options: {
            dataType: 'date',
            engine: 'math.js',
            expression: 'date',
          },
        }}
        form={form}
        id={['formula']}
      />
    </Form>
  );
}

function DateFormulaScopeHarness({ onForm }: { onForm: (form: any) => void }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    onForm(form);
  }, [form, onForm]);

  return (
    <Form
      form={form}
      initialValues={{
        date: '2026-06-03 00:00:00',
        formula: dayjs('2026-05-01 00:00:00'),
      }}
    >
      <Form.Item hidden name="date">
        <input />
      </Form.Item>
      <Form.Item hidden name="formula" getValueProps={() => ({ value: '' })}>
        <input />
      </Form.Item>
      <FormulaResult
        value={dayjs('2026-05-01 00:00:00')}
        collectionField={{
          options: {
            dataType: 'date',
            engine: 'math.js',
            expression: 'date',
          },
        }}
        form={form}
        id={['formula']}
      />
    </Form>
  );
}

describe('FormulaFieldModel', () => {
  it('renders through the model context', () => {
    const model = Object.create(FormulaFieldModel.prototype) as FormulaFieldModel;
    (model as any).props = {
      value: 'from model',
    };
    (model as any).context = {
      collectionField: {
        options: {
          dataType: 'string',
        },
      },
      form: {
        readPretty: true,
      },
    };

    render(model.render());

    expect(screen.getByText('from model')).toBeInTheDocument();
  });

  it('renders nothing without collection field metadata', () => {
    const { container } = render(<FormulaResult value="ignored" form={{ readPretty: true }} />);

    expect(container.textContent).toBe('');
  });

  it('does not write back when the calculated value is already current', async () => {
    const setFieldValue = vi.fn();

    render(
      <FormulaResult
        value={0}
        collectionField={{
          options: {
            dataType: 'integer',
            engine: 'math.js',
            expression: 'total',
          },
        }}
        form={{
          values: {
            total: 10,
          },
          getFieldValue: () => 10,
          setFieldValue,
        }}
        id="formula"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve));
    expect(setFieldValue).not.toHaveBeenCalled();
  });

  it('calculates scope from dotted id paths', async () => {
    const setFieldValue = vi.fn();

    render(
      <FormulaResult
        value={0}
        collectionField={{
          options: {
            dataType: 'integer',
            engine: 'math.js',
            expression: 'total',
          },
        }}
        form={{
          values: {
            items: [
              {
                total: 12,
                formula: 0,
              },
            ],
          },
          setFieldValue,
        }}
        id="items.0.formula"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(setFieldValue).toHaveBeenCalledWith(['items', 0, 'formula'], 12);
    });
  });

  it('falls back to root values when a parent path points to a primitive value', async () => {
    render(
      <FormulaResult
        value={0}
        collectionField={{
          options: {
            dataType: 'integer',
            engine: 'math.js',
            expression: 'total',
          },
        }}
        form={{
          values: {
            total: 10,
          },
        }}
        id="total.formula"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('falls back to null when formula evaluation fails', async () => {
    const { container } = render(
      <FormulaResult
        value={1}
        collectionField={{
          options: {
            dataType: 'integer',
            engine: 'math.js',
            expression: 'throws',
          },
        }}
        form={{
          values: {},
        }}
        id="formula"
      />,
    );

    await waitFor(() => {
      expect(container.textContent).toBe('');
    });
  });

  it('renders editable values in filter and default-value contexts', async () => {
    const onChange = vi.fn();
    const filterForm = {
      props: {
        'x-flag': {
          isInFilterFormBlock: true,
        },
      },
    };
    const { rerender } = render(
      <FormulaResult
        value={true}
        collectionField={{
          options: {
            dataType: 'boolean',
          },
        }}
        form={filterForm}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(
      <FormulaResult
        value={12}
        collectionField={{
          options: {
            dataType: 'double',
          },
        }}
        form={filterForm}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('spinbutton')).toHaveValue('12');

    rerender(
      <FormulaResult
        value="hello"
        collectionField={{
          options: {
            dataType: 'string',
          },
        }}
        form={filterForm}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('hello');

    rerender(
      <FormulaResult
        value="2026-06-03"
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInSetDefaultValueDialog: true,
            },
          },
        }}
        dateOnly
      />,
    );
    expect(screen.getByDisplayValue('2026-06-03')).toBeInTheDocument();
  });

  it('renders read-pretty formula values by data type', () => {
    const readPrettyForm = {
      readPretty: true,
    };
    const { rerender, container } = render(
      <FormulaResult
        value={false}
        collectionField={{
          options: {
            dataType: 'boolean',
          },
        }}
        form={readPrettyForm}
        showUnchecked
      />,
    );

    expect(container.querySelector('svg')).toBeTruthy();

    rerender(
      <FormulaResult
        value={123}
        collectionField={{
          options: {
            dataType: 'integer',
          },
        }}
        form={readPrettyForm}
        addonBefore="$"
        addonAfter="USD"
      />,
    );
    expect(container.textContent).toContain('$');
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(container.textContent).toContain('USD');

    rerender(
      <FormulaResult
        value="2026-06-03"
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(screen.getByText('2026-06-03')).toBeInTheDocument();

    rerender(
      <FormulaResult
        value="plain text"
        collectionField={{
          options: {
            dataType: 'string',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(screen.getByText('plain text')).toBeInTheDocument();

    rerender(
      <FormulaResult
        value={true}
        collectionField={{
          options: {
            dataType: 'boolean',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(container.querySelector('svg')).toBeTruthy();

    rerender(
      <FormulaResult
        value="not-a-date"
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(screen.getByText('not-a-date')).toBeInTheDocument();

    rerender(
      <FormulaResult
        value=""
        collectionField={{
          options: {
            dataType: 'string',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(container.textContent).toBe('');

    rerender(
      <FormulaResult
        value={null}
        collectionField={{
          options: {
            dataType: 'integer',
          },
        }}
        form={readPrettyForm}
      />,
    );
    expect(container.textContent).toBe('');
  });

  it('does not subscribe to form changes when rendering editable date values', () => {
    const useWatchSpy = vi.spyOn(Form, 'useWatch');
    useWatchSpy.mockClear();

    render(
      <FormulaResult
        value={null}
        collectionField={{
          options: {
            dataType: 'date',
          },
        }}
        form={{
          props: {
            'x-flag': {
              isInSetDefaultValueDialog: true,
            },
          },
        }}
      />,
    );

    expect(useWatchSpy).not.toHaveBeenCalled();
    useWatchSpy.mockRestore();
  });

  it('does not write back equivalent dayjs and Date values', async () => {
    let setFieldValueSpy: any;

    render(<DateFormulaHarness onSetFieldValueSpy={(spy) => (setFieldValueSpy = spy)} />);

    await waitFor(() => {
      expect(setFieldValueSpy).toHaveBeenCalledTimes(0);
    });
  });

  it('uses the parent form values as scope for date formula fields', async () => {
    let formRef: any;

    render(<DateFormulaScopeHarness onForm={(form) => (formRef = form)} />);

    await waitFor(() => {
      expect(screen.getByText('2026-06-03')).toBeInTheDocument();
      expect(new Date(formRef.getFieldValue('formula')).getTime()).toBe(new Date('2026-06-03 00:00:00').getTime());
    });
  });

  it('recalculates with the current sub-table row scope when a sibling field changes', async () => {
    let formRef: any;

    render(<FormulaHarness onForm={(form) => (formRef = form)} />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    act(() => {
      formRef.setFieldValue(['o2m_orders', 0, 'number'], 111111);
    });

    await waitFor(() => {
      expect(screen.getByText('111111')).toBeInTheDocument();
      expect(formRef.getFieldValue(['o2m_orders', 0, 'formula'])).toBe(111111);
    });
  });
});
