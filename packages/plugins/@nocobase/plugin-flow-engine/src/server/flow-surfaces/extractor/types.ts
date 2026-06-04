/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceCapabilityConfidence,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityWarning,
} from '../types';

export const FLOW_SURFACE_AUTO_SNAPSHOT_VERSION = 1;

export type FlowSurfaceExtractorEvidenceSource = 'runtime' | 'ast';

export type FlowSurfaceExtractorFlowStaticStatus = 'static' | 'dynamic' | 'unresolved';

export type FlowSurfaceExtractorCreateModelOptionsStatus = 'static' | 'dynamic' | 'unresolved';

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
