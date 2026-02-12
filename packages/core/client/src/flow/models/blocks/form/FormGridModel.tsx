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
import { Skeleton } from 'antd';

export type DefaultFormGridStructure = {
  parent: FormBlockModel;
  subModels: { items: FieldModel[] };
};

export class FormGridModel<T extends DefaultFormGridStructure = DefaultFormGridStructure> extends GridModel<T> {
  itemFallback = (<Skeleton.Input block size="small" style={{ marginBottom: '0.5rem' }} />);
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

  render() {
    const height = this.props?.height;
    const heightModel = this.props?.heightModel;
    const token = this.context.themeToken;
    const content = super.render();
    if (heightModel === 'defaultHeight') {
      return content;
    }
    return (
      <div
        style={{
          height,
          overflowY: 'auto',
          marginLeft: `-${token.marginLG}px`,
          marginRight: `-${token.marginLG}px`,
          paddingLeft: `${token.marginLG}px`,
          paddingRight: `${token.marginLG}px`,
          paddingTop: 5,
        }}
      >
        {content}
      </div>
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
