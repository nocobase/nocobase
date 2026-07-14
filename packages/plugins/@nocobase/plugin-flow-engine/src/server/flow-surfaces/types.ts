/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FLOW_SURFACE_MUTATE_OP_TYPES, FLOW_SURFACE_PLAN_STEP_ACTIONS } from './constants';
import type { FlowSurfaceApplyBlueprintDefaults } from './blueprint';

export type FlowSurfaceNodeDomain = 'node' | 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry';
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
  example?: unknown;
  default?: unknown;
  supportsFlowContext?: boolean;
};

export type FlowSurfaceConfigureOptions = Record<string, FlowSurfaceConfigureOption>;

export type FlowSurfaceCapabilityKind = 'block' | 'action' | 'fieldComponent' | 'fieldBinding' | 'fieldInterface';

export type FlowSurfaceCapabilityOriginSource =
  | 'builtInStatic'
  | 'officialManifest'
  | 'pluginManifest'
  | 'provider'
  | 'canaryOverlay'
  | 'autoSnapshot';

export type FlowSurfaceCapabilityConfidence = 'high' | 'medium' | 'low';

// Display/ranking metadata only. Builders must check availability.create/configure before writing.
export type FlowSurfaceSupportLevel =
  | 'render-only'
  | 'readback-only'
  | 'create-only'
  | 'create-with-settings'
  | 'configure-only'
  | 'create-and-configure';

export type FlowSurfaceCapabilityReadiness =
  | 'discovered'
  | 'readbackVerified'
  | 'contractDeclared'
  | 'createDryRunPassed'
  | 'createEnabled'
  | 'blocked';

export type FlowSurfaceReasonCode =
  | 'supported'
  | 'plugin-disabled'
  | 'public-type-conflict'
  | 'target-required'
  | 'slot-not-supported'
  | 'scene-not-supported'
  | 'collection-required'
  | 'field-interface-required'
  | 'missing-create-contract'
  | 'dynamic-create-options-not-projectable'
  | 'unsafe-auto-discovery'
  | 'manifest-required'
  | 'permission-denied'
  | 'license-required'
  | 'dependency-missing'
  | 'provider-error'
  | 'settings-schema-missing'
  | 'init-param-required'
  | 'readback-unsupported'
  | 'dry-run-failed'
  | 'readback-parity-failed'
  | 'snapshot-stale'
  | 'extractor-runtime-error'
  | 'contract-not-verified'
  | 'debug-expand-forbidden'
  | 'unsupported';

export type FlowSurfaceAvailabilityState = {
  supported: boolean;
  reasonCode?: FlowSurfaceReasonCode;
  reasonSource?: 'registry' | 'provider' | 'catalog' | 'builder';
};

export type FlowSurfaceCapabilityAvailability = {
  render: FlowSurfaceAvailabilityState;
  readback: FlowSurfaceAvailabilityState;
  create: FlowSurfaceAvailabilityState & {
    acceptsInitParams?: boolean;
    acceptsSettings?: boolean;
  };
  configure: FlowSurfaceAvailabilityState;
};

export type FlowSurfacePublicTypeMeta = {
  value: string;
  source: 'builtIn' | 'manifest' | 'canary' | 'autoNamespaced';
  searchAliases?: string[];
  acceptedAliases?: string[];
};

export type FlowSurfaceCapabilityIdentity = {
  capabilityId: string;
  capabilityVersion?: string;
  deprecated?: boolean;
  replacedBy?: {
    kind: FlowSurfaceCapabilityKind;
    publicType: string;
    ownerPlugin?: string;
  };
};

export type FlowSurfaceCapabilitySemantic = {
  title: string;
  description?: string;
  aliases?: string[];
  domainTags?: string[];
  intentTags?: string[];
  suitableScenes?: string[];
  antiPatterns?: string[];
  locale?: string;
  examples?: Array<{
    title?: string;
    userIntent: string;
    publicPayloadSnippet: Record<string, unknown>;
    safety?: {
      validatedPublicPayload: boolean;
    };
  }>;
};

export type FlowSurfacePlacementSummary = {
  scenes?: Array<'page' | 'tab' | 'popup' | 'form' | 'details' | 'table' | 'record' | 'actionPanel'>;
  slots?: Array<'blocks' | 'actions' | 'recordActions' | 'fields' | 'fieldComponents' | 'subModels'>;
  parentPublicTypes?: string[];
  containerKinds?: string[];
  collectionRequired?: boolean;
  fieldRequired?: boolean;
};

