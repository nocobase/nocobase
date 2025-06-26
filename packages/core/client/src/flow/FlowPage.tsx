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
import { useKeepAlive } from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';

function InternalFlowPage({ uid, sharedContext }) {
  const model = useFlowModelById(uid);
  return (
    <FlowModelRenderer
      model={model}
      sharedContext={sharedContext}
      fallback={<SkeletonFallback />}
      showFlowSettings={{ showBackground: false, showBorder: false }}
      hideRemoveInSettings
    />
  );
}

export const FlowRoute = () => {
  const layoutContentRef = useRef(null);
  const flowEngine = useFlowEngine();
  const params = useParams();
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
    model.setSharedContext({
      layoutContentElement: layoutContentRef.current,
    });
    model.dispatchEvent('click', { target: layoutContentRef.current });
  }, [model, params.name]);
  return <div ref={layoutContentRef} />;
};

export const FlowPage = (props) => {
  const { parentId, sharedContext } = props;
  const flowEngine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      const options = {
        async: true,
        parentId,
        subKey: 'page',
        subType: 'object',
        use: 'PageModel',
        subModels: {
          tabs: [
            {
              use: 'PageTabModel',
              subModels: {
                grid: {
                  use: 'BlockGridModel',
                },
              },
            },
          ],
        },
      };
      const data = await flowEngine.loadOrCreateModel(options);
      return data;
    },
    {
      refreshDeps: [parentId],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback />;
  }
  return <InternalFlowPage uid={data.uid} sharedContext={sharedContext} />;
};
