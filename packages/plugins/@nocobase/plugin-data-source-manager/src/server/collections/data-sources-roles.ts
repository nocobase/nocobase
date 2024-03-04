import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'dataSourcesRoles',
  dumpRules: 'required',
  autoGenId: false,
  timestamps: false,
  model: 'DataSourcesRolesModel',
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'belongsTo',
      name: 'dataSources',
      foreignKey: 'dataSourceKey',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsTo',
      name: 'role',
      target: 'roles',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    },
    {
      type: 'json',
      name: 'strategy',
    },
  ],
});
