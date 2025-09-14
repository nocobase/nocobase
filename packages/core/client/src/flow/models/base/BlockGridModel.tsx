/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import _ from 'lodash';
import React from 'react';
import { FilterManager } from '../blocks/filter-manager/FilterManager';
import { GridModel } from './GridModel';

export class BlockGridModel extends GridModel {
  subModelBaseClasses = ['DataBlockModel', 'FilterBlockModel', 'BlockModel'];

  onInit(options: any) {
    super.onInit(options);
    this.context.defineProperty('blockGridModel', {
      value: this,
    });
    this.context.defineProperty('filterManager', {
      once: true,
      get: () => {
        return new FilterManager(this, options['filterManager']);
      },
    });
  }

  get filterManager(): FilterManager {
    return this.context.filterManager;
  }

  serialize() {
    const data = super.serialize();
    data['filterManager'] = this.filterManager.getFilterConfigs();
    return data;
  }

  renderAddSubModelButton() {
    return (
      <>
        <AddSubModelButton model={this} subModelKey="items" subModelBaseClasses={this.subModelBaseClasses}>
          <FlowSettingsButton icon={<PlusOutlined />}>{this.context.t('Add block')}</FlowSettingsButton>
        </AddSubModelButton>
      </>
    );
  }

  render() {
    return <div style={{ padding: this.context.themeToken.marginBlock }}>{super.render()}</div>;
  }
}

BlockGridModel.registerFlow({
  key: 'blockGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', ctx.themeToken.marginBlock);
        ctx.model.setProps('colGap', ctx.themeToken.marginBlock);
      },
    },
  },
});
