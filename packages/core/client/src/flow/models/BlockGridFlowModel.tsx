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
import _ from 'lodash';
import React from 'react';
import { BlockFlowModel } from './BlockFlowModel';

function Grid({ items }) {
  return (
    <div>
      {items.map((item) => {
        return (
          <div key={item.uid} style={{ marginBottom: 16 }}>
            <FlowModelRenderer model={item} key={item.uid} showFlowSettings />
          </div>
        );
      })}
    </div>
  );
}

function AddBlockButton({ model }) {
  return (
    <Dropdown
      menu={{
        onClick: (info) => {
          const BlockModel = model.flowEngine.getModelClass(info.key);
          model.addItem(_.cloneDeep(BlockModel.meta.defaultOptions));
        },
        items: model.getBlockModels(),
      }}
    >
      <Button>Add block</Button>
    </Dropdown>
  );
}

export class BlockGridFlowModel extends FlowModel {
  onInit(options: any) {
    const items = options.items || [];
    items.forEach((item: any) => {
      this.addSubModel('items', item);
    });
  }

  addItem(item) {
    const model = this.addSubModel('items', item);
    model.save();
  }

  getBlockModels() {
    return [...this.flowEngine.getModelClasses()]
      .filter(([, Model]) => {
        return Model.prototype instanceof BlockFlowModel;
      })
      .map(([key, Model]) => {
        const meta = (Model as typeof BlockFlowModel).meta;
        return {
          key,
          label: meta.title,
        };
      });
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <h1>Grid Flow Model - {this.uid}</h1>
        <p>This is a placeholder for the Grid Flow Model content.</p>
        <Grid items={(this.subModels.items as any[] || []).slice()} />
        <br />
        <AddBlockButton model={this} />
      </div>
    );
  }
}
