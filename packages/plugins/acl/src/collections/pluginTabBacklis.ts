import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'pluginTabBacklist',
  title: '{{t("PluginTabBacklist")}}',
  autoGenId: true,
  fields: [
    {
      type: 'string',
      name: 'roleName',
      uiSchema: {
        type: 'string',
        title: '{{t("Role Name")}}',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'tabKey',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("tabKey")}}',
        'x-component': 'Input',
      },
    },
  ],
} as CollectionOptions;
