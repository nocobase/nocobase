import { extend } from '@nocobase/database';

export default extend({
  name: 'users',
  fields: [
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'userGroups',
      target: 'userGroups',
      foreignKey: 'userId',
      otherKey: 'groupId',
      sourceKey: 'id',
      targetKey: 'id',
      through: 'userGroupsUsers',
      uiSchema: {
        type: 'array',
        title: '{{t("User groups")}}',
        'x-component': 'RecordPicker',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    }
  ],
});