// Discovery hint only. Localized writes must still be authorized through target-scoped catalog/create checks.
export type FlowSurfaceCatalogQueryContext = {
  targetUid?: string;
  uid?: string;
  scene?: string;
  slot?: 'blocks' | 'actions' | 'recordActions' | 'fields' | 'fieldComponents' | 'subModels';
  parentPublicType?: string;
  collectionName?: string;
  dataSourceKey?: string;
  fieldInterface?: string;
};

export type FlowSurfaceCapabilitiesTarget = Pick<FlowSurfaceCatalogQueryContext, 'targetUid' | 'uid'>;

export type FlowSurfaceCapabilityWarning = {
  code:
    | 'auto-discovered-readonly'
    | 'manifest-recommended'
    | 'dynamic-create-options'
    | 'partial-settings-schema'
    | 'public-type-conflict'
    | 'unsafe-semantic-text'
    | 'extractor-runtime-error'
    | 'snapshot-stale'
    | 'contract-not-verified'
    | 'readback-parity-missing';
  message: string;
};

export type FlowSurfaceCapabilityValidationError = {
  path: string;
  code:
    | 'required'
    | 'invalid-type'
    | 'invalid-enum'
    | 'unknown-field'
    | 'collection-not-found'
    | 'field-not-found'
    | 'field-interface-mismatch'
    | 'target-not-allowed'
    | 'provider-error'
    | 'contract-guard-failed'
    | 'unsupported';
  message: string;
  details?: Record<string, unknown>;
};

export type FlowSurfaceJsonSchema = Record<string, unknown>;

export type FlowSurfaceNodeLens = {
  domain: FlowSurfaceNodeDomain;
  path: string;
  mode?: 'set' | 'merge' | 'append';
};

export type FlowSurfaceInitParamSpec = {
  name: string;
  required: boolean;
  schema: FlowSurfaceJsonSchema;
  description?: string;
  examples?: unknown[];
  internalLens?: FlowSurfaceNodeLens | FlowSurfaceNodeLens[];
};

export type FlowSurfaceSettingBinding = {
  key: string;
  title?: string;
  description?: string;
  schema: FlowSurfaceJsonSchema;
  default?: unknown;
  examples?: unknown[];
  visibility?: {
    create?: boolean;
    configure?: boolean;
  };
  internalLens?: FlowSurfaceNodeLens | FlowSurfaceNodeLens[];
  mergeStrategy?: 'replace' | 'shallowMerge' | 'deepMerge';
};

export type FlowSurfaceJsonCreateRecipe = {
  nodeTemplate: FlowSurfaceNodeSpec;
  initParams?: FlowSurfaceInitParamSpec[];
  settings?: FlowSurfaceSettingBinding[];
};

export type FlowSurfaceCapabilityManifestItem = {
  id: string;
  capabilityVersion?: string;
  kind: FlowSurfaceCapabilityKind;
  publicType?: string;
  acceptedAliases?: string[];
  deprecated?: boolean;
  replacedBy?: {
    kind: FlowSurfaceCapabilityKind;
    publicType: string;
    ownerPlugin?: string;
  };
  label: string;
  semantic: FlowSurfaceCapabilitySemantic;
  placement?: FlowSurfacePlacementSummary;
  implementation: {
    modelUse: string;
    legacyModelUses?: string[];
  };
  availability?: Partial<FlowSurfaceCapabilityAvailability>;
  supportLevel?: FlowSurfaceSupportLevel;
  confidence?: FlowSurfaceCapabilityConfidence;
  warnings?: FlowSurfaceCapabilityWarning[];
  initParamsSchema?: FlowSurfaceJsonSchema;
  settingsSchema?: FlowSurfaceJsonSchema;
  configureOptions?: FlowSurfaceConfigureOptions;
  createRecipe?: FlowSurfaceJsonCreateRecipe;
};

