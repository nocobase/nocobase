import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'comments',
  autoGenId: true,
  timestamps: true,
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collections',
      targetKey: 'name',
      sourceKey: 'id',
      foreignKey: 'collectionName',
      constraints: false,
    },
    {
      type: 'string',
      name: 'recordId',
    },
    {
      type: 'text',
      name: 'content',
    },
    {
      type: 'belongsToMany',
      name: 'commentUsers',
      target: 'users',
      foreignKey: 'userId',
      otherKey: 'commentId',
      onDelete: 'CASCADE',
    },
  ],
} as CollectionOptions;
