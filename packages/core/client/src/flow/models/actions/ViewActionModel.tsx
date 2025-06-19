/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import React from 'react';
import { FlowPage } from '../../FlowPage';
import { RecordActionModel } from '../base/ActionModel';

export class ViewActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    children: 'View',
    type: 'link',
  };
}

ViewActionModel.registerFlow({
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
              <FlowPage
                parentId={ctx.model.uid}
                sharedContext={{
                  currentDrawer,
                  parentRecord: ctx.extra.currentRecord,
                  parentBlockModel: ctx.shared.currentBlockModel,
                }}
              />
            </div>
          );
        }

        currentDrawer = ctx.globals.drawer.open({
          // title: '命令式 Drawer',
          width: 800,
          content: <DrawerContent />,
        });
      },
    },
  },
});
