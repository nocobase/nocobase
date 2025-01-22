/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettings,
  SchemaSettingsSelectItem,
  useDesignable,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsModalItem,
  useOpenModeContext,
} from '@nocobase/client';
import { CustomSchemaSettingsBlockTitleItem } from './SchemaSettingsBlockTitleItem';
import React from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
export const WorkbenchLayout = {
  Grid: 'grid',
  List: 'list',
};

const ActionPanelLayout = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { dn } = useDesignable();
  return (
    <SchemaSettingsSelectItem
      title={t('Layout', { ns: 'block-workbench' })}
      options={[
        { label: t('Grid', { ns: 'block-workbench' }), value: WorkbenchLayout.Grid },
        { label: t('List', { ns: 'block-workbench' }), value: WorkbenchLayout.List },
      ]}
      value={fieldSchema?.['x-component-props']?.layout || WorkbenchLayout.Grid}
      onChange={(value) => {
        field.componentProps.layout = value;
        const schema = {
          'x-uid': fieldSchema['x-uid'],
        };
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        schema['x-component-props'] = fieldSchema['x-component-props'] || {};
        schema['x-component-props'].layout = value;
        fieldSchema['x-component-props'].layout = value;
        dn.emit('patch', {
          schema: schema,
        });
        dn.refresh();
      }}
    />
  );
};

export function ActionPanelItemsPerRow() {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();

  return (
    <SchemaSettingsModalItem
      title={t('Items per row', { ns: 'block-workbench' })}
      schema={{
        type: 'object',
        properties: {
          itemsPerRow: {
            type: 'number',
            default: fieldSchema?.['x-decorator-props']?.['itemsPerRow'] || 4,
            'x-decorator': 'FormItem',
            'x-component': 'InputNumber',
            'x-component-props': {
              min: 1,
              max: 6,
            },
            description: t('At least 1, up to 6', { ns: 'block-workbench' }),
            required: true,
          },
        },
      }}
      onSubmit={({ itemsPerRow }) => {
        const componentProps = fieldSchema['x-decorator-props'] || {};
        componentProps.itemsPerRow = itemsPerRow;
        fieldSchema['x-decorator-props'] = componentProps;
        field.decoratorProps.ItemsPerRow = itemsPerRow;
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

export const workbenchBlockSettings = new SchemaSettings({
  name: 'blockSettings:workbench',
  items: [
    {
      name: 'title',
      Component: CustomSchemaSettingsBlockTitleItem,
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'layout',
      Component: ActionPanelLayout,
    },
    {
      name: 'itemsPerRow',
      Component: ActionPanelItemsPerRow,
      useVisible() {
        const { isMobile } = useOpenModeContext() || {};
        const fieldSchema = useFieldSchema();
        return isMobile && fieldSchema?.['x-component-props']?.layout !== WorkbenchLayout.List;
      },
    },
    {
      type: 'remove',
      name: 'remove',
    },
  ],
});
