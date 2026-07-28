/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, type Application } from '@nocobase/client-v2';
import { Flex, Result, Spin } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useT } from './locale';
import { getMultiPortalRouteUrl } from './routeUrl';

export type RootLandingPortal = {
  uid: string;
  portalType?: string | null;
  routePath: string;
  uiLayout?: {
    layoutType?: string | null;
  };
};

type RootLandingPortalListBody = {
  data?: RootLandingPortal[];
};

const ADMIN_PORTAL_UID = 'admin-layout-model';

function getRootLandingPriority(portal: RootLandingPortal) {
  if (portal.uid === ADMIN_PORTAL_UID && portal.portalType === 'no-code') {
    return 0;
  }
  if (portal.portalType === 'no-code' && portal.uiLayout?.layoutType === 'desktop') {
    return 1;
  }
  if (portal.portalType === 'no-code' && portal.uiLayout?.layoutType === 'mobile') {
    return 2;
  }
  return 3;
}

export function selectRootLandingPortal(portals: RootLandingPortal[]) {
  return portals
    .filter((portal) => portal.portalType === 'no-code' || portal.portalType === 'ai')
    .map((portal, index) => ({ index, portal, priority: getRootLandingPriority(portal) }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)[0]?.portal;
}

export function RootLanding() {
  const app = useApp<Application>();
  const t = useT();
  const [portals, setPortals] = useState<RootLandingPortal[]>();
  const [error, setError] = useState<Error>();
  const documentNavigationTargetRef = useRef<string>();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await app.apiClient.request<RootLandingPortalListBody>({
          url: 'multiPortals:listAccessible',
          method: 'get',
          skipNotify: true,
        });
        if (active) {
          setPortals(Array.isArray(response?.data?.data) ? response.data.data : []);
          setError(undefined);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [app]);

  const selectedPortal = useMemo(() => selectRootLandingPortal(portals ?? []), [portals]);

  useEffect(() => {
    if (!selectedPortal || selectedPortal.portalType !== 'ai') {
      return;
    }
    const target = getMultiPortalRouteUrl(app, selectedPortal.routePath, selectedPortal.portalType);
    if (documentNavigationTargetRef.current === target) {
      return;
    }
    documentNavigationTargetRef.current = target;
    window.location.replace(target);
  }, [app, selectedPortal]);

  if (error) {
    return <Result status="error" title={t('Failed to load portals')} />;
  }
  if (!portals || (selectedPortal && selectedPortal.portalType === 'ai')) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }
  if (!selectedPortal) {
    return <Result status="info" title={t('No accessible portals')} />;
  }

  return <Navigate replace to={selectedPortal.routePath} />;
}
