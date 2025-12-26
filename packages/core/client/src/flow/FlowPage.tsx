/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowModelRenderer,
  observable,
  parsePathnameToViewParams,
  reaction,
  useFlowEngine,
  useFlowModelById,
  useFlowViewContext,
  ViewNavigation,
} from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { useAllAccessDesktopRoutes, useCurrentRoute, useKeepAlive, useMobileLayout } from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';
import { resolveViewParamsToViewList, ViewItem } from './resolveViewParamsToViewList';
import { getViewDiffAndUpdateHidden } from './getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from './flows/openViewFlow';
import { useDesignable } from '../schema-component';
import { deviceType } from 'react-device-detect';

function InternalFlowPage({ uid, ...props }) {
  const model = useFlowModelById(uid);
  return (
    <FlowModelRenderer
      model={model}
      fallback={
        <SkeletonFallback
          style={{ margin: model?.context.isMobileLayout ? 8 : model?.context.themeToken.marginBlock }}
        />
      }
      hideRemoveInSettings
      showFlowSettings={{ showBackground: false, showBorder: false }}
      {...props}
    />
  );
}

const getKey = (viewItem: ViewItem) => `${viewItem.params.viewUid}_${viewItem.index}`;

export const FlowRoute = () => {
  const layoutContentRef = useRef(null);
  const flowEngine = useFlowEngine();
  const currentRoute = useCurrentRoute();
  const { refresh } = useAllAccessDesktopRoutes();
  const { isMobileLayout } = useMobileLayout();
  const pageUidRef = useRef(flowEngine.context.route.params.name);
  const viewStateRef = useRef<{
    [uid in string]: { close: (force?: boolean) => void; update: (value: any) => void; navigation: ViewNavigation };
  }>({});
  const prevViewListRef = useRef<ViewItem[]>([]);
  const hasStepNavigatedRef = useRef(false);
  const { designable } = useDesignable();
  const { active } = useKeepAlive();

  const routeModel = useMemo(() => {
    return flowEngine.createModel({
      uid: pageUidRef.current,
      use: 'RouteModel',
    });
  }, [flowEngine]);

  useEffect(() => {
    routeModel.context.defineProperty('pageActive', {
      value: observable.ref(false),
    });
  }, [routeModel]);

  useEffect(() => {
    routeModel.context.pageActive.value = active;
  }, [active, routeModel]);

  useEffect(() => {
    flowEngine.context.defineProperty('isMobileLayout', {
      get: () => isMobileLayout,
    });
    flowEngine.context.defineProperty('deviceType', {
      get: () => (deviceType === 'browser' ? 'computer' : deviceType),
      cache: false,
      meta: {
        type: 'string',
        title: flowEngine.translate('Current device type'),
        interface: 'select',
        uiSchema: {
          enum: [
            { label: flowEngine.translate('Computer'), value: 'computer' },
            { label: flowEngine.translate('Mobile'), value: 'mobile' },
            { label: flowEngine.translate('Tablet'), value: 'tablet' },
            { label: flowEngine.translate('SmartTv'), value: 'smarttv' },
            { label: flowEngine.translate('Console'), value: 'console' },
            { label: flowEngine.translate('Wearable'), value: 'wearable' },
            { label: flowEngine.translate('Embedded'), value: 'embedded' },
          ],
          'x-component': 'Select',
        },
      },
    });
  }, [isMobileLayout, flowEngine]);

  useEffect(() => {
    // 移动端中不允许配置 UI
    if (isMobileLayout) {
      flowEngine.flowSettings.disable();
    } else if (designable) {
      flowEngine.flowSettings.enable();
    }
  }, [designable, flowEngine, isMobileLayout]);

  useEffect(() => {
    if (!layoutContentRef.current) {
      return;
    }
    flowEngine.context.defineProperty('layoutContentElement', {
      get: () => layoutContentRef.current,
    });
    routeModel.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });
    // Also expose currentRoute on engine context so view-scoped engines
    // can still read it for default title fallback.
    flowEngine.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });
    routeModel.context.defineProperty('refreshDesktopRoutes', {
      get: () => refresh,
    });
  }, [routeModel, currentRoute, refresh, flowEngine]);

  useEffect(() => {
    const dispose = reaction(
      () => flowEngine.context.route,
      async (newRoute) => {
        if (newRoute.params.name !== pageUidRef.current) {
          return;
        }

        // 1. 把 pathname 解析成一个数组
        const viewStack = parsePathnameToViewParams(newRoute.pathname);

        // 2. 根据视图参数获取更多信息
        const viewList = await resolveViewParamsToViewList(flowEngine, viewStack, routeModel);

        // 特殊处理：当通过一个多级 url 打开时，需要把这个 url 分成多步，然后逐步打开。这样做是为了能在点击返回按钮时返回到上一级
        if (prevViewListRef.current.length === 0 && viewList.length > 1 && !hasStepNavigatedRef.current) {
          const navigateTo = (index: number) => {
            if (!viewList[index]) {
              return;
            }

            if (index === 0) {
              new ViewNavigation(flowEngine.context, []).navigateTo(viewList[index].params, { replace: true });
            } else {
              new ViewNavigation(
                flowEngine.context,
                viewList.slice(0, index).map((item) => item.params),
              ).navigateTo(viewList[index].params);
            }

            navigateTo(index + 1);
          };

          navigateTo(0);
          hasStepNavigatedRef.current = true;
          return;
        }

        // 3. 对比新旧列表，区分开需要打开和关闭的视图
        const { viewsToClose, viewsToOpen } = getViewDiffAndUpdateHidden(prevViewListRef.current, viewList);

        console.log('[NocoBase] FlowRoute view diff:', { viewsToClose, viewsToOpen });

        // 4. 处理需要打开的视图
        if (viewsToOpen.length) {
          const prevViewListCopy = [...prevViewListRef.current];
          const openView = (index: number) => {
            if (!viewsToOpen[index]) {
              return;
            }

            const viewItem = viewsToOpen[index];
            const closeRef = React.createRef<(result?: any, force?: boolean) => void>();
            const updateRef = React.createRef<(value: any) => void>();
            const openViewParams = getOpenViewStepParams(viewItem.model);
            const openerUids = prevViewListCopy.map((item) => item.params.viewUid);
            prevViewListCopy.push(viewItem);
            const navigation = new ViewNavigation(
              flowEngine.context,
              prevViewListCopy.map((item) => item.params),
            );

            viewItem.model.dispatchEvent('click', {
              target: layoutContentRef.current,
              collectionName: openViewParams?.collectionName,
              associationName: openViewParams?.associationName,
              dataSourceKey: openViewParams?.dataSourceKey,
              closeRef,
              updateRef,
              openerUids,
              ...viewItem.params,
              navigation,
              onOpen() {
                openView(index + 1); // 递归打开下一个视图
              },
              hidden: viewItem.hidden, // 是否隐藏视图
              isMobileLayout,
            });

            viewStateRef.current[getKey(viewItem)] = {
              close: (force?: boolean) => closeRef.current?.(undefined, force),
              update: (value: any) => updateRef.current?.(value),
              navigation,
            };
          };

          openView(0);
        }

        // 5. 处理需要关闭的视图（强制关闭，确保触发 onClose 并绕过 preventClose）
        viewsToClose.forEach((viewItem) => {
          viewStateRef.current[getKey(viewItem)]?.close?.(true);
          delete viewStateRef.current[getKey(viewItem)];
        });

        // 6. 当没有视图需要打开和关闭时，说明只是更新了当前视图的参数，比如切换 tab。这是需要更新当前视图 navigation 的 viewStack，避免 URL 错乱
        if (viewsToClose.length === 0 && viewsToOpen.length === 0) {
          const currentViewItem = viewList.at(-1);
          viewStateRef.current[getKey(currentViewItem)]?.navigation.setViewStack(viewList.map((item) => item.params));
        }

        prevViewListRef.current = viewList.map((item, index) => {
          if (prevViewListRef.current[index]) {
            // 修复子页面切换时，hidden 状态失去响应性的问题
            item.hidden = prevViewListRef.current[index].hidden;
          }
          return item;
        });
      },
      {
        fireImmediately: true,
      },
    );

    // Cleanup: on unmount, force-close all opened views and remove their models
    return () => {
      dispose?.();
      prevViewListRef.current.forEach((viewItem) => {
        flowEngine.removeModelWithSubModels(viewItem.params.viewUid);
        viewStateRef.current[getKey(viewItem)].close(true);
      });
    };
  }, [flowEngine, isMobileLayout, routeModel]);

  return <div ref={layoutContentRef} />;
};

