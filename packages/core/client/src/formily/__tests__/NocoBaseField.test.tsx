/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, SchemaContext } from '@formily/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { NocoBaseField, resolveLightweightFieldValue } from '../NocoBaseField';
import { setLightweightFormValue } from '../createNocoBaseField';

const ValueViewer = (props: any) => <span data-testid="value">{String(props.value)}</span>;

const schema = new Schema({
  type: 'string',
  default: 'DEFAULT',
  'x-component': ValueViewer,
});

function renderField(props: Record<string, any>) {
  return render(
    <SchemaContext.Provider value={schema}>
      <NocoBaseField schema={schema} {...props} />
    </SchemaContext.Provider>,
  );
}

describe('NocoBaseField', () => {
  it('updates rendered value when props.value changes', () => {
    const { rerender } = renderField({ value: 'A', record: { id: 1 } });

    expect(screen.getByTestId('value').textContent).toBe('A');

    rerender(
      <SchemaContext.Provider value={schema}>
        <NocoBaseField schema={schema} value="B" record={{ id: 1 }} />
      </SchemaContext.Provider>,
    );

    expect(screen.getByTestId('value').textContent).toBe('B');
  });

  it('only uses schema default for new rows with undefined values', () => {
    const { rerender } = renderField({ value: undefined, record: { __is_new__: true } });

    expect(screen.getByTestId('value').textContent).toBe('DEFAULT');

    rerender(
      <SchemaContext.Provider value={schema}>
        <NocoBaseField schema={schema} value={undefined} record={{ id: 1 }} />
      </SchemaContext.Provider>,
    );

    expect(screen.getByTestId('value').textContent).toBe('undefined');

    rerender(
      <SchemaContext.Provider value={schema}>
        <NocoBaseField schema={schema} value={null} record={{ __is_new__: true }} />
      </SchemaContext.Provider>,
    );

    expect(screen.getByTestId('value').textContent).toBe('null');
  });
});

describe('lightweight field helpers', () => {
  it('keeps explicit null values instead of falling back to schema default', () => {
    expect(resolveLightweightFieldValue({ value: null, schemaDefault: 'DEFAULT', record: { __is_new__: true } })).toBe(
      null,
    );
  });

  it('writes array name paths into nested objects', () => {
    const values = {
      items: [{ total: null }],
    };

    setLightweightFormValue(values, ['items', 0, 'total'], 5);

    expect(values.items[0].total).toBe(5);
    expect((values as any)['items,0,total']).toBeUndefined();
  });
});
