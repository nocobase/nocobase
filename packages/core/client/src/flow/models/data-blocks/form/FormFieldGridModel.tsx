/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import { SettingOutlined } from '@ant-design/icons';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { GridModel } from '../../base/GridModel';
import { CollectionFieldFormItemModel } from './FormItem/CollectionFieldFormItemModel';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';
import { FormModel } from './FormModel';

export class FormFieldGridModel extends GridModel<{
  parent: FormModel;
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
    const formModelInstance = this.context.blockModel as FormModel;

    return (
      <>
        <AddSubModelButton
          subModelKey="items"
          subModelBaseClasses={['CollectionFieldFormItemModel', 'FormCustomFormItemModel']}
          model={this}
          afterSubModelAdd={async (field: CollectionFieldFormItemModel) => {
            this.context.blockModel.addAppends(field.fieldPath, true);
          }}
          keepDropdownOpen
        >
          <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
        </AddSubModelButton>
        {/* <FlowSettingsButton
          onClick={() => {
            this.openStepSettingsDialog(GRID_FLOW_KEY, GRID_STEP);
          }}
        >
          {t('Configure rows')}
        </FlowSettingsButton> */}
      </>
    );
  }
}

FormFieldGridModel.registerFlow({
  key: 'formFieldGridSettings',
  steps: {
    init: {
      async handler(ctx, params) {
        await ctx.model.applySubModelsAutoFlows('items');
      },
    },
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});
