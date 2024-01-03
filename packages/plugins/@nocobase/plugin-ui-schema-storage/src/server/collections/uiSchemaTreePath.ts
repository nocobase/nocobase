import { CollectionOptions } from '@nocobase/database';

export default {
  dumpRules: 'required',
  name: 'uiSchemaTreePath',
  autoGenId: false,
  timestamps: false,
  indexes: [
    {
      fields: ['descendant'],
    },
  ],
  fields: [
    {
      type: 'string',
      name: 'ancestor',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'descendant',
      primaryKey: true,
      index: true,
    },
    {
      type: 'integer',
      name: 'depth',
    },
    {
      type: 'boolean',
      name: 'async',
    },
    {
      type: 'string',
      name: 'type',
      comment: 'type of node',
    },
    {
      type: 'integer',
      name: 'sort',
      comment: 'sort of node in adjacency',
    },
  ],
} as CollectionOptions;
