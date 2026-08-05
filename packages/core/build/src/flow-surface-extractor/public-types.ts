/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type FlowSurfaceNodeDomain = 'node' | 'props' | 'decoratorProps' | 'stepParams' | 'flowRegistry';

export type FlowSurfaceConfigureOption = {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: Array<string | number | boolean>;
  example?: unknown;
  default?: unknown;
  supportsFlowContext?: boolean;
};

export type FlowSurfaceConfigureOptions = Record<string, FlowSurfaceConfigureOption>;
export type FlowSurfaceCapabilityKind = 'block' | 'action' | 'fieldComponent' | 'fieldBinding' | 'fieldInterface';
export type FlowSurfaceCapabilityConfidence = 'high' | 'medium' | 'low';

export type FlowSurfacePlacementSummary = {
  scenes?: Array<'page' | 'tab' | 'popup' | 'form' | 'details' | 'table' | 'record' | 'actionPanel'>;
  slots?: Array<'blocks' | 'actions' | 'recordActions' | 'fields' | 'fieldComponents' | 'subModels'>;
  parentPublicTypes?: string[];
  containerKinds?: string[];
  collectionRequired?: boolean;
  fieldRequired?: boolean;
};

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

export type FlowSurfaceCapabilityDiagnosticWarning = {
  source: 'provider' | 'policy' | 'snapshot' | 'admission' | 'manifest';
  code: string;
  path?: string;
  ownerPlugin?: string;
  fileName?: string;
  publicType?: string;
  message: string;
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

export type FlowSurfaceNodeSpec = {
  uid?: string;
  clientKey?: string;
  sortIndex?: number;
  async?: boolean;
  use: string;
  popup?: Record<string, unknown>;
  props?: Record<string, unknown>;
  decoratorProps?: Record<string, unknown>;
  stepParams?: Record<string, unknown>;
  flowRegistry?: Record<string, unknown>;
  subModels?: Record<string, FlowSurfaceNodeSpec | FlowSurfaceNodeSpec[]>;
};

export type FlowSurfaceJsonCreateRecipe = {
  nodeTemplate: FlowSurfaceNodeSpec;
  initParams?: FlowSurfaceInitParamSpec[];
  settings?: FlowSurfaceSettingBinding[];
};
