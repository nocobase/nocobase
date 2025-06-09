import { FlowModel } from '@nocobase/flow-engine';
import React from 'react';

export class ActionModel extends FlowModel {
  render() {
    return <a>{this.props.title}</a>;
  }
}

ActionModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.model.setProps('title', params.title);
      },
    },
  },
});
