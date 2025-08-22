/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FlowPage } from '../FlowPage';

export const openView = defineAction({
  name: 'openView',
  title: escapeT('General'),
  uiSchema: {
    mode: {
      type: 'string',
      title: escapeT('Open mode'),
      enum: [
        { label: escapeT('Drawer'), value: 'drawer' },
        { label: escapeT('Dialog'), value: 'dialog' },
        // { label: escapeT('Page'), value: 'page' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    size: {
      type: 'string',
      title: escapeT('Popup size'),
      enum: [
        { label: escapeT('Small'), value: 'small' },
        { label: escapeT('Medium'), value: 'medium' },
        { label: escapeT('Large'), value: 'large' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
  },
  defaultParams: {
    mode: 'drawer',
    size: 'medium',
    pageModelClass: 'ChildPageModel',
  },
  async handler(ctx, params) {
    // eslint-disable-next-line prefer-const

    const sizeToWidthMap: Record<string, number> = {
      small: 480,
      medium: 800,
      large: 1200,
    };

    const pageModelClass = params.pageModelClass;

    const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
    const size = ctx.inputArgs.size || params.size || 'medium';
    let pageModelUid: string | null = null;

    await ctx.viewer.open({
      type: openMode,
      closable: false,
      inheritContext: false,
      target: ctx.inputArgs.target || ctx.layoutContentElement,
      width: sizeToWidthMap[size],
      content: (currentView) => {
        return (
          <FlowPage
            parentId={ctx.model.uid}
            pageModelClass={pageModelClass}
            onModelLoaded={(uid) => {
              pageModelUid = uid;
              const pageModel = ctx.model.flowEngine.getModel(pageModelUid);
              pageModel.context.defineProperty('currentView', {
                get: () => currentView,
              });
              pageModel.context.defineProperty('currentFlow', {
                get: () => ctx,
              });
              pageModel.context.defineProperty('closable', {
                get: () => openMode !== 'embed',
              });
              pageModel.invalidateAutoFlowCache(true);
              pageModel['_rerunLastAutoRun'](); // TODO: 临时做法，等上下文重构完成后去掉
            }}
          />
        );
      },
      styles: {
        content: {
          background: 'var(--nb-box-bg)',
          padding: 0,
        },
        body: {
          padding: 0,
        },
      },
      onClose: () => {
        if (pageModelUid) {
          const pageModel = ctx.model.flowEngine.getModel(pageModelUid);
          pageModel.invalidateAutoFlowCache(true);
        }
      },
    });
  },
});
