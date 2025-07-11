/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { EditFormModel, FormModel } from './FormModel';

export class FormActionModel extends ActionModel {}

export class FormSubmitActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Submit'),
    type: 'primary',
    htmlType: 'submit',
  };
}

FormSubmitActionModel.define({
  title: escapeT('Submit'),
});

FormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  on: 'click',
  steps: {
    step1: {
      async handler(ctx) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.message.error(ctx.t('No resource selected for submission.'));
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel as FormModel;
        try {
          await currentBlockModel.form.submit();
          const values = currentBlockModel.form.values;
          if (currentBlockModel.resource instanceof SingleRecordResource) {
            if (currentBlockModel instanceof EditFormModel) {
              const currentFilterByTk = currentBlockModel.resource.getMeta('currentFilterByTk');
              if (!currentFilterByTk) {
                currentBlockModel.resource.isNewRecord = true; // 设置为新记录
              }
            }
            await currentBlockModel.resource.save(values);
            if (currentBlockModel instanceof EditFormModel) {
              currentBlockModel.resource.isNewRecord = false;
              await currentBlockModel.resource.refresh();
            }
          } else if (currentBlockModel.resource instanceof MultiRecordResource) {
            const currentFilterByTk = currentBlockModel.resource.getMeta('currentFilterByTk');
            if (!currentFilterByTk) {
              ctx.message.error(ctx.t('No filterByTk found for multi-record resource.'));
              return;
            }
            await currentBlockModel.resource.update(currentFilterByTk, values);
          }
        } catch (error) {
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          return;
        }

        ctx.message.success(ctx.t('Saved successfully'));

        const parentBlockModel = ctx.shared?.currentFlow?.shared?.currentBlockModel as DataBlockModel;
        if (parentBlockModel) {
          parentBlockModel.resource.refresh();
        }
        if (ctx.shared.currentView && ctx.shared.closable) {
          ctx.shared.currentView.close();
        }
      },
    },
  },
});
