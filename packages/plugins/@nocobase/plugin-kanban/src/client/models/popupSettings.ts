/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { openView } from '@nocobase/client';

export const normalizeKanbanPopupTargetUid = (value?: string) => {
  if (!value?.trim()) {
    return undefined;
  }

  return value.trim();
};

export const normalizeKanbanPopupTemplateUid = (value?: string) => {
  return value?.trim() ? value.trim() : undefined;
};

export const resolveKanbanOpenViewDefaultParams = async (ctx: any) => {
  const commonDefaultParams = openView.defaultParams;
  const normalizedCtx = {
    getPropertyMetaTree: ctx.getPropertyMetaTree || (() => []),
    blockModel: ctx.blockModel || ctx.model?.parent,
    collection: ctx.collection || ctx.model?.collection || ctx.model?.parent?.collection,
    resource: ctx.resource || ctx.model?.resource || ctx.model?.parent?.resource,
    ...ctx,
  };

  return typeof commonDefaultParams === 'function'
    ? (await commonDefaultParams(normalizedCtx)) || {}
    : commonDefaultParams || {};
};
