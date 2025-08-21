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
import { CollectionActionModel, RecordActionModel } from '../base/ActionModel';
import { FormSubmitActionModel } from '../data-blocks/form/FormActionModel';

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
    runTrigger: {
      preset: true,
      title: escapeT('Trigger workflows'),
      uiSchema: {
        contextType: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: escapeT('None'), value: 'none' },
            { label: escapeT('Multiple records'), value: 'multiple' },
          ],
        },
        triggerWorkflows: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      async handler(ctx, params) {
        if (!params.triggerWorkflows) {
          ctx.message.error(ctx.t('Please enter the workflow to trigger'));
          return;
        }
        // 选中多条记录时
        if (params.contextType === 'multiple') {
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
