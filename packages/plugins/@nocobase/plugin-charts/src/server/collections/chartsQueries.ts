import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'chartsQueries',
  shared: true,
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'type',
      type: 'string',
    },
    {
      name: 'options',
      type: 'json',
    },
    {
      name: 'fields',
      type: 'json',
      defaultValue: [],
    },
  ],
});
