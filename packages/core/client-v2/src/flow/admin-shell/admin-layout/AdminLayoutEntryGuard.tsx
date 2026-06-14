/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parsePathnameToViewParams, useFlowEngine } from '@nocobase/flow-engine';
import React, { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useMatches, useNavigate } from 'react-router-dom';
import { NocoBaseDesktopRouteType } from '../../../flow-compat';
import { useApp } from '../../../hooks/useApp';
import { isLayoutContentRouteName } from '../../../layout-manager/utils';
import type { LayoutDefinition } from '../../../layout-manager/types';
import {
  findFirstV2LandingRoute,
  getAdminLayoutRoutePath,
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from './resolveAdminRouteRuntimeTarget';
import type { AdminLayoutModel } from './AdminLayoutModel';

type StableAdminEntryLayout = Partial<Pick<LayoutDefinition, 'authCheck' | 'routeName' | 'routePath' | 'uid'>>;

export const AdminLayoutEntryGuard: FC<{ children: React.ReactNode; model?: AdminLayoutModel }> = ({
  children,
  model,
}) => {
  const flowEngine = useFlowEngine();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const [ready, setReady] = useState(false);
  const replaceTriggeredRef = useRef(false);
  const routeRepository = flowEngine.context.routeRepository;
  const rawLayout = model?.layout;
  const layoutUid = rawLayout?.uid;
  const layoutRouteNameValue = rawLayout?.routeName;
  const layoutRoutePathValue = rawLayout?.routePath;
  const layoutAuthCheck = rawLayout?.authCheck;
  const layout = useMemo<StableAdminEntryLayout | undefined>(() => {
    if (!layoutUid && !layoutRouteNameValue && !layoutRoutePathValue && typeof layoutAuthCheck === 'undefined') {
      return undefined;
    }

    return {
      authCheck: layoutAuthCheck,
      routeName: layoutRouteNameValue,
      routePath: layoutRoutePathValue,
      uid: layoutUid,
    };
  }, [layoutAuthCheck, layoutRouteNameValue, layoutRoutePathValue, layoutUid]);
  const layoutRoutePath = getAdminLayoutRoutePath(layout);
  const layoutRouteName = layout?.routeName || 'admin';
  const layoutRuntime = useMemo(() => ({ routePath: layoutRoutePath }), [layoutRoutePath]);
  const isAdminRoot = useMemo(() => {
    const pathname = toRouterNavigationPath(location.pathname, app.router.getBasename());
    return pathname === layoutRoutePath;
  }, [app, layoutRoutePath, location.pathname]);
  const pageUid = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    if (!isLayoutContentRouteName(layoutRouteName, lastMatch?.id)) {
      return '';
    }
    const adminMatch = matches.find((match) => match.id === layoutRouteName);
    return (
      (lastMatch.params?.name as string) ||
      parsePathnameToViewParams(location.pathname, {
        basePath: adminMatch?.pathname || layoutRoutePath,
      })[0]?.viewUid ||
      ''
    );
  }, [layoutRouteName, layoutRoutePath, location.pathname, matches]);

  useEffect(() => {
    replaceTriggeredRef.current = false;
  }, [location.pathname, location.search, location.hash, pageUid]);

  useEffect(() => {
    let active = true;
    const deactivateLayout = routeRepository?.activateLayout?.(layout);

    const run = async () => {
      setReady(false);

      if (!isAdminRoot && !pageUid) {
        if (active) {
          setReady(true);
        }
        return;
      }

      if (!routeRepository?.isAccessibleLoaded?.()) {
        try {
          await routeRepository?.ensureAccessibleLoaded?.();
        } catch (_error) {
          if (active) {
            setReady(true);
          }
          return;
        }
      }

      if (!active || replaceTriggeredRef.current) {
        return;
      }

      if (pageUid) {
        const currentRoute = routeRepository?.getRouteBySchemaUid?.(pageUid);
        if (currentRoute?.type === NocoBaseDesktopRouteType.page) {
          const target = resolveAdminRouteRuntimeTarget({
            app,
            route: currentRoute,
            layout: layoutRuntime,
            location: {
              pathname: window.location.pathname,
              search: window.location.search,
              hash: window.location.hash,
            },
            preserveLocationState: true,
          });

          if (target.navigationMode === 'document' && target.runtimePath) {
            replaceTriggeredRef.current = true;
            window.location.replace(target.runtimePath);
            return;
          }
        }

        if (active) {
          setReady(true);
        }
        return;
      }

      const firstAccessibleRoute = findFirstV2LandingRoute(routeRepository?.listAccessible?.() || []);
      if (!firstAccessibleRoute) {
        if (active) {
          setReady(true);
        }
        return;
      }

      const target = resolveAdminRouteRuntimeTarget({
        app,
        route: firstAccessibleRoute,
        layout: layoutRuntime,
      });

      if (!target.runtimePath) {
        if (active) {
          setReady(true);
        }
        return;
      }

      replaceTriggeredRef.current = true;
      if (target.navigationMode === 'document') {
        window.location.replace(target.runtimePath);
        return;
      }

      navigate(toRouterNavigationPath(target.runtimePath, app.router.getBasename()), { replace: true });
    };

    run();

    return () => {
      active = false;
      deactivateLayout?.();
    };
  }, [
    app,
    flowEngine,
    isAdminRoot,
    layout,
    layoutRuntime,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    pageUid,
    routeRepository,
  ]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
};
