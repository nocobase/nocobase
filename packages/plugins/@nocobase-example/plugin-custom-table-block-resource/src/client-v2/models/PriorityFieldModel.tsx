/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// TODO: client-v2 暂未提供 ClickableFieldModel，待实现后将下方注释取消

// import { ClickableFieldModel } from '@nocobase/client-v2';
// import { DisplayItemModel } from '@nocobase/flow-engine';
// import { Tag } from 'antd';
// import React from 'react';
// import { tExpr } from '../locale';
//
// const priorityColors: Record<string, string> = {
//   high: 'red',
//   medium: 'orange',
//   low: 'green',
// };
//
// export class PriorityFieldModel extends ClickableFieldModel {
//   public renderComponent(value: string) {
//     if (!value) return <span>-</span>;
//     return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
//   }
// }
//
// PriorityFieldModel.define({
//   label: tExpr('Priority tag'),
// });
//
// DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
