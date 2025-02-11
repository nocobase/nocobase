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
    group: 'third-party',
  },
  shared: true,
  migrationRules: ['overwrite', 'schema-only'],
  name: 'userDataSyncSources',
  title: '{{t("Sync Sources")}}',
  sortable: true,
  model: 'SyncSourceModel',
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
      name: 'name',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Source name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'sourceType',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Source Type")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      interface: 'input',
      type: 'string',
      name: 'displayName',
      uiSchema: {
        type: 'string',
        title: '{{t("Source display name")}}',
        'x-component': 'Input',
      },
      translation: true,
    },
    {
      type: 'boolean',
      name: 'enabled',
      defaultValue: false,
    },
    {
      type: 'json',
      name: 'options',
      allowNull: false,
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'tasks',
      target: 'userDataSyncTasks',
      sourceKey: 'id',
      foreignKey: 'sourceId',
    },
  ],
});
