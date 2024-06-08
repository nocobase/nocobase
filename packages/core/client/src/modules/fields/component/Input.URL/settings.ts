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
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useColumnSchema, useDesignable } from '../../../../schema-component';

export const fieldComponent: any = {
  name: 'fieldComponent',
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();
    return {
      title: t('Field component'),
      options: [
        { value: 'Input.URL', label: 'URL' },
        { value: 'Input.Preview', label: 'Preview' },
      ],
      value: fieldSchema['x-component-props']?.['component'] || 'Input.URL',
      onChange(component) {
        _.set(fieldSchema, 'x-component-props.component', component);
        field.componentProps.component = component;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
      },
    };
  },
};

export const inputURLComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.URL',
  items: [fieldComponent],
});
