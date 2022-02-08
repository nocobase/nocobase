import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'uiSchemaAttrs',
  autoGenId: false,
  timestamps: false,
  fields: [
    {
      type: 'string',
      name: 'collectionPath',
    },
  ],
} as CollectionOptions;
