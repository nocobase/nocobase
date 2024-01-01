import {
  useRemoveGridFormItem,
  SchemaInitializerItemType,
  useCollectionV2,
  useCollectionManagerV2,
} from '@nocobase/client';
import { useForm } from '@formily/react';
import { useMemo } from 'react';

export const useCustomBulkEditFormItemInitializerFields = (options?: any) => {
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const remove = useRemoveGridFormItem();
  const filterFields = useMemo(
    () =>
      collection.fields
        ?.filter((field) => {
          return (
            field?.interface &&
            !field?.uiSchema?.['x-read-pretty'] &&
            field.interface !== 'snapshot' &&
            field.type !== 'sequence'
          );
        })
        .map((field) => {
          const interfaceConfig = cm.getCollectionFieldInterface(field.interface);
          const schema = {
            type: 'string',
            name: field.name,
            title: field?.uiSchema?.title || field.name,
            'x-designer': 'FormItem.Designer',
            'x-component': 'BulkEditField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
          };
          return {
            name: field?.uiSchema?.title || field.name,
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            Component: 'CollectionFieldInitializer',
            remove: remove,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field,
                block,
                readPretty,
                targetCollection: cm.getCollection(field.target),
              });
            },
            schema,
          } as SchemaInitializerItemType;
        }),
    [collection.fields, cm],
  );

  return filterFields;
};
