/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton, DragOverlayConfig } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel, GridModel } from '../../base';
import { FormBlockModel } from './FormBlockModel';

export type DefaultFormGridStructure = {
  parent: FormBlockModel;
  subModels: { items: FieldModel[] };
};

export class FormGridModel<T extends DefaultFormGridStructure = DefaultFormGridStructure> extends GridModel<T> {
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
  dragOverlayConfig: DragOverlayConfig = {
    // 列内插入
    columnInsert: {
      before: { offsetTop: -12, height: 24 },
      after: { offsetTop: 7, height: 24 },
    },
    // 列边缘
    columnEdge: {
      left: { offsetLeft: -5, width: 24 },
      right: { offsetLeft: 8, width: 24 },
    },
    // 行间隙
    rowGap: {
      above: { offsetTop: 0, height: 24 },
      below: { offsetTop: -14, height: 24 },
    },
  };
  renderAddSubModelButton() {
    return (
      <AddSubModelButton
        subModelKey="items"
        subModelBaseClasses={[
          this.context.getModelClassName('FormItemModel'),
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

FormGridModel.registerFlow({
  key: 'formFieldGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', 0);
        ctx.model.setProps('colGap', 16);
      },
    },
  },
});
