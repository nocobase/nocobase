/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useColumnSchema, useDesignable } from '../../../../schema-component';
import { SchemaSettingsItemType } from '../../../../application/schema-settings';
// import { createSelectSchemaSettingsItem } from '../../../../application';
// import { fieldComponent } from '../Input.URL/settings';

const size: SchemaSettingsItemType = {
  name: 'size',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Size'),
      options: [
        { value: 'small', label: 'Small' },
        { value: 'middle', label: 'Middle' },
        { value: 'large', label: 'Large' },
        { value: 'auto', label: 'Auto' },
      ],
      value: fieldSchema['x-component-props']?.['size'] || 'small',
      onChange(size) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['size'] = size;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.size = size;
        dn.emit('patch', {
          schema,
        });
      },
    };
  },
};

// const size2 = createSelectSchemaSettingsItem({
//   name: 'size2',
//   title: 'Size2',
//   type: 'field',
//   schemaKey: 'x-component-props.size',
//   options: [
//     { value: 'small', label: 'Small' },
//     { value: 'middle', label: 'Middle' },
//     { value: 'large', label: 'Large' },
//     { value: 'auto', label: 'Auto' },
//   ],
// });

export const inputPreviewComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.Preview',
  items: [
    size,
    // size2
  ],
});
