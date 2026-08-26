/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowModel } from '@nocobase/flow-engine';

/**
 * 作为字段子模型的入口类，实际实例化的目标类可通过 stepParams.fieldBinding.use 指定。
 * - 如果存在显式的 fieldBinding.use，则优先返回它；
 * - 否则回退到自身（保持原来的 use）。
 */
export class FieldModel<T = DefaultStructure> extends FlowModel<T> {
  static resolveUse(options: any, engine, parentModel) {
    const bindingUse = options?.stepParams?.fieldBinding?.use;
    // 避免入口与目标类间来回跳转：仅在 bindingUse 与当前 use 不一致时才跳转
    if (bindingUse && bindingUse !== options?.use) {
      return bindingUse;
    }
    return options?.use;
  }
}
