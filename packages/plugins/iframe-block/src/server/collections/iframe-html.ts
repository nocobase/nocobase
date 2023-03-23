import { CollectionOptions } from '@nocobase/database';

export default {
  namespace: 'iframe-block.iframe-html-storage',
  duplicator: 'required',
  name: 'iframeHtml',
  createdBy: true,
  updatedBy: true,
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'text',
      name: 'html',
    },
  ],
} as CollectionOptions;
