import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'connectionsRoles',
  autoGenId: false,
  timestamps: false,
  model: 'ConnectionsRolesModel',
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'belongsTo',
      name: 'connection',
      target: 'databaseConnections',
      foreignKey: 'connectionName',
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
