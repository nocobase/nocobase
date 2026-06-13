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
    return items.filter((item) => allowedSet.has(item.useModel || item.key));
  }
}
