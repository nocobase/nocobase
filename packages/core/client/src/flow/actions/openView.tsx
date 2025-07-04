/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { FlowPage } from '../FlowPage';

export const openView = defineAction({
  name: 'openView',
  title: tval('Open mode configuration'),
  uiSchema: {
    mode: {
      type: 'string',
      title: tval('Open mode'),
      enum: [
        { label: tval('Drawer'), value: 'drawer' },
        { label: tval('Dialog'), value: 'dialog' },
        { label: tval('Page'), value: 'page' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    size: {
      type: 'string',
      title: tval('Popup size'),
      enum: [
        { label: tval('Small'), value: 'small' },
        { label: tval('Medium'), value: 'medium' },
        { label: tval('Large'), value: 'large' },
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

    const sizeToWidthMap: Record<string, number> = {
      small: 480,
      medium: 800,
      large: 1200,
    };

    await ctx.globals[ctx.runtimeArgs.mode || params.mode || 'drawer'].open({
      target: ctx.runtimeArgs.target || ctx.shared.layoutContentElement,
      width: sizeToWidthMap[params.size || 'medium'],
      content: (currentView) => {
        return (
          <FlowPage
            parentId={ctx.model.uid}
            sharedContext={{
              currentFlow: ctx,
              currentView: currentView,
            }}
          />
        );
      },
      styles: {
        content: {
          background: 'var(--nb-box-bg)',
          padding: 0,
        },
      },
      bodyStyle: {
        padding: 0,
      },
    });
  },
});
