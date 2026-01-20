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

export function useMultiRecordResource(ctx: FlowCtx) {
  const resource = ctx.useResource('MultiRecordResource');
  resource.setCollectionName('users');
  return resource;
}

export async function listUsers(ctx: FlowCtx) {
  const resource = ctx.useResource('MultiRecordResource');
  resource.setCollectionName('users');
  return resource.list({ filter: { status: 'active' } });
}

export async function getRecord(ctx: FlowCtx, id: number) {
  const resource = ctx.useResource('SingleRecordResource');
  resource.setCollectionName('users');
  return resource.get({ filterByPk: id });
}
