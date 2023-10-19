import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'region.region',
  duplicator: 'skip',
  name: 'regions',
  title: 'Indian Administrative Areas',
  autoGenId: false,
  fields: [
    {
      name: 'code',
      type: 'string',
      // unique: true,
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'parent',
      type: 'belongsTo',
      target: 'regions',
      targetKey: 'code',
      foreignKey: 'parentCode',
    },
    {
      name: 'children',
      type: 'hasMany',
      target: 'regions',
      sourceKey: 'code',
      foreignKey: 'parentCode',
    },
    {
      name: 'level',
      type: 'integer',
    },
  ],
});
