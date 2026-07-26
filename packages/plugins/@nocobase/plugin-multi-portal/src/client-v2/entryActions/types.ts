/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AppPortalAppStatus =
  | 'preparing'
  | 'initializing'
  | 'initialized'
  | 'running'
  | 'commanding'
  | 'stopped'
  | 'error'
  | 'not_found';

export type AppPortalAppItem = {
  name: string;
  title?: string | null;
  icon?: string | null;
  cname?: string | null;
  ssoEnabled?: boolean;
  target?: string;
  status?: AppPortalAppStatus | Record<string, AppPortalAppStatus> | null;
};

export type AppPortalItem = {
  uid?: string | null;
  appName: string;
  title?: string | null;
  icon?: string | null;
  developmentMode?: string | null;
  routePath: string;
  layout?: string | null;
  defaultPortal?: boolean;
};

export type AppPortalsPayload = {
  apps: AppPortalAppItem[];
  portals: AppPortalItem[];
};

export type AppPortalActionAppLike = {
  name?: string;
  getRouteUrl?: (pathname: string) => string;
  getPublicPath?: () => string;
  router?: {
    basename?: string;
    getBasename?: () => string | undefined;
  };
};
