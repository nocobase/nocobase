/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FLOW_SURFACE_MUTATE_OP_TYPES } from './constants';

export type FlowSurfaceNodeDomain = 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry';
export type FlowSurfaceMergeStrategy = 'deep' | 'replace';
export type FlowSurfaceActionScope = 'block' | 'record' | 'form' | 'filterForm' | 'actionPanel';

export type FlowSurfaceReadLocator = {
  uid?: string;
  pageSchemaUid?: string;
  tabSchemaUid?: string;
  routeId?: string;
};

export type FlowSurfaceWriteTarget = {
  uid: string;
};

export type FlowSurfaceResolveTarget = FlowSurfaceReadLocator | FlowSurfaceWriteTarget;

export type FlowSurfaceConfigureOptionValueType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export type FlowSurfaceConfigureOption = {
  type: FlowSurfaceConfigureOptionValueType;
  description?: string;
  enum?: Array<string | number | boolean>;
  example?: any;
  supportsFlowContext?: boolean;
};

export type FlowSurfaceConfigureOptions = Record<string, FlowSurfaceConfigureOption>;

export type FlowSurfaceResourceBindingKey =
  | 'currentCollection'
  | 'currentRecord'
  | 'associatedRecords'
  | 'otherRecords';

export type FlowSurfaceResourceBindingAssociationField = {
  key: string;
  label: string;
  collectionName: string;
  associationName?: string;
};

export type FlowSurfaceResourceBindingOption = {
  key: FlowSurfaceResourceBindingKey;
  label: string;
  description?: string;
  requires?: string[];
  dataSourceKey?: string;
  collectionName?: string;
  associationFields?: FlowSurfaceResourceBindingAssociationField[];
};

export type FlowSurfaceSemanticResourceInput = {
  binding: FlowSurfaceResourceBindingKey;
  dataSourceKey?: string;
  collectionName?: string;
  associationField?: string;
};

export type FlowSurfaceReadTarget = {
  locator: FlowSurfaceReadLocator;
  uid: string;
  kind: FlowSurfaceContainerKind;
};

export type FlowSurfaceContainerKind = 'page' | 'tab' | 'grid' | 'block' | 'node';

export type FlowSurfaceDomainContract = {
  allowedKeys: string[];
  wildcard?: boolean;
  mergeStrategy: FlowSurfaceMergeStrategy;
  schema: Record<string, any>;
  groups?: Record<string, FlowSurfaceDomainGroupContract>;
};

export type FlowSurfaceEventCapabilities = {
  direct?: string[];
  object?: string[];
};

export type FlowSurfaceDomainGroupContract = {
  allowedPaths: string[];
  clearable?: boolean;
  mergeStrategy: FlowSurfaceMergeStrategy;
  schema: Record<string, any>;
  eventBindingSteps?: string[] | '*';
  pathSchemas?: Record<string, Record<string, any>>;
};

export type FlowSurfaceEventBindingContract = {
  stepKeys?: string[] | '*';
};

export type FlowSurfaceLayoutCapabilities = {
  supported: boolean;
};

export type FlowSurfaceNodeContract = {
  editableDomains: FlowSurfaceNodeDomain[];
  domains: Partial<Record<FlowSurfaceNodeDomain, FlowSurfaceDomainContract>>;
  eventCapabilities?: FlowSurfaceEventCapabilities;
  layoutCapabilities?: FlowSurfaceLayoutCapabilities;
  eventBindings?: Record<string, FlowSurfaceEventBindingContract>;
};

export type FlowSurfaceCatalogItem = {
  key: string;
  label: string;
  use: string;
  kind: 'page' | 'tab' | 'block' | 'field' | 'action';
  scope?: FlowSurfaceActionScope;
  scene?: string;
  requiredInitParams?: string[];
  allowedContainerUses?: string[];
  editableDomains: FlowSurfaceNodeDomain[];
  settingsSchema: Record<string, any>;
  settingsContract?: Partial<Record<FlowSurfaceNodeDomain, FlowSurfaceDomainContract>>;
  configureOptions?: FlowSurfaceConfigureOptions;
  resourceBindings?: FlowSurfaceResourceBindingOption[];
  eventCapabilities?: FlowSurfaceEventCapabilities;
  layoutCapabilities?: FlowSurfaceLayoutCapabilities;
  createSupported?: boolean;
};

export type FlowSurfaceNodeSpec = {
  uid?: string;
  clientKey?: string;
  use: string;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
  flowRegistry?: Record<string, any>;
  subModels?: Record<string, FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[]>;
};

export type FlowSurfaceNodeSubModel = FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[];

export type FlowSurfaceNodeDefaults = Partial<
  Pick<FlowSurfaceNodeSpec, 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry' | 'subModels'>
>;

export type FlowSurfaceApplyMode = 'replace';
export type FlowSurfaceComposeMode = 'append' | 'replace';

export type FlowSurfaceApplySpec = {
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
  flowRegistry?: Record<string, any>;
  subModels?: Record<string, FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[]>;
};

export type FlowSurfaceAtomicFlag = true;

export type FlowSurfaceMutateValues = {
  ops?: FlowSurfaceMutateOp[];
  atomic?: true;
};

export type FlowSurfaceApplyValues = {
  target: FlowSurfaceWriteTarget;
  spec: FlowSurfaceApplySpec;
  mode?: 'replace';
};

export type FlowSurfaceComposeValues = {
  target: FlowSurfaceWriteTarget;
  mode?: FlowSurfaceComposeMode;
  blocks?: Array<Record<string, any>>;
  layout?: Record<string, any>;
};

export type FlowSurfaceConfigureValues = {
  target: FlowSurfaceWriteTarget;
  changes: Record<string, any>;
};

export type FlowSurfaceContextVarInfo = {
  title?: string;
  type?: string;
  interface?: string;
  description?: string;
  enumValues?: string[];
  min?: number;
  max?: number;
  disabled?: boolean;
  disabledReason?: string;
  properties?: Record<string, FlowSurfaceContextVarInfo>;
};

export type FlowSurfaceContextValues = {
  target: FlowSurfaceWriteTarget;
  path?: string;
  maxDepth?: number;
};

export type FlowSurfaceContextResponse = {
  vars: Record<string, FlowSurfaceContextVarInfo>;
};

export type FlowSurfaceMutateOpType = (typeof FLOW_SURFACE_MUTATE_OP_TYPES)[number];

export type FlowSurfaceMutateOp = {
  opId?: string;
  type: FlowSurfaceMutateOpType;
  target?: FlowSurfaceWriteTarget;
  values?: Record<string, any>;
};

export type FlowSurfaceResolvedTarget = {
  target: FlowSurfaceResolveTarget;
  uid: string;
  kind: FlowSurfaceContainerKind;
  node?: any;
  route?: any;
  pageRoute?: any;
  tabRoute?: any;
  pageModel?: any;
};

export type FlowSurfaceExecutorContext = {
  transaction?: any;
  refs: Map<string, any>;
  clientKeyToUid: Record<string, string>;
};
