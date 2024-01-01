import { Schema } from '@formily/json-schema';
import { useFieldSchema, useForm } from '@formily/react';
import {
  SchemaInitializer,
  SchemaInitializerItemType,
  useCollectionManagerV2,
  useCollectionV2,
} from '@nocobase/client';

const quickEditField = [
  'attachment',
  'textarea',
  'markdown',
  'json',
  'richText',
  'polygon',
  'circle',
  'point',
  'lineString',
];

export const findTableColumn = (schema: Schema, key: string, action: string, deepth = 0) => {
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    const c = s.reduceProperties((buf, s) => {
      if (s[key] === action) {
        return s;
      }
      return buf;
    });
    if (c) {
      return c;
    }
    return buf;
  });
};
export const removeTableColumn = (schema, cb) => {
  cb(schema.parent);
};
export const useTableColumnInitializerFields = () => {
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const fieldSchema = useFieldSchema();
  const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
  const form = useForm();
  const isReadPretty = isSubTable ? form.readPretty : true;

  return collection
    .getFields(
      (field) => field?.interface && field?.interface !== 'subTable' && !field?.isForeignKey && !field?.treeChildren,
    )
    .map((field) => {
      const interfaceConfig = cm.getCollectionFieldInterface(field.interface);
      const isFileCollection = field?.target && cm.getCollection(field?.target)?.template === 'file';
      const schema = {
        name: field.name,
        'x-collection-field': `${name}.${field.name}`,
        'x-component': 'CollectionField',
        'x-component-props': isFileCollection
          ? {
              fieldNames: {
                label: 'preview',
                value: 'id',
              },
            }
          : {},
        'x-read-pretty': isReadPretty || field.uiSchema?.['x-read-pretty'],
        'x-decorator': isSubTable
          ? quickEditField.includes(field.interface) || isFileCollection
            ? 'QuickEdit'
            : 'FormItem'
          : null,
        'x-decorator-props': {
          labelStyle: {
            display: 'none',
          },
        },
      };
      return {
        type: 'item',
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        Component: 'TableCollectionFieldInitializer',
        find: findTableColumn,
        remove: removeTableColumn,
        schemaInitialize: (s) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            readPretty: isReadPretty,
            block: 'Table',
            targetCollection: cm.getCollection(field.target),
          });
        },
        field,
        schema,
      } as SchemaInitializerItemType;
    });
};

export const tableColumnInitializer = new SchemaInitializer({
  name: 'tableColumnInitializer',
  insertPosition: 'beforeEnd',
  icon: 'SettingOutlined',
  title: 'Configure columns',
  wrap: (s) => {
    if (s['x-action-column']) {
      return s;
    }
    return {
      type: 'void',
      'x-decorator': 'TableColumnDecorator',
      'x-settings': 'tableColumnSettings',
      'x-component': 'TableColumn',
      properties: {
        [s.name]: {
          ...s,
        },
      },
    };
  },
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      useChildren() {
        const columns = useTableColumnInitializerFields();
        console.log('columns', columns);
        return columns;
      },
    },
  ],
});
