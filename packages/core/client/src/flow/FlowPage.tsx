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
  parsePathnameToViewParams,
  reaction,
  useFlowEngine,
  useFlowModelById,
  useFlowViewContext,
  ViewNavigation,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { useAllAccessDesktopRoutes, useCurrentRoute, useMobileLayout } from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';
import { resolveViewParamsToViewList, ViewItem } from './resolveViewParamsToViewList';
import { getViewDiffAndUpdateHidden } from './getViewDiffAndUpdateHidden';
import { getOpenViewStepParams } from './flows/openViewFlow';

function InternalFlowPage({ uid, ...props }) {
  const model = useFlowModelById(uid);
  return (
    <FlowModelRenderer
      model={model}
      fallback={<SkeletonFallback style={{ margin: 16 }} />}
      hideRemoveInSettings
      showFlowSettings={{ showBackground: false, showBorder: false }}
      {...props}
    />
  );
}

export const FlowRoute = () => {
  const layoutContentRef = useRef(null);
  const flowEngine = useFlowEngine();
  const currentRoute = useCurrentRoute();
  const { refresh } = useAllAccessDesktopRoutes();
  const { isMobileLayout } = useMobileLayout();
  const pageUidRef = useRef(flowEngine.context.route.params.name);
  const viewStateRef = useRef<{
    [uid in string]: { close: () => void; update: (value: any) => void };
  }>({});
  const prevViewListRef = useRef<ViewItem[]>([]);
  const isStepNavigatingRef = useRef(false);

  const routeModel = useMemo(() => {
    return flowEngine.createModel({
      uid: pageUidRef.current,
      use: 'RouteModel',
    });
  }, [flowEngine]);

  useEffect(() => {
    routeModel.context.defineProperty('isMobileLayout', {
      get: () => isMobileLayout,
    });
  }, [isMobileLayout, routeModel]);

  useEffect(() => {
    if (!layoutContentRef.current) {
      return;
    }
    routeModel.context.defineProperty('layoutContentElement', {
      get: () => layoutContentRef.current,
    });
    routeModel.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });
    routeModel.context.defineProperty('refreshDesktopRoutes', {
      get: () => refresh,
    });
  }, [routeModel, currentRoute, refresh]);

  useEffect(() => {
    const dispose = reaction(
      () => flowEngine.context.route,
      async (newRoute) => {
        if (newRoute.params.name !== pageUidRef.current || isStepNavigatingRef.current) {
          return;
        }

        // 1. 把 pathname 解析成一个数组
        const viewStack = parsePathnameToViewParams(newRoute.pathname);

        // 2. 根据视图参数获取更多信息
        const viewList = await resolveViewParamsToViewList(flowEngine, viewStack, routeModel);

        // 特殊处理：当通过一个多级 url 打开时，需要把这个 url 分成多步，然后逐步打开。这样做是为了能在点击返回按钮时返回到上一级
        if (prevViewListRef.current.length === 0 && viewList.length > 1) {
          const navigateTo = (index: number) => {
            if (!viewList[index]) {
              return;
            }

            // 在最后一步时，确保能触发路由监听函数
            if (index === viewList.length - 1) {
              isStepNavigatingRef.current = false;
            }

            if (index === 0) {
              new ViewNavigation(flowEngine.context, []).navigateTo(viewList[index].params, { replace: true });
            } else {
              new ViewNavigation(
                flowEngine.context,
                viewList.slice(0, index).map((item) => item.params),
              ).navigateTo(viewList[index].params);
            }

            // 需要有个延迟，才能正常触发路由的跳转
            setTimeout(() => {
              navigateTo(index + 1);
            }, 20);
          };

          navigateTo(0);
          isStepNavigatingRef.current = true;
          return;
        }

        // 3. 对比新旧列表，区分开需要打开和关闭的视图
        const { viewsToClose, viewsToOpen } = getViewDiffAndUpdateHidden(prevViewListRef.current, viewList);

        // 4. 处理需要打开的视图
        if (viewsToOpen.length) {
          const openView = (index: number) => {
            if (!viewsToOpen[index]) {
              return;
            }

            const viewItem = viewsToOpen[index];
            const closeRef = React.createRef<() => void>();
            const updateRef = React.createRef<(value: any) => void>();
            const openViewParams = getOpenViewStepParams(viewItem.model);

            prevViewListRef.current.push(viewItem);

            viewItem.model.dispatchEvent('click', {
              target: layoutContentRef.current,
              collectionName: openViewParams?.collectionName,
              associationName: openViewParams?.associationName,
              dataSourceKey: openViewParams?.dataSourceKey,
              closeRef,
              updateRef,
              ...viewItem.params,
              navigation: new ViewNavigation(
                flowEngine.context,
                prevViewListRef.current.map((item) => item.params),
              ),
              onOpen() {
                openView(index + 1); // 递归打开下一个视图
              },
              hidden: viewItem.hidden, // 是否隐藏视图
            });

            viewStateRef.current[viewItem.params.viewUid] = {
              close: () => closeRef.current?.(),
              update: (value: any) => updateRef.current?.(value),
            };
          };

          openView(0);
        }

        // 5. 处理需要关闭的视图
        viewsToClose.forEach((viewItem) => {
          viewStateRef.current[viewItem.params.viewUid].close();
          delete viewStateRef.current[viewItem.params.viewUid];
          prevViewListRef.current = prevViewListRef.current.filter(
            (item) => item.params.viewUid !== viewItem.params.viewUid,
          );
        });
      },
      {
        fireImmediately: true,
      },
    );

    return dispose;
  }, [flowEngine, routeModel]);

  return <div ref={layoutContentRef} />;
};

export const FlowPage = (props) => {
  const { pageModelClass = 'ChildPageModel', parentId, onModelLoaded, ...rest } = props;
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
        options['subModels'] = {
          tabs: [
            {
              use: 'ChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: 'Details',
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
        onModelLoaded(data.uid);
      }
      return data;
    },
    {
      refreshDeps: [parentId],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <InternalFlowPage uid={data.uid} {...rest} />;
};

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
