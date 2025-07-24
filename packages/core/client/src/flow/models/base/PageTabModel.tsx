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
import { RemoteFlowModelRenderer } from '../../FlowPage';
import { BlockGridModel } from './GridModel';

export class PageTabModel extends FlowModel<{
  subModels: {
    grid: BlockGridModel;
  };
}> {
  render() {
    return (
      <div>
        <RemoteFlowModelRenderer parentId={this.uid} subKey={'grid'} showFlowSettings={false} />
      </div>
    );
  }
}

PageTabModel.registerFlow({
  key: 'pageTabSettings',
  steps: {
    step1: {
      async handler(ctx, params) {
        // model.setProps('label', `Tab123 - ${model.uid}`);
        // model.setProps('children', model.renderChildren());
      },
    },
  },
});
