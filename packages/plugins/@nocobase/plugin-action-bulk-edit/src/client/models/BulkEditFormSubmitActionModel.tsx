/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, FieldModel, FormActionModel } from '@nocobase/client';
import React from 'react';
import { Button, ButtonProps, message, Modal, Dropdown, DatePicker } from 'antd';
import { tExpr, FlowModelRenderer, useFlowEngine, useFlowSettingsContext } from '@nocobase/flow-engine';

export class BulkEditFormSubmitActionModel extends FormActionModel {
  defaultProps: ButtonProps & { withScheduleSend?: boolean } = {
    title: tExpr('Submit'),
    type: 'primary',
    withScheduleSend: true,
  };
}

BulkEditFormSubmitActionModel.define({
  label: tExpr('Send'),
  sort: 1,
});

BulkEditFormSubmitActionModel.registerFlow({
  key: 'sendSettings',
  title: tExpr('Send settings'),
  on: 'click',
  steps: {
    send: {
      async handler(ctx, params) {
        console.log('BulkEditFormSubmitActionModel send flow handler called', ctx, params);
      },
    },
  },
});
