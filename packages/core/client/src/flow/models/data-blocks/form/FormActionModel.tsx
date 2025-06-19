/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { ActionModel } from '../../base/ActionModel';

export class FormActionModel extends ActionModel {}

export class FormSubmitActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    children: 'Submit',
    type: 'primary',
    htmlType: 'submit',
  };
}

FormSubmitActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for submission.');
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        const currentResource = ctx.shared.currentBlockModel.resource;
        await currentBlockModel.form.submit();
        const values = currentBlockModel.form.values;
        await currentBlockModel.resource.save(values);
        await currentBlockModel.form.reset();
        // currentResource.refresh();
        ctx.shared.parentBlockModel?.resource?.refresh();
        if (ctx.shared.currentDrawer) {
          ctx.shared.currentDrawer.destroy();
        }
      },
    },
  },
});
