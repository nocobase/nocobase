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
import {
  findFirstV2LandingRoute,
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from './resolveAdminRouteRuntimeTarget';

export const AdminLayoutEntryGuard: FC<{ children: React.ReactNode }> = ({ children }) => {
  const flowEngine = useFlowEngine();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const matches = useMatches();
  const [ready, setReady] = useState(false);
  const replaceTriggeredRef = useRef(false);
  const routeRepository = flowEngine.context.routeRepository;
  const isAdminRoot = useMemo(() => {
    const pathname = toRouterNavigationPath(location.pathname, app.router.getBasename());
    return pathname === '/admin';
  }, [app, location.pathname]);
  const pageUid = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    if (!isLayoutContentRouteName('admin', lastMatch?.id)) {
      return '';
    }
    const adminMatch = matches.find((match) => match.id === 'admin');
    return (
      (lastMatch.params?.name as string) ||
      parsePathnameToViewParams(location.pathname, {
        basePath: adminMatch?.pathname || '/admin',
      })[0]?.viewUid ||
      ''
    );
  }, [location.pathname, matches]);

  useEffect(() => {
    replaceTriggeredRef.current = false;
  }, [location.pathname, location.search, location.hash, pageUid]);

  useEffect(() => {
    let active = true;

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

    void run();

    return () => {
      active = false;
    };
  }, [
    app,
    flowEngine,
    isAdminRoot,
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
