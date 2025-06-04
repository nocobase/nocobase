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
  name: 'userWorkflowTasks',
  shared: true,
  fields: [
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
      name: 'type',
      type: 'string',
    },
    {
      type: 'json',
      name: 'stats',
      defaultValue: {},
    },
  ],
  indexes: [
    {
      unique: true,
      fields: ['userId', 'type'],
    },
  ],
};
