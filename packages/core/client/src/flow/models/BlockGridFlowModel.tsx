/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Dropdown } from 'antd';
import React from 'react';
import { BlockFlowModel } from './BlockFlowModel';

function Grid({ items }) {
  return (
    <div>
      {items.map((item) => {
        return <FlowModelRenderer model={item} key={item.uid} showFlowSettings />;
      })}
    </div>
  );
}

function AddBlockButton({ model }) {
  console.log('model.getBlockModels()', model.getBlockModels());
  return (
    <Dropdown
      menu={{
        onClick: (info) => {
          const BlockModel = model.flowEngine.getModelClass(info.key);
          model.addItem(BlockModel.getInitParams());
        },
        items: model.getBlockModels(),
      }}
    >
      <Button>Add block</Button>
    </Dropdown>
  );
}

export class BlockGridFlowModel extends FlowModel {
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

  getBlockModels() {
    return this.flowEngine
      .getModelClasses((ModelClass) => {
        return ModelClass.prototype instanceof BlockFlowModel;
      })
      .map((ModelClass) => {
        return {
          key: ModelClass.name,
          label: ModelClass.name,
        };
      });
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <h1>Grid Flow Model - {this.uid}</h1>
        <p>This is a placeholder for the Grid Flow Model content.</p>
        <Grid items={this.items.slice()} />
        <br />
        <AddBlockButton model={this} />
      </div>
    );
  }
}
