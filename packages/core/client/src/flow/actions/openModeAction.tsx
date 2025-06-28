/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowPage } from '../FlowPage';

export const openModeAction = {
  title: '{{t("Open mode")}}',
  uiSchema: {
    mode: {
      type: 'string',
      title: '{{t("Open mode")}}',
      enum: [
        { label: '{{t("Drawer")}}', value: 'drawer' },
        { label: '{{t("Modal")}}', value: 'modal' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    size: {
      type: 'string',
      title: '{{t("Popup size")}}',
      enum: [
        { label: '{{t("Small")}}', value: 'small' },
        { label: '{{t("Medium")}}', value: 'medium' },
        { label: '{{t("Large")}}', value: 'large' },
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
            sharedContext={{
              ...ctx.extra,
              currentDrawer,
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

    currentDrawer = ctx.globals[params.mode].open({
      title: '{{t("Imperative Drawer")}}',
      width: sizeToWidthMap[params.size],
      content: <DrawerContent />,
    });
  },
};
