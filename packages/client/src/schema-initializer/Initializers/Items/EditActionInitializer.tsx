import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const EditActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(item?.schema?.['x-action'] || 'update', 'x-action', item.find);

  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          title: '{{ t("Edit") }}',
          'x-action': 'update',
          'x-designer': 'Action.Designer',
          'x-component': 'Action.Link',
          'x-component-props': {
            openMode: 'drawer',
          },
          properties: {
            drawer: {
              type: 'void',
              title: '{{ t("Edit record") }}',
              'x-component': 'Action.Container',
              'x-component-props': {
                className: 'nb-action-popup',
              },
              properties: {
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-initializer': 'RecordCreateFormInitializers',
                  properties: {},
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
