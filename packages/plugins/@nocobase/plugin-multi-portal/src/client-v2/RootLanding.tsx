/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, type Application } from '@nocobase/client-v2';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getMultiPortalRouteUrl, getMultiPortalSettingsUrl } from './routeUrl';

export type RootLandingPortal = {
  uid: string;
  portalType?: string | null;
  routePath: string;
};

export type RootLandingProps = {
  runtimeRegistrationFailed?: boolean;
};

type RootLandingPortalBody = {
  data?: RootLandingPortal | null;
};

function getLocationSuffix(location: { search?: string; hash?: string }) {
  return `${location.search || ''}${location.hash || ''}`;
}

export function RootLanding({ runtimeRegistrationFailed = false }: RootLandingProps) {
  const app = useApp<Application>();
  const location = useLocation();
  const [portal, setPortal] = useState<RootLandingPortal>();
  const documentNavigationTargetRef = useRef<string>();

  useEffect(() => {
    if (runtimeRegistrationFailed) {
      window.location.replace(`${getMultiPortalSettingsUrl(app)}${getLocationSuffix(location)}`);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const response = await app.apiClient.request<RootLandingPortalBody>({
          url: 'multiPortals:getDefault',
          method: 'get',
          skipAuth: true,
          skipNotify: true,
        });
        if (!active) {
          return;
        }
        const defaultPortal = response?.data?.data;
        if (defaultPortal && (defaultPortal.portalType === 'no-code' || defaultPortal.portalType === 'ai')) {
          if (
            defaultPortal.portalType === 'no-code' &&
            !app.layoutManager.listLayouts().some((layout) => layout.uid === defaultPortal.uid)
          ) {
            window.location.replace(`${getMultiPortalSettingsUrl(app)}${getLocationSuffix(location)}`);
            return;
          }
          setPortal(defaultPortal);
          return;
        }
        window.location.replace(`${getMultiPortalSettingsUrl(app)}${getLocationSuffix(location)}`);
      } catch {
        if (!active) return;
        window.location.replace(`${getMultiPortalSettingsUrl(app)}${getLocationSuffix(location)}`);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [app, location, runtimeRegistrationFailed]);

  useEffect(() => {
    if (!portal || portal.portalType !== 'ai') {
      return;
    }
    const target = `${getMultiPortalRouteUrl(app, portal.routePath, portal.portalType)}${getLocationSuffix(location)}`;
    if (documentNavigationTargetRef.current === target) {
      return;
    }
    documentNavigationTargetRef.current = target;
    window.location.replace(target);
  }, [app, location, portal]);

  if (!portal || portal.portalType === 'ai') {
    return null;
  }

  return <Navigate replace to={{ pathname: portal.routePath, search: location.search, hash: location.hash }} />;
}
