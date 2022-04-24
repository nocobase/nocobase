import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'applications',
  model: 'ApplicationModel',
  autoGenId: false,
  title: '{{t("Applications")}}',
  sortable: 'sort',
  createdBy: true,
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
      prefix: 'a',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Application name")}}',
        'x-component': 'Input',
        'x-read-pretty': true,
      },
    },
    {
      type: 'json',
      name: 'options',
    },
  ],
});
