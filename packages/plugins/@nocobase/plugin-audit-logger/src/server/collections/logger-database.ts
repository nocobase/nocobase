/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import { number } from 'packages/plugins/@nocobase/plugin-mock-collections/src/server/field-interfaces';

export default defineCollection({
  name: 'auditTrails', // auditLogs 与旧插件表名冲突
  createdBy: false,
  updatedBy: false,
  updatedAt: false,
  fields: [
    {
      name: 'uuid',
      type: 'uuid',
      unique: true,
    },
    {
      name: 'dataSource',
      type: 'string',
    },
    {
      name: 'resource',
      type: 'string',
    },
    {
      name: 'collection',
      type: 'string',
    },
    {
      name: 'association',
      type: 'string',
    },
    {
      name: 'resourceUk',
      type: 'string', // 可能是字符串或数字，统一用字符串存储？
    },
    {
      name: 'action',
      type: 'string',
    },
    {
      name: 'resourceId',
      type: 'string',
    },
    {
      name: 'userId',
      type: 'bigInt',
    },
    {
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      targetKey: 'id',
      foreignKey: 'userId',
    },
    {
      name: 'roleName',
      type: 'string',
    },
    {
      type: 'belongsTo',
      name: 'role',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
    },
    {
      name: 'ip',
      type: 'string',
    },
    {
      name: 'ua',
      type: 'string',
      length: 512,
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'createdAt',
      type: 'string',
    },
  ],
});
