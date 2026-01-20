/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export function registerMetaEnabledProperties(ctx: FlowCtx) {
  ctx.defineProperty('user', {
    get: () => ({
      id: 1,
      username: 'admin',
      roles: [
        { name: 'root', title: 'Super Admin' },
        { name: 'admin', title: 'Admin' },
      ],
    }),
    meta: {
      type: 'object',
      title: 'User',
      properties: {
        id: { type: 'number', title: 'ID' },
        username: { type: 'string', title: 'Username' },
        roles: {
          type: 'array',
          title: 'Roles',
          properties: {
            name: { type: 'string', title: 'Name' },
            title: { type: 'string', title: 'Title' },
          },
        },
      },
    },
  });

  ctx.defineProperty('record', {
    get: () => ({
      id: 42,
      title: 'Flow task',
    }),
    meta: {
      type: 'object',
      title: 'Record',
      properties: {
        id: { type: 'number', title: 'ID' },
        title: { type: 'string', title: 'Title' },
      },
    },
  });
}

export function getMetaTree(ctx: FlowCtx) {
  return ctx.getPropertyMetaTree();
}
