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
import { FilterFormActionModel } from './FilterFormActionModel';

export class ResetFilterFormActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: tval('Reset'),
  };
}

ResetFilterFormActionModel.registerFlow({
  key: 'resetSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doReset: {
      async handler(ctx, params) {},
    },
  },
});

ResetFilterFormActionModel.define({
  title: tval('Reset'),
});
