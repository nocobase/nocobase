import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collection_categories',
  title: '数据表类别',
  autoGenId: true,
  timestamps: false,
  filterTargetKey: 'name',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'integer',
      name: 'sort',
      defaultValue: 0,
    },
    {
      type: 'string',
      name: 'color',
      defaultValue: 'gray',
    },
    {
      type: 'belongsToMany',
      name: 'collection',
      target: 'collections',
      foreignKey: 'category',
      targetKey: 'name',
      onDelete: 'CASCADE',
    },
  ],
} as CollectionOptions;
