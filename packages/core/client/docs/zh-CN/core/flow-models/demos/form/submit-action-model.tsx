import { Submit } from '@formily/antd-v5';
import { Modal } from 'antd';
import React from 'react';
import { ActionModel } from './action-model';

export class SubmitActionModel extends ActionModel {
  render() {
    return <Submit {...this.props}>{this.props.title || 'Submit'}</Submit>;
  }
}

SubmitActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        await ctx.model.parent.form.submit();
        const values = ctx.model.parent.form.values;
        await ctx.model.parent.resource.save(values);
        if (ctx.model.parent.dialog) {
          ctx.model.parent.dialog.close();
        }
      },
    },
  },
});
