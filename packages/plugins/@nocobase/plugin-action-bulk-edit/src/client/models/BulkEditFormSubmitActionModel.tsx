/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormSubmitActionModel } from '@nocobase/client';
import { ButtonProps } from 'antd';
import { tExpr } from '@nocobase/flow-engine';
import { submitHandler } from './submitHandler';
import { BulkEditFormModel } from './BulkEditFormModel';
import { lang } from '../locale';

export class BulkEditFormSubmitActionModel extends FormSubmitActionModel {
  defaultProps: ButtonProps & { withScheduleSend?: boolean } = {
    title: tExpr('Submit'),
    type: 'primary',
  };
}

BulkEditFormSubmitActionModel.define({
  label: tExpr('Submit'),
  sort: 1,
  hide: (context) => {
    if (context.model instanceof BulkEditFormModel) {
      return false;
    }
    return true;
  },
});

BulkEditFormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  title: tExpr('Send settings'),
  on: 'click',
  steps: {
    verifySelectedRecords: {
      async handler(ctx) {
        const viewUid = ctx.view.inputArgs?.viewUid;
        const bulkEditActionModel = ctx.engine.getModel(viewUid, true);
        const collectionModel = bulkEditActionModel?.parent as any;
        const editModeParams = bulkEditActionModel?.getStepParams('bulkEditSettings', 'editMode') || {};
        const updateMode = editModeParams?.value || 'selected';

        if (updateMode === 'selected') {
          const rows = collectionModel?.resource?.getSelectedRows?.() || [];
          if (!rows?.length) {
            ctx.message.error(lang('Please select the records to be edited'));
            ctx.exit();
            return;
          }
        }
      },
    },
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
        try {
          ctx.model.setProps('loading', true);
          await submitHandler(ctx, params);
          ctx.model.setProps('loading', false);
        } catch (error) {
          ctx.model.setProps('loading', false);
          console.error('Form submission error:', error);
          ctx.exit();
        }
      },
    },
    refreshAndClose: {
      async handler(ctx) {
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
