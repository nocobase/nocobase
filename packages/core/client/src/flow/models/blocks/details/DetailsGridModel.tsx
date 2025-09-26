/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel, GridModel } from '../../base';
import { DetailsBlockModel } from './DetailsBlockModel';
import { DetailsItemModel } from './DetailsItemModel';

export class DetailsGridModel extends GridModel<{
  parent: DetailsBlockModel;
  subModels: { items: FieldModel[] };
}> {
  itemSettingsMenuLevel = 2;
  itemFlowSettings = {
    showBackground: true,
    style: {
      top: -6,
      left: -6,
      right: -6,
      bottom: -6,
    },
  };
  renderAddSubModelButton() {
    const blockModel = this.context.blockModel as DetailsBlockModel;

    return (
      <AddSubModelButton
        model={this}
        subModelKey={'items'}
        subModelBaseClasses={[
          this.context.getModelClassName('DetailsItemModel'),
          this.context.getModelClassName('DetailsAssociationFieldGroupModel'),
          this.context.getModelClassName('DetailsCustomItemModel'),
        ].filter(Boolean)}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}

DetailsGridModel.registerFlow({
  key: 'detailFieldGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});
