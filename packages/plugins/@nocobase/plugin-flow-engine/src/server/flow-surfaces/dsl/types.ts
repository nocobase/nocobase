/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceBindRef,
  FlowSurfacePlanRequestValues,
  FlowSurfaceReadLocator,
  FlowSurfaceResourceBindingKey,
  FlowSurfaceValidatePlanValidationOptions,
} from '../types';

export type FlowSurfaceDslKind = 'blueprint' | 'patch';
export type FlowSurfaceDslVersion = '1';
export type FlowSurfaceDslVerificationMode = 'none' | 'strict';
export type FlowSurfaceDslPopupCompletion = 'completed' | 'shell-only';

export type FlowSurfaceDslBlockSettings = Record<string, any>;
export type FlowSurfaceDslActionSettings = Record<string, any>;
export type FlowSurfaceDslFieldSettings = Record<string, any>;
export type FlowSurfaceDslLayoutValues = Record<string, any>;

export type FlowSurfaceDslCreatePageTarget = {
  mode: 'create-page';
};

export type FlowSurfaceDslUpdatePageTarget = {
  mode: 'update-page';
  locator: FlowSurfaceReadLocator;
};

export type FlowSurfaceDslTarget = FlowSurfaceDslCreatePageTarget | FlowSurfaceDslUpdatePageTarget;

export type FlowSurfaceDslNavigationParent =
  | {
      createGroup: {
        title: string;
        icon?: string;
        tooltip?: string;
        hideInMenu?: boolean;
      };
    }
  | {
      routeId: string | number;
    };

export type FlowSurfaceDslNavigation = {
  parent?: FlowSurfaceDslNavigationParent;
  item?: {
    title?: string;
    icon?: string;
    tooltip?: string;
    hideInMenu?: boolean;
  };
  page?: {
    title?: string;
    icon?: string;
    documentTitle?: string;
    enableHeader?: boolean;
    enableTabs?: boolean;
    displayTitle?: boolean;
  };
  initialTab?: {
    title?: string;
    icon?: string;
    documentTitle?: string;
  };
};

export type FlowSurfaceDslCollectionDataSource = {
  key: string;
  kind: 'collection';
  dataSourceKey?: string;
  collectionName: string;
};

export type FlowSurfaceDslAssociationDataSource = {
  key: string;
  kind: 'association';
  dataSourceKey?: string;
  collectionName: string;
  associationPathName: string;
};

export type FlowSurfaceDslBindingDataSource = {
  key: string;
  kind: 'binding';
  popupId: string;
  binding: FlowSurfaceResourceBindingKey;
  dataSourceKey?: string;
  collectionName?: string;
  associationField?: string;
};

export type FlowSurfaceDslDataSource =
  | FlowSurfaceDslCollectionDataSource
  | FlowSurfaceDslAssociationDataSource
  | FlowSurfaceDslBindingDataSource;

export type FlowSurfaceDslField = {
  id?: string;
  title?: string;
  fieldPath?: string;
  associationPathName?: string;
  renderer?: string;
  type?: string;
  target?: string | { blockId: string };
  settings?: FlowSurfaceDslFieldSettings;
};

export type FlowSurfaceDslAction = {
  id?: string;
  type: string;
  title?: string;
  popupId?: string;
  settings?: FlowSurfaceDslActionSettings;
};

export type FlowSurfaceDslBlock = {
  id: string;
  type: string;
  title?: string;
  dataBound: boolean;
  dataSourceKey?: string;
  fields?: FlowSurfaceDslField[];
  actions?: FlowSurfaceDslAction[];
  recordActions?: FlowSurfaceDslAction[];
  settings?: FlowSurfaceDslBlockSettings;
};

export type FlowSurfaceDslLayoutColumn = {
  key?: string;
  width?: number;
  items: string[];
};

export type FlowSurfaceDslLayoutRow = {
  key?: string;
  columns: FlowSurfaceDslLayoutColumn[];
};

