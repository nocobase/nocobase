import { InitializerWithSwitch, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';

export const AuditLogsTableActionColumnInitializer = () => {
  const schema = {
    type: 'void',
    title: '{{ t("Actions") }}',
    'x-decorator': 'TableV2.Column.ActionBar',
    'x-component': 'TableV2.Column',
    'x-designer': 'TableV2.ActionColumnDesigner',
    'x-initializer': 'auditLogsTable:configureItemActions',
    'x-action-column': 'actions',
    properties: {
      actions: {
        type: 'void',
        'x-decorator': 'DndContext',
        'x-component': 'Space',
        'x-component-props': {
          split: '|',
        },
        properties: {},
      },
    },
  };
  const itemConfig = useSchemaInitializerItem();
  return <InitializerWithSwitch {...itemConfig} schema={schema} item={itemConfig} type={'x-action-column'} />;
};
