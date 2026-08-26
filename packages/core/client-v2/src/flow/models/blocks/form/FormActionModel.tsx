/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DefaultStructure, FlowExitAllException, tExpr } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { AxiosRequestConfig } from 'axios';
import { ActionModel } from '../../base/ActionModelCore';
import { AssignFormModel } from '../assign-form/AssignFormModel';
import {
  createAssignFieldValuesStep,
  createAssignFormSubModelOptions,
  getAssignFieldValuesDefaultParams,
} from '../assign-form/assignFieldValuesFlow';
import { shouldSkipSubmitValidation, validateSubmitForm } from './submitValues';

export class FormActionModel<T extends DefaultStructure = DefaultStructure> extends ActionModel<T> {}

export class FormSubmitActionModel extends FormActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  assignFormUid?: string;

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
  createModelOptions: (ctx) => ({
    subModels: {
      assignForm: createAssignFormSubModelOptions(ctx),
    },
  }),
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
            await validateSubmitForm({
              form: ctx.form,
              blockModel: ctx.blockModel,
              flowSettingsEnabled: ctx?.flowSettingsEnabled,
              skipValidator: shouldSkipSubmitValidation(ctx?.model),
            });
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
    skipRequiredValidation: {
      title: tExpr('Skip required validation'),
      uiMode: { type: 'switch', key: 'skipValidator' },
      defaultParams: {
        skipValidator: false,
      },
      handler() {},
    },
    assignFieldValues: createAssignFieldValuesStep({
      settingsFlowKey: 'submitSettings',
      title: tExpr('Assign field values'),
    }),
    saveResource: {
      async defaultParams(ctx) {
        return getAssignFieldValuesDefaultParams(ctx, 'submitSettings');
      },
      async handler(ctx, params) {
        if (!ctx?.resource) {
          throw new Error('Resource is not initialized');
        }
        if (!ctx.blockModel) {
          throw new Error('Block model is not initialized');
        }
        try {
          ctx.model.setProps('loading', true);
          const { submitHandler } = await import('./submitHandler');
          await submitHandler(ctx, params);
        } catch (error) {
          ctx.model.setProps('loading', false);
          if (error instanceof FlowExitAllException) {
            throw error;
          }
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          ctx.exit();
        } finally {
          ctx.model.setProps('loading', false);
        }
      },
    },
    afterSuccess: {
      use: 'afterSuccess',
    },
  },
});
