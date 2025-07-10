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
    step1: {
      async handler(ctx) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error(ctx.model.flowEngine.translate('No resource selected for submission.'));
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel as FormModel;

        try {
          await currentBlockModel.form.submit();
          const values = currentBlockModel.form.values;
          const data = currentBlockModel.resource.getData();
          const currentRecord = Array.isArray(data) ? data[0] : data;
          const filterByTk = currentRecord?.[currentBlockModel.collection.filterTargetKey];

          // 根据资源类型调用不同的保存方法
          if (currentBlockModel.resource instanceof SingleRecordResource) {
            if (filterByTk) {
              const options = {
                params: {
                  filterByTk,
                },
              };
              await currentBlockModel.resource.runAction('update', {
                ...options,
                data: values,
              });
              await currentBlockModel.resource.refresh();
            } else {
              await currentBlockModel.resource.save(values);
            }
          } else if (currentBlockModel.resource instanceof MultiRecordResource) {
            if (filterByTk) {
              // 更新现有记录
              await currentBlockModel.resource.update(filterByTk, values);
            } else {
              // 如果没有当前记录或主键，则创建新记录
              await currentBlockModel.resource.create(values);
            }
          }
        } catch (error) {
          // 显示保存失败提示
          ctx.globals.message.error(ctx.model.flowEngine.translate('Save failed'));
          console.error('Form submission error:', error);
          return;
        }

        ctx.globals.message.success(ctx.model.flowEngine.translate('Saved successfully'));

        if (currentBlockModel.resource instanceof SingleRecordResource && currentBlockModel.resource.isNewRecord) {
          // 新增记录成功后重置表单
          await currentBlockModel.form.reset();
        } else {
          // 编辑记录成功后刷新数据，保持表单状态
          await currentBlockModel.resource.refresh();
        }

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
