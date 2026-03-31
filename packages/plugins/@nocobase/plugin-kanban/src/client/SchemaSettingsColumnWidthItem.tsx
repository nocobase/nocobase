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
import { useKanbanTranslation } from './locale';
import { SchemaSettingsModalItem, useDesignable } from '@nocobase/client';

export function SchemaSettingsColumnWidthItem() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useKanbanTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Set column width')}
      schema={
        {
          type: 'object',
          title: t('Set column width'),
          properties: {
            columnWidth: {
              title: t('Width'),
              type: 'string',
              default: field.componentProps.columnWidth || 300,
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                min: 300,
                max: 800,
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ columnWidth }) => {
        const componentProps = fieldSchema['x-component-props'] || {};
        componentProps.columnWidth = columnWidth;
        fieldSchema['x-component-props'] = componentProps;
        field.componentProps.columnWidth = columnWidth;
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
