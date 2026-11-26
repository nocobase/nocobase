/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, type Collection, type FlowModelContext, type SubModelItem } from '@nocobase/flow-engine';
import { TableAssociationFieldGroupModel } from './TableAssociationFieldGroupModel';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { buildJSFieldMenuChildren } from '../utils/transformChildrenToJS';

/**
 * “JavaScript 字段”菜单入口（表格）：
 * - 仅用于在“添加列”菜单中提供一个二级菜单；
 * - 子项为当前集合可选字段；
 * - 点击后创建 TableColumnModel，并将其 subModels.field 固定为 JSFieldModel。
 */
export class TableJSFieldItemModel extends TableCustomColumnModel {
  static async defineChildren(ctx: FlowModelContext) {
    const items = await buildJSFieldMenuChildren(ctx, {
      useModel: 'TableColumnModel',
      fieldUseModel: 'JSFieldModel',
      refreshTargets: ['TableColumnModel'],
      associationProvider: (inner) => TableAssociationFieldGroupModel.defineChildren(inner) as SubModelItem[],
    });
    const collection: Collection = ctx.model['collection'] || ctx.collection;
    const treeChildrenNames = new Set(
      collection
        .getFields()
        .filter((field) => field.options?.treeChildren)
        .map((field) => field.name),
    );
    return items.filter((item) => item.type === 'group' || !treeChildrenNames.has(item.key));
  }
}

TableJSFieldItemModel.define({
  label: tExpr('JS field'),
  searchable: true,
  searchPlaceholder: tExpr('Search fields'),
  // 提高排序到“字段类”列表的靠前位置，但不抢默认项
  sort: 110,
});
