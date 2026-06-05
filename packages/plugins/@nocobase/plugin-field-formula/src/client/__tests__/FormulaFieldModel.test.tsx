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

import { FormulaResult } from '../FormulaFieldModel';

vi.mock('@nocobase/client', () => {
  const ReadPretty = ({ value }: any) => <span data-testid="formula-value">{value == null ? '' : String(value)}</span>;
  const Editable = ({ value, onChange }: any) => (
    <input data-testid="formula-input" value={value ?? ''} onChange={(event) => onChange?.(event)} />
  );
  const resolveDynamicNamePath = (path: string | Array<string | number>, fieldIndex?: unknown) => {
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
  };

  return {
    Checkbox: Object.assign(Editable, { ReadPretty }),
    DatePicker: Object.assign(Editable, { ReadPretty }),
    FieldModel: class FieldModel {
      static registerFlow = vi.fn();
    },
    Input: Object.assign(Editable, { ReadPretty }),
    InputNumber: Object.assign(Editable, { ReadPretty }),
    resolveDynamicNamePath,
  };
});

vi.mock('@nocobase/evaluators/client', () => ({
  evaluators: {
    get: () => ({
      evaluate: (expression: string, scope: Record<string, any>) => scope?.[expression],
    }),
  },
}));

vi.mock('@nocobase/flow-engine', () => {
  const bindModelToInterface = vi.fn();
  return {
    DisplayItemModel: { bindModelToInterface },
    EditableItemModel: { bindModelToInterface },
    FilterableItemModel: { bindModelToInterface },
    tExpr: (value: string) => value,
  };
});

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

describe('FormulaFieldModel', () => {
  it('recalculates with the current sub-table row scope when a sibling field changes', async () => {
    let formRef: any;

    render(<FormulaHarness onForm={(form) => (formRef = form)} />);

    await waitFor(() => {
      expect(screen.getByTestId('formula-value')).toHaveTextContent('100');
    });

    act(() => {
      formRef.setFieldValue(['o2m_orders', 0, 'number'], 111111);
    });

    await waitFor(() => {
      expect(screen.getByTestId('formula-value')).toHaveTextContent('111111');
      expect(formRef.getFieldValue(['o2m_orders', 0, 'formula'])).toBe(111111);
    });
  });
});
