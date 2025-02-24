import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'blockTemplateLinks',
  fields: [
    {
      type: 'string',
      name: 'templateKey',
    },
    {
      type: 'belongsTo',
      name: 'templateBlock',
      target: 'uiSchemas',
      foreignKey: 'templateBlockUid',
      targetKey: 'x-uid',
    },
    {
      type: 'belongsTo',
      name: 'block',
      target: 'uiSchemas',
      foreignKey: 'blockUid',
      targetKey: 'x-uid',
    },
  ],
});
