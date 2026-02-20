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
import { AxiosRequestConfig } from 'axios';
import { ActionModel } from '../../base';
import { submitHandler } from './submitHandler';

export class FormActionModel extends ActionModel {}

export class FormSubmitActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Submit'),
    type: 'primary',
    htmlType: 'submit',
  };

  /**
   * 简化设置保存请求配置的方式
   * @param requestConfig
   */
  setSaveRequestConfig(requestConfig?: AxiosRequestConfig) {
    this.setStepParams('submitSettings', 'saveResource', {
      requestConfig,
    });
  }
}

FormSubmitActionModel.define({
  label: tExpr('Submit'),
});

FormSubmitActionModel.registerFlow({
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
              title: ctx.t(params.title, { ns: 'lm-flow-engine' }),
              content: ctx.t(params.content, { ns: 'lm-flow-engine' }),
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
        if (!ctx?.resource) {
          throw new Error('Resource is not initialized');
        }
        if (!ctx.blockModel) {
          throw new Error('Block model is not initialized');
        }
        try {
          ctx.model.setProps('loading', true);
          await submitHandler(ctx, params);
          ctx.message.success(ctx.t('Saved successfully'));
          ctx.model.setProps('loading', false);
        } catch (error) {
          ctx.model.setProps('loading', false);
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          ctx.exit();
        } finally {
          ctx.model.setProps('loading', false);
        }
      },
    },
    refreshAndClose: {
      async handler(ctx) {
        if (ctx.view) {
          ctx.view.close();
        }
      },
    },
  },
});
