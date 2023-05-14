export default {
  namespace: 'localization-management.localization_management_translations',
  duplicator: 'optional',
  name: 'localization_management_translations',
  fields: [
    {
      type: 'uid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'translation',
    },
    {
      type: 'string',
      name: 'locale',
    },
    {
      type: 'belongsTo',
      name: 'texts',
      target: 'localization_management_texts',
      targetKey: 'id',
      foreignKey: 'textId',
    },
  ],
};
