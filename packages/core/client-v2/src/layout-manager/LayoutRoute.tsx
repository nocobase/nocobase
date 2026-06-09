/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, FlowModelRenderer, isInheritedFrom, useFlowEngine } from '@nocobase/flow-engine';
import type { ModelConstructor } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { SkeletonFallback } from '../flow/components/SkeletonFallback';
import { useApp } from '../hooks/useApp';
import { BaseLayoutModel } from '../flow/admin-shell/BaseLayoutModel';
import type { LayoutDefinition } from './types';

export interface LayoutRouteProps {
  layoutRouteName: string;
}

const getRefCurrent = <T,>(ref: React.MutableRefObject<T>) => ref.current;

function isBaseLayoutModelClass(ModelClass: ModelConstructor) {
  return ModelClass === BaseLayoutModel || isInheritedFrom(ModelClass, BaseLayoutModel as ModelConstructor);
}

function assertLayoutModelInstance(model: FlowModel, layout: LayoutDefinition) {
  if (!(model instanceof BaseLayoutModel)) {
    throw new Error(
      `[NocoBase] Layout '${layout.routeName}' requires model '${layout.uid}' to be an instance of BaseLayoutModel.`,
    );
  }
}

async function assertLayoutModelClass(flowEngine: FlowEngine, layout: LayoutDefinition) {
  const ModelClass = await flowEngine.getModelClassAsync(layout.layoutModelClass);

  if (!ModelClass) {
    throw new Error(
      `[NocoBase] Layout '${layout.routeName}' model class '${layout.layoutModelClass}' is not registered.`,
    );
  }

  if (!isBaseLayoutModelClass(ModelClass)) {
    throw new Error(
      `[NocoBase] Layout '${layout.routeName}' model class '${layout.layoutModelClass}' must extend BaseLayoutModel.`,
    );
  }
}

export const LayoutRoute = (props: LayoutRouteProps) => {
  const { layoutRouteName } = props;
  const app = useApp();
  const flowEngine = useFlowEngine();
  const layout = app.layoutManager.getLayout(layoutRouteName);
  const location = useLocation();
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const layoutMatch = matches.find((match) => match.id === layout.routeName);
  const lastMatchParamsSignature = JSON.stringify(lastMatch?.params || {});
  const lastMatchParams = useMemo(
    () => JSON.parse(lastMatchParamsSignature) as Record<string, string | undefined>,
    [lastMatchParamsSignature],
  );
  const syncVersionRef = useRef(0);
  const routeLike = useMemo(() => {
    return {
      id: lastMatch?.id,
      name: lastMatch?.id,
      pathname: location.pathname,
      params: lastMatchParams,
      layoutRouteName: layout.routeName,
      layoutBasePathname: layoutMatch?.pathname,
    };
  }, [lastMatch?.id, lastMatchParams, layout.routeName, layoutMatch?.pathname, location.pathname]);
  const { loading, data, error } = useRequest(
    async () => {
      const existingModel = flowEngine.getModel<BaseLayoutModel>(layout.uid);

      if (existingModel) {
        assertLayoutModelInstance(existingModel, layout);
        existingModel.setProps({ layout });
        return existingModel;
      }

      await assertLayoutModelClass(flowEngine, layout);

      const model = await flowEngine.createModelAsync<BaseLayoutModel>({
        uid: layout.uid,
        use: layout.layoutModelClass,
        props: {
          layout,
        },
      });
      assertLayoutModelInstance(model, layout);
      return model;
    },
    {
      refreshDeps: [flowEngine, layout],
    },
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    const syncVersion = ++syncVersionRef.current;
    data.syncLayoutRoute(routeLike);
    return () => {
      Promise.resolve()
        .then(() => {
          if (getRefCurrent(syncVersionRef) !== syncVersion) {
            return;
          }
          data.clearLayoutRoute(routeLike);
        })
        .catch(() => {
          // ignore
        });
    };
  }, [data, routeLike]);

  if (error) {
    throw error;
  }

  if (loading || !data) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }

  return <FlowModelRenderer model={data} />;
};

export default LayoutRoute;
