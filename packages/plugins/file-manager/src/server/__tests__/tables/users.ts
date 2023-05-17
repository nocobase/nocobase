import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'belongsTo',
      name: 'avatar',
      target: 'attachments',
      attachment: {
        // storage 为配置的默认引擎
        rules: {
          size: 1024 * 10,
          mimetype: ['image/png'],
        },
      },
    },
    {
      type: 'belongsToMany',
      name: 'pubkeys',
      target: 'attachments',
      attachment: {
        storage: 'local_private',
        rules: {
          mimetype: ['text/*'],
        },
      },
    },
    {
      type: 'belongsToMany',
      name: 'photos',
      target: 'attachments',
      attachment: {
        rules: {
          size: 1024 * 100,
          mimetype: ['image/*'],
        },
      },
    },
  ],
} as CollectionOptions;
