import { SchemaSettings } from '../../../application/schema-settings';
import { useCollection_deprecated } from '../../../collection-manager';
import { SchemaSettingsTemplate } from '../../../schema-settings/SchemaSettings';

/**
 * @deprecated
 */
export const formV1Settings = new SchemaSettings({
  name: 'FormV1Settings',
  items: [
    {
      name: 'template',
      Component: SchemaSettingsTemplate,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        return {
          componentName: 'Form',
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
