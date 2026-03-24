/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  ActionDefinition,
  FlowActionSchemaContribution,
  FlowFieldBindingContextContribution,
  FlowFieldBindingContribution,
  FlowFieldModelCompatibility,
  FlowSchemaBundleDocument,
  FlowSchemaBundleNode,
  FlowSchemaBundleSlotCatalog,
  FlowSchemaContextEdge,
  FlowSchemaDocs,
  FlowDynamicHint,
  FlowSchemaInventoryContribution,
  FlowJsonSchema,
  FlowModelSchemaPatch,
  FlowModelSchemaContribution,
  FlowModelMeta,
  FlowSchemaCoverage,
  FlowSchemaDetail,
  FlowSchemaDocument,
  FlowModelSchemaExposure,
  FlowSchemaPublicDocument,
  FlowSubModelSlotSchema,
  ModelConstructor,
  StepDefinition,
} from './types';
import {
  buildFieldModelCompatibility,
  matchesFieldBinding,
  normalizeFieldBindingContextContribution,
  normalizeFieldBindingContribution,
  type RegisteredFieldBinding,
  type RegisteredFieldBindingContext,
} from './flow-schema-registry/fieldBinding';
import {
  applyModelSchemaPatch,
  matchesDescendantSchemaPatch,
  normalizeSubModelSlots,
  resolveChildSchemaPatch,
} from './flow-schema-registry/modelPatches';
import { inferParamsSchemaFromUiSchema, type StepSchemaResolution } from './flow-schema-registry/schemaInference';
import {
  JSON_SCHEMA_DRAFT_07,
  buildSkeletonFromSchema,
  collectAllowedUses,
  createFlowHint,
  deepFreezePlainGraph,
  hashString,
  mergeSchemas,
  normalizeSchemaDocs,
  normalizeSchemaHints,
  normalizeStringArray,
  stableStringify,
  toSchemaTitle,
} from './flow-schema-registry/utils';

export type RegisteredActionSchema = {
  name: string;
  title?: string;
  definition?: ActionDefinition;
  schema?: FlowJsonSchema;
  docs: FlowSchemaDocs;
  coverage: FlowSchemaCoverage;
  dynamicHints: FlowDynamicHint[];
};

export type RegisteredModelSchema = {
  use: string;
  modelClass?: ModelConstructor;
  stepParamsSchema?: FlowJsonSchema;
  flowRegistrySchema?: FlowJsonSchema;
  subModelSlots?: Record<string, FlowSubModelSlotSchema>;
  flowRegistrySchemaPatch?: FlowJsonSchema;
  title?: string;
  examples: any[];
  docs: FlowSchemaDocs;
  skeleton?: any;
  dynamicHints: FlowDynamicHint[];
  coverage: FlowSchemaCoverage;
  exposure: FlowModelSchemaExposure;
  abstract: boolean;
  allowDirectUse: boolean;
  suggestedUses: string[];
};

type ModelPatchContribution = {
  patch: FlowModelSchemaPatch;
  source: FlowSchemaCoverage['source'];
  strict?: boolean;
};

export class FlowSchemaRegistry {
  private readonly modelSchemas = new Map<string, RegisteredModelSchema>();
  private readonly actionSchemas = new Map<string, RegisteredActionSchema>();
  private readonly fieldBindingContexts = new Map<string, RegisteredFieldBindingContext>();
  private readonly fieldBindings = new Map<string, RegisteredFieldBinding[]>();
  private readonly resolvedModelCache = new Map<string, RegisteredModelSchema>();
  private readonly modelSnapshotSchemaCache = new Map<string, FlowJsonSchema>();
  private readonly compactModelSnapshotSchemaCache = new Map<string, FlowJsonSchema>();
  private readonly modelSchemaHashCache = new Map<string, string>();
  private readonly compactModelSchemaHashCache = new Map<string, string>();
  private readonly modelDocumentCache = new Map<string, FlowSchemaDocument>();
  private readonly modelLocalDynamicHintsCache = new Map<string, FlowDynamicHint[]>();
  private readonly publicModelDocumentCache = new Map<string, FlowSchemaPublicDocument>();
  private readonly publicTreeRoots = new Set<string>();
  private readonly slotUseExpansions = new Map<string, string[]>();

  private invalidateDerivedCaches() {
    this.resolvedModelCache.clear();
    this.modelSnapshotSchemaCache.clear();
    this.compactModelSnapshotSchemaCache.clear();
    this.modelSchemaHashCache.clear();
    this.compactModelSchemaHashCache.clear();
    this.modelDocumentCache.clear();
    this.modelLocalDynamicHintsCache.clear();
    this.publicModelDocumentCache.clear();
  }

