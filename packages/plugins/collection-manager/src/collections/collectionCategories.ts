import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'collection-manager',
  duplicator: 'required',
  name: 'collectionCategories',
  autoGenId: true,
  sortable: true,
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    // {
    //   type: 'integer',
    //   name: 'sort',
    //   defaultValue: 0,
    // },
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
