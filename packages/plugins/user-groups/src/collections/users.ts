import { extend } from '@nocobase/database';

export default extend({
  name: 'users',
  repository: 'UserRepository',
  fields: [
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'userGroups',
      allowNull: true,
      target: 'userGroups',
      foreignKey: 'userId',
      otherKey: 'groupId',
      sourceKey: 'id',
      targetKey: 'gid',
      through: 'userGroupsUsers',
      uiSchema: {
        type: 'array',
        title: '{{t("User groups")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'name',
            value: 'gid',
          },
        },
      },
    }
  ],
});
