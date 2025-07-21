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
import { CollectionBlockModel } from '../../base/BlockModel';
import { EditFormModel } from './EditFormModel';
import { FormModel } from './FormModel';

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
    saveResource: {
      async handler(ctx) {
        console.log(ctx.blockModel.form.values);
        if (!ctx?.resource) {
          throw new Error('Resource is not initialized');
        }
        if (!ctx.blockModel) {
          throw new Error('Block model is not initialized');
        }
        const resource = ctx.resource;
        const blockModel = ctx.blockModel as FormModel;
        try {
          await blockModel.form.submit();
          const values = blockModel.form.values;
          if (resource instanceof SingleRecordResource) {
            if (blockModel instanceof EditFormModel) {
              const currentFilterByTk = resource.getMeta('currentFilterByTk');
              if (!currentFilterByTk) {
                resource.isNewRecord = true; // 设置为新记录
              } else {
                resource.setFilterByTk(currentFilterByTk);
              }
            }
            await resource.save(values);
            if (blockModel instanceof EditFormModel) {
              resource.isNewRecord = false;
              await resource.refresh();
            } else {
              blockModel.form.reset();
            }
          } else if (resource instanceof MultiRecordResource) {
            const currentFilterByTk = resource.getMeta('currentFilterByTk');
            if (!currentFilterByTk) {
              ctx.message.error(ctx.t('No filterByTk found for multi-record resource.'));
              return;
            }
            await resource.update(currentFilterByTk, values);
          }
        } catch (error) {
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          return;
        }

        ctx.message.success(ctx.t('Saved successfully'));

        const parentBlockModel = ctx.currentFlow?.blockModel as CollectionBlockModel;
        if (parentBlockModel) {
          parentBlockModel.resource.refresh();
        }
        if (ctx.currentView && ctx.closable) {
          ctx.currentView.close();
        }
      },
    },
  },
});
