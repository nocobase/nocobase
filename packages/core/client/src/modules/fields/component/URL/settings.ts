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

const fieldComponent: any = {
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
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props']['component'] = component;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps.component = component;
        dn.emit('patch', {
          schema,
        });
      },
    };
  },
};

const size = {
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

export const urlComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.URL',
  items: [fieldComponent, size],
});
