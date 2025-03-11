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
  dumpRules: 'required',
  name: 'customRequests',
  autoGenId: false,
  migrationRules: ['overwrite', 'schema-only'],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      onDelete: 'CASCADE',
      through: 'customRequestsRoles',
      target: 'roles',
      foreignKey: 'customRequestKey',
      otherKey: 'roleName',
      sourceKey: 'key',
      targetKey: 'name',
    },
    {
      type: 'json',
      name: 'options', // 配置的请求参数都放这里
    },
  ],
});
