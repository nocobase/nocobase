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

export async function canListUsers(ctx: FlowCtx) {
  return ctx.acl.can({
    resource: 'users',
    action: 'list',
  });
}

export async function canGetUser(ctx: FlowCtx, userId: number) {
  return ctx.acl.can({
    resource: 'users',
    action: 'get',
    filterByTk: userId,
  });
}

export async function canCreateUser(ctx: FlowCtx) {
  return ctx.acl.can({
    resource: 'users',
    action: 'create',
  });
}

export async function canUpdateUser(ctx: FlowCtx, userId: number) {
  return ctx.acl.can({
    resource: 'users',
    action: 'update',
    filterByTk: userId,
  });
}

export async function canDestroyUsers(ctx: FlowCtx, userId?: number) {
  return ctx.acl.can({
    resource: 'users',
    action: 'destroy',
    ...(userId ? { filterByTk: userId } : {}),
  });
}

export async function canReadFields(ctx: FlowCtx, fields: string[]) {
  return ctx.acl.can({
    resource: 'users',
    action: 'get',
    fields,
  });
}

export async function canWriteFields(ctx: FlowCtx, fields: string[]) {
  return ctx.acl.can({
    resource: 'users',
    action: 'update',
    fields,
  });
}
