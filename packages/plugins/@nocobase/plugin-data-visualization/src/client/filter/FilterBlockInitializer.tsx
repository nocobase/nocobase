import React, { useContext } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import {
  Grid,
  gridRowColWrap,
  useDesignable,
  useCurrentSchema,
  SchemaInitializerSwitch,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { uid, merge } from '@formily/shared';
import { ChartFilterContext } from './FilterProvider';
import { css } from '@emotion/css';
import { theme } from 'antd';

const createFilterSchema = () => {
  return {
    type: 'void',
    'x-action': 'filter',
    'x-decorator': 'ChartFilterBlockProvider',
    'x-component': 'CardItem',
    'x-component-props': {
      size: 'small',
    },
    'x-designer': 'ChartFilterBlockDesigner',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'ChartFilterForm',
        properties: {
          grid: {
            type: 'void',
            'x-component': 'ChartFilterGrid',
            'x-initializer': 'chartFilterForm:configureFields',
            properties: {},
          },
          actions: {
            type: 'void',
            'x-initializer': 'chartFilterForm:configureActions',
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
  const {
    collapse: { collapsed },
  } = useContext(ChartFilterContext);
  const { token } = theme.useToken();
  return (
    <div
      className={css`
        .ant-nb-grid {
          overflow: hidden;
          height: ${collapsed ? `${token.controlHeight * 2}px` : 'auto'};
        }
      `}
    >
      <Grid {...props}>{props.children}</Grid>
    </div>
  );
};

export const FilterBlockInitializer: React.FC = () => {
  const { insertAdjacent } = useDesignable();
  const { setEnabled } = useContext(ChartFilterContext);
  const item = useSchemaInitializerItem();
  const { remove: _remove, disabled } = item;
  const type = 'x-action';
  const schema = createFilterSchema();
  const { exists, remove } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    _remove || item.remove,
  );

  return (
    <SchemaInitializerSwitch
      icon={<FilterOutlined />}
      checked={exists}
      disabled={disabled}
      title={item.title}
      onClick={() => {
        if (disabled) {
          return;
        }
        if (exists) {
          setEnabled(false);
          return remove();
        }
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insertAdjacent('afterBegin', gridRowColWrap(s));
        setEnabled(true);
      }}
    />
  );
};
