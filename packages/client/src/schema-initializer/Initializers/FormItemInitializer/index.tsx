import { ISchema, observer, Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Switch } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, SchemaInitializerItemOptions } from '../..';
import { useCollection } from '../../../collection-manager';
import { useDesignable } from '../../../schema-component';

const useFormItems = () => {
  const { name, fields } = useCollection();
  return fields?.map((field) => {
    return {
      type: 'item',
      title: field?.uiSchema?.title || field.name,
      component: InitializeFormItem,
      schema: {
        name: field.name,
        'x-designer': 'FormItem.Designer',
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${name}.${field.name}`,
      },
    } as SchemaInitializerItemOptions;
  });
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
          'x-editable': false,
          'x-decorator': 'FormItem',
          'x-designer': 'Markdown.Void.Designer',
          'x-component': 'Markdown.Void',
          'x-component-props': {
            content: '# Markdown content',
          },
        });
      }}
    />
  );
});

export const FormItemInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: t('Display fields'),
          children: useFormItems(),
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Add text'),
          component: InitializeTextFormItem,
        },
      ]}
    >
      {t('Configure fields')}
    </SchemaInitializer.Button>
  );
});
