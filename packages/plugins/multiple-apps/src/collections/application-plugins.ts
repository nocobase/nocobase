import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applicationPlugins',
  timestamps: false,
  fields: [
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'json',
      name: 'options',
    },
    {
      type: 'belongsTo',
      name: 'application',
      foreignKey: 'applicationName',
    },
  ],
});
