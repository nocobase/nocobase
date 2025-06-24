/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AddBlockButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import _ from 'lodash';
import React from 'react';
import { BlockModel } from './BlockModel';

function Grid({ items }) {
  return (
    <div>
      {items.map((item) => {
        return (
          <div key={item.uid} style={{ marginBottom: 16 }}>
            <FlowModelRenderer
              model={item}
              key={item.uid}
              showFlowSettings={{ showBackground: false }}
              showErrorFallback
            />
          </div>
        );
      })}
    </div>
  );
}

type GridModelStructure = {
  subModels: {
    items: BlockModel[];
  };
};

export class GridModel extends FlowModel<GridModelStructure> {
  subModelBaseClass = 'BlockModel';
  render() {
    return (
      <div style={{ padding: 16 }}>
        <Grid items={this.subModels.items?.slice() || []} />
        <AddBlockButton model={this} subModelKey="items" subModelBaseClass={this.subModelBaseClass} />
      </div>
    );
  }
}

export class BlockGridModel extends GridModel {
  subModelBaseClass = 'BlockModel';
}
