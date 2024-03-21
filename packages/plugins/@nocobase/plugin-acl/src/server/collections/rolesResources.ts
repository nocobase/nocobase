import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: 'required',
  name: 'rolesResources',
  model: 'RoleResourceModel',
  indexes: [
    {
      unique: true,
      fields: ['roleName', 'name'],
    },
  ],
  fields: [
    {
      type: 'belongsTo',
      name: 'role',
      foreignKey: 'roleName',
      targetKey: 'name',
    },
    {
      type: 'string',
      name: 'name',
    },
    {
      type: 'boolean',
      name: 'usingActionsConfig',
    },
    {
      type: 'hasMany',
      name: 'actions',
      target: 'rolesResourcesActions',
    },
  ],
});
