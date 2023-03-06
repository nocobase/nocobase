import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'graph-collection-manager',
  duplicator: 'required',
  name: 'graphPositions',
  fields: [
    {
      type: 'string',
      name: 'collectionName',
      unique: true,
    },
    {
      type: 'double',
      name: 'x',
    },
    {
      type: 'double',
      name: 'y',
    },
  ],
});
