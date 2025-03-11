/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  namespace: 'localization.localization',
  dumpRules: {
    group: 'required',
  },
  migrationRules: ['overwrite', 'schema-only'],
  name: 'localizationTranslations',
  model: 'LocalizationTranslationModel',
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
});
