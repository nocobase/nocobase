/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ClickableFieldModel } from '@nocobase/client';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import React from 'react';
import { tExpr } from '../locale';

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'green',
};

export class PriorityFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    if (!value) return <span>-</span>;
    return <Tag color={priorityColors[value] || 'default'}>{value}</Tag>;
  }
}

PriorityFieldModel.define({
  label: tExpr('Priority tag'),
});

// 绑定到 input（单行文本）类型的字段接口
DisplayItemModel.bindModelToInterface('PriorityFieldModel', ['input']);
