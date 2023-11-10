export const createdBy = {
  options: (options) => ({
    type: 'belongsTo',
    target: 'users',
    foreignKey: 'createdById',
    // name,
    uiSchema: {
      type: 'object',
      title: '{{t("Created by")}}',
      'x-component': 'AssociationField',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'nickname',
        },
      },
      'x-read-pretty': true,
    },
  }),
};
