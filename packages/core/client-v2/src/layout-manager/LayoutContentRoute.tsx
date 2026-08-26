/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowEngine, useFlowEngine } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { AppNotFound } from '../components';
import { getLayoutModel, type BaseLayoutModel, type LayoutRouteLike } from '../flow/admin-shell/BaseLayoutModel';
import FlowRoute from '../flow/components/FlowRoute';
import { useApp } from '../hooks/useApp';

export interface LayoutContentRouteProps {
  layoutRouteName: string;
}

const getRefCurrent = <T,>(ref: React.MutableRefObject<T>) => ref.current;

export const LayoutContentRoute = (props: LayoutContentRouteProps) => {
  const { layoutRouteName } = props;
  const app = useApp();
  const flowEngine = useFlowEngine();
  const layout = app.layoutManager.getLayout(layoutRouteName);
  const location = useLocation();
  const matches = useMatches();
  const model = getLayoutModel<BaseLayoutModel>(flowEngine, layout.uid, { required: true });
  const legacyPageBehavior = layout.routeName === 'admin' ? 'redirect' : 'notFound';
  const syncVersionRef = useRef(0);
  const routeLike = useMemo<LayoutRouteLike>(() => {
    const lastMatch = matches[matches.length - 1];
    const layoutMatch = matches.find((match) => match.id === layout.routeName);
    return {
      id: lastMatch?.id,
      name: lastMatch?.id,
      pathname: location.pathname,
      params: (lastMatch?.params || {}) as Record<string, string | undefined>,
      layoutRouteName: layout.routeName,
      layoutBasePathname: layoutMatch?.pathname,
    };
  }, [layout.routeName, location.pathname, matches]);
  if (!model) {
    throw new Error(`[NocoBase] Layout '${layout.routeName}' model '${layout.uid}' is not mounted.`);
  }

  const layoutRoute = model.resolveLayoutRoute(routeLike);
  const getCurrentLayoutModel = useMemo(
    () => (flowEngine: FlowEngine) => getLayoutModel<BaseLayoutModel>(flowEngine, layout.uid, { required: true }),
    [layout.uid],
  );

  useEffect(() => {
    const syncVersion = ++syncVersionRef.current;
    model.syncLayoutRoute(routeLike);
    return () => {
      Promise.resolve()
        .then(() => {
          if (getRefCurrent(syncVersionRef) !== syncVersion) {
            return;
          }
          model.clearLayoutRoute(routeLike);
        })
        .catch(() => {
          // ignore
        });
    };
  }, [model, routeLike]);

  if (layoutRoute.type === 'root') {
    return null;
  }

  if (layoutRoute.type === 'notFound') {
    return <AppNotFound />;
  }

  return (
    <FlowRoute
      pageUid={layoutRoute.pageUid}
      getLayoutModel={getCurrentLayoutModel}
      legacyPageBehavior={legacyPageBehavior}
    />
  );
};

export default LayoutContentRoute;