export type FlowSurfaceCapabilitiesProvider = {
  ownerPlugin: string;
  getCapabilities(ctx: {
    app?: unknown;
    enabledPlugins: ReadonlySet<string>;
  }): Promise<FlowSurfaceCapabilityManifestItem[]> | FlowSurfaceCapabilityManifestItem[];
  validateSettings?(
    capability: FlowSurfaceProviderRuntimeCapability,
    input: FlowSurfaceDynamicCapabilityPublicInput,
    ctx: FlowSurfaceProviderCreateContext,
  ):
    | Promise<{ ok: boolean; errors?: FlowSurfaceCapabilityValidationError[] }>
    | { ok: boolean; errors?: FlowSurfaceCapabilityValidationError[] };
  resolveCreate?(
    capability: FlowSurfaceProviderRuntimeCapability,
    input: FlowSurfaceDynamicCapabilityPublicInput,
    ctx: FlowSurfaceProviderCreateContext,
  ): Promise<FlowSurfaceNodeSpec> | FlowSurfaceNodeSpec;
};

export type FlowSurfaceProviderRuntimeCapability = {
  publicItem: FlowSurfacePublicCapabilityItem;
  implementation: FlowSurfaceCapabilityManifestItem['implementation'];
};

export type FlowSurfaceDynamicCapabilityPublicInput = {
  initParams?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type FlowSurfaceDynamicCapabilityCreateActionName =
  | 'addBlock'
  | 'addBlocks'
  | 'addAction'
  | 'addRecordAction'
  | 'addField'
  | 'compose'
  | 'applyBlueprint'
  | 'validateCapabilityCreate';

export type FlowSurfaceProviderCreateContext = {
  actionName: FlowSurfaceDynamicCapabilityCreateActionName;
  enabledPlugins: ReadonlySet<string>;
  target?: FlowSurfaceWriteTarget;
};

export type FlowSurfacePublicCapabilityItem = {
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  publicTypeMeta: FlowSurfacePublicTypeMeta;
  label: string;
  ownerPlugin: string;
  ownerPluginTitle?: string;
  origin: FlowSurfaceCapabilityOriginSource;
  semantic: FlowSurfaceCapabilitySemantic;
  availability: FlowSurfaceCapabilityAvailability;
  supportLevel: FlowSurfaceSupportLevel;
  confidence: FlowSurfaceCapabilityConfidence;
  readiness: FlowSurfaceCapabilityReadiness;
  placement?: FlowSurfacePlacementSummary;
  warnings?: FlowSurfaceCapabilityWarning[];
  identity?: FlowSurfaceCapabilityIdentity;
  initParamsSchema?: Record<string, unknown>;
  settingsSchema?: Record<string, unknown>;
  configureOptions?: FlowSurfaceConfigureOptions;
};

export type FlowSurfaceCapabilitiesValues = {
  kinds?: FlowSurfaceCapabilityKind[];
  publicTypes?: string[];
  ownerPlugins?: string[];
  query?: string;
  // This first discovery slice only supports concrete target lookup. Rich placement hints are reserved
  // for future target-scoped discovery and must go through `catalog` for write authorization today.
  target?: FlowSurfaceCapabilitiesTarget;
  includeUnavailable?: boolean;
  includeWarnings?: boolean;
  limit?: number;
  expand?: Array<'item.identity' | 'item.semantic' | 'item.settings' | 'item.warnings' | 'debugImplementation'>;
};

export type FlowSurfaceCapabilitiesResponse = {
  data: FlowSurfacePublicCapabilityItem[];
  meta: {
    version: 1;
    generatedAt: string;
    // Kept for wire compatibility: plugin owners represented in `data`, not the full enabled package list.
    enabledPlugins: string[];
    registrySources: Array<{
      origin: FlowSurfaceCapabilityOriginSource;
      count: number;
    }>;
    targetHintUsed: boolean;
  };
};

export type FlowSurfaceDescribeCapabilityValues = {
  capabilityId?: string;
  kind?: FlowSurfaceCapabilityKind;
  publicType?: string;
  ownerPlugin?: string;
  target?: FlowSurfaceCapabilitiesTarget;
  includeUnavailable?: boolean;
  includeWarnings?: boolean;
  expand?: Array<'item.identity' | 'item.semantic' | 'item.settings' | 'item.warnings' | 'debugImplementation'>;
};

export type FlowSurfaceDescribeCapabilityResponse = {
  data: FlowSurfacePublicCapabilityItem;
  meta: {
    version: 1;
    generatedAt: string;
    targetHintUsed: boolean;
  };
};

export type FlowSurfaceCapabilityDiagnosticsValues = {
  ownerPlugin?: string;
  publicType?: string;
  includeImplementation?: boolean;
  includeEvents?: boolean;
};

export type FlowSurfaceCapabilityDiagnosticsCapabilityRef = {
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  ownerPlugin: string;
  origin: FlowSurfaceCapabilityOriginSource;
  capabilityId?: string;
  reasonCode?: FlowSurfaceReasonCode;
  message?: string;
};

export type FlowSurfaceCapabilityDiagnosticWarning = {
  source: 'provider' | 'policy' | 'snapshot' | 'manifest';
  code: string;
  path?: string;
  ownerPlugin?: string;
  fileName?: string;
  publicType?: string;
  message: string;
};

export type FlowSurfaceCapabilityDiagnosticsResponse = {
  data: {
    registrySources: FlowSurfaceCapabilitiesResponse['meta']['registrySources'];
    warnings: FlowSurfaceCapabilityDiagnosticWarning[];
    publicTypeConflicts: FlowSurfaceCapabilityDiagnosticsCapabilityRef[];
    providerErrors: FlowSurfaceCapabilityDiagnosticsCapabilityRef[];
    staleSnapshots: FlowSurfaceCapabilityDiagnosticsCapabilityRef[];
  };
  meta: {
    version: 1;
    generatedAt: string;
    diagnosticsEnabled: boolean;
    implementationIncluded: false;
    eventsIncluded: false;
  };
};

export type FlowSurfaceDynamicCapabilityCreateValues = {
  kind?: 'block' | 'action' | 'fieldComponent';
  publicType: string;
  ownerPlugin?: string;
  target?: FlowSurfaceWriteTarget;
  initParams?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  rawPublicPayload?: Record<string, unknown>;
  allowUnavailable?: boolean;
};

export type FlowSurfaceDynamicCapabilityCreateResponse = {
  capability: FlowSurfacePublicCapabilityItem;
  publicPayload: Record<string, unknown>;
  node: FlowSurfaceNodeSpec;
  warnings: FlowSurfaceCapabilityWarning[];
};

export type FlowSurfaceValidateCapabilityCreateValues = Omit<
  FlowSurfaceDynamicCapabilityCreateValues,
  'allowUnavailable' | 'rawPublicPayload'
>;

export type FlowSurfaceValidateCapabilityCreateResponse = {
  ok: true;
  capability: FlowSurfacePublicCapabilityItem;
  normalizedPublicPayload: Record<string, unknown>;
  dryRunNode: {
    publicType: string;
  };
  warnings: FlowSurfaceCapabilityWarning[];
};

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
  pathSchemas?: Record<string, Record<string, any>>;
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
  publicType?: string;
  acceptedAliases?: string[];
  semantic?: FlowSurfaceCapabilitySemantic;
  ownerPlugin?: string;
  origin?: FlowSurfaceCapabilityOriginSource;
  supportLevel?: FlowSurfaceSupportLevel;
  confidence?: FlowSurfaceCapabilityConfidence;
  placement?: FlowSurfacePlacementSummary;
  availability?: FlowSurfaceCapabilityAvailability;
  warnings?: FlowSurfaceCapabilityWarning[];
  identity?: FlowSurfaceCapabilityIdentity;
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
  builderContainerUse?: string;
};

