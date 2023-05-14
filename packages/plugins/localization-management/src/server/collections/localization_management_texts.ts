export default {
  namespace: 'localization-management.localization_management_texts',
  duplicator: 'optional',
  name: 'localization_management_texts',
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'module',
    },
    {
      type: 'string',
      name: 'text',
    },
    {
      type: 'hasMany',
      name: 'translations',
      target: 'localization_management_translations',
      sourceKey: 'id',
      foreignKey: 'textId',
    },
  ],
};
