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

const createSettingsItem = (config: {
  name: string;
  title: string;
  options: typeof getSizeOptions | typeof getObjectFitOptions;
  defaultValue: string;
}): SchemaSettingsItemType => ({
  name: config.name,
  type: 'select',
  useComponentProps() {
    const { t } = useTranslation();
    const field = useField<Field>();
    const schema = useFieldSchema();
    const { fieldSchema: tableColumnSchema } = useColumnSchema();
    const fieldSchema = tableColumnSchema || schema;
    const { dn } = useDesignable();

    return {
      title: t(config.title),
      options: config.options(t),
      value: fieldSchema['x-component-props']?.[config.name] || config.defaultValue,
      onChange(value) {
        const schema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'][config.name] = value;
        schema['x-component-props'] = fieldSchema['x-component-props'];
        field.componentProps = field.componentProps || {};
        field.componentProps[config.name] = value;
        dn.emit('patch', {
          schema,
        });
      },
    };
  },
});

const getSizeOptions = (t: (key: string) => any) => [
  { value: 'small', label: t('Small') },
  { value: 'middle', label: t('Middle') },
  { value: 'large', label: t('Large') },
  { value: 'oversized', label: t('Oversized') },
  { value: 'auto', label: t('Auto') },
];

const getObjectFitOptions = (t: (key: string) => any) => [
  { value: 'cover', label: t('Cover') },
  { value: 'fill', label: t('Fill') },
  { value: 'contain', label: t('Contain') },
  { value: 'scale-down', label: t('Scale Down') },
  { value: 'none', label: t('None') },
];

const size = createSettingsItem({
  name: 'size',
  title: 'Size',
  options: getSizeOptions,
  defaultValue: 'small',
});

const objectFit = createSettingsItem({
  name: 'objectFit',
  title: 'Object Fit',
  options: getObjectFitOptions,
  defaultValue: 'cover',
});

export const inputPreviewComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Input.Preview',
  items: [size, objectFit],
});
