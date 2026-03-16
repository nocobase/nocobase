/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { applyCollectionFieldUiSchemaToDefaultValueSchema } from '../SchemaSettingsDefaultValue';

describe('applyCollectionFieldUiSchemaToDefaultValueSchema', () => {
  it('should copy enum options for choice fields in default value dialog', () => {
    const schema = {
      'x-component': 'CollectionField',
      'x-component-props': {
        placeholder: '请选择',
      },
    };
    const uiSchema = {
      type: 'string',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: true,
      },
      enum: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ],
    };

    const nextSchema = applyCollectionFieldUiSchemaToDefaultValueSchema(schema, uiSchema);

    expect(nextSchema['x-component']).toBe('Select');
    expect(nextSchema.type).toBe('string');
    expect(nextSchema['x-component-props']).toMatchObject({
      allowClear: true,
      placeholder: '请选择',
    });
    expect(nextSchema.enum).toEqual(uiSchema.enum);
    expect(nextSchema.enum).not.toBe(uiSchema.enum);
  });
});
