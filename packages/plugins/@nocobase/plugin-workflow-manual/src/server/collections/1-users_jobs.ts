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
  name: 'users_jobs',
  dumpRules: {
    group: 'log',
  },
  migrationRules: ['schema-only', 'skip'],
  shared: true,
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    {
      type: 'belongsTo',
      name: 'job',
      target: 'jobs',
      foreignKey: 'jobId',
      primaryKey: false,
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      primaryKey: false,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'belongsTo',
      name: 'execution',
    },
    {
      type: 'belongsTo',
      name: 'node',
      target: 'flow_nodes',
    },
    {
      type: 'belongsTo',
      name: 'workflow',
    },
    {
      type: 'integer',
      name: 'status',
    },
    {
      type: 'jsonb',
      name: 'result',
    },
  ],
});
