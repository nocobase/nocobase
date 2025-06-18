/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import type { ButtonType } from 'antd/es/button';
import React from 'react';
import { FlowPageComponent } from '../FlowPage';
import { ActionModel } from './ActionModel';

export class ViewActionModel extends ActionModel {
  title = 'View';
  type: ButtonType = 'link';
}

ViewActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.globals.drawer.open({
          title: '命令式 Drawer',
          width: 800,
          content: (
            <div>
              <FlowPageComponent uid={`${ctx.model.uid}-drawer`} extraContext={ctx.extra} />
            </div>
          ),
        });
      },
    },
  },
});