export type FlowSurfaceCatalogSection = 'blocks' | 'fields' | 'actions' | 'recordActions' | 'node';
export type FlowSurfaceCatalogExpand =
  | 'item.configureOptions'
  | 'item.contracts'
  | 'item.allowedContainerUses'
  | 'item.identity'
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
  async?: boolean;
  use: string;
  popup?: Record<string, any>;
  props?: Record<string, any>;
  decoratorProps?: Record<string, any>;
  stepParams?: Record<string, any>;
  flowRegistry?: Record<string, any>;
  subModels?: Record<string, FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[]>;
};

export type FlowSurfaceNodeSubModel = FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[];

export type FlowSurfaceNodeDefaults = Partial<
  Pick<FlowSurfaceNodeSpec, 'async' | 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry' | 'subModels'>
>;

export type FlowSurfaceApplyMode = 'replace';
export type FlowSurfaceComposeMode = 'append' | 'replace';

export type FlowSurfaceApplySpec = {
  popup?: Record<string, any>;
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
  assets?: {
    charts?: Record<string, any>;
  };
  layout?: Record<string, any>;
  defaults?: FlowSurfaceApplyBlueprintDefaults;
};

export type FlowSurfaceConfigureValues = {
  target: FlowSurfaceWriteTarget;
  changes: Record<string, any>;
  defaults?: FlowSurfaceApplyBlueprintDefaults;
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
  dynamicProperties?: FlowSurfaceContextVarInfo;
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
