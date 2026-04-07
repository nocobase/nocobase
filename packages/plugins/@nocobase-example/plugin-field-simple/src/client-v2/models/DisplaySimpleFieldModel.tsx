/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// TODO: client-v2 暂未提供 ClickableFieldModel，待实现后将下方注释取消

// import React from 'react';
// import { ClickableFieldModel } from '@nocobase/client-v2';
// import { DisplayItemModel } from '@nocobase/flow-engine';
// import { tExpr } from '../locale';
//
// export class DisplaySimpleFieldModel extends ClickableFieldModel {
//   public renderComponent(value) {
//     console.log('当前记录：', this.context.record);
//     console.log('当前记录 index：', this.context.recordIndex);
//     return <span>[{value}]</span>;
//   }
// }
//
// DisplaySimpleFieldModel.define({
//   label: tExpr('Simple field'),
// });
//
// DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
