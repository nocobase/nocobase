import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'multi-app-manager.multi-apps',
  duplicator: 'optional',
  name: 'applications',
  model: 'ApplicationModel',
  autoGenId: false,
  title: '{{t("Applications")}}',
  sortable: 'sort',
  filterTargetKey: 'name',
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'displayName',
    },
    {
      type: 'string',
      name: 'cname',
      unique: true,
    },
    {
      type: 'boolean',
      name: 'pinned',
    },
    {
      type: 'string',
      name: 'icon',
    },
    {
      type: 'string',
      name: 'status',
      defaultValue: 'pending',
    },
    {
      type: 'json',
      name: 'options',
    },
  ],
});
