import { defineCollection } from '@nocobase/database';

export default defineCollection({
  dumpRules: {
    group: 'required',
  },
  name: 'localizationTexts',
  model: 'LocalizationTextModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      interface: 'id',
    },
    {
      interface: 'input',
      type: 'string',
      name: 'module',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Module")}}',
        'x-component': 'Select',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'text',
      name: 'text',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Text")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'batch',
      type: 'string',
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'translations',
      target: 'localizationTranslations',
      sourceKey: 'id',
      foreignKey: 'textId',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      fields: ['batch'],
    },
  ],
});
