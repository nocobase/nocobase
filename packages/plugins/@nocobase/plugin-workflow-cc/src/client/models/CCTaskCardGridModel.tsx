/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { DetailsGridModel } from '@nocobase/client';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';

/**
 * 抄送任务卡片详情的字段网格
 */
export class CCTaskCardGridModel extends DetailsGridModel {
  renderAddSubModelButton() {
    if (!this.context.flowSettingsEnabled) {
      return null;
    }

    return (
      <AddSubModelButton
        model={this}
        subModelKey={'items'}
        subModelBaseClasses={[
          this.context.getModelClassName('CCTaskCardDetailsItemModel'),
          this.context.getModelClassName('CCTaskCardDetailsAssociationFieldGroupModel'),
          this.context.getModelClassName('DetailsCustomItemModel'),
        ].filter(Boolean)}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}
