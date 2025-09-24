/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT, FlowModelContext, FlowModel } from '@nocobase/flow-engine';
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
  async handler(ctx: FlowModelContext, params) {
    const inputArgs = ctx.inputArgs || {};

    if (params.filterByTk) {
      inputArgs.filterByTk = params.filterByTk;
    }

    if (params.sourceId) {
      inputArgs.sourceId = params.sourceId;
    }

    if (params.tabUid) {
      inputArgs.tabUid = params.tabUid;
    }

    const navigation = inputArgs.navigation ?? params.navigation;

    if (navigation !== false) {
      if (!ctx.inputArgs.navigation && ctx.view.navigation) {
        ctx.view.navigation.navigateTo({
          viewUid: ctx.model.uid,
          filterByTk: inputArgs.filterByTk,
          sourceId: inputArgs.sourceId,
        });
        return;
      }
    }

    const sizeToWidthMap: Record<string, Record<string, string | undefined>> = {
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

    const pageModelClass = ctx.inputArgs.pageModelClass || params.pageModelClass;

    const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
    const size = ctx.inputArgs.size || params.size || 'medium';
    let pageModelUid: string | null = null;
    let pageModelRef: FlowModel | null = null;

    // If subModelKey is provided, create or load a container FlowModel under current ctx.model
    // and use it as the parent for the child page content.
    let parentIdForChild = ctx.model.uid;
    if (params.subModelKey) {
      const container = await ctx.engine.loadOrCreateModel({
        async: true,
        parentId: ctx.model.uid,
        subKey: params.subModelKey,
        subType: 'object',
        use: 'FlowModel',
      });
      if (container?.uid) {
        parentIdForChild = container.uid;
      }
    }

    // Build openerUids information (a list of view uids from root -> immediate opener)
    const isRouteManaged = !!ctx.inputArgs?.navigation;
    const parentOpenerUids =
      (ctx.view?.inputArgs?.openerUids as string[] | undefined) || (inputArgs.openerUids as string[] | undefined) || [];
    const openerUids: string[] = isRouteManaged
      ? (inputArgs.openerUids as string[] | undefined) || parentOpenerUids
      : [...parentOpenerUids, ctx.model.uid];

    const finalInputArgs: Record<string, unknown> = {
      ...ctx.inputArgs,
      ...inputArgs,
      dataSourceKey: params.dataSourceKey,
      collectionName: params.collectionName,
      associationName: params.associationName,
      openerUids,
    };
    // if (finalInputArgs && typeof finalInputArgs === 'object') {
    //   const fi = finalInputArgs as { [key: string]: unknown; hidden?: unknown };
    //   if ('hidden' in fi) {
    //     delete fi.hidden;
    //   }
    // }

    await ctx.viewer.open({
      type: ctx.inputArgs.isMobileLayout ? 'embed' : openMode, // 移动端中只需要显示子页面
      inputArgs: finalInputArgs,
      preventClose: !!params.preventClose,
      destroyOnClose: true,
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
            parentId={parentIdForChild}
            pageModelClass={pageModelClass}
            onModelLoaded={(uid, model) => {
              pageModelUid = uid;
              const pageModel = (model as FlowModel) || (ctx.engine.getModel(pageModelUid) as FlowModel | undefined);
              pageModelRef = pageModel || null;
              const defineProperties = inputArgs.defineProperties || {};
              const defineMethods = inputArgs.defineMethods || {};

              pageModel.context.defineProperty('currentView', {
                get: () => currentView,
              });
              pageModel.context.defineProperty('closable', {
                get: () => openMode !== 'embed',
              });

              Object.entries(defineProperties as Record<string, any>).forEach(([key, p]) => {
                pageModel.context.defineProperty(key, p);
              });
              Object.entries(defineMethods as Record<string, any>).forEach(([key, method]) => {
                pageModel.context.defineMethod(key, method);
              });

              pageModel.invalidateAutoFlowCache(true);
              pageModel['_rerunLastAutoRun'](); // TODO: 临时做法，等上下文重构完成后去掉
            }}
          />
        );
      },
      styles: {
        content: {
          padding: 0,
          backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
          ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
        },
        body: {
          padding: 0,
        },
      },
      onClose: () => {
        if (pageModelUid) {
          const pageModel = pageModelRef || ctx.model.flowEngine.getModel(pageModelUid);
          pageModel?.invalidateAutoFlowCache(true);
        }
        if (navigation !== false) {
          ctx.inputArgs.navigation?.back();
        }
      },
      onOpen: ctx.inputArgs.onOpen,
    });
  },
});
