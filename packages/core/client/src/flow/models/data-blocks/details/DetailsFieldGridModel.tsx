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
import { FieldModel } from '../../base/FieldModel';
import { GridModel } from '../../base/GridModel';
import { DetailItemModel } from './DetailItemModel';
import { DetailsModel } from './DetailsModel';

export class DetailsFieldGridModel extends GridModel<{
  parent: DetailsModel;
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
    const blockModel = this.context.blockModel as DetailsModel;

    return (
      <AddSubModelButton
        model={this}
        subModelKey={'items'}
        subModelBaseClasses={['DetailItemModel', 'AssociationFieldItemModel', 'DetailCustomModel']}
        afterSubModelInit={async (item: DetailItemModel) => {
          const field: any = item.subModels.field;
          if (field) {
            await field.applyAutoFlows();
          }
        }}
        afterSubModelAdd={async (item: DetailItemModel) => {
          blockModel.addAppends(item.fieldPath, true);
          blockModel.addAppends(item.associationPathName, true);
        }}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}

DetailsFieldGridModel.registerFlow({
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
