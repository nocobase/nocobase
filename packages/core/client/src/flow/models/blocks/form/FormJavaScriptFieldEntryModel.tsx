/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildWrapperFieldChildren, escapeT, FlowModelContext } from '@nocobase/flow-engine';
import { FormCustomItemModel } from './FormCustomItemModel';

/**
 * “JavaScript 字段（可编辑）”菜单入口（表单）：
 * - 出现在 FormCustomItemModel 分组（Others）中；
 * - 子项列出集合字段；
 * - 点击后创建标准 FormItemModel，并将子字段设置为 JSEditableFieldModel。
 */
export class FormJavaScriptFieldEntryModel extends FormCustomItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'FormItemModel',
      fieldUseModel: 'JSEditableFieldModel',
    });
    const [group] = groups || [];
    if (!group) return groups;
    return [
      {
        ...group,
        children: (innerCtx: FlowModelContext) => {
          const reGroups = buildWrapperFieldChildren(innerCtx, {
            useModel: 'FormItemModel',
            fieldUseModel: 'JSEditableFieldModel',
            // 对齐 FormItemModel.defineChildren 的 fullName 行为，保证 toggle 共享
            associationPathName: (innerCtx as any).prefixFieldPath,
          });
          return reGroups?.[0]?.children || [];
        },
      },
    ];
  }
}

FormJavaScriptFieldEntryModel.define({
  label: escapeT('JavaScript field (editable)'),
  sort: 110,
});
