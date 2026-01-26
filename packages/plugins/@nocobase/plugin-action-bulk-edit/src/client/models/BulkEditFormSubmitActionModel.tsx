/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, FieldModel, FormActionModel, FormSubmitActionModel, ActionModel } from '@nocobase/client';
import React from 'react';
import { Button, ButtonProps, message, Modal, Dropdown, DatePicker } from 'antd';
import { tExpr, FlowModelRenderer, useFlowEngine, useFlowSettingsContext } from '@nocobase/flow-engine';

export class BulkEditFormSubmitActionModel extends ActionModel {
  defaultProps: ButtonProps & { withScheduleSend?: boolean } = {
    title: tExpr('Submit'),
    type: 'primary',
  };
}

BulkEditFormSubmitActionModel.define({
  label: tExpr('Submit'),
  sort: 1,
});

BulkEditFormSubmitActionModel.registerFlow({
  key: 'sendSettings',
  title: tExpr('Send settings'),
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Submit record'),
        content: tExpr('Are you sure you want to save it?'),
      },
      async handler(ctx, params) {
        if (params.enable) {
          try {
            await ctx.form.validateFields();
            const confirmed = await ctx.modal.confirm({
              title: ctx.t(params.title),
              content: ctx.t(params.content),
              okText: ctx.t('Confirm'),
              cancelText: ctx.t('Cancel'),
            });

            if (!confirmed) {
              ctx.exit();
            }
          } catch (error) {
            ctx.exit();
          }
        }
      },
    },
    saveResource: {
      async handler(ctx, params) {
        const blockModel = ctx.blockModel;
        await blockModel.form.validateFields();
        const values = blockModel.form.getFieldsValue(true);
        console.log('BulkEditFormSubmitActionModel send flow handler called', ctx, params, values);
      },
    },
  },
});
