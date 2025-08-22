/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  BaseRecordResource,
  escapeT,
  MultiRecordResource,
  SingleRecordResource,
  useFlowContext,
} from '@nocobase/flow-engine';
import { ButtonProps, Form } from 'antd';
import { CollectionActionModel, RecordActionModel } from '../base/ActionModel';
import { CollectionBlockModel } from '../base/BlockModel';
import { FormModel } from '../data-blocks/form';
import { FormActionModel, FormSubmitActionModel } from '../data-blocks/form/FormActionModel';

export class CollectionTriggerWorkflowActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Trigger workflow'),
  };
}

CollectionTriggerWorkflowActionModel.define({
  label: escapeT('Trigger workflow'),
});

CollectionTriggerWorkflowActionModel.registerFlow({
  key: 'triggerWorkflowSettings',
  title: escapeT('Trigger workflow settings'),
  on: 'click',
  steps: {
    // setContextType: {
    //   // hideInSettings: true,
    //   preset: true,
    //   title: escapeT('Context type'),
    //   uiSchema: {

    //   },
    // },
    runTrigger: {
      title: escapeT('Trigger workflows'),
      preset: true,
      uiMode: {
        props: {
          width: 800,
        },
      },
      uiSchema: (ctx) => {
        return {
          contextType: {
            type: 'string',
            title: 'Context type',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
            'x-hidden': !!ctx.getStepParams('runTrigger').contextType,
            enum: [
              { label: escapeT('None'), value: 'none' },
              { label: escapeT('Multiple records'), value: 'multiple' },
            ],
          },
          triggerWorkflows: {
            type: 'string',
            // required: true,
            title: 'Bind workflows',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayTable',
          },
        };
      },
      async handler(ctx, params) {
        if (!params.triggerWorkflows) {
          ctx.message.error(ctx.t('Please enter the workflow to trigger'));
          return;
        }
        const { contextType } = ctx.getStepParams('setContextType');
        console.log('contextType', contextType);
        // 选中多条记录时
        if (contextType === 'multiple') {
          console.log((ctx.resource as MultiRecordResource).getSelectedRows());
        }
        await ctx.api.request({
          url: 'workflows:trigger',
          method: 'post',
          params: {
            triggerWorkflows: params.triggerWorkflows,
          },
        });
      },
    },
  },
});

export class RecordTriggerWorkflowActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Trigger workflow'),
  };
}

RecordTriggerWorkflowActionModel.define({
  label: escapeT('Trigger workflow'),
});

RecordTriggerWorkflowActionModel.registerFlow({
  key: 'triggerWorkflowSettings',
  title: escapeT('Trigger workflow settings'),
  on: 'click',
  steps: {
    runTrigger: {
      title: escapeT('Trigger workflows'),
      uiSchema: {
        triggerWorkflows: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      async handler(ctx, params) {
        // 使用上下文的 resource
        const resource = ctx.resource;
        if (!params.triggerWorkflows) {
          ctx.message.error(ctx.t('Please enter the workflow to trigger'));
          return;
        }
        try {
          await resource.runAction('trigger', {
            method: 'post',
            params: {
              triggerWorkflows: params.triggerWorkflows,
            },
          });
        } catch (error) {
          ctx.message.error(ctx.t('Failed to trigger workflow'));
        }
      },
    },
  },
});

export class FormTriggerWorkflowActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Trigger workflow'),
    htmlType: 'submit',
  };
}

FormTriggerWorkflowActionModel.define({
  label: escapeT('Trigger workflow'),
});

FormTriggerWorkflowActionModel.registerFlow({
  key: 'triggerWorkflowSettings',
  on: 'click',
  steps: {
    runTrigger: {
      title: escapeT('Trigger workflows'),
      uiSchema: {
        triggerWorkflows: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      async handler(ctx, params) {
        if (!ctx?.resource) {
          throw new Error('Resource is not initialized');
        }
        if (!ctx.blockModel) {
          throw new Error('Block model is not initialized');
        }
        const resource = ctx.resource as BaseRecordResource;
        const blockModel = ctx.blockModel as FormModel;
        try {
          await blockModel.form.validateFields();
          const values = blockModel.form.getFieldsValue();
          resource.runAction('trigger', {
            method: 'post',
            params: {
              triggerWorkflows: params.triggerWorkflows,
            },
          });
        } catch (error) {
          // 显示保存失败提示
          ctx.message.error(ctx.t('Save failed'));
          console.error('Form submission error:', error);
          return;
        }

        ctx.message.success(ctx.t('Saved successfully'));

        // TODO: 以下暂时先这么写
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

FormSubmitActionModel.registerFlow({
  key: 'triggerActionSettings',
  title: escapeT('Trigger action settings'),
  steps: {
    setSaveActionOptions: {
      title: escapeT('Trigger workflows'),
      uiSchema: {
        triggerWorkflows: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      handler(ctx, params) {
        ctx.model.setSaveRequestConfig({
          params: {
            triggerWorkflows: params.triggerWorkflows,
          },
        });
      },
    },
  },
});
