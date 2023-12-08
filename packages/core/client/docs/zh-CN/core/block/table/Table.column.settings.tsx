import { SchemaSettings } from '@nocobase/client';

export const tableColumnSettings = new SchemaSettings({
  name: 'tableColumnSettings',
  items: [
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
