/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@formily/reactive';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

import { GridModel } from './gridModel';
import { uid } from '@nocobase/utils/client';
import { Spin } from 'antd';

export class TabModel extends FlowModel {
  gridModel: GridModel | null = null;

  constructor(options: { uid: string; stepParams?: any }) {
    super(options);
    define(this, {
      gridModel: observable,
      setGridModel: action,
    });
  }

  setGridModel(gridModel: GridModel) {
    this.gridModel = gridModel;
  }

  render() {
    console.log('TabModel.render: Rendering tab', this.uid, 'gridModel:', !!this.gridModel);

    return (
      <div
        style={{
          backgroundColor: '#f0f2f5',
          minHeight: '400px',
          padding: '16px',
        }}
      >
        {/* Grid 内容区域 */}
        {this.gridModel ? (
          <FlowModelRenderer model={this.gridModel} />
        ) : (
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '6px',
              minHeight: '200px',
              border: '1px solid #f0f0f0',
              textAlign: 'center',
              color: '#999',
            }}
          >
            <Spin />
          </div>
        )}
      </div>
    );
  }
}

TabModel.registerFlow('defaultFlow', {
  key: 'defaultFlow',
  auto: true,
  steps: {
    step1: {
      handler(_ctx, model: TabModel, params) {
        model.setProps('key', model.uid);
        model.setProps('label', params.title || `Tab ${model.uid.slice(-6)}`);
        model.setProps('title', params.title || `Tab ${model.uid.slice(-6)}`);
        model.setProps('content', params.content || 'Default tab content');
      },
    },
  },
});

TabModel.registerFlow('contentFlow', {
  key: 'contentFlow',
  on: { eventName: 'onActive' },
  steps: {
    createGrid: {
      async handler(_ctx, model: TabModel, _params) {
        console.log('TabModel.contentFlow.createGrid: Creating GridModel for tab:', model.uid);
        // 创建 GridModel
        const gridModel = model.flowEngine.createModel<GridModel>({
          use: 'GridModel',
        });
        model.setGridModel(gridModel);
      },
    },
    loadBlocks: {
      async handler(_ctx, model: TabModel, _params) {
        // 创建一些默认的 blocks
        // TODO: 这里应该从后端加载
        if (model.gridModel) {
          const defaultBlocks = [
            { type: 'text', content: 'Welcome to this tab!' },
            { type: 'image', content: 'Image placeholder' },
          ];

          for (let i = 0; i < defaultBlocks.length; i++) {
            const blockData = defaultBlocks[i];
            await model.gridModel.addItem(0, i, {
              uid: uid(),
              use: 'BlockModel',
              stepParams: {
                defaultFlow: {
                  setBlockInfo: {
                    content: blockData.content,
                  },
                },
              },
            });
          }
        }
      },
    },
  },
});
