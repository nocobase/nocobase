/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionGroupModel, ActionModel } from '../../../../base';

export class StFormSubmitActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Submit'),
    type: 'primary',
    htmlType: 'submit',
  };
}

StFormSubmitActionModel.define({
  label: tExpr('Submit'),
});

StFormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  on: 'click',
  title: tExpr('Submit action settings'),
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
    save: {
      async handler(ctx, params) {
        const blockModel = ctx.blockModel;
        const subTableModel = blockModel.context.associationModel;
        try {
          await blockModel.form.validateFields();
          const values = blockModel.form.getFieldsValue(true);
          console.log(values);
          subTableModel.updateRow(values);
        } catch (error) {
          return;
        }
        ctx.message.success(ctx.t('Saved successfully'));
        if (ctx.view) {
          ctx.view.close();
        }
      },
    },
  },
});

export class SubTableFormActionGroupModel extends ActionGroupModel {
  static baseClass = StFormSubmitActionModel;
}
