import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'systemSettings',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'boolean',
      name: 'showLogoOnly',
    },
    {
      type: 'boolean',
      name: 'allowSignUp',
      defaultValue: true,
    },
    {
      type: 'belongsTo',
      name: 'logo',
      target: 'attachments',
    },
    {
      type: 'array',
      name: 'enabledLanguages',
    },
    {
      type: 'string',
      name: 'appLang',
    },
  ],
});

