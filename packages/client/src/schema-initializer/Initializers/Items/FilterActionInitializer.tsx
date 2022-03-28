import { Switch } from 'antd';
import React from 'react';
import { SchemaInitializer } from '../../SchemaInitializer';
import { useCurrentSchema } from '../utils';

const schema = {
  type: 'void',
  title: '{{t("Filter")}}',
  'x-action': 'filter',
  'x-align': 'left',
  'x-component': 'Action',
  'x-designer': 'Action.Designer',
  'x-component-props': {
    popover: true,
  },
  properties: {
    popover: {
      type: 'void',
      'x-decorator': 'Form',
      'x-decorator-props': {},
      'x-component': 'Action.Popover',
      'x-component-props': {
        trigger: 'click',
        placement: 'bottomLeft',
      },
      properties: {
        filter: {
          type: 'object',
          default: {
            $and: [{}],
          },
          'x-component': 'Filter',
          'x-component-props': {
            useDataSource: '{{cm.useFilterDataSource}}',
          },
        },
        footer: {
          type: 'void',
          'x-component': 'Action.Popover.Footer',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'ActionBar',
              properties: {
                saveDefault: {
                  type: 'void',
                  'x-component': 'Filter.SaveDefaultValue',
                  'x-component-props': {},
                },
                reset: {
                  type: 'void',
                  title: '{{t("Reset")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{cm.useResetFilterAction}}',
                  },
                },
                submit: {
                  type: 'void',
                  title: '{{t("Submit")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    useAction: '{{cm.useFilterAction}}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const FilterActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema(item?.schema?.['x-action'] || 'filter', 'x-action', item.find);

  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          ...schema,
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
