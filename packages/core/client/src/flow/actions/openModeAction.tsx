/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { tval } from '@nocobase/utils/client';
import { FlowPage } from '../FlowPage';

export const openModeAction = {
  title: tval('Open mode'),
  uiSchema: {
    mode: {
      type: 'string',
      title: tval('Open mode'),
      enum: [
        { label: tval('Drawer'), value: 'drawer' },
        { label: tval('Modal'), value: 'modal' },
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
          <FlowPage
            parentId={ctx.model.uid}
            onModelLoaded={(uid) => {
              const pageModel = ctx.model.flowEngine.getModel(uid);
              pageModel.context.defineProperty('currentDrawer', {
                get: () => currentDrawer,
              });
            }}
          />
        </div>
      );
    }

    const sizeToWidthMap: Record<string, number> = {
      small: 480,
      medium: 800,
      large: 1200,
    };

    currentDrawer = ctx[params.mode].open({
      title: tval('Imperative Drawer'),
      width: sizeToWidthMap[params.size],
      content: <DrawerContent />,
    });
  },
};
