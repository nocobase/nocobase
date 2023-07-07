import { CollectionOptions } from '@nocobase/client';

export default {
  namespace: 'localization.localization',
  duplicator: 'optional',
  name: 'localizationTranslations',
  title: '{{t("Localization Translations")}}',
  model: 'LocalizationTranslationModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
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
      name: 'locale',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Locale")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'text',
      name: 'translation',
      allowNull: false,
      defaultValue: '',
      uiSchema: {
        type: 'string',
        title: '{{t("Translation")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'm2o',
      type: 'belongsTo',
      name: 'text',
      target: 'localizationTexts',
      targetKey: 'id',
      foreignKey: 'textId',
    },
  ],
  indexes: [
    {
      fields: ['locale', 'textId'],
      unique: true,
    },
  ],
} as CollectionOptions;
