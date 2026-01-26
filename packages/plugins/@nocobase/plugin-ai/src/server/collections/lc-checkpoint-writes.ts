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
  name: 'lcCheckpointWrites',
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  fields: [
    {
      name: 'threadId',
      type: 'string',
      allowNull: false,
      primaryKey: true,
      length: 128,
    },
    {
      name: 'checkpointNs',
      type: 'string',
      allowNull: false,
      defaultValue: '',
      primaryKey: true,
      length: 128,
    },
    {
      name: 'checkpointId',
      type: 'string',
      allowNull: false,
      primaryKey: true,
      length: 128,
    },
    {
      name: 'taskId',
      type: 'string',
      allowNull: false,
      primaryKey: true,
      length: 128,
    },
    {
      name: 'idx',
      type: 'integer',
      allowNull: false,
      primaryKey: true,
    },
    {
      name: 'channel',
      type: 'string',
      allowNull: false,
      length: 128,
    },
    {
      name: 'type',
      type: 'string',
      length: 128,
    },
    {
      name: 'blob',
      type: 'blob',
      allowNull: false,
    },
  ],
});
