/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { BlockGridFlowModel } from './BlockGridFlowModel';

export class PageTabFlowModel extends FlowModel<{
  subModels: {
    grid: BlockGridFlowModel;
  }
}> {

  render() {
    console.log('TabFlowModel render', this.uid);
    return (
      <div>
        <FlowModelRenderer model={this.subModels.grid} />
      </div>
    );
  }
}

PageTabFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      async handler(ctx, params) {
        // model.setProps('label', `Tab123 - ${model.uid}`);
        // model.setProps('children', model.renderChildren());
      },
    },
  },
});
