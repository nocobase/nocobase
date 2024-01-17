import React from 'react';

import { useSchemaInitializerItem } from '../../application';
import { InitializerWithSwitch } from './InitializerWithSwitch';

export const TableActionColumnInitializer = () => {
  const schema = {
    type: 'void',
    title: '{{ t("Actions") }}',
    'x-decorator': 'TableV2.Column.ActionBar',
    'x-component': 'TableV2.Column',
    'x-designer': 'TableV2.ActionColumnDesigner',
    'x-initializer': 'TableActionColumnInitializers',
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
