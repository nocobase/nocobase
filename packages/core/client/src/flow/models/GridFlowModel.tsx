/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card } from 'antd';
import React from 'react';

interface GridProps {
  items: string[][][]; // 三维数组：行-列-区块
  itemRender: (uid: string) => React.ReactNode;
}

function Grid({ items, itemRender }: GridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', gap: 8 }}>
          {row.map((col, colIdx) => (
            <div
              key={colIdx}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                // border: '1px solid #eee',
                // padding: 8,
              }}
            >
              {col.map((uid, blockIdx) => (
                <div style={{ width: '100%' }} key={blockIdx}>
                  {itemRender(uid)}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export class GridFlowModel extends FlowModel {
  items: Array<any>;

  onInit(options: any) {
    const items = options.items || [];
    this.items = observable.shallow([]);
    items.forEach((item: any) => {
      this.addSubModel('items', item);
    });
  }

  addItem(item) {
    const model = this.addSubModel('items', item);
    model.save();
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <h1>Grid Flow Model - {this.uid}</h1>
        <p>This is a placeholder for the Grid Flow Model content.</p>
        {this.items.map((item) => {
          return <FlowModelRenderer model={item} key={item.uid} showFlowSettings />;
        })}
        <br />
        <Button
          onClick={() => {
            this.addItem({
              use: 'HtmlBlockFlowModel',
              stepParams: {
                default: {
                  step1: {
                    html: `<h1>Hello, NocoBase!</h1>
<p>This is a simple HTML content rendered by FlowModel.</p>`,
                  },
                },
              },
            });
          }}
        >
          Add block
        </Button>
      </div>
    );
  }
}
