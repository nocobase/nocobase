/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ClickableFieldModel, FieldModel } from '@nocobase/client';
import { DisplayItemModel } from '@nocobase/flow-engine';
import React from 'react';

export class DisplaySimpleFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

DisplayItemModel.bindModelToInterface('DisplaySimpleFieldModel', ['input']);
