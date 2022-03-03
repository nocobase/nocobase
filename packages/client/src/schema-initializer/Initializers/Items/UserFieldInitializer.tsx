import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

export const UserFieldInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(
    item.schema['x-collection-field'],
    'x-collection-field',
    item.find,
    item.remove,
  );
  const targetKey = item.field.targetKey || 'id';
  return (
    <SchemaInitializer.Item
      onClick={() => {
        console.log(item, exists);
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
          'x-component': 'CollectionField',
          'x-component-props': {
            mode: 'tags',
            fieldNames: {
              label: targetKey,
              value: targetKey,
            },
          },
          properties: {
            item: {
              'x-component': 'RecordPicker.SelectedItem',
              properties: {
                drawer1: {
                  'x-component': 'Action.Drawer',
                  type: 'void',
                  title: 'Drawer Title',
                  properties: {
                    details: {
                      type: 'void',
                      'x-collection': 'collections',
                      'x-decorator': 'ResourceActionProvider',
                      'x-decorator-props': {
                        collection: item.field.target,
                        request: {
                          resource: item.field.target,
                          action: 'get',
                          params: {},
                        },
                      },
                      'x-designer': 'Form.Designer',
                      'x-component': 'CardItem',
                      properties: {
                        form: {
                          type: 'void',
                          'x-decorator': 'Form',
                          'x-decorator-props': {},
                          properties: {
                            actions: {
                              type: 'void',
                              'x-initializer': 'FormActionInitializers',
                              'x-component': 'ActionBar',
                              'x-component-props': {
                                layout: 'one-column',
                                style: {
                                  marginBottom: 16,
                                },
                              },
                              properties: {},
                            },
                            grid: {
                              type: 'void',
                              'x-component': 'Grid',
                              'x-initializer': 'GridFormItemInitializers',
                              properties: {},
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
};
