import { FlowModel } from '@nocobase/flow-engine';
import { Modal } from 'antd';
import React from 'react';

export class ActionModel extends FlowModel {
  set onClick(fn) {
    this.setProps('onClick', fn);
  }

  render() {
    return <a {...this.props}>{this.props.title || 'Action'}</a>;
  }
}

ActionModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.model.setProps('title', params.title);
        ctx.model.onClick = (e) => {
          ctx.model.dispatchEvent('click', {
            event: e,
            record: ctx.runtimeArgs.record,
          });
        };
      },
    },
  },
});

ActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        Modal.confirm({
          title: `${ctx.runtimeArgs?.record?.id}`,
          content: 'Are you sure you want to perform this action?',
          onOk: async () => {},
        });
      },
    },
  },
});
