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

    applyCollectionFieldUiSchemaToDefaultValueSchema(schema, uiSchema);

    expect(schema['x-component']).toBe('Select');
    expect(schema.type).toBe('string');
    expect(schema['x-component-props']).toMatchObject({
      allowClear: true,
      placeholder: '请选择',
    });
    expect(schema.enum).toBe(uiSchema.enum);
  });
});
