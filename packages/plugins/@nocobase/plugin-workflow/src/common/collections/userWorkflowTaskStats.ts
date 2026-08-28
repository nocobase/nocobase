/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only'],
  name: 'userWorkflowTaskStats',
  dataCategory: 'business',
  shared: true,
  fields: [
    {
      name: 'id',
      type: 'snowflakeId',
      primaryKey: true,
      allowNull: false,
    },
    {
      name: 'userId',
      type: 'bigInt',
    },
    {
      name: 'user',
      type: 'belongsTo',
      foreignKey: 'userId',
    },
    {
      name: 'workflowKey',
      type: 'string',
    },
    {
      name: 'type',
      type: 'string',
    },
    {
      name: 'pending',
      type: 'integer',
      defaultValue: 0,
    },
    {
      name: 'all',
      type: 'integer',
      defaultValue: 0,
    },
  ],
  indexes: [
    {
      unique: true,
      fields: ['userId', 'workflowKey', 'type'],
    },
    {
      fields: ['userId', 'workflowKey'],
    },
    {
      fields: ['userId', 'type'],
    },
  ],
};
