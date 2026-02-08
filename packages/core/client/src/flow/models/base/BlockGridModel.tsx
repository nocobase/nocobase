/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { AddSubModelButton, DragOverlayConfig, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import { FilterManager } from '../blocks/filter-manager/FilterManager';
import { GridModel } from './GridModel';

export class BlockGridModel extends GridModel {
  dragOverlayConfig: DragOverlayConfig = {
    // 列内插入
    columnInsert: {
      before: { offsetTop: -24 },
      after: { offsetTop: 24 },
    },
    // 列边缘
    columnEdge: {
      left: { offsetLeft: -5 },
      right: { offsetLeft: 6 },
    },
  };

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

  get subModelBaseClasses() {
    const inputArgs = this.context.view?.inputArgs ?? {};
    if (inputArgs.collectionName && !inputArgs.filterByTk) {
      // 新增记录的场景，需要移除掉 筛选区块
      return ['DataBlockModel', 'FilterBlockModel', 'BlockModel'];
    }
    return ['DataBlockModel', 'FilterBlockModel', 'BlockModel'];
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
      <AddSubModelButton model={this} subModelKey="items" subModelBaseClasses={this.subModelBaseClasses}>
        <FlowSettingsButton icon={<PlusOutlined />} data-flow-add-block>
          {this.context.t('Add block')}
        </FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  render() {
    return (
      <div
        className="nb-block-grid"
        style={
          this.context.disableBlockGridPadding
            ? null
            : { padding: this.context.isMobileLayout ? 8 : this.context.themeToken.marginBlock, paddingBottom: 0 }
        }
      >
        {super.render()}
      </div>
    );
  }
}

BlockGridModel.registerFlow({
  key: 'blockGridSettings',
  steps: {
    grid: {
      handler(ctx, params) {
        ctx.model.setProps('rowGap', ctx.isMobileLayout ? 12 : ctx.themeToken.marginBlock);
        ctx.model.setProps('colGap', ctx.themeToken.marginBlock);
      },
    },
  },
});
