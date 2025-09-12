/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildWrapperFieldChildren, escapeT, FlowModelContext } from '@nocobase/flow-engine';
import { TableColumnModel } from './TableColumnModel';
import { TableCustomColumnModel } from './TableCustomColumnModel';

/**
 * “JavaScript 字段”菜单入口（表格）：
 * - 仅用于在“添加列”菜单中提供一个二级菜单；
 * - 子项为当前集合可选字段；
 * - 点击后创建 TableColumnModel，并将其 subModels.field 固定为 JSFieldModel。
 */
export class TableJavaScriptFieldEntryModel extends TableCustomColumnModel {
  static defineChildren(ctx: FlowModelContext) {
    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'TableColumnModel',
      fieldUseModel: 'JSFieldModel',
    });
    const [group] = groups || [];
    if (!group) return groups;
    // 将子项改为函数，确保每次展开时重新计算 toggle 状态
    return [
      {
        ...group,
        children: (innerCtx: FlowModelContext) => {
          const reGroups = buildWrapperFieldChildren(innerCtx, {
            useModel: 'TableColumnModel',
            fieldUseModel: 'JSFieldModel',
          });
          return reGroups?.[0]?.children || [];
        },
      },
    ];
  }
}

TableJavaScriptFieldEntryModel.define({
  label: escapeT('JavaScript field'),
  // 提高排序到“字段类”列表的靠前位置，但不抢默认项
  sort: 110,
});
