/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Submit } from '@formily/antd-v5';
import React from 'react';
import { ActionModel } from './ActionModel';

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
