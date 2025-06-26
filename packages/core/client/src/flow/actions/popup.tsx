/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import React from 'react';
import { FlowPage } from '../FlowPage';

export const popup = defineAction({
  name: 'popup',
  title: '弹窗配置',
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
  defaultParams: {
    mode: 'drawer',
    size: 'medium',
  },
  async handler(ctx, params) {
    // eslint-disable-next-line prefer-const
    let currentDrawer: any;

    function DrawerContent() {
      return (
        <FlowPage
          parentId={ctx.model.uid}
          sharedContext={{
            ...params.sharedContext,
            currentDrawer,
          }}
        />
      );
    }

    const sizeToWidthMap: Record<string, number> = {
      small: 480,
      medium: 800,
      large: 1200,
    };

    currentDrawer = await ctx.globals[params.mode || 'drawer'].open({
      // title: '命令式 Drawer',
      width: sizeToWidthMap[params.size || 'medium'],
      content: <DrawerContent />,
      style: {
        backgroundColor: 'var(--nb-box-bg)',
      },
      bodyStyle: {
        padding: 0,
      },
    });
  },
});
