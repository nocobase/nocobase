import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: {
    group: 'required',
  },
  shared: true,
  name: 'collectionCategories',
  autoGenId: true,
  sortable: true,
  fields: [
    {
      type: 'string',
      name: 'name',
      translation: true,
    },
    {
      type: 'string',
      name: 'color',
      defaultValue: 'default',
    },
    {
      type: 'belongsToMany',
      name: 'collections',
      target: 'collections',
      foreignKey: 'categoryId',
      otherKey: 'collectionName',
      targetKey: 'name',
      through: 'collectionCategory',
    },
  ],
} as CollectionOptions;
