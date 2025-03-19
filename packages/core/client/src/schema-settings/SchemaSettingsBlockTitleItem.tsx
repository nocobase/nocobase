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
import { useDesignable } from '../schema-component/hooks/useDesignable';
import { SchemaSettingsModalItem } from './SchemaSettings';

export function SchemaSettingsBlockTitleItem() {
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
              title: t('title'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['title'],
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                'aria-label': 'block-title',
              },
            },
            description: {
              title: t('Description'),
              type: 'string',
              default: fieldSchema?.['x-component-props']?.['description'],
              'x-decorator': 'FormItem',
              'x-component': 'Markdown',
            },
          },
        } as ISchema
      }
      onSubmit={({ title, description }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.title = title;
        componentProps.description = description;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.title = title;
        field.componentProps.description = description;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
      }}
    />
  );
}
