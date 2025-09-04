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
  dumpRules: {
    group: 'required',
  },
  migrationRules: ['overwrite', 'schema-only'],
  name: 'localizationTexts',
  model: 'LocalizationTextModel',
  createdBy: true,
  updatedBy: true,
  logging: true,
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
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
