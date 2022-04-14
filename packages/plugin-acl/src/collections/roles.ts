import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'roles',
  title: '{{t("Roles")}}',
  autoGenId: false,
  model: 'RoleModel',
  filterTargetKey: 'name',
  // targetKey: 'name',
  sortable: true,
  fields: [
    {
      type: 'uid',
      name: 'name',
      prefix: 'r_',
      primaryKey: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Role UID")}}',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'title',
      unique: true,
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Role name")}}',
        'x-component': 'Input',
      },
    },
    {
      type: 'boolean',
      name: 'default',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'json',
      name: 'strategy',
    },
    {
      type: 'boolean',
      name: 'default',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'hidden',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'allowConfigure',
    },
    {
      type: 'boolean',
      name: 'allowNewMenu',
    },
    {
      type: 'belongsToMany',
      name: 'menuUiSchemas',
      target: 'uiSchemas',
      targetKey: 'x-uid',
    },
    {
      type: 'hasMany',
      name: 'resources',
      target: 'rolesResources',
      sourceKey: 'name',
      targetKey: 'name',
    },
  ],
} as CollectionOptions;
