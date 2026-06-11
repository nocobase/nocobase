/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export enum NocoBaseDesktopRouteType {
  group = 'group',
  page = 'page',
  flowRoute = 'flowRoute',
  link = 'link',
  tabs = 'tabs',
  flowPage = 'flowPage',
}

export interface NocoBaseDesktopRouteOptions {
  hasPersistedMenuInstanceFlow?: boolean;
  [key: string]: any;
}

export interface NocoBaseDesktopRoute {
  id?: number;
  parentId?: number;
  children?: NocoBaseDesktopRoute[];
  title?: string;
  tooltip?: string;
  icon?: string;
  schemaUid?: string;
  menuSchemaUid?: string;
  tabSchemaName?: string;
  pageSchemaUid?: string;
  type?: NocoBaseDesktopRouteType;
  options?: NocoBaseDesktopRouteOptions;
  sort?: number;
  hideInMenu?: boolean;
  enableTabs?: boolean;
  hidden?: boolean;
  roles?: Array<{
    name: string;
    title: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
  updatedBy?: any;
}

export interface AdminLayoutRoutePageMeta {
  active?: boolean;
  refreshDesktopRoutes?: () => Promise<unknown>;
  layoutContentElement?: HTMLDivElement | null;
}

export interface AdminLayoutModel {
  registerRoutePage: (pageUid: string, meta: AdminLayoutRoutePageMeta) => unknown;
  updateRoutePage: (pageUid: string, meta: Partial<AdminLayoutRoutePageMeta>) => unknown;
  unregisterRoutePage: (pageUid: string) => unknown;
}
