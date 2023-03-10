import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'charts.chartsQueries',
  duplicator: 'optional',
  name: 'chartsQueries',
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
