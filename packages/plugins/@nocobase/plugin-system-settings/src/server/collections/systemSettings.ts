import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'systemSettings',
  fields: [
    {
      type: 'string',
      name: 'title',
      translation: true,
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
      type: 'boolean',
      name: 'smsAuthEnabled',
      defaultValue: false,
    },
    {
      type: 'belongsTo',
      name: 'logo',
      target: 'attachments',
    },
    {
      type: 'json',
      name: 'enabledLanguages',
      defaultValue: [],
    },
    {
      type: 'string',
      name: 'appLang',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
});
