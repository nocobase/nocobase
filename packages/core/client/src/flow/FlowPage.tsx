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
import { useCurrentRoute, useMobileLayout } from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';
import { resolveViewParamsToViewList, ViewItem } from './resolveViewParamsToViewList';
import { getViewDiff } from './getViewDiff';

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
  const { isMobileLayout } = useMobileLayout();
  const pageUidRef = useRef(flowEngine.context.route.params.name);
  const viewStateRef = useRef<{
    [uid in string]: { close: () => void; update: (value: any) => void; hidden: boolean };
  }>({});
  const prevViewListRef = useRef<ViewItem[]>([]);

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
  }, [routeModel, currentRoute]);

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

        // 3. 对比新旧列表，区分开需要打开和关闭的视图
        const { viewsToClose, viewsToOpen } = getViewDiff(prevViewListRef.current, viewList);

        // 4. 处理需要打开的视图
        viewsToOpen.forEach((viewItem, index) => {
          const closeRef = React.createRef<() => void>();
          const updateRef = React.createRef<(value: any) => void>();

          prevViewListRef.current.push(viewItem);

          viewItem.model.dispatchEvent('click', {
            target: layoutContentRef.current,
            params: viewItem.params,
            closeRef,
            updateRef,
            navigation: new ViewNavigation(
              flowEngine.context,
              prevViewListRef.current.map((item) => item.params),
            ),
          });
          viewStateRef.current[viewItem.params.viewUid] = {
            close: () => closeRef.current?.(),
            update: (value: any) => updateRef.current?.(value),
            hidden: false,
          };
        });

        // 5. 处理需要关闭的视图
        viewsToClose.forEach((viewItem) => {
          viewStateRef.current[viewItem.params.viewUid].close();
          delete viewStateRef.current[viewItem.params.viewUid];
          prevViewListRef.current = viewList;
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
