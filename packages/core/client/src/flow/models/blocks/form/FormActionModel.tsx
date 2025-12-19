/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { AxiosRequestConfig } from 'axios';
import { ActionModel } from '../../base';
import { EditFormModel } from './EditFormModel';
import { FormBlockModel } from './FormBlockModel';

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
        if (!ctx?.resource) {
          throw new Error('Resource is not initialized');
        }
        if (!ctx.blockModel) {
          throw new Error('Block model is not initialized');
        }
        const resource = ctx.resource;
        const blockModel = ctx.blockModel as FormBlockModel;
        try {
          await blockModel.form.validateFields();
          const values = blockModel.form.getFieldsValue(true);
          if (resource instanceof SingleRecordResource) {
            if (blockModel instanceof EditFormModel) {
              const currentFilterByTk = resource.getMeta('currentFilterByTk');
              if (!currentFilterByTk) {
                resource.isNewRecord = true; // 设置为新记录
              } else {
                resource.setFilterByTk(currentFilterByTk);
              }
            }
            const data: any = await resource.save(values, params.requestConfig);
            if (blockModel instanceof EditFormModel) {
              resource.isNewRecord = false;
              await resource.refresh();
            } else {
              blockModel.form.resetFields();
              blockModel.emitter.emit('onFieldReset');
              if (ctx.view.inputArgs.collectionName === blockModel.collection.name && ctx.view.inputArgs.onChange) {
                ctx.view.inputArgs.onChange(data?.data);
              }
            }
          } else if (resource instanceof MultiRecordResource) {
            const currentFilterByTk = resource.getMeta('currentFilterByTk');
            if (!currentFilterByTk) {
              ctx.message.error(ctx.t('No filterByTk found for multi-record resource.'));
              return;
            }
            await resource.update(currentFilterByTk, values, params.requestConfig);
          }
        } catch (error) {
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          return;
        }

        ctx.message.success(ctx.t('Saved successfully'));

        if (ctx.view) {
          const viewUid = ctx.view.inputArgs?.viewUid;
          const actionModel = ctx.engine.getModel(viewUid, true);

          if (actionModel) {
            actionModel.context.blockModel?.resource?.refresh();
          }

          ctx.view.close();
        }
      },
    },
  },
});
