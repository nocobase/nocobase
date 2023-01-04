import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collection_categories',
  title: '数据表类别',
  sortable: 'sort',
  autoGenId: true,
  timestamps: false,
  filterTargetKey: 'name',
  fields: [
    {
      type: 'uid',
      name: 'name',
      unique: true,
      prefix: 'c_',
    },

    {
      type: 'double',
      name: 'sort',
      defaultValue: 0,
    },
    {
      type: 'string',
      name: 'color',
      defaultValue: 'gray',
    },
    // {
    //     type: 'belongsTo',
    //     name: 'collection',
    //     target: 'collections',
    //     foreignKey: 'collectionName',
    //     targetKey: 'name',
    //     onDelete: 'CASCADE',
    //   },
  ],
} as CollectionOptions;
