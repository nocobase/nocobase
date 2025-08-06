/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine, useFlowModelById } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Card, Skeleton, Spin } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useCurrentRoute, useKeepAlive } from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';

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
  const params = useParams();
  const currentRoute = useCurrentRoute();
  // console.log('FlowRoute params:', params);
  // const { active } = useKeepAlive();
  const model = useMemo(() => {
    return flowEngine.createModel({
      uid: params.name,
      use: 'RouteModel',
    });
  }, [params.name, flowEngine]);
  useEffect(() => {
    // if (!active) {
    //   return;
    // }
    if (!layoutContentRef.current) {
      return;
    }
    model.context.defineProperty('layoutContentElement', {
      get: () => layoutContentRef.current,
    });
    model.context.defineProperty('currentRoute', {
      get: () => currentRoute,
    });

    model.dispatchEvent('click', { mode: 'embed', target: layoutContentRef.current, activeTab: params.tabUid });
  }, [model, params.name, params.tabUid, currentRoute]);
  return <div ref={layoutContentRef} />;
};

export const FlowPage = (props) => {
  const { pageModelClass = 'SubPageModel', parentId, onModelLoaded, ...rest } = props;
  const flowEngine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      const options = {
        async: true,
        parentId,
        subKey: 'page',
        subType: 'object',
        use: pageModelClass,
        subModels: {
          tabs: [
            {
              use: 'PageTabModel',
              subModels: {
                grid: {
                  // async: true,
                  use: 'BlockGridModel',
                },
              },
            },
          ],
        },
      };
      const data = await flowEngine.loadOrCreateModel(options);
      if (data?.uid && onModelLoaded) {
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
