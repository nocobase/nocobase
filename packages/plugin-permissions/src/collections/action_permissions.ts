import { TableOptions } from '@nocobase/database';

export default {
  name: 'action_permissions',
  fields: [
    {
      type: 'string',
      name: 'actionName',
    },
    {
      type: 'belongsTo',
      name: 'scope',
    },
    {
      type: 'belongsTo',
      name: 'collection',
    },
    {
      type: 'belongsTo',
      name: 'role',
    },
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'hasMany',
      name: 'fieldPermissions',
      target: 'field_permissions',
      foreignKey: 'action_permission_id',
    },
    {
      type: 'belongsToMany',
      name: 'fields',
      through: 'field_permissions',
    },
  ],
} as TableOptions;
