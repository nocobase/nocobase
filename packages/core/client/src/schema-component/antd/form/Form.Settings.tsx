import { SchemaSetting } from '../../../application';
import { useCollection } from '../../../collection-manager';

export const formV1Settings = new SchemaSetting({
  name: 'FormV1Settings',
  items: [
    {
      name: 'template',
      type: 'template',
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
