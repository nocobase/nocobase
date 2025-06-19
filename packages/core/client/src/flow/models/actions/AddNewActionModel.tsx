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
import { GlobalActionModel } from '../base/ActionModel';

export class AddNewActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    type: 'primary',
    children: 'Add new',
  };
}

AddNewActionModel.registerFlow({
  sort: 200,
  title: '事件',
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      title: '弹窗配置',
      uiSchema: {
        width: {
          type: 'number',
          title: '宽度',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker',
          'x-component-props': {
            placeholder: '请输入宽度',
          },
        },
      },
      defaultParams: {
        width: 800,
      },
      handler(ctx, params) {
        // eslint-disable-next-line prefer-const
        let currentDrawer: any;

        function DrawerContent() {
          return (
            <div>
              <FlowPage
                parentId={ctx.model.uid}
                sharedContext={{ parentBlockModel: ctx.shared.currentBlockModel, currentDrawer }}
              />
            </div>
          );
        }

        currentDrawer = ctx.globals.drawer.open({
          // title: '命令式 Drawer',
          header: null,
          width: params.width,
          content: <DrawerContent />,
        });
      },
    },
  },
});
