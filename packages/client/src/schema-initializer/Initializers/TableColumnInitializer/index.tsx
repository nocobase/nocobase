import { observer, Schema, useFieldSchema } from '@formily/react';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../..';
import { useCollection, useDesignable } from '../../..';

const useTableColumnInitializerFields = () => {
  const { name, fields } = useCollection();
  return (
    fields
      // .filter((field) => field?.uiSchema?.title)
      .map((field) => {
        return {
          type: 'item',
          title: field?.uiSchema?.title || field.name,
          schema: {
            name: field.name,
            'x-collection-field': `${name}.${field.name}`,
            'x-component': 'CollectionField',
          },
          component: ColumnInitializerItem,
        } as SchemaInitializerItemOptions;
      })
  );
};

const useCurrentColumnSchema = (path: string) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const findFieldSchema = (schema: Schema) => {
    return schema.reduceProperties((buf, s) => {
      if (s['x-collection-field'] === path) {
        return s;
      }
      const child = findFieldSchema(s);
      if (child) {
        return child;
      }
      return buf;
    });
  };
  const schema = findFieldSchema(fieldSchema);
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && remove(schema.parent);
    },
  };
};

const ColumnInitializerItem = SchemaInitializer.itemWrap((props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentColumnSchema(item.schema['x-collection-field']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          type: 'void',
          'x-decorator': 'TableColumnDecorator',
          'x-designer': 'TableColumnDeigner',
          'x-component': 'VoidTable.Column',
          properties: {
            [item.schema.name]: {
              'x-read-pretty': true,
              ...item.schema,
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
});

/**
 * 表格列配置器
 */
export const TableColumnInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: useTableColumnInitializerFields(),
        },
      ]}
    >
      {t('Configure columns')}
    </SchemaInitializer.Button>
  );
});
