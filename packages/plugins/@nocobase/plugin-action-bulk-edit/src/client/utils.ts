import {
  useCollection,
  useCollectionManager,
  useRemoveGridFormItem,
  SchemaInitializerItemType,
} from '@nocobase/client';
import { useForm } from '@formily/react';
import { useMemo } from 'react';

export const useCustomBulkEditFormItemInitializerFields = (options?: any) => {
  const { name, fields } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const remove = useRemoveGridFormItem();
  const filterFields = useMemo(
    () =>
      fields
        ?.filter((field) => {
          return (
            field?.interface &&
            !field?.uiSchema?.['x-read-pretty'] &&
            field.interface !== 'snapshot' &&
            field.type !== 'sequence'
          );
        })
        .map((field) => {
          const interfaceConfig = getInterface(field.interface);
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
                targetCollection: getCollection(field.target),
              });
            },
            schema,
          } as SchemaInitializerItemType;
        }),
    [fields],
  );

  return filterFields;
};
