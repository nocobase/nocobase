import { SchemaSetting } from '../../../application/schema-settings';
import { useCollection } from '../../../collection-manager';
import { SchemaSettings } from '../../../schema-settings/SchemaSettings';

export const formV1Settings = new SchemaSetting({
  name: 'FormV1Settings',
  items: [
    {
      name: 'template',
      Component: SchemaSettings.Template,
      useComponentProps() {
        const { name } = useCollection();
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
