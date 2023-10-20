import React, { useContext } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { Grid, InitializerWithSwitch, gridRowColWrap, useDesignable } from '@nocobase/client';
import { uid } from '@formily/shared';
import { Schema } from '@formily/react';
import { ChartFilterContext } from './FilterProvider';
import { css } from '@emotion/css';

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
            'x-component': 'ChartFilterGrid',
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

export const ChartFilterGrid: React.FC = (props) => {
  const { collapse } = useContext(ChartFilterContext);
  console.log(collapse);
  return (
    <div
      className={css`
        .ant-nb-grid {
          overflow: hidden;
          height: ${collapse ? '44px' : 'auto'};
        }
      `}
    >
      <Grid {...props}>{props.children}</Grid>
    </div>
  );
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
