import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collection_categories',
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
      defaultValue: 'gray',
    },
    {
      type: 'belongsToMany',
      name: 'collection',
      target: 'collections',
      foreignKey: 'collectionCategoryId',
      targetKey: 'name',
    },
  ],
} as CollectionOptions;
