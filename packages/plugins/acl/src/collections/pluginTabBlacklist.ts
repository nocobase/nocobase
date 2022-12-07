import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'pluginTabBlacklist',
  title: '{{t("PluginTabBlacklist")}}',
  autoGenId: true,
  fields: [
    {
      type: 'string',
      name: 'roleName',
    },
    {
      type: 'string',
      name: 'tabKey',
    },
  ],
} as CollectionOptions;