type FlowPageProps = {
  pageModelClass?: string;
  parentId?: string;
  onModelLoaded?: (uid: string, model: FlowModel) => void;
  defaultTabTitle?: string;
};

export const FlowPage = React.memo((props: FlowPageProps & Record<string, unknown>) => {
  const { pageModelClass = 'ChildPageModel', parentId, onModelLoaded, defaultTabTitle, ...rest } = props;
  const flowEngine = useFlowEngine();
  const ctx = useFlowViewContext();
  const { loading, data } = useRequest(
    async () => {
      const options = {
        async: true,
        parentId,
        subKey: 'page',
        subType: 'object',
        use: pageModelClass,
      };
      if (pageModelClass === 'ChildPageModel') {
        const tabTitle = defaultTabTitle || flowEngine.translate?.('Details');
        options['subModels'] = {
          tabs: [
            {
              use: 'ChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: tabTitle,
                  },
                },
              },
            },
          ],
        };
        // 弹窗或者子页面中，默认显示 tab
        options['stepParams'] = {
          pageSettings: {
            general: {
              displayTitle: false,
              enableTabs: true,
            },
          },
        };
      }
      const data = await flowEngine.loadOrCreateModel(options);
      if (data?.uid && onModelLoaded) {
        data.context.addDelegate(ctx);
        data.removeParentDelegate();
        onModelLoaded(data.uid, data);
      }
      return data;
    },
    {
      refreshDeps: [parentId],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: ctx?.isMobileLayout ? 8 : ctx?.themeToken.marginBlock }} />;
  }
  return <InternalFlowPage uid={data.uid} {...rest} />;
});

FlowPage.displayName = 'FlowPage';

export const RemoteFlowModelRenderer = (props) => {
  const { uid, parentId, subKey, ...rest } = props;
  const flowEngine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      const data = await flowEngine.loadModel({ uid, parentId, subKey });
      return data;
    },
    {
      refreshDeps: [uid, parentId, subKey],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <InternalFlowPage uid={data.uid} {...rest} />;
};
