import { TableOptions } from "@nocobase/database";

export default {
  name: 'posts',
  tableName: 'actions__posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'publish',
    },
    {
      type: 'date',
      name: 'published_at'
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'hasmany',
      name: 'comments',
    },
    {
      type: 'belongsToMany',
      name: 'tags',
    },
  ],
  hooks: {
    beforeCreate(model, options) {
    },
  },
  scopes: {
    customTitle: (title, ctx) => {
      return {
        where: {
          title: title,
        },
      }
    },
  },
} as TableOptions;
