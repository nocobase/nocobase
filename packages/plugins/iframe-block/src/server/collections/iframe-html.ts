import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'iframeHtml',
  createdBy: false,
  updatedBy: false,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    {
      type: 'text',
      name: 'html',
    },
  ],
} as CollectionOptions;
