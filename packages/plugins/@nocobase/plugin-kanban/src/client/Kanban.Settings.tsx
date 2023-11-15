import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import {
  useFormBlockContext,
  SchemaSetting,
  useCollection,
  useDesignable,
  SchemaSettings,
  useSortFields,
  FixedBlockDesignerItem,
  removeNullCondition,
} from '@nocobase/client';
import { useKanbanBlockContext } from './KanbanBlockProvider';
export const kanbanSettings = new SchemaSetting({
  name: 'KanbanSettings',
  items: [
    {
      name: 'title',
      type: 'blockTitle',
    },
    {
      name: 'dataScope',
      Component: SchemaSettings.DataScope,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const { form } = useFormBlockContext();
        const field = useField();
        const { service } = useKanbanBlockContext();
        const { dn } = useDesignable();
        return {
          collectionName: name,
          defaultFilter: fieldSchema?.['x-decorator-props']?.params?.filter || {},
          form,
          onSubmit: ({ filter }) => {
            filter = removeNullCondition(filter);
            const params = field.decoratorProps.params || {};
            params.filter = filter;
            field.decoratorProps.params = params;
            fieldSchema['x-decorator-props']['params'] = params;
            service.run({ ...service.params?.[0], filter });
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
          },
        };
      },
    },
    {
      name: 'fixedBlock',
      Component: FixedBlockDesignerItem,
    },
    {
      name: 'dataTemplates',
      Component: SchemaSettings.DataTemplates,
      useVisible() {
        const { action } = useFormBlockContext();
        return !action;
      },
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },

    {
      name: 'divider',
      type: 'divider',
    },

    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});
