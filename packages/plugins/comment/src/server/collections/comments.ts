import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'comments',
  autoGenId: true,
  timestamps: true,
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
      type: 'integer',
      name: 'recordId',
    },
    {
      type: 'string',
      name: 'content',
    },
    {
      type: 'belongsTo',
      name: 'commenter',
      target: 'users',
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
