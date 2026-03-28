/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  ActionDefinition as BaseActionDefinition,
  FlowContext,
  FlowModel,
  FlowModelMeta as BaseFlowModelMeta,
  ModelConstructor as BaseModelConstructor,
  StepDefinition as BaseStepDefinition,
} from '@nocobase/flow-engine';

export type FlowJsonSchema = Record<string, any> & {
  $schema?: string;
  $id?: string;
};

export interface FlowDynamicHintMetadata {
  slotRules?: {
    slotKey?: string;
    type?: 'object' | 'array';
    allowedUses?: string[];
  };
  contextRequirements?: string[];
  unresolvedReason?: string;
  recommendedFallback?: any;
}

export interface FlowDynamicHint {
  kind:
    | 'dynamic-ui-schema'
    | 'dynamic-children'
    | 'custom-component'
    | 'x-reactions'
    | 'unresolved-action'
    | 'manual-schema-required'
    | 'unresolved-model';
  path?: string;
  message: string;
  'x-flow'?: FlowDynamicHintMetadata;
}

export interface FlowSchemaCoverage {
  status: 'auto' | 'manual' | 'mixed' | 'unresolved';
  source: 'official' | 'plugin' | 'third-party';
  strict?: boolean;
  issues?: string[];
}

export type FlowModelSchemaExposure = 'public' | 'internal';

export interface FlowSchemaPattern {
  title: string;
  description?: string;
  snippet?: any;
}

export interface FlowSchemaDocs {
  description?: string;
  examples?: any[];
  minimalExample?: any;
  commonPatterns?: FlowSchemaPattern[];
  antiPatterns?: FlowSchemaPattern[];
  dynamicHints?: FlowDynamicHint[];
}

export interface FlowFieldBindingConditions {
  association?: boolean;
  fieldTypes?: string[];
  targetCollectionTemplateIn?: string[];
  targetCollectionTemplateNotIn?: string[];
}

export interface FlowFieldBindingContextContribution {
  name: string;
  inherits?: string[];
}

export interface FlowFieldBindingContribution {
  context: string;
  use: string;
  interfaces: string[];
  isDefault?: boolean;
  order?: number;
  conditions?: FlowFieldBindingConditions;
  defaultProps?: any;
}

export interface FlowFieldModelCompatibility {
  context: string;
  interfaces: string[];
  isDefault?: boolean;
  order?: number;
  association?: boolean;
  fieldTypes?: string[];
  targetCollectionTemplateIn?: string[];
  targetCollectionTemplateNotIn?: string[];
  inheritParentFieldBinding?: boolean;
}

export interface FlowSchemaBundleSlotCatalog {
  type: 'object' | 'array';
  required?: boolean;
  minItems?: number;
  open?: boolean;
  candidates: FlowSchemaBundleNode[];
}

export interface FlowSchemaBundleNode {
  use: string;
  title?: string;
  compatibility?: FlowFieldModelCompatibility;
  subModelCatalog?: Record<string, FlowSchemaBundleSlotCatalog>;
}

export type FlowSchemaBundleItem = FlowSchemaBundleNode;

export interface FlowSchemaBundleDocument {
  items: FlowSchemaBundleNode[];
}

export interface FlowSchemaContextEdge {
  parentUse: string;
  slotKey: string;
  childUse: string;
}

export interface FlowSubModelContextPathStep {
  slotKey: string;
  use?: string | string[];
}

export interface FlowModelSchemaPatch {
  stepParamsSchema?: FlowJsonSchema;
  flowRegistrySchema?: FlowJsonSchema;
  subModelSlots?: Record<string, FlowSubModelSlotSchema>;
  flowRegistrySchemaPatch?: FlowJsonSchema;
  docs?: FlowSchemaDocs;
  examples?: any[];
  skeleton?: any;
  dynamicHints?: FlowDynamicHint[];
}

export interface FlowDescendantSchemaPatch {
  path: FlowSubModelContextPathStep[];
  patch: FlowModelSchemaPatch;
}

export interface FlowSubModelSlotSchema {
  type: 'object' | 'array';
  use?: string;
  uses?: string[];
  required?: boolean;
  minItems?: number;
  dynamic?: boolean;
  schema?: FlowJsonSchema;
  fieldBindingContext?: string;
  childSchemaPatch?: FlowModelSchemaPatch | Record<string, FlowModelSchemaPatch>;
  descendantSchemaPatches?: FlowDescendantSchemaPatch[];
  description?: string;
}

export interface FlowModelSchemaMeta {
  stepParamsSchema?: FlowJsonSchema;
  flowRegistrySchema?: FlowJsonSchema;
  subModelSlots?: Record<string, FlowSubModelSlotSchema>;
  flowRegistrySchemaPatch?: FlowJsonSchema;
  docs?: FlowSchemaDocs;
  examples?: any[];
  skeleton?: any;
  dynamicHints?: FlowDynamicHint[];
  source?: FlowSchemaCoverage['source'];
  strict?: boolean;
  exposure?: FlowModelSchemaExposure;
  abstract?: boolean;
  allowDirectUse?: boolean;
  suggestedUses?: string[];
}

