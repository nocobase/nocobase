import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'publicForms',
  filterTargetKey: 'key',
  fields: [
    {
      type: 'uid',
      name: 'key',
      unique: true,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'collection',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'boolean',
      name: 'enabled',
    },
    {
      type: 'password',
      name: 'password',
      hidden: true,
    },
  ],
});
