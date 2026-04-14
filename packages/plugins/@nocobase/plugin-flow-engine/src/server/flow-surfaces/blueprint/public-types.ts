/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfacePlanStep,
  FlowSurfaceReadLocator,
  FlowSurfaceSurfaceSelector,
  FlowSurfaceResourceBindingKey,
} from '../types';
import type { FlowSurfaceApplyBlueprintReactionItem } from '../reaction/types';

export type FlowSurfaceApplyBlueprintMode = 'create' | 'replace';

export type FlowSurfaceApplyBlueprintTarget = {
  pageSchemaUid: string;
};

export type FlowSurfaceApplyBlueprintNavigationGroup = {
  routeId?: string | number;
  title?: string;
  icon?: string;
  tooltip?: string;
  hideInMenu?: boolean;
};

export type FlowSurfaceApplyBlueprintNavigation = {
  group?: FlowSurfaceApplyBlueprintNavigationGroup;
  item?: {
    title?: string;
    icon?: string;
    tooltip?: string;
    hideInMenu?: boolean;
  };
};

export type FlowSurfaceApplyBlueprintPage = {
  title?: string;
  icon?: string;
  documentTitle?: string;
  enableHeader?: boolean;
  enableTabs?: boolean;
  displayTitle?: boolean;
};

export type FlowSurfaceApplyBlueprintAssetMap = Record<string, Record<string, any>>;

export type FlowSurfaceApplyBlueprintAssets = {
  scripts?: FlowSurfaceApplyBlueprintAssetMap;
  charts?: FlowSurfaceApplyBlueprintAssetMap;
};

export type FlowSurfaceApplyBlueprintIdentifier = string | number;

export type FlowSurfaceApplyBlueprintLayoutCellObject = {
  key: string;
  span?: number;
};

export type FlowSurfaceApplyBlueprintLayoutCell = string | FlowSurfaceApplyBlueprintLayoutCellObject;

export type FlowSurfaceApplyBlueprintLayout = {
  rows: FlowSurfaceApplyBlueprintLayoutCell[][];
};

export type FlowSurfaceApplyBlueprintSemanticResource = {
  binding: FlowSurfaceResourceBindingKey;
  dataSourceKey?: string;
  collectionName?: string;
  associationField?: string;
};

export type FlowSurfaceApplyBlueprintRawResource = {
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  associationPathName?: string;
  sourceId?: FlowSurfaceApplyBlueprintIdentifier;
  filterByTk?: FlowSurfaceApplyBlueprintIdentifier;
};

export type FlowSurfaceApplyBlueprintBlockResource =
  | FlowSurfaceApplyBlueprintSemanticResource
  | FlowSurfaceApplyBlueprintRawResource;

export type FlowSurfaceApplyBlueprintPopup = {
  title?: string;
  mode?: 'replace' | 'append';
  template?: Record<string, any>;
  blocks?: FlowSurfaceApplyBlueprintBlockSpec[];
  layout?: FlowSurfaceApplyBlueprintLayout;
};

export type FlowSurfaceApplyBlueprintFieldObjectSpec = {
  key?: string;
  field?: string;
  associationPathName?: string;
  renderer?: string;
  type?: string;
  label?: string;
  target?: string;
  settings?: Record<string, any>;
  popup?: FlowSurfaceApplyBlueprintPopup;
  script?: string;
  chart?: string;
};

export type FlowSurfaceApplyBlueprintFieldSpec = string | FlowSurfaceApplyBlueprintFieldObjectSpec;

export type FlowSurfaceApplyBlueprintActionObjectSpec = {
  key?: string;
  type: string;
  title?: string;
  settings?: Record<string, any>;
  popup?: FlowSurfaceApplyBlueprintPopup;
  script?: string;
  chart?: string;
};

export type FlowSurfaceApplyBlueprintActionSpec = string | FlowSurfaceApplyBlueprintActionObjectSpec;

export type FlowSurfaceApplyBlueprintBlockType =
  | 'table'
  | 'createForm'
  | 'editForm'
  | 'details'
  | 'filterForm'
  | 'list'
  | 'gridCard'
  | 'markdown'
  | 'iframe'
  | 'chart'
  | 'actionPanel'
  | 'jsBlock';

export type FlowSurfaceApplyBlueprintBlockSpec = {
  key?: string;
  type?: FlowSurfaceApplyBlueprintBlockType;
  title?: string;
  collection?: string;
  dataSourceKey?: string;
  associationPathName?: string;
  binding?: FlowSurfaceResourceBindingKey;
  associationField?: string;
  resource?: FlowSurfaceApplyBlueprintBlockResource;
  template?: Record<string, any>;
  settings?: Record<string, any>;
  fields?: FlowSurfaceApplyBlueprintFieldSpec[];
  actions?: FlowSurfaceApplyBlueprintActionSpec[];
  recordActions?: FlowSurfaceApplyBlueprintActionSpec[];
  script?: string;
  chart?: string;
};

export type FlowSurfaceApplyBlueprintTabDocument = {
  key: string;
  title?: string;
  icon?: string;
  documentTitle?: string;
  blocks: FlowSurfaceApplyBlueprintBlockSpec[];
  layout?: FlowSurfaceApplyBlueprintLayout;
};

export type FlowSurfaceApplyBlueprintReaction = {
  items: FlowSurfaceApplyBlueprintReactionItem[];
};

export type FlowSurfaceApplyBlueprintDocument = {
  version: '1';
  mode: FlowSurfaceApplyBlueprintMode;
  target?: FlowSurfaceApplyBlueprintTarget;
  navigation?: FlowSurfaceApplyBlueprintNavigation;
  page?: FlowSurfaceApplyBlueprintPage;
  tabs: FlowSurfaceApplyBlueprintTabDocument[];
  assets: FlowSurfaceApplyBlueprintAssets;
  reaction?: FlowSurfaceApplyBlueprintReaction;
};

export type FlowSurfaceApplyBlueprintReplaceTargetInfo = {
  locator: FlowSurfaceReadLocator;
  pageUid: string;
  pageEnableTabs?: boolean;
  tabs: Array<{
    uid: string;
  }>;
};

export type FlowSurfaceApplyBlueprintProgram = {
  document: FlowSurfaceApplyBlueprintDocument;
  surface?: FlowSurfaceSurfaceSelector;
  steps: FlowSurfacePlanStep[];
  pageLocator: FlowSurfaceReadLocator;
  pageUid?: string;
};
