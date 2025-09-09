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
  title: escapeT('Edit popup'),
  uiSchema: {
    mode: {
      type: 'string',
      title: escapeT('Open mode'),
      enum: [
        { label: escapeT('Drawer'), value: 'drawer' },
        { label: escapeT('Dialog'), value: 'dialog' },
        { label: escapeT('Page'), value: 'embed' },
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
      'x-reactions': {
        dependencies: ['mode'],
        fulfill: {
          state: {
            hidden: '{{$deps[0] === "embed"}}',
          },
        },
      },
    },
  },
  defaultParams: {
    mode: 'drawer',
    size: 'medium',
    pageModelClass: 'ChildPageModel',
  },
  async handler(ctx, params) {
    if (params.navigation !== false) {
      if (!ctx.inputArgs.navigation && ctx.view.navigation) {
        ctx.view.navigation.navigateTo({
          viewUid: ctx.model.uid,
          filterByTk: ctx.inputArgs.filterByTk,
          sourceId: ctx.inputArgs.sourceId,
        });
        return;
      }
    }

    const sizeToWidthMap: Record<string, any> = {
      drawer: {
        small: '30%',
        medium: '50%',
        large: '70%',
      },
      dialog: {
        small: '40%',
        medium: '50%',
        large: '80%',
      },
      embed: {},
    };

    const pageModelClass = params.pageModelClass;

    const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
    const size = ctx.inputArgs.size || params.size || 'medium';
    let pageModelUid: string | null = null;

    await ctx.viewer.open({
      type: ctx.inputArgs.isMobileLayout ? 'embed' : openMode, // 移动端中只需要显示子页面
      inputArgs: {
        ...ctx.inputArgs,
        dataSourceKey: params.dataSourceKey,
        collectionName: params.collectionName,
        associationName: params.associationName,
      },
      preventClose: !!params.preventClose,
      inheritContext: false,
      target: ctx.inputArgs.target || ctx.layoutContentElement,
      width: sizeToWidthMap[openMode][size],
      content: (currentView) => {
        if (ctx.inputArgs.closeRef) {
          ctx.inputArgs.closeRef.current = currentView.close;
        }
        if (ctx.inputArgs.updateRef) {
          ctx.inputArgs.updateRef.current = currentView.update;
        }

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
        if (params.navigation !== false) {
          ctx.inputArgs.navigation?.back();
        }
      },
      onOpen: ctx.inputArgs.onOpen,
    });
  },
});
