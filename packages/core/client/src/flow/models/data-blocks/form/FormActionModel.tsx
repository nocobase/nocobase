/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { tval } from '@nocobase/utils/client';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { FormModel } from './FormModel';

export class FormActionModel extends ActionModel {}

export class FormSubmitActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: tval('Submit'),
    type: 'primary',
    htmlType: 'submit',
  };
}

FormSubmitActionModel.define({
  title: tval('Submit'),
});

FormSubmitActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error(ctx.model.flowEngine.translate('No resource selected for submission.'));
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel as FormModel;
        await currentBlockModel.form.submit();
        const values = currentBlockModel.form.values;
        await currentBlockModel.resource.save(values);
        await currentBlockModel.form.reset();
        const parentBlockModel = ctx.shared?.currentFlow?.shared?.currentBlockModel as DataBlockModel;
        if (parentBlockModel) {
          parentBlockModel.resource.refresh();
        }
        if (ctx.shared.currentView) {
          ctx.shared.currentView.destroy();
        }
      },
    },
  },
});
