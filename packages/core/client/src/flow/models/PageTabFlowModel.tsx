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

export class PageTabFlowModel extends FlowModel {
  grid;

  onInit(options: any): void {
    if (options.grid) {
      this.grid = this.setSubModel('grid', options.grid);
    }
  }

  render() {
    console.log('TabFlowModel render', this.uid);
    return (
      <div>
        <FlowModelRenderer model={this.grid} />
      </div>
    );
  }
}

PageTabFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      async handler(ctx, model: PageTabFlowModel, params) {
        // model.setProps('label', `Tab123 - ${model.uid}`);
        // model.setProps('children', model.renderChildren());
      },
    },
  },
});
