/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { ActionModel } from './ActionModel';

export class LinkActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Link',
  };
}

LinkActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.globals.modal.confirm({
          title: `${ctx.extra.currentRecord?.id}`,
          content: 'Are you sure you want to perform this action?',
        });
      },
    },
  },
});
