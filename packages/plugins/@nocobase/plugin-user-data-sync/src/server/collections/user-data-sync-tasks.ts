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
  migrationRules: ['schema-only', 'overwrite'],
  name: 'userDataSyncTasks',
  title: '{{t("Sync Tasks")}}',
  sortable: 'sort',
  model: 'SyncTaskModel',
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
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
      name: 'batch',
      interface: 'input',
      type: 'string',
      allowNull: false,
      unique: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Batch")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'source',
      interface: 'input',
      type: 'belongsTo',
      target: 'userDataSyncSources',
      targetKey: 'id',
      foreignKey: 'sourceId',
      allowNull: false,
      uiSchema: {
        type: 'object',
        title: '{{t("Source")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          fieldNames: {
            value: 'id',
            label: 'name',
          },
        },
        required: true,
        'x-read-pretty': true,
      },
    },
    {
      name: 'status',
      interface: 'Select',
      type: 'string',
      allowNull: false,
      uiSchema: {
        type: 'string',
        title: '{{t("Status")}}',
        'x-component': 'Select',
        required: true,
      },
    },
    {
      name: 'message',
      interface: 'input',
      type: 'string',
      allowNull: true,
      uiSchema: {
        type: 'string',
        title: '{{t("Message")}}',
        'x-component': 'Input',
        required: false,
      },
    },
    {
      name: 'cost',
      interface: 'input',
      type: 'integer',
      allowNull: true,
      uiSchema: {
        type: 'integer',
        title: '{{t("Cost")}}',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        required: false,
      },
    },
  ],
});
