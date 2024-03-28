import { useFieldSchema } from '@formily/react';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../../collection-manager';
import { SchemaSettingsBlockTitleItem, SchemaSettingsFormItemTemplate } from '../../../../schema-settings';
import { SchemaSettingsItemType } from '../../../../application/schema-settings/types';

const commonItems: SchemaSettingsItemType[] = [
  {
    name: 'title',
    Component: SchemaSettingsBlockTitleItem,
  },
  {
    name: 'formItemTemplate',
    Component: SchemaSettingsFormItemTemplate,
    useComponentProps() {
      const { name } = useCollection_deprecated();
      const fieldSchema = useFieldSchema();
      const defaultResource =
        fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;
      return {
        insertAdjacentPosition: 'beforeEnd',
        componentName: 'ReadPrettyFormItem',
        collectionName: name,
        resourceName: defaultResource,
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
];

/**
 * @deprecated
 * 已弃用，请使用 detailsBlockSettings 代替
 */
export const singleDataDetailsBlockSettings = new SchemaSettings({
  name: 'blockSettings:singleDataDetails',
  items: commonItems,
});

export const detailsBlockSettings = new SchemaSettings({
  name: 'blockSettings:details',
  items: commonItems,
});
