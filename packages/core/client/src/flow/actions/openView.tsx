/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, FlowModelContext, FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { FlowPage } from '../FlowPage';
import { RootPageModel } from '../models';

/**
 * 弹窗打开动作（openView）配置
 * - 当 params.uid !== ctx.model.uid：委托 ctx.openView 打开其它弹窗
 * - filterByTk/sourceId 优先级：显式 inputArgs > params > actionDefaults
 */

export const openView = defineAction({
  name: 'openView',
  title: tExpr('Edit popup'),
  uiSchema: {
    mode: {
      type: 'string',
      title: tExpr('Open mode'),
      enum: [
        { label: tExpr('Drawer'), value: 'drawer' },
        { label: tExpr('Dialog'), value: 'dialog' },
        { label: tExpr('Page'), value: 'embed' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
    size: {
      type: 'string',
      title: tExpr('Popup size'),
      enum: [
        { label: tExpr('Small'), value: 'small' },
        { label: tExpr('Medium'), value: 'medium' },
        { label: tExpr('Large'), value: 'large' },
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
  /**
   * 通用的设置菜单可见性控制：
   * - 字段场景下，当未启用「点击打开」（clickToOpen=false）时，隐藏弹窗设置步骤；
   * - 其他场景默认不隐藏，保持向后兼容。
   */
  hideInSettings: async (ctx: FlowModelContext) => {
    const displayFieldSettingsFlow = ctx.model.getFlow('displayFieldSettings');
    if (!displayFieldSettingsFlow) {
      // 没有 displayFieldSettings 这个flow，就直接显示该配置
      return false;
    }
    const clickToOpen = ctx.model.getStepParams?.('displayFieldSettings', 'clickToOpen')?.clickToOpen;
    if (clickToOpen === undefined) {
      return !ctx.collectionField?.isAssociationField();
    }
    return clickToOpen === false;
  },
  defaultParams: async (ctx) => {
    const tree = ctx.getPropertyMetaTree() || [];
    const hasRecord = Array.isArray(tree) && tree.some((n: any) => String(n?.name) === 'record');
    // 决定主键字段：优先使用集合的 filterTargetKey；否则直接回退 'id'
    let recordKeyPath = ctx.collection?.filterTargetKey || 'id';

    // 如果是关系字段，这个需要获取关系字段对应的key
    if (ctx.blockModel?.resource?.resourceName) {
      const assocField = ctx.collection.dataSource.collectionManager.getAssociation(
        ctx.blockModel?.resource?.resourceName,
      );
      if (assocField?.interface !== 'm2m') {
        recordKeyPath = assocField?.targetKey || recordKeyPath;
      }
    }

    const filterByTkExpr = hasRecord ? `{{ ctx.record.${recordKeyPath} }}` : undefined;
    // 仅在“当前 resource.sourceId 有实际值”时设置默认值，
    let sourceIdExpr: string | undefined = undefined;
    try {
      const sid = ctx.resource?.getSourceId?.();
      if (sid !== undefined && sid !== null && String(sid) !== '') {
        sourceIdExpr = `{{ ctx.resource.sourceId }}`;
      }
    } catch (e) {
      // ignore
    }
    const defaultDSKey = ctx.collection?.dataSourceKey;
    const defaultCol = ctx.collection?.name;
    return {
      mode: 'drawer',
      size: 'medium',
      pageModelClass: 'ChildPageModel',
      uid: ctx.model?.uid,
      ...(filterByTkExpr ? { filterByTk: filterByTkExpr } : {}),
      ...(sourceIdExpr ? { sourceId: sourceIdExpr } : {}),
      ...(defaultDSKey ? { dataSourceKey: defaultDSKey } : {}),
      ...(defaultCol ? { collectionName: defaultCol } : {}),
    };
  },
  async beforeParamsSave(ctx, params) {
    if (params?.uid) {
      const engine = ctx.engine;
      const model = engine.getModel(params.uid) || (await engine.loadModel({ uid: params.uid }));
      if (!model) {
        throw new Error(ctx.t('Popup UID not exists'));
      }
    }
  },
  async handler(ctx: FlowModelContext, params) {
    // If uid differs from current model, delegate to ctx.openView to open that popup
    const inputArgs = ctx.inputArgs || {};
    const defineProperties = inputArgs.defineProperties ?? ctx.model.context?.inputArgs?.defineProperties ?? undefined;
    const defineMethods = inputArgs.defineMethods ?? ctx.model.context?.inputArgs?.defineMethods ?? undefined;
    const actionDefaults = (ctx.model as any)?.getInputArgs?.() || {};
    const defaultKeys: string[] = (inputArgs as any)?.defaultInputKeys || [];
    const pickWithDefault = (key: 'filterByTk' | 'sourceId') => {
      const hasInput = typeof inputArgs?.[key] !== 'undefined';
      const isDefault = defaultKeys.includes(key);
      // 优先级：显式传入的 inputArgs > 配置 params > 自动默认值
      if (hasInput && !isDefault) return inputArgs[key];
      if (typeof params?.[key] !== 'undefined') return params[key];
      // 如果 inputArgs 中的值被标记为默认，则它只在 params 未提供时兜底
      if (hasInput) return inputArgs[key];
      return actionDefaults?.[key];
    };
    const mergedFilterByTk = pickWithDefault('filterByTk');
    const mergedSourceId = pickWithDefault('sourceId');

    const runtimeDataSourceKey =
      typeof (inputArgs as any)?.dataSourceKey !== 'undefined'
        ? (inputArgs as any).dataSourceKey
        : (params as any)?.dataSourceKey;
    const runtimeCollectionName =
      typeof (inputArgs as any)?.collectionName !== 'undefined'
        ? (inputArgs as any).collectionName
        : (params as any)?.collectionName;
    const runtimeAssociationName =
      typeof (inputArgs as any)?.associationName !== 'undefined'
        ? (inputArgs as any).associationName
        : (params as any)?.associationName;
    const mergedTabUid = typeof inputArgs.tabUid !== 'undefined' ? inputArgs.tabUid : params.tabUid;
    // 移动端中只需要显示子页面
    const openMode = ctx.inputArgs?.isMobileLayout ? 'embed' : ctx.inputArgs?.mode || params.mode || 'drawer';
    let navigation = typeof inputArgs.navigation !== 'undefined' ? inputArgs.navigation : params.navigation;

    // 传递了上下文就必须禁用路由，否则下次路由打开会缺少上下文
    if (defineProperties || defineMethods) {
      navigation = false;
    }

    if (navigation !== false) {
      if (!ctx.inputArgs.navigation && ctx.view?.navigation) {
        // 在路由跳转前注入 PendingView，统一首次 handler 阶段的 ctx.view 语义
        const pendingType = openMode;
        const pendingInputArgs = {
          ...ctx.inputArgs,
          dataSourceKey: runtimeDataSourceKey,
          collectionName: runtimeCollectionName,
          associationName: runtimeAssociationName,
          filterByTk: mergedFilterByTk,
          sourceId: mergedSourceId,
          tabUid: mergedTabUid,
          viewUid: ctx.model.context?.inputArgs?.viewUid || ctx.model.uid,
        } as Record<string, unknown>;
        const pendingView = {
          type: pendingType,
          inputArgs: pendingInputArgs,
          navigation: ctx.view?.navigation,
          preventClose: !!params?.preventClose,
          engineCtx: ctx.engine.context,
        };
        ctx.model.context.defineProperty('view', { value: pendingView });

        const nextView = {
          viewUid: ctx.model.context?.inputArgs?.viewUid || ctx.model.uid,
          filterByTk: mergedFilterByTk,
          sourceId: mergedSourceId,
          tabUid: mergedTabUid,
        };
        ctx.view.navigation.navigateTo(nextView);
        return;
      }
    }

    if (params?.uid && params.uid !== ctx.model.uid) {
      // 外部弹窗（uid 指向其它 PopupActionModel）：
      // - 路由模式下，URL 的 viewId 应以“发起该弹窗的按钮/动作模型 uid”为准，保证刷新后可还原原始触发上下文；
      // - 由 FlowRoute 第二阶段（带 inputArgs.navigation）重新打开时，需要把 closeRef/updateRef/onOpen 等透传给目标弹窗，否则无法正确维护视图栈。
      await ctx.openView(params.uid, {
        ...inputArgs,
        ...(params || {}),
        navigation,
        target: ctx.inputArgs.target || ctx.layoutContentElement,
        dataSourceKey: runtimeDataSourceKey ?? actionDefaults.dataSourceKey,
        collectionName: runtimeCollectionName ?? actionDefaults.collectionName,
        associationName: runtimeAssociationName ?? actionDefaults.associationName,
        filterByTk: mergedFilterByTk,
        sourceId: mergedSourceId,
        tabUid: mergedTabUid,
        // 关键：把自定义上下文一并传递给 ctx.openView
        ...(defineProperties ? { defineProperties } : {}),
        ...(defineMethods ? { defineMethods } : {}),
      });
      return;
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

    const pageModelClass = ctx.inputArgs.pageModelClass || params.pageModelClass || 'ChildPageModel';
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
      : [...parentOpenerUids, (ctx.model.context?.inputArgs?.viewUid as string) || ctx.model.uid];
    const runtimePreventClose =
      typeof inputArgs.preventClose !== 'undefined' ? !!inputArgs.preventClose : !!params.preventClose;

    const finalInputArgs: Record<string, unknown> = {
      ...ctx.inputArgs,
      ...inputArgs,
      dataSourceKey: runtimeDataSourceKey,
      collectionName: runtimeCollectionName,
      associationName: runtimeAssociationName,
      tabUid: mergedTabUid,
      openerUids,
    };
    // Ensure runtime keys propagate to view.inputArgs
    finalInputArgs.filterByTk = mergedFilterByTk;
    finalInputArgs.sourceId = mergedSourceId;
    await ctx.viewer.open({
      type: openMode,
      inputArgs: finalInputArgs,
      preventClose: runtimePreventClose,
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
              const defineProperties =
                inputArgs.defineProperties ?? ctx.model.context?.inputArgs?.defineProperties ?? {};
              const defineMethods = inputArgs.defineMethods ?? ctx.model.context?.inputArgs?.defineMethods ?? {};

              pageModel.context.defineProperty('currentView', {
                get: () => currentView,
              });
              // 统一视图上下文：无论内部还是外部弹窗，页面内的 ctx.view 都指向“当前视图”
              // 这样在路由模式下，外部弹窗（通过 ctx.openView 触发）与内部弹窗拥有一致的 ctx.view 行为
              pageModel.context.defineProperty('view', {
                get: () => currentView,
              });
              pageModel.context.defineProperty('closable', {
                get: () => openMode !== 'embed',
              });

              if (pageModel instanceof RootPageModel) {
                // ctx.pageActive 是一个 observable.ref 对象，来自 RouteModel
                pageModel.context.defineProperty('pageActive', {
                  get: () => ctx.pageActive,
                });
              }

              Object.entries(defineProperties as Record<string, any>).forEach(([key, p]) => {
                pageModel.context.defineProperty(key, p);
              });
              Object.entries(defineMethods as Record<string, any>).forEach(([key, method]) => {
                pageModel.context.defineMethod(key, method);
              });

              pageModel.invalidateFlowCache('beforeRender', true);
              pageModel['_rerunLastAutoRun'](); // TODO: 临时做法，等上下文重构完成后去掉
            }}
            defaultTabTitle={ctx.model['defaultPopupTitle']}
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
        const nav = ctx.inputArgs?.navigation || ctx.view?.navigation;
        if (pageModelUid) {
          const pageModel = pageModelRef || ctx.model.flowEngine.getModel(pageModelUid);
          pageModel?.invalidateFlowCache('beforeRender', true);
        }
        if (navigation !== false) {
          if (nav?.back) {
            nav.back();
          }
        }
      },
      onOpen: ctx.inputArgs.onOpen,
    });
  },
});