  registerAction(action: ActionDefinition | ({ name: string } & Partial<ActionDefinition>)) {
    const name = String(action?.name || '').trim();
    if (!name) return;

    const previous = this.actionSchemas.get(name);
    const inferred = inferParamsSchemaFromUiSchema(name, action.uiSchema as any, `actions.${name}`);
    const mergedSchema = mergeSchemas(action.paramsSchema || inferred.schema, action.paramsSchemaPatch);
    const explicit = !!action.paramsSchema || !!action.paramsSchemaPatch;
    const coverageStatus: FlowSchemaCoverage['status'] = explicit
      ? inferred.schema
        ? 'mixed'
        : 'manual'
      : inferred.coverage;
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...action.schemaDocs,
      examples: action.schemaDocs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(action.schemaDocs?.dynamicHints || [])],
    });

    this.actionSchemas.set(name, {
      name,
      title: action.title,
      definition: action as ActionDefinition,
      schema: mergedSchema,
      coverage: {
        status: mergedSchema ? coverageStatus : 'unresolved',
        source: previous?.coverage.source || 'official',
        strict: previous?.coverage.strict,
      },
      docs,
      dynamicHints: normalizeSchemaHints([
        ...(previous?.dynamicHints || []),
        ...(inferred.hints || []),
        ...(docs.dynamicHints || []),
      ]),
    });
    this.invalidateDerivedCaches();
  }

  registerActions(actions: Record<string, ActionDefinition>) {
    for (const action of Object.values(actions || {})) {
      this.registerAction(action);
    }
  }

  registerActionContribution(contribution: FlowActionSchemaContribution) {
    const name = String(contribution?.name || '').trim();
    if (!name) return;

    const previous = this.actionSchemas.get(name);
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...contribution.docs,
      examples: contribution.docs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(contribution.docs?.dynamicHints || [])],
      commonPatterns: contribution.docs?.commonPatterns || previous?.docs?.commonPatterns,
      antiPatterns: contribution.docs?.antiPatterns || previous?.docs?.antiPatterns,
      minimalExample:
        contribution.docs?.minimalExample !== undefined
          ? contribution.docs.minimalExample
          : previous?.docs?.minimalExample,
    });
    this.actionSchemas.set(name, {
      name,
      title: contribution.title || previous?.title,
      definition: previous?.definition,
      schema: contribution.paramsSchema ? _.cloneDeep(contribution.paramsSchema) : previous?.schema,
      docs,
      coverage: {
        status: contribution.paramsSchema ? 'manual' : previous?.coverage.status || 'unresolved',
        source: contribution.source || previous?.coverage.source || 'official',
        strict: contribution.strict ?? previous?.coverage.strict,
      },
      dynamicHints: normalizeSchemaHints([...(previous?.dynamicHints || []), ...(docs.dynamicHints || [])]),
    });
    this.invalidateDerivedCaches();
  }

  registerActionContributions(
    contributions: FlowActionSchemaContribution[] | Record<string, FlowActionSchemaContribution>,
  ) {
    const values = Array.isArray(contributions) ? contributions : Object.values(contributions || {});
    for (const contribution of values) {
      this.registerActionContribution(contribution);
    }
  }

  registerFieldBindingContext(contribution: FlowFieldBindingContextContribution, fallbackName?: string) {
    const normalized = normalizeFieldBindingContextContribution(contribution, fallbackName);
    if (!normalized) {
      return;
    }

    const previous = this.fieldBindingContexts.get(normalized.name);
    this.fieldBindingContexts.set(normalized.name, {
      name: normalized.name,
      inherits: _.uniq([...(previous?.inherits || []), ...normalized.inherits]),
    });
    this.invalidateDerivedCaches();
  }

  registerFieldBindingContexts(
    contributions:
      | FlowFieldBindingContextContribution[]
      | Record<string, FlowFieldBindingContextContribution>
      | undefined,
  ) {
    if (!contributions) {
      return;
    }

    if (Array.isArray(contributions)) {
      for (const contribution of contributions) {
        this.registerFieldBindingContext(contribution);
      }
      return;
    }

    for (const [name, contribution] of Object.entries(contributions)) {
      if (!contribution) {
        continue;
      }
      this.registerFieldBindingContext(contribution, name);
    }
  }

  registerFieldBinding(contribution: FlowFieldBindingContribution, source: FlowSchemaCoverage['source'] = 'official') {
    const normalized = normalizeFieldBindingContribution(contribution, source);
    if (!normalized) {
      return;
    }

    const bindings = this.fieldBindings.get(normalized.context) || [];
    bindings.push(normalized);
    this.fieldBindings.set(normalized.context, bindings);
    this.invalidateDerivedCaches();
  }

  registerFieldBindings(
    contributions:
      | FlowFieldBindingContribution[]
      | Record<string, FlowFieldBindingContribution | FlowFieldBindingContribution[]>
      | undefined,
    source: FlowSchemaCoverage['source'] = 'official',
  ) {
    if (!contributions) {
      return;
    }

    if (Array.isArray(contributions)) {
      for (const contribution of contributions) {
        this.registerFieldBinding(contribution, source);
      }
      return;
    }

    for (const [context, contribution] of Object.entries(contributions)) {
      if (!contribution) {
        continue;
      }

      const items = Array.isArray(contribution) ? contribution : [contribution];
      for (const item of items) {
        this.registerFieldBinding(
          {
            ...item,
            context: item.context || context,
          },
          source,
        );
      }
    }
  }

  registerModel(use: string, options: Partial<RegisteredModelSchema>) {
    const name = String(use || '').trim();
    if (!name) return;
    const previous = this.modelSchemas.get(name);
    this.modelSchemas.set(name, {
      use: name,
      title: options.title || previous?.title,
      modelClass: options.modelClass || previous?.modelClass,
      stepParamsSchema: options.stepParamsSchema || previous?.stepParamsSchema,
      flowRegistrySchema: options.flowRegistrySchema || previous?.flowRegistrySchema,
      subModelSlots: normalizeSubModelSlots(options.subModelSlots || previous?.subModelSlots),
      flowRegistrySchemaPatch: options.flowRegistrySchemaPatch || previous?.flowRegistrySchemaPatch,
      examples: options.examples || previous?.examples || [],
      docs: normalizeSchemaDocs({
        ...previous?.docs,
        ...options.docs,
        examples: options.docs?.examples || previous?.docs?.examples,
        dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(options.docs?.dynamicHints || [])],
        commonPatterns: options.docs?.commonPatterns || previous?.docs?.commonPatterns,
        antiPatterns: options.docs?.antiPatterns || previous?.docs?.antiPatterns,
        minimalExample:
          options.docs?.minimalExample !== undefined ? options.docs.minimalExample : previous?.docs?.minimalExample,
      }),
      skeleton: options.skeleton !== undefined ? _.cloneDeep(options.skeleton) : previous?.skeleton,
      dynamicHints: normalizeSchemaHints([...(previous?.dynamicHints || []), ...(options.dynamicHints || [])]),
      coverage: options.coverage || previous?.coverage || { status: 'unresolved', source: 'third-party' },
      exposure: options.exposure ?? previous?.exposure ?? 'public',
      abstract: options.abstract ?? previous?.abstract ?? false,
      allowDirectUse: options.allowDirectUse ?? previous?.allowDirectUse ?? true,
      suggestedUses: normalizeStringArray(options.suggestedUses || previous?.suggestedUses),
    });
    this.invalidateDerivedCaches();
  }

  registerModelContribution(contribution: FlowModelSchemaContribution) {
    const use = String(contribution?.use || '').trim();
    if (!use) return;

    const previous = this.modelSchemas.get(use);
    const hasSchemaContribution =
      !!contribution.stepParamsSchema ||
      !!contribution.flowRegistrySchema ||
      !!contribution.flowRegistrySchemaPatch ||
      !!contribution.subModelSlots;
    const docs = normalizeSchemaDocs({
      ...previous?.docs,
      ...contribution.docs,
      examples: contribution.examples || contribution.docs?.examples || previous?.docs?.examples,
      dynamicHints: [...(previous?.docs?.dynamicHints || []), ...(contribution.docs?.dynamicHints || [])],
      commonPatterns: contribution.docs?.commonPatterns || previous?.docs?.commonPatterns,
      antiPatterns: contribution.docs?.antiPatterns || previous?.docs?.antiPatterns,
      minimalExample:
        contribution.docs?.minimalExample !== undefined
          ? contribution.docs.minimalExample
          : previous?.docs?.minimalExample,
    });
    this.registerModel(use, {
      title: contribution.title,
      stepParamsSchema: contribution.stepParamsSchema ? _.cloneDeep(contribution.stepParamsSchema) : undefined,
      flowRegistrySchema: contribution.flowRegistrySchema ? _.cloneDeep(contribution.flowRegistrySchema) : undefined,
      subModelSlots: contribution.subModelSlots ? normalizeSubModelSlots(contribution.subModelSlots) : undefined,
      flowRegistrySchemaPatch: contribution.flowRegistrySchemaPatch
        ? _.cloneDeep(contribution.flowRegistrySchemaPatch)
        : undefined,
      examples: contribution.examples || docs.examples || [],
      docs,
      skeleton: contribution.skeleton,
      dynamicHints: [...(contribution.dynamicHints || []), ...(docs.dynamicHints || [])],
      coverage: hasSchemaContribution
        ? {
            status: previous?.coverage.status === 'auto' ? 'mixed' : 'manual',
            source: contribution.source || previous?.coverage.source || 'official',
            strict: contribution.strict ?? previous?.coverage.strict,
          }
        : previous?.coverage || {
            status: 'unresolved',
            source: contribution.source || 'official',
            strict: contribution.strict,
          },
      exposure: contribution.exposure,
      abstract: contribution.abstract,
      allowDirectUse: contribution.allowDirectUse,
      suggestedUses: contribution.suggestedUses,
    });
  }

  registerModelContributions(
    contributions: FlowModelSchemaContribution[] | Record<string, FlowModelSchemaContribution>,
  ) {
    const values = Array.isArray(contributions) ? contributions : Object.values(contributions || {});
    for (const contribution of values) {
      this.registerModelContribution(contribution);
    }
  }

  registerModelClass(use: string, modelClass: ModelConstructor) {
    const meta = ((modelClass as any).meta || {}) as FlowModelMeta;
    const schemaMeta = meta.schema || {};
    const inferredSlots = this.inferSubModelSlotsFromModelClass(use, modelClass);
    const inferredHints = this.collectModelDynamicHints(use, modelClass, meta);
    const hasManual =
      !!schemaMeta.stepParamsSchema ||
      !!schemaMeta.flowRegistrySchema ||
      !!schemaMeta.subModelSlots ||
      !!schemaMeta.flowRegistrySchemaPatch;
    const hasAuto = !!Object.keys(inferredSlots).length;

    this.registerModel(use, {
      modelClass,
      title: toSchemaTitle(meta.label, use),
      stepParamsSchema: schemaMeta.stepParamsSchema,
      flowRegistrySchema: schemaMeta.flowRegistrySchema,
      subModelSlots: Object.keys(schemaMeta.subModelSlots || {}).length ? schemaMeta.subModelSlots : inferredSlots,
      flowRegistrySchemaPatch: schemaMeta.flowRegistrySchemaPatch,
      examples: schemaMeta.examples || schemaMeta.docs?.examples || [],
      docs: schemaMeta.docs,
      skeleton: schemaMeta.skeleton,
      dynamicHints: [...(schemaMeta.dynamicHints || []), ...(schemaMeta.docs?.dynamicHints || []), ...inferredHints],
      coverage: {
        status: hasManual && hasAuto ? 'mixed' : hasManual ? 'manual' : hasAuto ? 'auto' : 'unresolved',
        source: schemaMeta.source || 'official',
        strict: schemaMeta.strict,
      },
      exposure: schemaMeta.exposure,
      abstract: schemaMeta.abstract,
      allowDirectUse: schemaMeta.allowDirectUse,
      suggestedUses: schemaMeta.suggestedUses,
    });
  }

  registerModels(models: Record<string, ModelConstructor | undefined>) {
    for (const [use, modelClass] of Object.entries(models || {})) {
      if (modelClass) {
        this.registerModelClass(use, modelClass);
      }
    }
  }

  registerInventory(inventory: FlowSchemaInventoryContribution | undefined, _source: FlowSchemaCoverage['source']) {
    if (!inventory) {
      return;
    }

    for (const use of normalizeStringArray(inventory.publicTreeRoots)) {
      this.publicTreeRoots.add(use);
    }

    for (const item of inventory.slotUseExpansions || []) {
      const parentUse = String(item?.parentUse || '').trim();
      const slotKey = String(item?.slotKey || '').trim();
      const uses = normalizeStringArray(item?.uses);
      if (!parentUse || !slotKey || uses.length === 0) {
        continue;
      }

      const key = this.createSlotUseExpansionKey(parentUse, slotKey);
      this.slotUseExpansions.set(key, _.uniq([...(this.slotUseExpansions.get(key) || []), ...uses]));
    }
    this.invalidateDerivedCaches();
  }

  resolveFieldBindingCandidates(
    context: string,
    options: {
      interface?: string;
      fieldType?: string;
      association?: boolean;
      targetCollectionTemplate?: string;
    } = {},
  ) {
    const contextChain = this.resolveFieldBindingContextChain(context);
    const entries = contextChain.flatMap((contextName, contextIndex) =>
      (this.fieldBindings.get(contextName) || []).map((binding, bindingIndex) => ({
        binding,
        contextIndex,
        bindingIndex,
      })),
    );

    const candidates = entries
      .filter(({ binding }) => matchesFieldBinding(binding, options))
      .filter(({ binding }) => this.hasQueryableModel(binding.use))
      .sort((a, b) => {
        if (a.binding.isDefault !== b.binding.isDefault) {
          return a.binding.isDefault ? -1 : 1;
        }

        const aOrder = typeof a.binding.order === 'number' ? a.binding.order : Number.MAX_SAFE_INTEGER;
        const bOrder = typeof b.binding.order === 'number' ? b.binding.order : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        if (a.contextIndex !== b.contextIndex) {
          return a.contextIndex - b.contextIndex;
        }

        return a.bindingIndex - b.bindingIndex;
      })
      .map(({ binding }) => ({
        use: binding.use,
        defaultProps: binding.defaultProps === undefined ? undefined : _.cloneDeep(binding.defaultProps),
        compatibility: buildFieldModelCompatibility(binding),
      }));

    return _.uniqBy(candidates, (candidate) => `${candidate.use}:${stableStringify(candidate.compatibility)}`);
  }

  getAction(name: string): RegisteredActionSchema | undefined {
    return this.actionSchemas.get(name);
  }

  listActionNames(): string[] {
    return Array.from(this.actionSchemas.keys()).sort();
  }

  getModel(use: string): RegisteredModelSchema | undefined {
    return this.modelSchemas.get(use);
  }

  private resolveFieldBindingContextChain(context: string, visited = new Set<string>()): string[] {
    const name = String(context || '').trim();
    if (!name || visited.has(name)) {
      return [];
    }

    visited.add(name);

    const chain = [name];
    const inherits = this.fieldBindingContexts.get(name)?.inherits || [];
    for (const inheritedContext of inherits) {
      for (const item of this.resolveFieldBindingContextChain(inheritedContext, visited)) {
        if (!chain.includes(item)) {
          chain.push(item);
        }
      }
    }

    return chain;
  }

  private resolveModelSchemaRef(use: string, contextChain: FlowSchemaContextEdge[] = []): RegisteredModelSchema {
    const name = String(use || '').trim();
    const cacheKey = `${name}::${stableStringify(contextChain)}`;
    const cached = this.resolvedModelCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const registered = this.modelSchemas.get(name);
    const resolved: RegisteredModelSchema = {
      use: name,
      title: registered?.title || name,
      modelClass: registered?.modelClass,
      stepParamsSchema: registered?.stepParamsSchema
        ? _.cloneDeep(registered.stepParamsSchema)
        : this.buildInferredStepParamsSchema(name),
      flowRegistrySchema: registered?.flowRegistrySchema
        ? _.cloneDeep(registered.flowRegistrySchema)
        : this.buildInferredFlowRegistrySchema(name),
      subModelSlots: normalizeSubModelSlots(registered?.subModelSlots),
      flowRegistrySchemaPatch: registered?.flowRegistrySchemaPatch
        ? _.cloneDeep(registered.flowRegistrySchemaPatch)
        : undefined,
      examples: _.cloneDeep(registered?.examples || []),
      docs: normalizeSchemaDocs(registered?.docs),
      skeleton: registered?.skeleton === undefined ? undefined : _.cloneDeep(registered.skeleton),
      dynamicHints: normalizeSchemaHints(registered?.dynamicHints),
      coverage: registered?.coverage || { status: 'unresolved', source: 'third-party' },
      exposure: registered?.exposure || 'public',
      abstract: registered?.abstract ?? false,
      allowDirectUse: registered?.allowDirectUse ?? true,
      suggestedUses: normalizeStringArray(registered?.suggestedUses),
    };

    for (const contribution of this.collectContextPatches(name, contextChain)) {
      applyModelSchemaPatch(resolved, contribution.patch, contribution.source, contribution.strict);
    }

    const frozen = deepFreezePlainGraph(resolved);
    this.resolvedModelCache.set(cacheKey, frozen);
    return frozen;
  }

  resolveModelSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): RegisteredModelSchema {
    return _.cloneDeep(this.resolveModelSchemaRef(use, contextChain));
  }

  private isPublicModel(model?: Pick<RegisteredModelSchema, 'exposure'>): boolean {
    return (model?.exposure || 'public') === 'public';
  }

  private isQueryableModel(model?: Pick<RegisteredModelSchema, 'abstract'>): boolean {
    return !!model && model.abstract !== true;
  }

  getSuggestedUses(use: string): string[] {
    const model = this.modelSchemas.get(String(use || '').trim());
    if (model?.suggestedUses?.length) {
      return normalizeStringArray(model.suggestedUses);
    }
    return this.listModelUses({ directUseOnly: true })
      .filter((item) => item !== use)
      .slice(0, 20);
  }

  hasQueryableModel(use: string): boolean {
    const model = this.modelSchemas.get(String(use || '').trim());
    return this.isQueryableModel(model);
  }

  isDirectUseAllowed(use: string): boolean {
    const model = this.modelSchemas.get(String(use || '').trim());
    return model ? this.isQueryableModel(model) && model.allowDirectUse !== false : true;
  }

  listPublicTreeRoots(): string[] {
    return Array.from(this.publicTreeRoots).sort();
  }

  listModelUses(options: { publicOnly?: boolean; directUseOnly?: boolean; queryableOnly?: boolean } = {}): string[] {
    const { publicOnly = false, directUseOnly = false, queryableOnly = false } = options;
    return Array.from(this.modelSchemas.values())
      .filter((model) => !publicOnly || (this.isPublicModel(model) && this.isQueryableModel(model)))
      .filter((model) => !queryableOnly || this.isQueryableModel(model))
      .filter((model) => !directUseOnly || (this.isQueryableModel(model) && model.allowDirectUse !== false))
      .map((model) => model.use)
      .sort();
  }

  getSchemaBundle(uses?: string[]): FlowSchemaBundleDocument {
    return {
      items: (Array.isArray(uses) && uses.length > 0 ? uses.filter((use) => this.hasQueryableModel(use)) : []).map(
        (use) => this.buildBundleNode(use, [], new Set<string>()),
      ),
    };
  }

  getModelDocument(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowSchemaDocument {
    return _.cloneDeep(this.getModelDocumentRef(use, contextChain));
  }

  getModelDocumentRef(use: string, contextChain: FlowSchemaContextEdge[] = []): Readonly<FlowSchemaDocument> {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.modelDocumentCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const document = this.buildModelDocument(use, contextChain, new Set<string>());
    const frozen = deepFreezePlainGraph(document);
    this.modelDocumentCache.set(cacheKey, frozen);
    return frozen;
  }

  getPublicModelDocument(
    use: string,
    options: { detail?: FlowSchemaDetail; contextChain?: FlowSchemaContextEdge[] } = {},
  ): FlowSchemaPublicDocument {
    return _.cloneDeep(this.getPublicModelDocumentRef(use, options));
  }

  getPublicModelDocumentRef(
    use: string,
    options: { detail?: FlowSchemaDetail; contextChain?: FlowSchemaContextEdge[] } = {},
  ): Readonly<FlowSchemaPublicDocument> {
    const detail = options.detail === 'full' ? 'full' : 'compact';
    const contextChain = options.contextChain || [];
    const cacheKey = `${detail}::${this.createContextVisitKey(use, contextChain)}`;
    const cached = this.publicModelDocumentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const document =
      detail === 'full'
        ? this.buildFullPublicModelDocument(use, contextChain)
        : this.buildCompactPublicModelDocument(use, contextChain);
    const frozen = deepFreezePlainGraph(document);
    this.publicModelDocumentCache.set(cacheKey, frozen);
    return frozen;
  }

  private buildFullPublicModelDocument(use: string, contextChain: FlowSchemaContextEdge[]): FlowSchemaPublicDocument {
    const document = this.getModelDocumentRef(use, contextChain);
    return {
      use: document.use,
      title: document.title,
      jsonSchema: document.jsonSchema,
      dynamicHints: document.dynamicHints,
      minimalExample: document.minimalExample,
      commonPatterns: document.commonPatterns,
      antiPatterns: document.antiPatterns,
      hash: document.hash,
      source: document.source,
    };
  }

  private buildCompactPublicModelDocument(
    use: string,
    contextChain: FlowSchemaContextEdge[],
  ): FlowSchemaPublicDocument {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const jsonSchema = this.buildCompactModelSnapshotSchemaRef(use, contextChain);
    const minimalExample = _.cloneDeep(
      resolved?.docs?.minimalExample ??
        resolved?.examples?.[0] ??
        resolved?.skeleton ??
        buildSkeletonFromSchema(jsonSchema),
    );

    return {
      use,
      title: resolved?.title || use,
      jsonSchema,
      dynamicHints: [...this.getModelLocalDynamicHintsRef(use, contextChain)],
      minimalExample,
      commonPatterns: _.cloneDeep(resolved?.docs?.commonPatterns || []),
      antiPatterns: _.cloneDeep(resolved?.docs?.antiPatterns || []),
      hash: this.getCompactModelSchemaHash(use, contextChain),
      source: (resolved?.coverage || { source: 'third-party' as const }).source,
    };
  }

  private getModelLocalDynamicHintsRef(
    use: string,
    contextChain: FlowSchemaContextEdge[] = [],
  ): Readonly<FlowDynamicHint[]> {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.modelLocalDynamicHintsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const hints = this.buildModelLocalDynamicHints(use, contextChain);
    const frozen = deepFreezePlainGraph(hints);
    this.modelLocalDynamicHintsCache.set(cacheKey, frozen);
    return frozen;
  }

  private buildModelLocalDynamicHints(use: string, contextChain: FlowSchemaContextEdge[]): FlowDynamicHint[] {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const baseCoverage = resolved.coverage || { status: 'unresolved', source: 'third-party' as const };
    const flowDiagnostics = this.collectFlowSchemaDiagnostics(use);
    const slotHints = Object.entries(resolved?.subModelSlots || {}).map(([slotKey, slot]) => {
      const allowedUses = this.resolveSlotAllowedUses(use, slotKey, slot);
      return createFlowHint(
        {
          kind: slot.dynamic || slot.fieldBindingContext ? 'dynamic-children' : 'manual-schema-required',
          path: `${use}.subModels.${slotKey}`,
          message:
            slot.description ||
            `${use}.subModels.${slotKey} accepts ${slot.type}${
              allowedUses.length ? `: ${allowedUses.join(', ')}` : ''
            }.`,
        },
        {
          slotRules: {
            slotKey,
            type: slot.type,
            allowedUses,
          },
        },
      );
    });
    const coverage = this.buildDocumentCoverage(baseCoverage, flowDiagnostics.statuses);

    return normalizeSchemaHints([
      ...(resolved?.dynamicHints || []),
      ...slotHints,
      ...flowDiagnostics.hints,
      ...(coverage.status === 'unresolved'
        ? [
            createFlowHint(
              {
                kind: 'unresolved-model' as const,
                path: use,
                message: `${use} has no registered server-safe schema contribution yet.`,
              },
              {
                unresolvedReason: 'missing-model-contribution',
                recommendedFallback: { use },
              },
            ),
          ]
        : []),
    ]);
  }

  getModelSchemaHash(use: string, contextChain: FlowSchemaContextEdge[] = []): string {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.modelSchemaHashCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const hash = hashString(stableStringify(this.buildModelSnapshotSchemaRef(use, contextChain)));
    this.modelSchemaHashCache.set(cacheKey, hash);
    return hash;
  }

  getCompactModelSchemaHash(use: string, contextChain: FlowSchemaContextEdge[] = []): string {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.compactModelSchemaHashCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const hash = hashString(stableStringify(this.buildCompactModelSnapshotSchemaRef(use, contextChain)));
    this.compactModelSchemaHashCache.set(cacheKey, hash);
    return hash;
  }

  private createSlotUseExpansionKey(parentUse: string, slotKey: string): string {
    return `${parentUse}::${slotKey}`;
  }

  private getSlotUseExpansionUses(parentUse: string, slotKey: string): string[] {
    return this.slotUseExpansions.get(this.createSlotUseExpansionKey(parentUse, slotKey)) || [];
  }

  resolveSlotAllowedUses(parentUse: string, slotKey: string, slot?: FlowSubModelSlotSchema): string[] {
    if (!slot) {
      return [];
    }

    if (slot.fieldBindingContext) {
      return _.uniq(this.resolveFieldBindingCandidates(slot.fieldBindingContext).map((candidate) => candidate.use));
    }

    return _.uniq([...collectAllowedUses(slot), ...this.getSlotUseExpansionUses(parentUse, slotKey)]);
  }

  private buildModelDocument(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowSchemaDocument {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const baseCoverage = resolved.coverage || { status: 'unresolved', source: 'third-party' as const };
    const flowDiagnostics = this.collectFlowSchemaDiagnostics(use);
    const coverage = this.buildDocumentCoverage(baseCoverage, flowDiagnostics.statuses);
    const dynamicHints = normalizeSchemaHints([
      ...this.getModelLocalDynamicHintsRef(use, contextChain),
      ...this.collectNestedDocumentHints(use, contextChain, visited),
    ]);

    const jsonSchema = this.buildModelSnapshotSchemaRef(use, contextChain);
    const skeleton = _.cloneDeep(resolved?.skeleton ?? buildSkeletonFromSchema(jsonSchema));
    const minimalExample = _.cloneDeep(resolved?.docs?.minimalExample ?? resolved?.examples?.[0] ?? skeleton);
    const hash = this.getModelSchemaHash(use, contextChain);

    return {
      use,
      title: resolved?.title || use,
      jsonSchema,
      coverage,
      dynamicHints,
      examples: resolved?.examples || [],
      minimalExample,
      commonPatterns: _.cloneDeep(resolved?.docs?.commonPatterns || []),
      antiPatterns: _.cloneDeep(resolved?.docs?.antiPatterns || []),
      skeleton,
      hash,
      source: coverage.source,
    };
  }

  private buildBundleNode(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
    compatibility?: FlowFieldModelCompatibility,
  ): FlowSchemaBundleNode {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const visitKey = this.createContextVisitKey(use, contextChain);
    const node: FlowSchemaBundleNode = {
      use,
      title: resolved?.title || use,
    };

    if (compatibility) {
      node.compatibility = _.cloneDeep(compatibility);
    }

    if (visited.has(visitKey) || this.isContextCycle(use, contextChain)) {
      return node;
    }

    visited.add(visitKey);
    try {
      const subModelCatalog = this.buildBundleSubModelCatalog(use, resolved?.subModelSlots, contextChain, visited);
      if (subModelCatalog && Object.keys(subModelCatalog).length > 0) {
        node.subModelCatalog = subModelCatalog;
      }
      return node;
    } finally {
      visited.delete(visitKey);
    }
  }

  private buildBundleSubModelCatalog(
    parentUse: string,
    slots: Record<string, FlowSubModelSlotSchema> | undefined,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): Record<string, FlowSchemaBundleSlotCatalog> | undefined {
    if (!slots || Object.keys(slots).length === 0) {
      return undefined;
    }

    const entries = Object.entries(slots).map(([slotKey, slot]) => {
      const edgeBase = {
        parentUse,
        slotKey,
      };
      const fieldBindingCandidates = slot.fieldBindingContext
        ? this.resolveFieldBindingCandidates(slot.fieldBindingContext)
        : [];
      const allowedUses =
        fieldBindingCandidates.length > 0
          ? _.uniq(fieldBindingCandidates.map((item) => item.use))
          : this.resolveSlotAllowedUses(parentUse, slotKey, slot);
      const catalog: FlowSchemaBundleSlotCatalog = {
        type: slot.type,
        candidates:
          fieldBindingCandidates.length > 0
            ? fieldBindingCandidates.map((candidate) =>
                this.buildBundleNode(
                  candidate.use,
                  [
                    ...contextChain,
                    {
                      ...edgeBase,
                      childUse: candidate.use,
                    },
                  ],
                  visited,
                  candidate.compatibility,
                ),
              )
            : allowedUses.map((childUse) =>
                this.buildBundleNode(
                  childUse,
                  [
                    ...contextChain,
                    {
                      ...edgeBase,
                      childUse,
                    },
                  ],
                  visited,
                ),
              ),
      };

      if (slot.required !== undefined) {
        catalog.required = slot.required;
      }

      if (slot.type === 'array' && typeof slot.minItems === 'number') {
        catalog.minItems = slot.minItems;
      }

      if (allowedUses.length === 0) {
        catalog.open = true;
      }

      return [slotKey, catalog] as const;
    });

    return entries.length ? Object.fromEntries(entries) : undefined;
  }

  private createContextVisitKey(use: string, contextChain: FlowSchemaContextEdge[]): string {
    return `${use}::${stableStringify(contextChain)}`;
  }

  private isContextCycle(use: string, contextChain: FlowSchemaContextEdge[]): boolean {
    if (!contextChain.length) {
      return false;
    }

    const ancestorUses = [contextChain[0].parentUse, ...contextChain.slice(0, -1).map((edge) => edge.childUse)];
    return ancestorUses.includes(use);
  }

  buildModelSnapshotSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    return _.cloneDeep(this.buildModelSnapshotSchemaRef(use, contextChain));
  }

  buildCompactModelSnapshotSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    return _.cloneDeep(this.buildCompactModelSnapshotSchemaRef(use, contextChain));
  }

  private buildModelSnapshotSchemaRef(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.modelSnapshotSchemaCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const schema = this.buildModelSnapshotSchemaInternal(use, contextChain, new Set<string>());
    const frozen = deepFreezePlainGraph(schema);
    this.modelSnapshotSchemaCache.set(cacheKey, frozen);
    return frozen;
  }

  private buildCompactModelSnapshotSchemaRef(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const cacheKey = this.createContextVisitKey(use, contextChain);
    const cached = this.compactModelSnapshotSchemaCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const schema = this.buildCompactModelSnapshotSchemaInternal(use, contextChain);
    const frozen = deepFreezePlainGraph(schema);
    this.compactModelSnapshotSchemaCache.set(cacheKey, frozen);
    return frozen;
  }

  private buildCompactModelSnapshotSchemaInternal(use: string, contextChain: FlowSchemaContextEdge[]): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const subModelsSchema = this.buildCompactSubModelsSchemaFromSlots(use, resolved?.subModelSlots, contextChain);
    return this.buildSnapshotShellSchema(use, resolved, subModelsSchema);
  }

  private buildModelSnapshotSchemaInternal(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const visitKey = this.createContextVisitKey(use, contextChain);

    if (visited.has(visitKey) || this.isContextCycle(use, contextChain)) {
      return this.buildTruncatedSnapshotSchema(use, resolved);
    }

    visited.add(visitKey);
    try {
      return this.buildSnapshotSchemaFromResolved(use, resolved, contextChain, visited);
    } finally {
      visited.delete(visitKey);
    }
  }

  private buildSnapshotSchemaFromResolved(
    use: string | undefined,
    resolved: RegisteredModelSchema,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowJsonSchema {
    const subModelsSchema = this.buildSubModelsSchemaFromSlots(
      use || '',
      resolved?.subModelSlots,
      contextChain,
      visited,
    );
    return this.buildSnapshotShellSchema(use, resolved, subModelsSchema);
  }

  private buildSnapshotShellSchema(
    use: string | undefined,
    resolved: RegisteredModelSchema,
    subModelsSchema: FlowJsonSchema,
  ): FlowJsonSchema {
    const flowRegistrySchema = resolved?.flowRegistrySchema || { type: 'object', additionalProperties: true };
    const stepParamsSchema = resolved?.stepParamsSchema || { type: 'object', additionalProperties: true };
    return {
      $schema: JSON_SCHEMA_DRAFT_07,
      type: 'object',
      properties: {
        uid: { type: 'string' },
        use: use ? { const: use } : { type: 'string' },
        async: { type: 'boolean' },
        parentId: { type: 'string' },
        subKey: { type: 'string' },
        subType: { type: 'string', enum: ['object', 'array'] },
        sortIndex: { type: 'number' },
        stepParams: stepParamsSchema,
        flowRegistry: mergeSchemas(flowRegistrySchema, resolved?.flowRegistrySchemaPatch) || {
          type: 'object',
          additionalProperties: true,
        },
        subModels: subModelsSchema,
      },
      required: ['uid', 'use'],
      additionalProperties: true,
    };
  }

  private buildTruncatedSnapshotSchema(use: string | undefined, resolved: RegisteredModelSchema): FlowJsonSchema {
    return this.buildSnapshotShellSchema(use, resolved, {
      type: 'object',
      additionalProperties: true,
    });
  }

  buildStaticFlowRegistrySchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    const schema = mergeSchemas(resolved?.flowRegistrySchema, resolved?.flowRegistrySchemaPatch);
    if (schema) {
      return _.cloneDeep(schema);
    }
    return { type: 'object', additionalProperties: true };
  }

  buildStaticStepParamsSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    if (resolved?.stepParamsSchema) {
      return _.cloneDeep(resolved.stepParamsSchema);
    }
    return { type: 'object', additionalProperties: true };
  }

  buildSubModelsSchema(use: string, contextChain: FlowSchemaContextEdge[] = []): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    return this.buildSubModelsSchemaFromSlots(use, resolved?.subModelSlots, contextChain, new Set<string>());
  }

  private buildCompactSubModelsSchemaFromSlots(
    parentUse: string,
    slots: Record<string, FlowSubModelSlotSchema> | undefined,
    contextChain: FlowSchemaContextEdge[] = [],
  ): FlowJsonSchema {
    if (!slots || Object.keys(slots).length === 0) {
      return { type: 'object', additionalProperties: true };
    }

    const properties: Record<string, FlowJsonSchema> = {};
    const required: string[] = [];
    for (const [slotKey, slot] of Object.entries(slots)) {
      const itemSchema = this.buildCompactSlotTargetSchema(parentUse, slotKey, slot, contextChain);
      properties[slotKey] =
        slot.type === 'array'
          ? {
              type: 'array',
              ...(typeof slot.minItems === 'number' ? { minItems: slot.minItems } : {}),
              items: itemSchema,
            }
          : itemSchema;
      if (slot.required) {
        required.push(slotKey);
      }
    }

    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: true,
    };
  }

  private buildSubModelsSchemaFromSlots(
    parentUse: string,
    slots: Record<string, FlowSubModelSlotSchema> | undefined,
    contextChain: FlowSchemaContextEdge[] = [],
    visited: Set<string>,
  ): FlowJsonSchema {
    if (!slots || Object.keys(slots).length === 0) {
      return { type: 'object', additionalProperties: true };
    }
    const properties: Record<string, FlowJsonSchema> = {};
    const required: string[] = [];
    for (const [slotKey, slot] of Object.entries(slots)) {
      const itemSchema = this.buildSlotTargetSchema(parentUse, slotKey, slot, contextChain, visited);
      properties[slotKey] =
        slot.type === 'array'
          ? {
              type: 'array',
              ...(typeof slot.minItems === 'number' ? { minItems: slot.minItems } : {}),
              items: itemSchema,
            }
          : itemSchema;
      if (slot.required) {
        required.push(slotKey);
      }
    }
    return {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: true,
    };
  }

  private buildInferredFlowRegistrySchema(use: string): FlowJsonSchema | undefined {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return undefined;
    }

    const properties: Record<string, FlowJsonSchema> = {};
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      const stepProperties: Record<string, FlowJsonSchema> = {};
      const steps = flowDef?.steps || {};
      for (const [stepKey, stepDef] of Object.entries(steps)) {
        stepProperties[stepKey] = this.buildStepDefinitionSchema(stepDef as StepDefinition);
      }
      properties[flowKey] = {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          manual: { type: 'boolean' },
          sort: { type: 'number' },
          on: this.buildFlowOnSchema(),
          steps: {
            type: 'object',
            properties: stepProperties,
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      };
    }
    return {
      type: 'object',
      properties,
      additionalProperties: true,
    };
  }

  private buildInferredStepParamsSchema(use: string): FlowJsonSchema | undefined {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return undefined;
    }

    const properties: Record<string, FlowJsonSchema> = {};
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      const stepProperties: Record<string, FlowJsonSchema> = {};
      const steps = flowDef?.steps || {};
      for (const [stepKey, stepDef] of Object.entries(steps)) {
        const resolved = this.resolveStepParamsSchema(stepDef as StepDefinition, `${use}.${flowKey}.${stepKey}`);
        stepProperties[stepKey] = resolved.schema || { type: 'object', additionalProperties: true };
      }
      properties[flowKey] = {
        type: 'object',
        properties: stepProperties,
        additionalProperties: false,
      };
    }
    return {
      type: 'object',
      properties,
      additionalProperties: true,
    };
  }

  buildFlowOnSchema(): FlowJsonSchema {
    return {
      anyOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            eventName: { type: 'string' },
            defaultParams: { type: 'object', additionalProperties: true },
            phase: {
              type: 'string',
              enum: ['beforeAllFlows', 'afterAllFlows', 'beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'],
            },
            flowKey: { type: 'string' },
            stepKey: { type: 'string' },
          },
          required: ['eventName'],
          additionalProperties: true,
        },
      ],
    };
  }

  buildStepDefinitionSchema(step: StepDefinition): FlowJsonSchema {
    return {
      type: 'object',
      properties: {
        key: { type: 'string' },
        flowKey: { type: 'string' },
        title: { type: 'string' },
        use: { type: 'string' },
        sort: { type: 'number' },
        preset: { type: 'boolean' },
        isAwait: { type: 'boolean' },
        manual: { type: 'boolean' },
        on: this.buildFlowOnSchema(),
        defaultParams: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] as any },
        paramsSchemaOverride: { type: 'object', additionalProperties: true },
      },
      additionalProperties: true,
    };
  }

  resolveStepParamsSchema(step: StepDefinition, path: string): StepSchemaResolution {
    if (step.paramsSchemaOverride) {
      return {
        schema: _.cloneDeep(step.paramsSchemaOverride),
        hints: normalizeSchemaHints(step.schemaDocs?.dynamicHints),
        coverage: 'manual',
      };
    }

    if (step.use) {
      const action = this.getAction(step.use);
      if (action?.schema) {
        return {
          schema: _.cloneDeep(action.schema),
          hints: normalizeSchemaHints([...(action.dynamicHints || []), ...(step.schemaDocs?.dynamicHints || [])]),
          coverage:
            action.coverage.status === 'auto' || action.coverage.status === 'manual'
              ? action.coverage.status
              : action.coverage.status === 'unresolved'
                ? 'unresolved'
                : 'mixed',
        };
      }
      return {
        schema: { type: 'object', additionalProperties: true },
        hints: [
          createFlowHint(
            {
              kind: 'unresolved-action',
              path,
              message: `${path} references unresolved action "${step.use}".`,
            },
            {
              unresolvedReason: 'missing-action-contribution',
              recommendedFallback: { use: step.use, params: {} },
            },
          ),
          ...(step.schemaDocs?.dynamicHints || []),
        ],
        coverage: 'unresolved',
      };
    }

    const inferred = inferParamsSchemaFromUiSchema(path, step.uiSchema as any, path);
    return {
      schema: mergeSchemas(inferred.schema, step.paramsSchemaPatch),
      hints: normalizeSchemaHints([...(inferred.hints || []), ...(step.schemaDocs?.dynamicHints || [])]),
      coverage: step.paramsSchemaPatch ? 'mixed' : inferred.coverage,
    };
  }

  private buildSlotTargetSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowJsonSchema {
    if (slot.fieldBindingContext) {
      const candidateUses = _.uniq(
        this.resolveFieldBindingCandidates(slot.fieldBindingContext).map((item) => item.use),
      );
      if (candidateUses.length > 0) {
        const candidateSchemas = candidateUses.map((use) =>
          this.buildModelSnapshotSchemaInternal(
            use,
            [
              ...contextChain,
              {
                parentUse,
                slotKey,
                childUse: use,
              },
            ],
            visited,
          ),
        );

        if (slot.schema) {
          return {
            anyOf: [...candidateSchemas, _.cloneDeep(slot.schema)],
          };
        }

        return candidateSchemas.length === 1 ? candidateSchemas[0] : { oneOf: candidateSchemas };
      }
    }

    const allowedUses = this.resolveSlotAllowedUses(parentUse, slotKey, slot);
    if (allowedUses.length > 0) {
      const knownSchemas = allowedUses.map((use) =>
        this.buildModelSnapshotSchemaInternal(
          use,
          [
            ...contextChain,
            {
              parentUse,
              slotKey,
              childUse: use,
            },
          ],
          visited,
        ),
      );
      if (slot.schema) {
        return {
          anyOf: [...knownSchemas, _.cloneDeep(slot.schema)],
        };
      }
      if (knownSchemas.length === 1) {
        return knownSchemas[0];
      }
      return {
        oneOf: knownSchemas,
      };
    }
    if (slot.childSchemaPatch || slot.descendantSchemaPatches?.length) {
      return this.buildAnonymousSlotSnapshotSchema(parentUse, slotKey, slot, contextChain, visited);
    }
    if (slot.schema && !slot.childSchemaPatch && !slot.descendantSchemaPatches?.length) {
      return _.cloneDeep(slot.schema);
    }
    return { type: 'object', additionalProperties: true };
  }

  private buildCompactSlotTargetSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
    contextChain: FlowSchemaContextEdge[],
  ): FlowJsonSchema {
    if (slot.fieldBindingContext) {
      const candidateUses = _.uniq(
        this.resolveFieldBindingCandidates(slot.fieldBindingContext).map((item) => item.use),
      );
      if (candidateUses.length > 0) {
        const candidateSchemas = candidateUses.map((use) =>
          this.buildCompactSlotCandidateSchema(use, [
            ...contextChain,
            {
              parentUse,
              slotKey,
              childUse: use,
            },
          ]),
        );

        if (slot.schema) {
          return {
            anyOf: [...candidateSchemas, _.cloneDeep(slot.schema)],
          };
        }

        return candidateSchemas.length === 1 ? candidateSchemas[0] : { oneOf: candidateSchemas };
      }
    }

    const allowedUses = this.resolveSlotAllowedUses(parentUse, slotKey, slot);
    if (allowedUses.length > 0) {
      const knownSchemas = allowedUses.map((use) =>
        this.buildCompactSlotCandidateSchema(use, [
          ...contextChain,
          {
            parentUse,
            slotKey,
            childUse: use,
          },
        ]),
      );

      if (slot.schema) {
        return {
          anyOf: [...knownSchemas, _.cloneDeep(slot.schema)],
        };
      }

      return knownSchemas.length === 1 ? knownSchemas[0] : { oneOf: knownSchemas };
    }

    if (slot.childSchemaPatch || slot.descendantSchemaPatches?.length) {
      return this.buildCompactAnonymousSlotSnapshotSchema(parentUse, slotKey, slot);
    }

    if (slot.schema && !slot.childSchemaPatch && !slot.descendantSchemaPatches?.length) {
      return _.cloneDeep(slot.schema);
    }

    return { type: 'object', additionalProperties: true };
  }

  private buildCompactSlotCandidateSchema(use: string, contextChain: FlowSchemaContextEdge[]): FlowJsonSchema {
    const resolved = this.resolveModelSchemaRef(use, contextChain);
    return this.buildTruncatedSnapshotSchema(use, resolved);
  }

  private buildCompactAnonymousSlotSnapshotSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
  ): FlowJsonSchema {
    const anonymousResolved = this.createAnonymousResolvedSchema(parentUse, slotKey, slot);
    return this.buildTruncatedSnapshotSchema(undefined, anonymousResolved);
  }

  private buildAnonymousSlotSnapshotSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowJsonSchema {
    const anonymousResolved = this.createAnonymousResolvedSchema(parentUse, slotKey, slot);
    return this.buildSnapshotSchemaFromResolved(
      '',
      anonymousResolved,
      [
        ...contextChain,
        {
          parentUse,
          slotKey,
          childUse: '',
        },
      ],
      visited,
    );
  }

  private createAnonymousResolvedSchema(
    parentUse: string,
    slotKey: string,
    slot: FlowSubModelSlotSchema,
  ): RegisteredModelSchema {
    const anonymousResolved: RegisteredModelSchema = {
      use: '',
      title: slot.description || `${parentUse || 'AnonymousModel'}.${slotKey}`,
      examples: [],
      docs: normalizeSchemaDocs(),
      dynamicHints: [],
      coverage: {
        status: 'unresolved',
        source: 'third-party',
      },
      exposure: 'internal',
      abstract: false,
      allowDirectUse: true,
      suggestedUses: [],
    };

    const directPatch = resolveChildSchemaPatch(slot, '');
    if (directPatch) {
      applyModelSchemaPatch(anonymousResolved, directPatch, 'third-party');
    }

    return anonymousResolved;
  }

  private collectNestedDocumentHints(
    use: string,
    contextChain: FlowSchemaContextEdge[],
    visited: Set<string>,
  ): FlowDynamicHint[] {
    const visitKey = this.createContextVisitKey(use, contextChain);
    if (visited.has(visitKey) || this.isContextCycle(use, contextChain)) {
      return [];
    }

    visited.add(visitKey);
    try {
      const resolved = this.resolveModelSchemaRef(use, contextChain);
      const hints: FlowDynamicHint[] = [];
      for (const [slotKey, slot] of Object.entries(resolved.subModelSlots || {})) {
        const childUses = this.resolveSlotAllowedUses(use, slotKey, slot);
        for (const childUse of childUses) {
          const childContext = [
            ...contextChain,
            {
              parentUse: use,
              slotKey,
              childUse,
            },
          ];
          const childDocument = this.buildModelDocument(childUse, childContext, visited);
          const basePath = `${use}.subModels.${slotKey}`;
          hints.push(...childDocument.dynamicHints.map((hint) => this.prefixNestedHint(hint, basePath, childUse)));
        }
      }
      return normalizeSchemaHints(hints);
    } finally {
      visited.delete(visitKey);
    }
  }

  private prefixNestedHint(hint: FlowDynamicHint, basePath: string, childUse: string): FlowDynamicHint {
    if (!hint.path) {
      return {
        ...hint,
        path: basePath,
      };
    }

    if (hint.path === childUse) {
      return {
        ...hint,
        path: basePath,
      };
    }

    if (hint.path.startsWith(`${childUse}.`)) {
      return {
        ...hint,
        path: `${basePath}.${hint.path.slice(childUse.length + 1)}`,
      };
    }

    return {
      ...hint,
      path: `${basePath}.${hint.path}`,
    };
  }

  private collectContextPatches(use: string, contextChain: FlowSchemaContextEdge[]): ModelPatchContribution[] {
    if (!contextChain.length) {
      return [];
    }

    const contributions: ModelPatchContribution[] = [];
    const targetEdgeIndex = contextChain.length - 1;

    for (let index = 0; index < contextChain.length; index++) {
      const edge = contextChain[index];
      const parentContext = contextChain.slice(0, index);
      const parentResolved = this.resolveModelSchemaRef(edge.parentUse, parentContext);
      const slot = parentResolved.subModelSlots?.[edge.slotKey];
      if (!slot) {
        continue;
      }

      const remainingEdges = contextChain.slice(index + 1);
      for (const patch of slot.descendantSchemaPatches || []) {
        if (matchesDescendantSchemaPatch(patch, remainingEdges)) {
          contributions.push({
            patch: patch.patch,
            source: parentResolved.coverage.source,
            strict: parentResolved.coverage.strict,
          });
        }
      }

      if (index === targetEdgeIndex) {
        const directPatch = resolveChildSchemaPatch(slot, use);
        if (directPatch) {
          contributions.push({
            patch: directPatch,
            source: parentResolved.coverage.source,
            strict: parentResolved.coverage.strict,
          });
        }
      }
    }

    return contributions;
  }

  private collectModelDynamicHints(use: string, modelClass: ModelConstructor, meta: FlowModelMeta): FlowDynamicHint[] {
    const hints: FlowDynamicHint[] = [];
    if (typeof meta.children === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.meta.children`,
            message: `${use} uses function-based children and only static slot hints are available.`,
          },
          {
            unresolvedReason: 'function-children',
          },
        ),
      );
    }
    if (typeof meta.createModelOptions === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.meta.createModelOptions`,
            message: `${use} uses function-based createModelOptions and may need manual sub-model slot schema.`,
          },
          {
            unresolvedReason: 'function-create-model-options',
          },
        ),
      );
    }
    if (typeof (modelClass as any).defineChildren === 'function') {
      hints.push(
        createFlowHint(
          {
            kind: 'dynamic-children',
            path: `${use}.defineChildren`,
            message: `${use} defines dynamic children. Schema generation only keeps static baseline.`,
          },
          {
            unresolvedReason: 'runtime-define-children',
          },
        ),
      );
    }
    return hints;
  }

  private collectFlowSchemaDiagnostics(use: string): {
    hints: FlowDynamicHint[];
    statuses: FlowSchemaCoverage['status'][];
  } {
    const registered = this.modelSchemas.get(use);
    const modelClass = registered?.modelClass as any;
    const flowsMap = modelClass?.globalFlowRegistry?.getFlows?.() as Map<string, any> | undefined;
    if (!flowsMap?.size) {
      return {
        hints: [],
        statuses: [],
      };
    }

    const hints: FlowDynamicHint[] = [];
    const statuses: FlowSchemaCoverage['status'][] = [];
    for (const [flowKey, flowDef] of flowsMap.entries()) {
      for (const [stepKey, stepDef] of Object.entries(flowDef?.steps || {})) {
        const resolved = this.resolveStepParamsSchema(stepDef as StepDefinition, `${use}.${flowKey}.${stepKey}`);
        if (resolved.hints?.length) {
          hints.push(...resolved.hints);
        }
        statuses.push(resolved.coverage);
      }
    }

    return {
      hints: normalizeSchemaHints(hints),
      statuses,
    };
  }

  private buildDocumentCoverage(
    base: FlowSchemaCoverage,
    stepStatuses: FlowSchemaCoverage['status'][],
  ): FlowSchemaCoverage {
    const statuses = new Set<FlowSchemaCoverage['status']>([base.status, ...stepStatuses].filter(Boolean));

    let status: FlowSchemaCoverage['status'] = base.status;
    if (statuses.size > 1) {
      statuses.delete('unresolved');
      if (statuses.size === 0) {
        status = 'unresolved';
      } else {
        status = 'mixed';
      }
    } else if (statuses.size === 1) {
      status = (Array.from(statuses)[0] || 'unresolved') as FlowSchemaCoverage['status'];
    }

    return {
      ...base,
      status,
    };
  }

  private inferSubModelSlotsFromModelClass(
    use: string,
    modelClass: ModelConstructor,
  ): Record<string, FlowSubModelSlotSchema> {
    const meta = (((modelClass as any).meta || {}) as FlowModelMeta).schema;
    if (meta?.subModelSlots) {
      return _.cloneDeep(meta.subModelSlots);
    }

    const createModelOptions = ((modelClass as any).meta || {}).createModelOptions;
    if (!_.isPlainObject(createModelOptions) || !_.isPlainObject((createModelOptions as any).subModels)) {
      return {};
    }

    const slots: Record<string, FlowSubModelSlotSchema> = {};
    for (const [slotKey, slotValue] of Object.entries((createModelOptions as any).subModels || {})) {
      if (Array.isArray(slotValue)) {
        const first = slotValue[0] as any;
        slots[slotKey] = {
          type: 'array',
          ...(typeof first?.use === 'string' ? { use: first.use } : {}),
        };
      } else if (_.isPlainObject(slotValue)) {
        slots[slotKey] = {
          type: 'object',
          ...((slotValue as any).use ? { use: (slotValue as any).use } : {}),
        };
      } else {
        slots[slotKey] = {
          type: 'object',
        };
      }
    }
    return slots;
  }
}
