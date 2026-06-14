/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceConfigureOptions,
  FlowSurfaceCapabilityConfidence,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityWarning,
  FlowSurfaceJsonCreateRecipe,
  FlowSurfaceJsonSchema,
  FlowSurfacePlacementSummary,
} from '../types';

export const FLOW_SURFACE_AUTO_SNAPSHOT_VERSION = 1;
export const FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION = 1;

export type FlowSurfaceExtractorEvidenceSource = 'runtime' | 'ast';

export type FlowSurfaceExtractorFlowStaticStatus = 'static' | 'dynamic' | 'unresolved';

export type FlowSurfaceExtractorCreateModelOptionsStatus = 'static' | 'dynamic' | 'unresolved';

export type FlowSurfaceCreateModelOptionsSubModels = Record<string, string[]>;

export type FlowSurfaceExtractorLabelFields = {
  label?: string;
  labelText?: string;
  labelKey?: string;
  labelFallback?: string;
};

export type FlowSurfaceAutoSourceRef = {
  source: string;
  evidenceSource?: FlowSurfaceExtractorEvidenceSource;
  ref?: string;
};

export type FlowSurfaceModelRegisteredEvent = {
  type: 'model.registered';
  modelUse: string;
  className?: string;
  source: string;
  evidenceSource: FlowSurfaceExtractorEvidenceSource;
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceModelLoaderRegisteredEvent = {
  type: 'model.loaderRegistered';
  modelUse: string;
  loaderName?: string;
  source: string;
  evidenceSource: FlowSurfaceExtractorEvidenceSource;
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceModelFlowRegisteredEvent = {
  type: 'model.flowRegistered';
  modelUse?: string;
  flowKey?: string;
  title?: string;
  sort?: number;
  staticStatus: FlowSurfaceExtractorFlowStaticStatus;
  source: string;
  evidenceSource: FlowSurfaceExtractorEvidenceSource;
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceMenuItemRegisteredEvent = FlowSurfaceExtractorLabelFields & {
  type: 'menu.itemRegistered';
  menuKey?: string;
  modelUse?: string;
  slot?: string;
  createModelOptionsStatus: FlowSurfaceExtractorCreateModelOptionsStatus;
  createModelOptionsUse?: string;
  createModelOptionsSubModels?: FlowSurfaceCreateModelOptionsSubModels;
  source: string;
  evidenceSource: FlowSurfaceExtractorEvidenceSource;
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceFieldBindingRole = 'display' | 'editable' | 'filterable' | 'wrapper';

export type FlowSurfaceFieldBindingRegisteredEvent = {
  type: 'field.bindingRegistered';
  fieldInterface?: string;
  modelUse?: string;
  role: FlowSurfaceFieldBindingRole;
  source: string;
  evidenceSource: FlowSurfaceExtractorEvidenceSource;
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceExtractorWarningEvent = {
  type: 'warning';
  warning: FlowSurfaceCapabilityWarning;
};

export type FlowSurfaceExtractionEvent =
  | FlowSurfaceModelRegisteredEvent
  | FlowSurfaceModelLoaderRegisteredEvent
  | FlowSurfaceModelFlowRegisteredEvent
  | FlowSurfaceMenuItemRegisteredEvent
  | FlowSurfaceFieldBindingRegisteredEvent
  | FlowSurfaceExtractorWarningEvent;

export type FlowSurfaceAutoModel = {
  modelUse: string;
  className?: string;
  loaderName?: string;
  sourceRefs: FlowSurfaceAutoSourceRef[];
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceAutoMenuItem = FlowSurfaceExtractorLabelFields & {
  menuKey?: string;
  modelUse?: string;
  slot?: string;
  createModelOptionsStatus: FlowSurfaceExtractorCreateModelOptionsStatus;
  createModelOptionsUse?: string;
  createModelOptionsSubModels?: FlowSurfaceCreateModelOptionsSubModels;
  sourceRefs: FlowSurfaceAutoSourceRef[];
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceAutoFieldBinding = {
  fieldInterface?: string;
  modelUse?: string;
  role: FlowSurfaceFieldBindingRole;
  sourceRefs: FlowSurfaceAutoSourceRef[];
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceAutoFlow = {
  modelUse?: string;
  flowKey?: string;
  title?: string;
  sort?: number;
  staticStatus: FlowSurfaceExtractorFlowStaticStatus;
  sourceRefs: FlowSurfaceAutoSourceRef[];
  confidence: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceAutoInferredAuthoringConfidence = {
  discovery: FlowSurfaceCapabilityConfidence;
  placement: FlowSurfaceCapabilityConfidence;
  tree: FlowSurfaceCapabilityConfidence;
  settings: FlowSurfaceCapabilityConfidence;
  write: FlowSurfaceCapabilityConfidence;
};

export type FlowSurfaceAutoInferredAuthoringEvidence = {
  type: 'model' | 'menuItem' | 'flow' | 'fieldBinding' | 'ast' | 'runtimeMock' | 'coreTemplate';
  ref: string;
};

export type FlowSurfaceAutoChildSurface = {
  key: string;
  parentModelUse: string;
  subModelKey: string;
  kind: 'block' | 'action' | 'fieldComponent';
  allowedChildren?: string[];
  emptyWhenMissing?: boolean;
};

export type FlowSurfaceAutoAllowedChild = {
  kind: 'block' | 'action' | 'fieldComponent';
  modelUse: string;
  publicType?: string;
  label?: string;
  conditions?: string[];
  builderContainerUse?: string;
};

export type FlowSurfaceAutoPopupHostDefaultType = 'addNew' | 'view' | 'edit';

export type FlowSurfaceAutoPopupHost = {
  key: string;
  modelUse: string;
  publicType?: string;
  parentModelUse?: string;
  subModelKey?: string;
  childSurfaceKey?: string;
  openViewPath?: string;
  parentOpenViewMirrorPaths?: string[];
  defaultType: FlowSurfaceAutoPopupHostDefaultType;
  hasCurrentRecord?: boolean;
  templateStrategy?: 'preferTemplateThenFallback' | 'fallbackOnly';
  openViewDefaults?: Record<string, unknown>;
  confidence?: FlowSurfaceCapabilityConfidence;
  evidence?: FlowSurfaceAutoInferredAuthoringEvidence[];
};

export type FlowSurfaceAutoInferredAuthoringCapability = {
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  acceptedAliases?: string[];
  ownerPlugin: string;
  modelUse: string;
  label: string;
  placement?: FlowSurfacePlacementSummary;
  confidence: FlowSurfaceAutoInferredAuthoringConfidence;
  initParamsSchema?: FlowSurfaceJsonSchema;
  settingsSchema?: FlowSurfaceJsonSchema;
  configureOptions?: FlowSurfaceConfigureOptions;
  createRecipe?: FlowSurfaceJsonCreateRecipe;
  childSurfaces?: FlowSurfaceAutoChildSurface[];
  allowedChildren?: FlowSurfaceAutoAllowedChild[];
  popupHosts?: FlowSurfaceAutoPopupHost[];
  evidence: FlowSurfaceAutoInferredAuthoringEvidence[];
  warnings?: FlowSurfaceCapabilityWarning[];
};

export type FlowSurfaceAutoInferredAuthoring = {
  contractVersion?: typeof FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION;
  capabilities: FlowSurfaceAutoInferredAuthoringCapability[];
};

export type FlowSurfaceAutoSnapshot = {
  version: typeof FLOW_SURFACE_AUTO_SNAPSHOT_VERSION;
  plugin: string;
  pluginVersion?: string;
  generatedAt: string;
  resolvedEntry?: string;
  sourceHash: string;
  dependencyHash?: string;
  extractorVersion: string;
  models: FlowSurfaceAutoModel[];
  menuItems: FlowSurfaceAutoMenuItem[];
  fieldBindings: FlowSurfaceAutoFieldBinding[];
  flows: FlowSurfaceAutoFlow[];
  inferredAuthoring?: FlowSurfaceAutoInferredAuthoring;
  warnings: FlowSurfaceCapabilityWarning[];
};

export type FlowSurfaceAutoCapabilityCandidate = {
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  label: string;
  modelUse: string;
  ownerPlugin: string;
  origin: 'autoSnapshot';
  confidence: FlowSurfaceCapabilityConfidence;
  evidence: Array<{
    type: 'model' | 'menuItem' | 'flow' | 'fieldBinding' | 'ast';
    ref: string;
  }>;
  warnings: FlowSurfaceCapabilityWarning[];
};

export type FlowSurfacePluginEntryResolution = {
  plugin: string;
  packageRoot: string;
  packageJsonPath: string;
  sourceEntry?: string;
  distEntry?: string;
  selectedEntry?: string;
  mode?: 'source' | 'dist';
  warnings: FlowSurfaceCapabilityWarning[];
};

export type FlowSurfaceExtractorCliResult = {
  ok: boolean;
  plugin: string;
  snapshotPath?: string;
  eventCount: number;
  candidateCount: number;
  warningCount: number;
  errors?: Array<{ code: string; message: string }>;
};
