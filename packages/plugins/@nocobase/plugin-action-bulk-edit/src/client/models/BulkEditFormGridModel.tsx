/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormGridModel } from '@nocobase/client';
import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import { tExpr } from '@nocobase/flow-engine';

export class BulkEditFormGridModel extends FormGridModel {
  // 显示字段的设置项
  // itemSettingsMenuLevel = 3;

  renderAddSubModelButton() {
    return (
      <AddSubModelButton
        subModelKey="items"
        subModelBaseClasses={[
          this.context.getModelClassName('BulkEditFormItemModel'),
          // this.context.getModelClassName('FormCustomItemModel'),
          // this.context.getModelClassName('FormJSFieldItemModel'),
        ].filter(Boolean)}
        model={this}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}
BulkEditFormGridModel.define({
  label: tExpr('Bulk Edit Form Grid'),
});
