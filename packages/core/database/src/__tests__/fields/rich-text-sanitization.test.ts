/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonField, StringField, TextField } from '@nocobase/database';
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
  const attribute = field.additionalSequelizeOptions();
  attribute.set.call({ setDataValue }, value);
  return setDataValue;
}

describe('rich text field sanitization', () => {
  it.each([JsonField, StringField, TextField])('sanitizes values assigned to %s', (FieldClass) => {
    const field = new FieldClass({ type: 'text', name: 'content', interface: 'richText' }, fieldContext as never);

    const setDataValue = setFieldValue(field, '<p>safe</p><img src=x onerror="alert(1)">');

    expect(setDataValue).toHaveBeenCalledWith('content', '<p>safe</p><img src="x" />');
    expect(field.setter('<script>alert(1)</script><strong>safe</strong>')).toBe('<strong>safe</strong>');
  });

  it('leaves ordinary text values unchanged', () => {
    const field = new TextField({ type: 'text', name: 'content' }, fieldContext as never);
    const value = { unsafe: '<img src=x onerror="alert(1)">' };

    const setDataValue = setFieldValue(field, value.unsafe);

    expect(setDataValue).toHaveBeenCalledWith('content', value.unsafe);
    expect(field.setter(value)).toBe(value);
  });

  it('does not install a Sequelize setter on ordinary JSON fields', () => {
    const customSetter = vi.fn();
    const field = new JsonField({ type: 'json', name: 'content', set: customSetter }, fieldContext as never);

    expect(field.additionalSequelizeOptions()).toEqual({});
    expect(field.toSequelize().set).toBe(customSetter);
  });

  it('preserves a rich text JSON custom setter and sanitizes its output', () => {
    const customSetter = vi.fn(function (
      this: { setDataValue: (name: string, value: unknown) => void },
      value: unknown,
    ) {
      this.setDataValue('content', `${value}<script>alert(1)</script>`);
    });
    const field = new JsonField(
      { type: 'json', name: 'content', interface: 'richText', set: customSetter },
      fieldContext as never,
    );
    const values = new Map<string, unknown>();
    const model = {
      getDataValue: (name: string) => values.get(name),
      setDataValue: (name: string, value: unknown) => values.set(name, value),
    };

    field.toSequelize().set.call(model, '<p>safe</p><img src=x onerror="alert(1)">');

    expect(customSetter).toHaveBeenCalledWith('<p>safe</p><img src="x" />');
    expect(values.get('content')).toBe('<p>safe</p><img src="x" />');
  });

  it('leaves non-string JSON rich text values unchanged', () => {
    const field = new JsonField({ type: 'json', name: 'content', interface: 'richText' }, fieldContext as never);
    const value = { delta: [{ insert: '<img src=x onerror="alert(1)">' }] };

    const setDataValue = setFieldValue(field, value);

    expect(setDataValue).toHaveBeenCalledWith('content', value);
    expect(field.setter(value)).toBe(value);
  });
});
