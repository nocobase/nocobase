import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'comments',
  autoGenId: true,
  timestamps: true,
  // sortable: {
  //   name: 'sort',
  //   scopeKey: 'collectionName',
  // },
  // indexes: [
  //   {
  //     type: 'UNIQUE',
  //     fields: ['collectionName', 'name'],
  //   },
  // ],
  fields: [
    {
      type: 'string',
      name: 'collectionName',
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
