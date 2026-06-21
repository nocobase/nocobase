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

import { FormulaResult } from '../models/FormulaFieldModel';

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
      evaluate: (expression: string, scope: Record<string, any>) => scope?.[expression],
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
