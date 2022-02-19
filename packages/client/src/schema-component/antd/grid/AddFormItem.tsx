import { ISchema, observer, Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Switch } from 'antd';
import React from 'react';
import { useCollection } from '../../../collection-manager/hooks';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../../../schema-initializer';
import { useDesignable } from '../../hooks';

const useFormItemInitializerFields = () => {
  const { fields } = useCollection();
  const fieldSchema = useFieldSchema();
  const props = fieldSchema['x-item-initializer-props'];
  return fields?.map((field) => {
    return {
      type: 'item',
      title: field.name,
      component: InitializeFormItem,
      schema: {
        name: field.name,
        type: field.type,
        title: field?.uiSchema?.title ?? field.name,
        'x-component': field?.uiSchema?.['x-component'],
        'x-component-props': field?.uiSchema?.['x-component-props'],
        'x-decorator': field?.uiSchema?.['FormItem'] ?? 'FormItem',
        'x-decorator-props': field?.uiSchema?.['x-decorator-props'],
        'x-collection-field': field.name,
        'x-read-pretty': !!props?.readPretty,
      },
    };
  }) as SchemaInitializerItemOptions[];
};

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

const useCurrentFieldSchema = (path: string) => {
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
      schema &&
        remove(schema, {
          removeParentsIfNoChildren: true,
          breakRemoveOn: (s) => {
            return s['x-component'] === 'Grid';
          },
        });
    },
  };
};

const itemWrap = SchemaInitializer.itemWrap;

const InitializeFormItem = itemWrap((props) => {
  const { item, insert } = props;
  const { schema, exists, remove } = useCurrentFieldSchema(item.schema['x-collection-field']);
  return (
    <SchemaInitializer.Item
      onClick={() => {
        if (exists) {
          return remove();
        }
        insert({
          ...item.schema,
        });
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {item.title} <Switch size={'small'} checked={exists} />
      </div>
    </SchemaInitializer.Item>
  );
});

const InitializeTextFormItem = itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'Markdown.Void',
          'x-decorator': 'FormItem',
          // 'x-editable': false,
        });
      }}
    />
  );
});

export const AddGridFormItem = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: 'Display fields',
          children: useFormItemInitializerFields(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: 'Add text',
          component: InitializeTextFormItem,
        },
      ]}
    >
      Configure fields
    </SchemaInitializer.Button>
  );
});
