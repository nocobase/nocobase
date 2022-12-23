import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'iframeHtml',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'text',
      name: 'html',
    },
  ],
} as CollectionOptions;
