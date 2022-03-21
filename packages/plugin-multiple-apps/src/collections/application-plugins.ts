import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applicationPlugins',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'belongsTo',
      name: 'application',
      foreignKey: 'applicationName',
    },
  ],
});
