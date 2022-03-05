import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const AddNewActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(item?.schema?.['x-action'] || 'create', 'x-action', item.find);

  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          title: '{{ t("Add new") }}',
          'x-action': 'create',
          'x-designer': 'Action.Designer',
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            openMode: 'drawer',
          },
          properties: {
            drawer: {
              type: 'void',
              title: '{{ t("Add new record") }}',
              'x-component': 'Action.Container',
              'x-component-props': {},
              'x-decorator': 'Form',
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'GridFormItemInitializers',
                  properties: {},
                },
                footer: {
                  type: 'void',
                  'x-component': 'Action.Container.Footer',
                  properties: {
                    actions: {
                      type: 'void',
                      'x-initializer': 'PopupFormActionInitializers',
                      'x-decorator': 'DndContext',
                      'x-component': 'ActionBar',
                      'x-component-props': {
                        layout: 'one-column',
                      },
                      properties: {},
                    },
                  },
                },
              },
            },
          },
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
