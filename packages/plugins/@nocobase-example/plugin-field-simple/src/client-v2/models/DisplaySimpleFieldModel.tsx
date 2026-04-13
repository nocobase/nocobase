/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ClickableFieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value: string) {
    console.log('current record：', this.context.record);
    console.log('current record index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

DisplaySimpleFieldModel.define({
  label: tExpr('Simple field'),
});

DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
