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
    {
      type: 'hasMany',
      name: 'records',
      target: 'userDataSyncRecords',
      sourceKey: 'id',
      foreignKey: 'sourceId',
    },
    {
      name: 'authenticator',
      interface: 'input',
      type: 'belongsTo',
      target: 'authenticators',
      targetKey: 'id',
      foreignKey: 'authenticatorId',
      uiSchema: {
        type: 'object',
        title: '{{t("Authenticator")}}',
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
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      foreignKey: 'sourceId',
      otherKey: 'userId',
      onDelete: 'CASCADE',
      sourceKey: 'id',
      targetKey: 'id',
      through: 'usersSyncSources',
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'departments',
      target: 'departments',
      foreignKey: 'sourceId',
      otherKey: 'departmentId',
      onDelete: 'CASCADE',
      sourceKey: 'id',
      targetKey: 'id',
      through: 'departmentsSyncSources',
    },
  ],
});
