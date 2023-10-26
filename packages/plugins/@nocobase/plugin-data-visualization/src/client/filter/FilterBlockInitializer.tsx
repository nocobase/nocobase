import React, { useContext, useEffect, useMemo } from 'react';
import { FilterOutlined } from '@ant-design/icons';
import { Grid, gridRowColWrap, useDesignable, useCurrentSchema, SchemaInitializer, FormV2 } from '@nocobase/client';
import { uid, merge } from '@formily/shared';
import { ChartFilterContext } from './FilterProvider';
import { css } from '@emotion/css';
import { createForm, onFieldChange, onFieldMount, onFieldUnmount } from '@formily/core';

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

export const ChartFilterForm: React.FC = (props) => {
  const { addField, removeField, setForm } = useContext(ChartFilterContext);
  const form = useMemo(
    () =>
      createForm({
        effects() {
          const getField = (field: any) => {
            if (field.displayName !== 'Field') {
              return null;
            }
            const { name } = field.props || {};
            return name;
          };
          onFieldMount('*', (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            addField(name, { title: field.title, operator: field.componentProps.filterOperator });
          });
          onFieldUnmount('*', (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            removeField(name);
          });
          onFieldChange('*', ['title'], (field: any) => {
            const name = getField(field);
            if (!name) {
              return;
            }
            addField(name, { title: field.title, operator: field.componentProps.filterOperator });
          });
        },
      }),
    [addField, removeField],
  );

  useEffect(() => setForm(form), [form, setForm]);
  return <FormV2 {...props} form={form} />;
};

export const ChartFilterGrid: React.FC = (props) => {
  const { collapse } = useContext(ChartFilterContext);
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

export const FilterBlockInitializer: React.FC = (props: any) => {
  const { insertAdjacent } = useDesignable();
  const { setEnabled } = useContext(ChartFilterContext);
  const { item, remove: _remove, disabled } = props;
  const type = 'x-action';
  const schema = createFilterSchema();
  const { exists, remove } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    _remove || item.remove,
  );

  return (
    <SchemaInitializer.SwitchItem
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
