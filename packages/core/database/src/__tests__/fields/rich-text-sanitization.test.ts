/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonField, Model, StringField, TextField } from '@nocobase/database';
import { vi } from 'vitest';

const fieldContext = {
  collection: {},
  database: {
    inDialect: () => false,
    sequelize: {
      getDialect: () => 'sqlite',
      normalizeDataType: (dataType: unknown) => dataType,
    },
  },
};

function setFieldValue(field: JsonField | StringField | TextField, value: unknown) {
  const setDataValue = vi.fn();
  field.toSequelize().set.call({ getDataValue: vi.fn(), setDataValue }, value);
  return setDataValue;
}

function callFieldSetter(field: JsonField | StringField | TextField, value: unknown) {
  return Model.callSetters.call({ collection: { getField: () => field } }, { content: value }, {}).content;
}

describe('rich text field sanitization', () => {
  it.each([JsonField, StringField, TextField])('sanitizes %s values', (FieldClass) => {
    const field = new FieldClass({ type: 'text', name: 'content', interface: 'richText' }, fieldContext as never);

    const setDataValue = setFieldValue(field, '<p>safe</p><img src=x onerror="alert(1)">');

    expect(setDataValue).toHaveBeenCalledWith('content', '<p>safe</p><img src="x" />');
    expect(callFieldSetter(field, '<script>alert(1)</script><strong>safe</strong>')).toBe('<strong>safe</strong>');
  });

  it('does not affect ordinary fields', () => {
    const field = new TextField({ type: 'text', name: 'content' }, fieldContext as never);
    const value = '<img src=x onerror="alert(1)">';

    expect(setFieldValue(field, value)).toHaveBeenCalledWith('content', value);
    expect(callFieldSetter(field, value)).toBe(value);
  });

  it('preserves custom setters and sanitizes their output', () => {
    const values = new Map<string, unknown>();
    const field = new JsonField(
      {
        type: 'json',
        name: 'content',
        interface: 'richText',
        set(this: { setDataValue: (name: string, value: unknown) => void }, value: string) {
          this.setDataValue('content', `${value}<script>alert(1)</script>`);
        },
      },
      fieldContext as never,
    );
    const model = {
      getDataValue: (name: string) => values.get(name),
      setDataValue: (name: string, value: unknown) => values.set(name, value),
    };

    field.toSequelize().set.call(model, '<p>safe</p><img src=x onerror="alert(1)">');

    expect(values.get('content')).toBe('<p>safe</p><img src="x" />');
  });
});
