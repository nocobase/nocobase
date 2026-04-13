/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FLOW_SURFACE_MUTATE_OP_TYPES, FLOW_SURFACE_PLAN_STEP_ACTIONS } from './constants';

export type FlowSurfaceNodeDomain = 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry';
export type FlowSurfaceMergeStrategy = 'deep' | 'replace';
export type FlowSurfaceActionScope = 'block' | 'record' | 'form' | 'filterForm' | 'actionPanel';
export type FlowSurfaceContainerKind = 'page' | 'tab' | 'grid' | 'block' | 'node';

export type FlowSurfaceReadLocator = {
  uid?: string;
  pageSchemaUid?: string;
  tabSchemaUid?: string;
  routeId?: string;
};

export type FlowSurfacePlanStepLink = {
  step: string;
  path?: string;
};

export type FlowSurfaceKeySelector = {
  key: string;
};

export type FlowSurfaceLocatorSelector = {
  locator: FlowSurfaceReadLocator;
};

export type FlowSurfaceSurfaceSelector = FlowSurfaceKeySelector | FlowSurfaceLocatorSelector;

export type FlowSurfacePlanSelector = FlowSurfaceSurfaceSelector | FlowSurfacePlanStepLink;

export type FlowSurfaceBindKey = {
  key: string;
  locator: FlowSurfaceReadLocator;
  expectedKind?:
    | 'page'
    | 'tab'
    | 'grid'
    | 'block'
    | 'fieldHost'
    | 'action'
    | 'popupHost'
    | 'popupPage'
    | 'popupTab'
    | 'node';
  rebind?: boolean;
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

export type FlowSurfaceReadTarget = {
  locator: FlowSurfaceReadLocator;
  uid: string;
  kind: FlowSurfaceContainerKind;
};

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

export type FlowSurfaceCatalogItem = {
  key: string;
  label: string;
  use: string;
  kind: 'page' | 'tab' | 'block' | 'field' | 'action';
  scope?: FlowSurfaceActionScope;
  scene?: string;
  requiredInitParams?: string[];
  allowedContainerUses?: string[];
  editableDomains?: FlowSurfaceNodeDomain[];
  settingsSchema?: Record<string, any>;
  settingsContract?: Partial<Record<FlowSurfaceNodeDomain, FlowSurfaceDomainContract>>;
  configureOptions?: FlowSurfaceConfigureOptions;
  resourceBindings?: FlowSurfaceResourceBindingOption[];
  eventCapabilities?: FlowSurfaceEventCapabilities;
  layoutCapabilities?: FlowSurfaceLayoutCapabilities;
  createSupported?: boolean;
  fieldUse?: string;
  wrapperUse?: string;
  renderer?: string;
  type?: string;
  associationPathName?: string;
  defaultTargetUid?: string;
  targetBlockUid?: string;
};

export type FlowSurfaceCatalogSection = 'blocks' | 'fields' | 'actions' | 'recordActions' | 'node';
export type FlowSurfaceCatalogExpand =
  | 'item.configureOptions'
  | 'item.contracts'
  | 'item.allowedContainerUses'
  | 'node.contracts';

export type FlowSurfaceCatalogPopupScenario = {
  kind: 'plainPopup' | 'recordPopup' | 'associationPopup';
  scene: 'new' | 'one' | 'many' | 'select' | 'subForm' | 'bulkEditForm' | 'generic';
  hasCurrentRecord: boolean;
  hasAssociationContext: boolean;
};

export type FlowSurfaceCatalogFieldContainerScenario = {
  kind: 'form' | 'details' | 'table' | 'filter-form';
  targetMode?: 'single' | 'multiple';
};

export type FlowSurfaceCatalogActionContainerScenario = {
  scope: FlowSurfaceActionScope;
  ownerUse?: string;
  recordActionContainerUse?: string;
};

export type FlowSurfaceCatalogScenario = {
  surfaceKind: 'global' | FlowSurfaceContainerKind;
  popup?: FlowSurfaceCatalogPopupScenario;
  fieldContainer?: FlowSurfaceCatalogFieldContainerScenario;
  actionContainer?: FlowSurfaceCatalogActionContainerScenario;
};

export type FlowSurfaceCatalogNodeInfo = {
  editableDomains: FlowSurfaceNodeDomain[];
  configureOptions: FlowSurfaceConfigureOptions;
  settingsSchema?: Record<string, any>;
  settingsContract?: Partial<Record<FlowSurfaceNodeDomain, FlowSurfaceDomainContract>>;
  eventCapabilities?: FlowSurfaceEventCapabilities;
  layoutCapabilities?: FlowSurfaceLayoutCapabilities;
};

export type FlowSurfaceCatalogValues = {
  target?: FlowSurfaceWriteTarget;
  sections?: FlowSurfaceCatalogSection[];
  expand?: FlowSurfaceCatalogExpand[];
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

export type FlowSurfaceCatalogResponse = {
  target: FlowSurfaceResolvedTarget | null;
  scenario: FlowSurfaceCatalogScenario;
  selectedSections: FlowSurfaceCatalogSection[];
  blocks?: FlowSurfaceCatalogItem[];
  fields?: FlowSurfaceCatalogItem[];
  actions?: FlowSurfaceCatalogItem[];
  recordActions?: FlowSurfaceCatalogItem[];
  node?: FlowSurfaceCatalogNodeInfo;
};

export type FlowSurfaceNodeSpec = {
  uid?: string;
  clientKey?: string;
  sortIndex?: number;
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

export type FlowSurfaceDescribeValues = {
  locator: FlowSurfaceReadLocator;
  bindKeys?: FlowSurfaceBindKey[];
};

export type FlowSurfacePlanStepAction = (typeof FLOW_SURFACE_PLAN_STEP_ACTIONS)[number];

export type FlowSurfacePlanStep = {
  id?: string;
  action: FlowSurfacePlanStepAction;
  selectors?: {
    target?: FlowSurfacePlanSelector;
    source?: FlowSurfacePlanSelector;
  };
  values?: Record<string, any>;
};

export type FlowSurfacePlanRequestValues = {
  surface?: FlowSurfaceSurfaceSelector;
  plan: {
    steps?: FlowSurfacePlanStep[];
  };
};

export type FlowSurfaceMutateOpType = (typeof FLOW_SURFACE_MUTATE_OP_TYPES)[number];

export type FlowSurfaceMutateOp = {
  opId?: string;
  type: FlowSurfaceMutateOpType;
  target?: FlowSurfaceWriteTarget;
  values?: Record<string, any>;
};

export type FlowSurfaceExecutorContext = {
  transaction?: any;
  keys: Map<string, any>;
  clientKeyToUid: Record<string, string>;
};
