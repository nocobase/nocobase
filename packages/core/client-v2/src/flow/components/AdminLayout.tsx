/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine, FlowModelRenderer } from '@nocobase/flow-engine';
import React, { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { getAdminLayoutModel, AdminLayoutModel } from '..';
import { useApp } from '../../hooks/useApp';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { NocoBaseDesktopRouteType } from '../../flow-compat';
import {
  findFirstAccessiblePageRoute,
  resolveAdminRouteRuntimeTarget,
  toRouterNavigationPath,
} from '../admin-shell/admin-layout/resolveAdminRouteRuntimeTarget';

const AdminLayoutEntryGuard: FC<{ children: React.ReactNode }> = ({ children }) => {
  const flowEngine = useFlowEngine();
  const app = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [ready, setReady] = useState(false);
  const replaceTriggeredRef = useRef(false);
  const routeRepository = flowEngine.context.routeRepository;
  const isAdminRoot = useMemo(() => {
    const pathname = toRouterNavigationPath(location.pathname, app.router.getBasename());
    return pathname === '/admin';
  }, [app, location.pathname]);

  useEffect(() => {
    replaceTriggeredRef.current = false;
  }, [location.pathname, location.search, location.hash, params.name]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setReady(false);

      if (!isAdminRoot && !params.name) {
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

      if (params.name) {
        const currentRoute = routeRepository?.getRouteBySchemaUid?.(params.name);
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

      const firstAccessibleRoute = findFirstAccessiblePageRoute(routeRepository?.listAccessible?.() || []);
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
    params.name,
    routeRepository,
  ]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
};

const AdminLayout: FC = (props) => {
  const flowEngine = useFlowEngine();
  const model = getAdminLayoutModel(flowEngine, {
    create: true,
    props,
    use: AdminLayoutModel,
  });

  if (!model) {
    throw new Error('[NocoBase] Failed to create admin-layout-model.');
  }

  return (
    <AdminLayoutEntryGuard>
      <FlowModelRenderer model={model} />
    </AdminLayoutEntryGuard>
  );
};

export default AdminLayout;
