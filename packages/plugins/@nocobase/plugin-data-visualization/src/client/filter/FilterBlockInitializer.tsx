import React from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { InitializerWithSwitch, gridRowColWrap, useDesignable } from '@nocobase/client';
import { uid } from '@formily/shared';
import { Schema } from '@formily/react';

const createFilterSchema = () => {
  return {
    type: 'void',
    'x-action': 'filter',
    'x-decorator': 'ChartFilterBlockProvider',
    'x-component': 'CardItem',
    'x-component-props': {
      size: 'small',
      bordered: true,
    },
    'x-designer': 'ChartFilterBlockDesigner',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          layout: 'inline',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'ChartFilterItemInitializers',
            properties: {},
          },
          actions: {
            type: 'void',
            'x-initializer': 'ChartFilterActionInitializers',
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                float: 'right',
                marginTop: 8,
              },
            },
            properties: {},
          },
        },
      },
    },
  };
};

export const FilterBlockInitializer: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  return (
    <InitializerWithSwitch
      {...props}
      schema={createFilterSchema()}
      icon={<FilterOutlined />}
      insert={(s: Schema) => insertAdjacent('afterBegin', gridRowColWrap(s))}
      type="x-action"
    />
  );
};
