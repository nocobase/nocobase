import { useField, useFieldSchema } from '@formily/react';
import {
  useFormBlockContext,
  SchemaSettingsDataScope,
  useCollection_deprecated,
  useDesignable,
  SchemaSettings,
  FixedBlockDesignerItem,
  SchemaSettingsBlockTitleItem,
  removeNullCondition,
  SchemaSettingsTemplate,
} from '@nocobase/client';
import { useKanbanBlockContext } from './KanbanBlockProvider';
export const kanbanSettings = new SchemaSettings({
  name: 'blockSettings:kanban',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'dataScope',
      Component: SchemaSettingsDataScope,
      useComponentProps() {
        const { name } = useCollection_deprecated();
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
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        return {
          componentName: 'Kanban',
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
