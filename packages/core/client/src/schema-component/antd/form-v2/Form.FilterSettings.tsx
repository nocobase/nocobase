import { useFieldSchema } from '@formily/react';
import { SchemaSetting } from '../../../application';
import { useCollection } from '../../../collection-manager';
import { SchemaSettings } from '../../../schema-settings';
import { FilterBlockType } from '../../../filter-provider';
import { useTranslation } from 'react-i18next';

export const formFilterSettings = new SchemaSetting({
  name: 'FormFilterSettings',
  items: [
    {
      name: 'title',
      type: 'blockTitle',
    },
    {
      name: 'formItemTemplate',
      Component: SchemaSettings.FormItemTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
        return {
          componentName: 'FilterFormItem',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettings.LinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettings.ConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.FORM,
          emptyDescription: t('No blocks to connect'),
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
