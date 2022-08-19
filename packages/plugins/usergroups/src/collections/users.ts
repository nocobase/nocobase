import { extend } from '@nocobase/database';

export default extend({
  name: 'users',
  fields: [
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'usergroups',
      target: 'usergroups',
      foreignKey: 'userId',
      otherKey: 'groupId',
      sourceKey: 'id',
      targetKey: 'id',
      through: 'usergroupsUsers',
      uiSchema: {
        type: 'array',
        title: '{{t("userGroups")}}',
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
