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
  migrationRules: ['schema-only'],
  autoGenId: false,
  name: 'aiConversations',
  fields: [
    {
      name: 'sessionId',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'topicId',
      type: 'string',
    },
    {
      name: 'user',
      type: 'belongsTo',
      target: 'users',
      targetKey: 'id',
      foreignKey: 'userId',
    },
    {
      name: 'aiEmployee',
      type: 'belongsTo',
      target: 'aiEmployees',
      targetKey: 'username',
      foreignKey: 'aiEmployeeUsername',
    },
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'messages',
      type: 'hasMany',
      target: 'aiMessages',
      sourceKey: 'sessionId',
      foreignKey: 'sessionId',
      onDelete: 'CASCADE',
    },
    {
      name: 'options',
      type: 'jsonb',
    },
  ],
});
