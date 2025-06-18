/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import React from 'react';
import { FlowPageComponent } from '../FlowPage';
import { ActionModel } from './ActionModel';

export class ViewActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'View',
  };
}

ViewActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    open: {
      title: '打开方式',
      uiSchema: {
        mode: {
          type: 'string',
          title: '打开方式',
          enum: [
            { label: 'Drawer', value: 'drawer' },
            { label: 'Modal', value: 'modal' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        size: {
          type: 'string',
          title: '弹窗尺寸',
          enum: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
      },
      defaultParams(ctx) {
        return {
          mode: 'drawer',
          size: 'medium',
        };
      },
      handler(ctx, params) {
        // eslint-disable-next-line prefer-const
        let currentDrawer: any;

        function DrawerContent() {
          return (
            <div>
              <FlowPageComponent parentId={ctx.model.uid} sharedContext={{ ...ctx.extra, currentDrawer }} />
            </div>
          );
        }

        const sizeToWidthMap: Record<string, number> = {
          small: 480,
          medium: 800,
          large: 1200,
        };

        currentDrawer = ctx.globals[params.mode].open({
          title: '命令式 Drawer',
          width: sizeToWidthMap[params.size],
          content: <DrawerContent />,
        });
      },
    },
  },
});
