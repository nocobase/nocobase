import { extend } from '@nocobase/database';

export default extend({
  name: 'roles',
  fields: [
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'userGroups',
      allowNull: true,
      target: 'userGroups',
      foreignKey: 'roleName',
      otherKey: 'groupId',
      sourceKey: 'name',
      targetKey: 'gid',
      through: 'userGroupsRoles',
    }
  ],
});
