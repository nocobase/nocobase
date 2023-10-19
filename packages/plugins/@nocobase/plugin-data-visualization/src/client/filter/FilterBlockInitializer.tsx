import React from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { SchemaInitializer, gridRowColWrap, useDesignable } from '@nocobase/client';
import { uid } from '@formily/shared';
import { css } from '@emotion/css';

const createFilterSchema = () => {
  return {
    type: 'void',
    'x-decorator': 'ChartFilterBlockProvider',
    'x-component': 'CardItem',
    'x-component-props': {
      size: 'small',
    },
    'x-designer': 'ChartFilterBlockDesigner',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
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
                marginTop: 24,
              },
            },
            properties: {},
          },
        },
      },
    },
  };
};

export const ChartFilterBlockProvider: React.FC = (props) => {
  return (
    <div
      className={css`
        .ant-card {
          box-shadow: none;
        }
      `}
    >
      {props.children}
    </div>
  );
};

export const FilterBlockInitializer: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FilterOutlined />}
      onClick={() => insertAdjacent('afterBegin', gridRowColWrap(createFilterSchema()))}
    />
  );
};
