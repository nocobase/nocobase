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
import { FormGridModel } from '@nocobase/client-v2';
import React from 'react';

import { tExpr } from '../locale';

export class MultiStepFormStepModel extends FormGridModel {
  renderAddSubModelButton() {
    return (
      <AddSubModelButton
        subModelKey="items"
        subModelBaseClasses={[
          this.context.getModelClassName('FormItemModel'),
          this.context.getModelClassName('FormAssociationFieldGroupModel'),
          this.context.getModelClassName('FormCustomItemModel'),
          this.context.getModelClassName('FormJSFieldItemModel'),
        ].filter(Boolean)}
        model={this}
        keepDropdownOpen
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Fields')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }
}

MultiStepFormStepModel.registerFlow({
  key: 'stepSettings',
  title: tExpr('Step settings'),
  steps: {
    title: {
      title: tExpr('Step title'),
      uiMode: { type: 'input', key: 'title' },
      defaultParams(ctx) {
        return {
          title: ctx.model.props?.title || tExpr('Untitled step'),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ title: params.title });
      },
    },
  },
});

MultiStepFormStepModel.define({
  label: tExpr('Step'),
  hide: true,
  createModelOptions: {
    use: 'MultiStepFormStepModel',
    props: {
      title: tExpr('Untitled step'),
    },
  },
});
