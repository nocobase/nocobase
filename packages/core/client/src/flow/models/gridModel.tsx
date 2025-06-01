/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@formily/reactive';
import { CreateModelOptions, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';
import { BlockModel } from './blockModel';

export interface GridItem {
  uid: string;
  use: string;
}

export class GridModel extends FlowModel {
  items: GridItem[][][] = observable([]);

  constructor(options: { uid: string; stepParams?: any }) {
    super(options);
    this.onInit();
  }

  onInit() {
    define(this, {
      items: observable,
      addItem: action,
      removeItem: action,
    });
  }

  async addItem(row: number, col: number, blockOptions?: CreateModelOptions, ctx?: any) {
    // 创建新的 BlockModel
    const model = this.flowEngine.createModel({
      use: 'BlockModel',
      ...blockOptions,
    }) as BlockModel;

    // 确保行存在
    while (this.items.length <= row) {
      this.items.push([]);
    }

    // 确保列存在
    while (this.items[row].length <= col) {
      this.items[row].push([]);
    }

    // 添加 item 到指定的行列
    const item: GridItem = { uid: model.uid, use: blockOptions.use };
    this.items[row][col].push(item);

    return model;
  }

  async removeItem(row: number, col: number, itemIndex: number) {
    if (this.items[row] && this.items[row][col] && this.items[row][col][itemIndex]) {
      const item = this.items[row][col][itemIndex];

      this.items[row][col].splice(itemIndex, 1);

      // TODO: 这里应该销毁对应的 BlockModel
      // 但需要从 flowEngine 中获取并销毁模型
      this.flowEngine.destroyModel(item.uid);

      await this.applyAutoFlows();
      return item;
    }
    return null;
  }

  renderItem(item: GridItem) {
    // 这里应该根据 uid 获取对应的 BlockModel 并渲染
    // 暂时返回一个简单的占位符
    const model = this.flowEngine.createModel({
      uid: item.uid,
      use: item.use,
    });
    if (!model) {
      return null;
    }
    return <FlowModelRenderer model={model} />;
  }

  render() {
    return (
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '6px',
          minHeight: '200px',
          border: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '16px' }}>
          {this.items.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: 8 }}>
              {row.map((col, colIdx) => (
                <div
                  key={colIdx}
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    border: '1px solid #eee',
                    padding: 8,
                    minHeight: '100px',
                  }}
                >
                  {col.map((item, blockIdx) => (
                    <div style={{ width: '100%' }} key={blockIdx}>
                      {this.renderItem(item)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <Button
          type="dashed"
          size="small"
          style={{
            borderColor: '#ff7875',
            color: '#ff7875',
            backgroundColor: 'white',
            borderStyle: 'dashed',
          }}
          onClick={async () => {
            await this.addItem(0, 0, {
              use: 'BlockModel',
              uid: 'block_' + Date.now(),
            });
          }}
        >
          + Add block
        </Button>
      </div>
    );
  }
}
