import { useCollection } from '../../../../collection-manager';
import type { SchemaInitializerItemOptions } from '../../../../schema-initializer';
import { removeGridFormItem } from '../../../../schema-initializer/utils';

export const useCardItemInitializerFields = () => {
  const { name, fields } = useCollection();
  return fields
    ?.filter((field) => field?.interface)
    ?.map((field) => {
      return {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
        remove: removeGridFormItem,
        schema: {
          name: field.name,
          title: field?.uiSchema?.title || field.name,
          'x-designer': 'FormItem.Designer',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-read-pretty': true,
          'x-collection-field': `${name}.${field.name}`,
          ...field?.uiSchema,
        },
      } as SchemaInitializerItemOptions;
    });
};