export type FlowModelMeta = BaseFlowModelMeta & {
  schema?: FlowModelSchemaMeta;
};

export type ModelConstructor<T extends FlowModel<any> = FlowModel<any>> = BaseModelConstructor<T> & {
  meta?: FlowModelMeta;
};

export type ActionDefinition<
  TModel extends FlowModel = FlowModel,
  TCtx extends FlowContext = FlowContext,
> = BaseActionDefinition<TModel, TCtx> & {
  paramsSchema?: FlowJsonSchema;
  paramsSchemaPatch?: FlowJsonSchema;
  schemaDocs?: FlowSchemaDocs;
};

export type StepDefinition<TModel extends FlowModel = FlowModel> = BaseStepDefinition<TModel> & {
  paramsSchemaPatch?: FlowJsonSchema;
  paramsSchemaOverride?: FlowJsonSchema;
  schemaDocs?: FlowSchemaDocs;
};

export interface FlowActionSchemaContribution {
  name: string;
  title?: string;
  paramsSchema?: FlowJsonSchema;
  docs?: FlowSchemaDocs;
  source?: FlowSchemaCoverage['source'];
  strict?: boolean;
}

export interface FlowModelSchemaContribution {
  use: string;
  title?: string;
  stepParamsSchema?: FlowJsonSchema;
  flowRegistrySchema?: FlowJsonSchema;
  subModelSlots?: Record<string, FlowSubModelSlotSchema>;
  flowRegistrySchemaPatch?: FlowJsonSchema;
  docs?: FlowSchemaDocs;
  examples?: any[];
  skeleton?: any;
  dynamicHints?: FlowDynamicHint[];
  source?: FlowSchemaCoverage['source'];
  strict?: boolean;
  exposure?: FlowModelSchemaExposure;
  abstract?: boolean;
  allowDirectUse?: boolean;
  suggestedUses?: string[];
}

export interface FlowSchemaContributionDefaults {
  source?: FlowSchemaCoverage['source'];
  strict?: boolean;
}

export interface FlowSchemaSlotUseExpansion {
  parentUse: string;
  slotKey: string;
  uses: string[];
}

export interface FlowSchemaInventoryContribution {
  publicTreeRoots?: string[];
  slotUseExpansions?: FlowSchemaSlotUseExpansion[];
}

export interface FlowSchemaContribution {
  models?: FlowModelSchemaContribution[] | Record<string, FlowModelSchemaContribution>;
  actions?: FlowActionSchemaContribution[] | Record<string, FlowActionSchemaContribution>;
  fieldBindingContexts?: FlowFieldBindingContextContribution[] | Record<string, FlowFieldBindingContextContribution>;
  fieldBindings?:
    | FlowFieldBindingContribution[]
    | Record<string, FlowFieldBindingContribution | FlowFieldBindingContribution[]>;
  inventory?: FlowSchemaInventoryContribution;
  defaults?: FlowSchemaContributionDefaults;
}

export interface FlowSchemaContributionProvider {
  getFlowSchemaContributions(): FlowSchemaContribution | undefined | Promise<FlowSchemaContribution | undefined>;
}

export interface FlowSchemaDocument {
  use: string;
  title?: string;
  jsonSchema: FlowJsonSchema;
  coverage: FlowSchemaCoverage;
  dynamicHints: FlowDynamicHint[];
  examples: any[];
  minimalExample?: any;
  commonPatterns: FlowSchemaPattern[];
  antiPatterns: FlowSchemaPattern[];
  skeleton: any;
  hash: string;
  source: FlowSchemaCoverage['source'];
}

export type FlowSchemaDetail = 'compact' | 'full';

export interface FlowSchemaPublicDocument {
  use: string;
  title?: string;
  jsonSchema: FlowJsonSchema;
  dynamicHints: FlowDynamicHint[];
  minimalExample?: any;
  commonPatterns: FlowSchemaPattern[];
  antiPatterns: FlowSchemaPattern[];
  hash: string;
  source: FlowSchemaCoverage['source'];
}

export type FlowSchemaActionDefinition<
  TModel extends FlowModel = FlowModel,
  TCtx extends FlowContext = FlowContext,
> = ActionDefinition<TModel, TCtx>;

export type FlowSchemaStepDefinition<TModel extends FlowModel = FlowModel> = StepDefinition<TModel>;

export type FlowSchemaModelMeta = FlowModelMeta;

export type FlowSchemaModelConstructor<T extends FlowModel<any> = FlowModel<any>> = ModelConstructor<T>;
