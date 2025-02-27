/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable, SchemaSettingsModalItem } from '@nocobase/client';

export function CustomSchemaSettingsBlockTitleItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Edit block title & description')}
      schema={
        {
          type: 'object',
          title: t('Edit block title & description'),
          properties: {
            title: {
              title: t('Block title'),
              type: 'string',
              default: fieldSchema?.['x-decorator-props']?.['title'],
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
            description: {
              title: t('Description'),
              type: 'string',
              default: fieldSchema?.['x-decorator-props']?.['description'],
              'x-decorator': 'FormItem',
              'x-component': 'Markdown',
            },
          },
        } as ISchema
      }
      onSubmit={({ title, description }) => {
        const componentProps = fieldSchema['x-decorator-props'] || {};
        componentProps.title = title;
        componentProps.description = description;
        fieldSchema['x-decorator-props'] = componentProps;
        field.decoratorProps.title = title;
        field.decoratorProps.description = description;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-decorator-props': fieldSchema['x-decorator-props'],
          },
        });
        dn.refresh();
      }}
    />
  );
}
