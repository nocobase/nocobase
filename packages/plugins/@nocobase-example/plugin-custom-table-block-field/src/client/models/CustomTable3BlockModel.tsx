/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ClickableFieldModel, TableBlockModel, TableColumnModel } from '@nocobase/client';
import React from 'react';

export class CustomTable3BlockModel extends TableBlockModel {
  customModelClasses = {
    TableColumnModel: 'CustomTable3ColumnModel',
    TableAssociationFieldGroupModel: null,
  };
}

export class CustomTable3ColumnModel extends TableColumnModel {}

export class CustomTable3NicknameFieldModel extends ClickableFieldModel {
  public renderComponent(value) {
    console.log('当前记录：', this.context.record);
    console.log('当前记录 index：', this.context.recordIndex);
    return <span>[{value}]</span>;
  }
}

CustomTable3ColumnModel.bindModelToInterface('CustomTable3NicknameFieldModel', ['input'], {
  isDefault: true,
  when(ctx, fieldInstance) {
    return fieldInstance.name === 'nickname';
  },
});
