/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildWrapperFieldChildren, escapeT, FlowModelContext } from '@nocobase/flow-engine';
import { DetailsItemModel } from './DetailsItemModel';
import { DetailsCustomItemModel } from './DetailsCustomItemModel';

/**
 * “JavaScript 字段”菜单入口（详情）：
 * - 仅用于在“添加字段”菜单中提供一个二级菜单；
 * - 子项为当前集合可选字段；
 * - 点击后创建 DetailsItemModel，并将其 subModels.field 固定为 JSFieldModel。
 */
export class DetailsJavaScriptFieldEntryModel extends DetailsCustomItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const groups = buildWrapperFieldChildren(ctx, {
      useModel: 'DetailsItemModel',
      fieldUseModel: 'JSFieldModel',
    });
    return groups?.[0]?.children || [];
  }
}

DetailsJavaScriptFieldEntryModel.define({
  label: escapeT('JavaScript field'),
  searchable: true,
  searchPlaceholder: escapeT('Search fields'),
  sort: 110,
});
