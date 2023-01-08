// import { defineCollection } from '@nocobase/database';

// export default defineCollection({
//   name: 'comment',
//   fields: [
//     {
//       type: 'date',
//       name: 'createdAt',
//     },
//     {
//       type: 'string',
//       name: 'createdBy',
//     },
//     {
//       type: 'integer',
//       name: 'like',
//     },
//     {
//       type: 'integer',
//       name: 'dislike',
//     },
//     {
//       type: 'string',
//       name: 'commentId',
//       //primaryKey: true,
//       index: true,
//     },
//     {
//       type: 'text',
//       name: 'content',
//     },
//     {
//       type: 'string',
//       name: 'path',
//     },
//     {
//       type: 'belongsTo',
//       name: 'collection',
//       target: 'collections',
//       targetKey: 'name',
//       sourceKey: 'id',
//       foreignKey: 'collectionName',
//       constraints: false,
//     },
//     {
//       type: 'belongsTo',
//       name: 'parent',
//       target: 'comment',
//       foreignKey: 'parentId',
//     },
//     {
//       type: 'hasMany',
//       name: 'children',
//       target: 'comment',
//       foreignKey: 'childrenId',
//     },
//     {
//       type: 'belongsTo',
//       name: 'user',
//       target: 'users',
//     },
//   ],
// });

export default {
  name: 'comment',
  fields: [
    {
      type: 'date',
      name: 'createdAt',
    },
    {
      type: 'string',
      name: 'createdBy',
    },
    {
      type: 'integer',
      name: 'like',
    },
    {
      type: 'integer',
      name: 'dislike',
    },
    {
      type: 'string',
      name: 'commentId',
      //primaryKey: true,
      index: true,
    },
    {
      type: 'text',
      name: 'content',
    },
    {
      type: 'string',
      name: 'path',
    },
    // {
    //   type: 'belongsTo',
    //   name: 'collection',
    //   target: 'collections',
    //   targetKey: 'name',
    //   sourceKey: 'id',
    //   foreignKey: 'collectionName',
    //   constraints: false,
    // },
    {
      type: 'belongsTo',
      name: 'parent',
      target: 'comment',
      foreignKey: 'parentId',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'comment',
      foreignKey: 'childrenId',
    },
    // {
    //   type: 'belongsTo',
    //   name: 'user',
    //   target: 'users',
    //   sourceKey: 'id',
    //   foreignKey: 'id',
    // },
  ],
};