export type FlowSurfaceDslLayout = {
  kind?: 'rows-columns';
  rows: FlowSurfaceDslLayoutRow[];
};

export type FlowSurfaceDslInteraction = {
  type: 'filter-target';
  sourceBlockId: string;
  fieldPath: string;
  associationPathName?: string;
  targetBlockId: string;
};

export type FlowSurfaceDslPopup = {
  id: string;
  title?: string;
  completion: FlowSurfaceDslPopupCompletion;
  blocks?: FlowSurfaceDslBlock[];
  layout?: FlowSurfaceDslLayoutValues;
};

export type FlowSurfaceBlueprintDsl = {
  version: FlowSurfaceDslVersion;
  kind?: 'blueprint';
  title: string;
  target: FlowSurfaceDslTarget;
  navigation?: FlowSurfaceDslNavigation;
  dataSources: FlowSurfaceDslDataSource[];
  layout: FlowSurfaceDslLayout;
  blocks: FlowSurfaceDslBlock[];
  interactions: FlowSurfaceDslInteraction[];
  popups: FlowSurfaceDslPopup[];
  assumptions: string[];
  unresolvedQuestions: string[];
};

export type FlowSurfaceDslEntityRefById = {
  id: string;
  anchor?: string;
};

export type FlowSurfaceDslEntityRefByLocator = {
  locator: FlowSurfaceReadLocator;
};

export type FlowSurfaceDslEntityRef = FlowSurfaceDslEntityRefById | FlowSurfaceDslEntityRefByLocator;

export type FlowSurfaceDslPatchOp =
  | 'page.destroy'
  | 'tab.add'
  | 'tab.update'
  | 'tab.move'
  | 'tab.remove'
  | 'block.add'
  | 'field.add'
  | 'action.add'
  | 'recordAction.add'
  | 'settings.update'
  | 'layout.replace'
  | 'node.move'
  | 'node.remove'
  | 'template.detach';

export type FlowSurfacePatchDslChange = {
  id?: string;
  op: FlowSurfaceDslPatchOp;
  target?: FlowSurfaceDslEntityRef;
  source?: FlowSurfaceDslEntityRef;
  values?: Record<string, any>;
};

export type FlowSurfacePatchDsl = {
  version: FlowSurfaceDslVersion;
  kind: 'patch';
  target: {
    locator: FlowSurfaceReadLocator;
  };
  dataSources?: FlowSurfaceDslDataSource[];
  popups?: FlowSurfaceDslPopup[];
  changes: FlowSurfacePatchDslChange[];
  assumptions: string[];
  unresolvedQuestions: string[];
};

export type FlowSurfaceDslDocument = FlowSurfaceBlueprintDsl | FlowSurfacePatchDsl;

export type FlowSurfaceDslRequestBase = {
  dsl: FlowSurfaceDslDocument;
  expectedFingerprint?: string;
  bindRefs?: FlowSurfaceBindRef[];
};

export type FlowSurfaceValidateDslValues = FlowSurfaceDslRequestBase & {
  validation?: FlowSurfaceValidatePlanValidationOptions;
};

export type FlowSurfaceExecuteDslValues = FlowSurfaceDslRequestBase & {
  verificationMode?: FlowSurfaceDslVerificationMode;
};

export type FlowSurfaceDslCompileContext = {
  blueprintUpdatePageComposeTarget?: FlowSurfaceReadLocator;
};

export type FlowSurfacePreparedDslRequest = {
  dsl: FlowSurfaceDslDocument;
  expectedFingerprint?: string;
  bindRefs?: FlowSurfaceBindRef[];
  validation?: FlowSurfaceValidatePlanValidationOptions;
  verificationMode: FlowSurfaceDslVerificationMode;
  compileContext?: FlowSurfaceDslCompileContext;
  planValues: FlowSurfacePlanRequestValues;
};
