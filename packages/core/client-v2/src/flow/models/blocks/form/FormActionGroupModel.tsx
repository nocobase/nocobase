/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionGroupModel } from '../../base/ActionGroupModel';
import { FormActionModel } from './FormActionModel';
import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';

async function filterAllowedFormActionItems(
  items: SubModelItem[],
  allowedSet: Set<string>,
  ctx: FlowModelContext,
): Promise<SubModelItem[]> {
  const filtered: SubModelItem[] = [];

  for (const item of items) {
    if (item.useModel) {
      if (allowedSet.has(item.useModel)) {
        filtered.push(item);
      }
      continue;
    }

    if (Array.isArray(item.children)) {
      const children = await filterAllowedFormActionItems(item.children, allowedSet, ctx);
      if (children.length > 0 || item.createModelOptions) {
        filtered.push({ ...item, children });
      }
      continue;
    }

    if (typeof item.children === 'function') {
      const resolveChildren = item.children;
      filtered.push({
        ...item,
        children: async (childCtx) => {
          const children = await resolveChildren(childCtx);
          return filterAllowedFormActionItems(children, allowedSet, childCtx);
        },
      });
      continue;
    }

    if (item.key && allowedSet.has(item.key)) {
      filtered.push(item);
    }
  }

  return filtered;
}

export class FormActionGroupModel extends ActionGroupModel {
  static baseClass = FormActionModel;

  static async defineChildren(ctx) {
    const allowedModelNames = ctx.allowedFormActionModelNames;

    if (!Array.isArray(allowedModelNames) || allowedModelNames.length === 0) {
      return super.defineChildren(ctx);
    }

    await Promise.all(allowedModelNames.map((name) => ctx.engine?.getModelClassAsync?.(name)));

    const items = await super.defineChildren(ctx);
    const allowedSet = new Set(allowedModelNames);
    return filterAllowedFormActionItems(items, allowedSet, ctx);
  }
}
