import { CollectionOptions } from '@nocobase/database';

export default {
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
      name: 'collection',
      target: 'collections',
      foreignKey: 'collectionCategoryId',
      targetKey: 'name',
      through: 'collectionCategory',
    },
  ],
} as CollectionOptions;
