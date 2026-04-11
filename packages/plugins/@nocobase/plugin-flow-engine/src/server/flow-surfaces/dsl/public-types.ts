/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceExecutePlanValues, FlowSurfaceReadLocator, FlowSurfaceResourceBindingKey } from '../types';

export type FlowSurfaceExecuteDslMode = 'create' | 'replace';

export type FlowSurfaceExecuteDslTarget = {
  pageSchemaUid: string;
};

export type FlowSurfaceExecuteDslNavigationGroup = {
  routeId?: string | number;
  title?: string;
  icon?: string;
  tooltip?: string;
  hideInMenu?: boolean;
};

export type FlowSurfaceExecuteDslNavigation = {
  group?: FlowSurfaceExecuteDslNavigationGroup;
  item?: {
    title?: string;
    icon?: string;
    tooltip?: string;
    hideInMenu?: boolean;
  };
};

export type FlowSurfaceExecuteDslPage = {
  title?: string;
  icon?: string;
  documentTitle?: string;
  enableHeader?: boolean;
  enableTabs?: boolean;
  displayTitle?: boolean;
};

export type FlowSurfaceExecuteDslAssetMap = Record<string, Record<string, any>>;

export type FlowSurfaceExecuteDslAssets = {
  scripts?: FlowSurfaceExecuteDslAssetMap;
  charts?: FlowSurfaceExecuteDslAssetMap;
};

export type FlowSurfaceExecuteDslIdentifier = string | number;

export type FlowSurfaceExecuteDslLayoutCellObject = {
  key: string;
  span?: number;
};

export type FlowSurfaceExecuteDslLayoutCell = string | FlowSurfaceExecuteDslLayoutCellObject;

export type FlowSurfaceExecuteDslLayout = {
  rows: FlowSurfaceExecuteDslLayoutCell[][];
};

export type FlowSurfaceExecuteDslSemanticResource = {
  binding: FlowSurfaceResourceBindingKey;
  dataSourceKey?: string;
  collectionName?: string;
  associationField?: string;
};

export type FlowSurfaceExecuteDslRawResource = {
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  associationPathName?: string;
  sourceId?: FlowSurfaceExecuteDslIdentifier;
  filterByTk?: FlowSurfaceExecuteDslIdentifier;
};

export type FlowSurfaceExecuteDslBlockResource =
  | FlowSurfaceExecuteDslSemanticResource
  | FlowSurfaceExecuteDslRawResource;

export type FlowSurfaceExecuteDslPopup = {
  title?: string;
  mode?: 'replace' | 'append';
  template?: Record<string, any>;
  blocks?: FlowSurfaceExecuteDslBlockSpec[];
  layout?: FlowSurfaceExecuteDslLayout;
};

export type FlowSurfaceExecuteDslFieldObjectSpec = {
  key?: string;
  field?: string;
  associationPathName?: string;
  renderer?: string;
  type?: string;
  label?: string;
  target?: string;
  settings?: Record<string, any>;
  popup?: FlowSurfaceExecuteDslPopup;
  script?: string;
  chart?: string;
};

export type FlowSurfaceExecuteDslFieldSpec = string | FlowSurfaceExecuteDslFieldObjectSpec;

export type FlowSurfaceExecuteDslActionObjectSpec = {
  key?: string;
  type: string;
  title?: string;
  settings?: Record<string, any>;
  popup?: FlowSurfaceExecuteDslPopup;
  script?: string;
  chart?: string;
};

export type FlowSurfaceExecuteDslActionSpec = string | FlowSurfaceExecuteDslActionObjectSpec;

export type FlowSurfaceExecuteDslBlockSpec = {
  key?: string;
  type?: string;
  title?: string;
  collection?: string;
  dataSourceKey?: string;
  associationPathName?: string;
  binding?: FlowSurfaceResourceBindingKey;
  associationField?: string;
  resource?: FlowSurfaceExecuteDslBlockResource;
  template?: Record<string, any>;
  settings?: Record<string, any>;
  fields?: FlowSurfaceExecuteDslFieldSpec[];
  actions?: FlowSurfaceExecuteDslActionSpec[];
  recordActions?: FlowSurfaceExecuteDslActionSpec[];
  script?: string;
  chart?: string;
};

export type FlowSurfaceExecuteDslTabDocument = {
  key: string;
  title?: string;
  icon?: string;
  documentTitle?: string;
  blocks: FlowSurfaceExecuteDslBlockSpec[];
  layout?: FlowSurfaceExecuteDslLayout;
};

export type FlowSurfaceExecuteDslDocument = {
  version: '1';
  mode: FlowSurfaceExecuteDslMode;
  target?: FlowSurfaceExecuteDslTarget;
  navigation?: FlowSurfaceExecuteDslNavigation;
  page?: FlowSurfaceExecuteDslPage;
  tabs: FlowSurfaceExecuteDslTabDocument[];
  assets: FlowSurfaceExecuteDslAssets;
};

export type FlowSurfaceExecuteDslReplaceTargetInfo = {
  locator: FlowSurfaceReadLocator;
  pageUid: string;
  pageEnableTabs?: boolean;
  tabs: Array<{
    uid: string;
  }>;
};

export type FlowSurfaceExecuteDslProgram = {
  document: FlowSurfaceExecuteDslDocument;
  planValues: FlowSurfaceExecutePlanValues;
  pageLocator: FlowSurfaceReadLocator;
  pageUid?: string;
};
