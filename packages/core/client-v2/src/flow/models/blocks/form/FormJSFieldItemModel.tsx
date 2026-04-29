/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, FlowModel, FlowModelContext } from '@nocobase/flow-engine';
import { buildJSFieldMenuChildren } from '../utils/transformChildrenToJS';

/**
 * “JavaScript 字段（可编辑）”菜单入口（表单）：
 * - 作为独立分组（在 FormGrid 的 subModelBaseClasses 中显式包含本类）；
 * - 子项列出集合字段；
 * - 点击后创建标准 FormItemModel，并将子字段设置为 JSEditableFieldModel。
 */
export class FormJSFieldItemModel extends FlowModel {
  static defineChildren(ctx: FlowModelContext) {
    return buildJSFieldMenuChildren(ctx, {
      useModel: 'FormItemModel',
      fieldUseModel: 'JSEditableFieldModel',
      associationPathName: ctx.prefixFieldPath,
      refreshTargets: ['FormItemModel', 'FilterFormItemModel'],
    });
  }
}

FormJSFieldItemModel.define({
  label: tExpr('JS field'),
  searchable: true,
  searchPlaceholder: tExpr('Search fields'),
  menuType: 'submenu',
  sort: 110,
});
