/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonType } from 'antd/es/button';
import React from 'react';
import { FlowPageComponent } from '../FlowPage';
import { ActionModel } from './ActionModel';

export class AddNewActionModel extends ActionModel {
  title = 'Add new';
}

AddNewActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        // eslint-disable-next-line prefer-const
        let currentDrawer: any;

        function DrawerContent() {
          return (
            <div>
              <FlowPageComponent uid={`${ctx.model.uid}-drawer`} sharedContext={{ ...ctx.extra, currentDrawer }} />
            </div>
          );
        }

        currentDrawer = ctx.globals.drawer.open({
          title: '命令式 Drawer',
          width: 800,
          content: <DrawerContent />,
        });
      },
    },
  },
});
