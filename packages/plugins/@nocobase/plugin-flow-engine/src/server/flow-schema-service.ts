/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import { uid } from '@nocobase/utils';
import {
  FlowSchemaRegistry,
  type ActionDefinition,
  type FlowActionSchemaContribution,
  type FlowFieldBindingContextContribution,
  type FlowFieldBindingContribution,
  type FlowSchemaInventoryContribution,
  type FlowModelSchemaContribution,
  type FlowSchemaBundleDocument,
  type FlowSchemaContextEdge,
  type FlowJsonSchema,
  type FlowSchemaDocument,
  type FlowSchemaDetail,
  type FlowSchemaPublicDocument,
  type ModelConstructor,
  type FlowSubModelSlotSchema,
} from '@nocobase/flow-engine/server';

export interface FlowSchemaValidationIssue {
  level: 'error' | 'warning';
  jsonPointer: string;
  modelUid?: string;
  modelUse?: string;
  section: 'model' | 'stepParams' | 'subModels' | 'flowRegistry';
  keyword: string;
  message: string;
  expectedType?: string | string[];
  allowedValues?: any[];
  suggestedUses?: string[];
  fieldInterface?: string;
  fieldType?: string;
  targetCollectionTemplate?: string;
  schemaHash?: string;
}

const MODEL_SHELL_SCHEMA: FlowJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['uid', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
    async: { type: 'boolean' },
    parentId: { type: 'string' },
    subKey: { type: 'string' },
    subType: { type: 'string', enum: ['object', 'array'] },
    sortIndex: { type: 'number' },
    stepParams: { type: 'object' },
    flowRegistry: { type: 'object' },
    subModels: { type: 'object' },
  },
  additionalProperties: true,
};

const MODEL_SHELL_OBJECT_LOCATOR_SCHEMA: FlowJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['parentId', 'subKey', 'subType', 'use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
    async: { type: 'boolean' },
    parentId: { type: 'string' },
    subKey: { type: 'string' },
    subType: { const: 'object' },
    sortIndex: { type: 'number' },
    stepParams: { type: 'object' },
    flowRegistry: { type: 'object' },
    subModels: { type: 'object' },
  },
  additionalProperties: true,
};

const MODEL_SHELL_CREATE_SCHEMA: FlowJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['use'],
  properties: {
    uid: { type: 'string' },
    use: { type: 'string' },
    async: { type: 'boolean' },
    parentId: { type: 'string' },
    subKey: { type: 'string' },
    subType: { type: 'string', enum: ['object', 'array'] },
    sortIndex: { type: 'number' },
    stepParams: { type: 'object' },
    flowRegistry: { type: 'object' },
    subModels: { type: 'object' },
  },
  additionalProperties: true,
};

const FLOW_EVENT_PHASES = ['beforeAllFlows', 'afterAllFlows', 'beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'];

const FLOW_DEFINITION_SHELL_SCHEMA: FlowJsonSchema = {
  type: 'object',
  properties: {
    key: { type: 'string' },
    title: { type: 'string' },
    manual: { type: 'boolean' },
    sort: { type: 'number' },
    steps: { type: 'object' },
  },
  required: ['steps'],
  additionalProperties: true,
};

function stableStringify(input: any): string {
  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (input && typeof input === 'object') {
    const entries = Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${JSON.stringify(key)}:${stableStringify(value)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(input) ?? 'null';
}

function slotAllowsUnknownUses(slot?: FlowSubModelSlotSchema): boolean {
  return !!slot?.schema;
}

function readModelUse(value: any): string {
  return String(value && typeof value === 'object' ? value.use || '' : '').trim();
}

function readFieldBindingUse(value: any): string {
  return String(value?.stepParams?.fieldBinding?.use || '').trim();
}

type NormalizeModelTreeOptions = {
  allowRootObjectLocator?: boolean;
  assignImplicitUids?: boolean;
};

type FlowSchemaValidationOptions = {
  allowRootObjectLocator?: boolean;
  existingNodeUids?: ReadonlySet<string>;
};

export class FlowSchemaService {
  readonly registry = new FlowSchemaRegistry();
  private readonly ajv = new Ajv({
    allErrors: true,
  });
  private readonly validatorCache = new Map<string, ValidateFunction>();
  private app: any;

  constructor() {
    this.registry.registerModel('FlowModel', {
      title: 'FlowModel',
      coverage: {
        status: 'manual',
        source: 'official',
        strict: false,
      },
      exposure: 'internal',
      abstract: true,
      allowDirectUse: false,
    });
  }

  registerModels(models: Record<string, ModelConstructor>) {
    this.registry.registerModels(models);
  }

  registerActions(actions: Record<string, ActionDefinition>) {
    this.registry.registerActions(actions);
  }

  registerActionContributions(
    contributions: FlowActionSchemaContribution[] | Record<string, FlowActionSchemaContribution>,
  ) {
    this.registry.registerActionContributions(contributions);
  }

  registerModelContributions(
    contributions: FlowModelSchemaContribution[] | Record<string, FlowModelSchemaContribution>,
  ) {
    this.registry.registerModelContributions(contributions);
  }

  registerInventory(
    inventory: FlowSchemaInventoryContribution | undefined,
    source: 'official' | 'plugin' | 'third-party',
  ) {
    this.registry.registerInventory(inventory, source);
  }

  registerFieldBindingContexts(
    contributions:
      | FlowFieldBindingContextContribution[]
      | Record<string, FlowFieldBindingContextContribution>
      | undefined,
  ) {
    this.registry.registerFieldBindingContexts(contributions);
  }

  registerFieldBindings(
    contributions:
      | FlowFieldBindingContribution[]
      | Record<string, FlowFieldBindingContribution | FlowFieldBindingContribution[]>
      | undefined,
    source: 'official' | 'plugin' | 'third-party',
  ) {
    this.registry.registerFieldBindings(contributions, source);
  }

  setApp(app: any) {
    this.app = app;
  }

  private readDocumentFromRegistry(use: string, clone = true): FlowSchemaDocument {
    const registry = this.registry as typeof this.registry & {
      getModelDocumentRef?: (use: string) => Readonly<FlowSchemaDocument>;
    };
    if (!clone && typeof registry.getModelDocumentRef === 'function') {
      return registry.getModelDocumentRef(use) as FlowSchemaDocument;
    }
    return this.registry.getModelDocument(use);
  }

  getDocument(use: string, options: { clone?: boolean } = {}): FlowSchemaDocument | undefined {
    if (!this.registry.hasQueryableModel(use)) {
      return undefined;
    }
    return this.readDocumentFromRegistry(use, options.clone !== false);
  }

  getDocuments(uses?: string[], options: { clone?: boolean } = {}): FlowSchemaDocument[] {
    if (!Array.isArray(uses) || uses.length === 0) {
      return [];
    }
    return uses
      .filter((use) => this.registry.hasQueryableModel(use))
      .map((use) => this.readDocumentFromRegistry(use, options.clone !== false));
  }

  private projectDocument(document: FlowSchemaDocument): FlowSchemaPublicDocument {
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

  getPublicDocument(
    use: string,
    options: { clone?: boolean; detail?: FlowSchemaDetail } = {},
  ): FlowSchemaPublicDocument | undefined {
    if (!this.registry.hasQueryableModel(use)) {
      return undefined;
    }

    const detail = options.detail === 'full' ? 'full' : 'compact';
    const registry = this.registry as typeof this.registry & {
      getPublicModelDocument?: (
        use: string,
        options?: { detail?: FlowSchemaDetail },
      ) => Readonly<FlowSchemaPublicDocument>;
      getPublicModelDocumentRef?: (
        use: string,
        options?: { detail?: FlowSchemaDetail },
      ) => Readonly<FlowSchemaPublicDocument>;
    };

    if (!options.clone && typeof registry.getPublicModelDocumentRef === 'function') {
      return registry.getPublicModelDocumentRef(use, { detail }) as FlowSchemaPublicDocument;
    }

    if (typeof registry.getPublicModelDocument === 'function') {
      return registry.getPublicModelDocument(use, { detail }) as FlowSchemaPublicDocument;
    }

    const document = this.readDocumentFromRegistry(use, options.clone !== false);
    return document ? this.projectDocument(document) : undefined;
  }

  getPublicDocuments(
    uses?: string[],
    options: { clone?: boolean; detail?: FlowSchemaDetail } = {},
  ): FlowSchemaPublicDocument[] {
    if (!Array.isArray(uses) || uses.length === 0) {
      return [];
    }

    return uses
      .filter((use) => this.registry.hasQueryableModel(use))
      .map((use) => this.getPublicDocument(use, options))
      .filter(Boolean) as FlowSchemaPublicDocument[];
  }

  getBundle(uses?: string[]): FlowSchemaBundleDocument {
    return this.registry.getSchemaBundle(uses);
  }

  private collectRuntimeFieldBindingUses(slot?: FlowSubModelSlotSchema, parentNode?: any, slotKey?: string) {
    const parentUse = String(parentNode?.use || '').trim();
    const fieldBindingContext = String(slot?.fieldBindingContext || '').trim();
    if (!fieldBindingContext) {
      return {
        allowedUses: this.registry.resolveSlotAllowedUses(parentUse, String(slotKey || ''), slot),
      };
    }

    const metadata = this.resolveFieldBindingMetadata(parentNode);
    const candidates = this.registry.resolveFieldBindingCandidates(fieldBindingContext, metadata || {});
    const allowedUses = candidates.map((candidate) => candidate.use);

    return {
      allowedUses:
        allowedUses.length > 0
          ? allowedUses
          : this.registry.resolveSlotAllowedUses(parentUse, String(slotKey || ''), slot),
      metadata,
    };
  }

  private resolveFieldBindingMetadata(parentNode: any):
    | {
        interface?: string;
        fieldType?: string;
        association?: boolean;
        targetCollectionTemplate?: string;
      }
    | undefined {
    const init = parentNode?.stepParams?.fieldSettings?.init;
    const dataSourceKey = String(init?.dataSourceKey || 'main').trim() || 'main';
    const collectionName = String(init?.collectionName || '').trim();
    const fieldPath = String(init?.fieldPath || '').trim();
    if (!collectionName || !fieldPath) {
      return undefined;
    }

    const dataSource =
      this.app?.dataSourceManager?.get?.(dataSourceKey) || this.app?.dataSourceManager?.getDataSource?.(dataSourceKey);
    const database = dataSource?.collectionManager?.db || (dataSourceKey === 'main' ? this.app?.db : undefined);
    const field = database?.getFieldByPath?.(`${collectionName}.${fieldPath}`);
    if (!field) {
      return undefined;
    }

    const targetCollection =
      field.targetCollection || (field.target ? database?.getCollection?.(field.target) : undefined);
    const association =
      typeof field.isAssociationField === 'function'
        ? !!field.isAssociationField()
        : !!field.target || !!targetCollection;

    return {
      interface: typeof field.interface === 'string' ? field.interface : undefined,
      fieldType:
        typeof field.dataType === 'string' ? field.dataType : typeof field.type === 'string' ? field.type : undefined,
      association,
      targetCollectionTemplate: typeof targetCollection?.template === 'string' ? targetCollection.template : undefined,
    };
  }

  validateModelTree(input: any, options: FlowSchemaValidationOptions = {}): FlowSchemaValidationIssue[] {
    return this.validateNormalizedModelTree(
      this.normalizeModelTree(input, [], {
        allowRootObjectLocator: options.allowRootObjectLocator,
      }),
      options,
    );
  }

  validateNormalizedModelTree(input: any, options: FlowSchemaValidationOptions = {}): FlowSchemaValidationIssue[] {
    const issues: FlowSchemaValidationIssue[] = [];
    this.validateModelNode(input, '#', issues, options, []);
    return issues;
  }

  normalizeModelTree(
    input: any,
    contextChain: FlowSchemaContextEdge[] = [],
    options: NormalizeModelTreeOptions = {},
    isRoot = true,
  ): any {
    if (!input || typeof input !== 'object') {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map((item) => this.normalizeModelTree(item, contextChain, options, false));
    }
    return this.normalizeModelNodeInput(input, contextChain, options, isRoot);
  }

  assignImplicitUids(
    input: any,
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
    isRoot = true,
  ): any {
    if (!input || typeof input !== 'object') {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map((item) => this.assignImplicitUids(item, options, false));
    }

    const normalizedNode = { ...input };
    const declaredUid = String(input?.uid || '').trim();
    const isRootObjectLocator =
      isRoot &&
      options.allowRootObjectLocator &&
      !declaredUid &&
      String(input?.parentId || '').trim() &&
      String(input?.subKey || '').trim() &&
      input?.subType === 'object';
    if (!declaredUid && !isRootObjectLocator) {
      normalizedNode.uid = uid();
    }

    const subModels = input?.subModels;
    if (!subModels || typeof subModels !== 'object' || Array.isArray(subModels)) {
      return normalizedNode;
    }

    normalizedNode.subModels = Object.fromEntries(
      Object.entries(subModels).map(([slotKey, slotValue]) => [
        slotKey,
        Array.isArray(slotValue)
          ? slotValue.map((item) => this.assignImplicitUids(item, options, false))
          : this.assignImplicitUids(slotValue, options, false),
      ]),
    );
    return normalizedNode;
  }

  private normalizeModelNodeInput(
    node: any,
    contextChain: FlowSchemaContextEdge[],
    options: NormalizeModelTreeOptions,
    isRoot: boolean,
  ): any {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return node;
    }

    const normalizedNode = { ...node };
    const declaredUid = String(node?.uid || '').trim();
    const isRootObjectLocator =
      isRoot &&
      options.allowRootObjectLocator &&
      !declaredUid &&
      String(node?.parentId || '').trim() &&
      String(node?.subKey || '').trim() &&
      node?.subType === 'object';
    if (options.assignImplicitUids && !declaredUid && !isRootObjectLocator) {
      normalizedNode.uid = uid();
    }
    const declaredUse = readModelUse(node);
    const bindingUse = readFieldBindingUse(node);
    const effectiveUse = bindingUse || declaredUse;
    const isFieldBindingTransition = !!bindingUse && bindingUse !== declaredUse;

    if (effectiveUse && declaredUse !== effectiveUse) {
      normalizedNode.use = effectiveUse;
    }

    const subModels = node?.subModels;
    if (!subModels || typeof subModels !== 'object' || Array.isArray(subModels)) {
      return normalizedNode;
    }

    const slots = effectiveUse ? this.registry.resolveModelSchema(effectiveUse, contextChain)?.subModelSlots || {} : {};
    const hasKnownSlots = Object.keys(slots).length > 0;
    const normalizedSubModels: Record<string, any> = {};

    for (const [slotKey, slotValue] of Object.entries(subModels)) {
      const slotSchema = slots[slotKey];
      if (isFieldBindingTransition && hasKnownSlots && !slotSchema) {
        continue;
      }

      if (Array.isArray(slotValue)) {
        normalizedSubModels[slotKey] = slotValue.map((item) =>
          this.normalizeChildModelInput(effectiveUse, slotKey, item, contextChain, options),
        );
        continue;
      }

      normalizedSubModels[slotKey] = this.normalizeChildModelInput(
        effectiveUse,
        slotKey,
        slotValue,
        contextChain,
        options,
      );
    }

    normalizedNode.subModels = normalizedSubModels;
    return normalizedNode;
  }

  private normalizeChildModelInput(
    parentUse: string,
    slotKey: string,
    value: any,
    contextChain: FlowSchemaContextEdge[],
    options: NormalizeModelTreeOptions,
  ) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const childUse = readFieldBindingUse(value) || readModelUse(value);
    const nextContext = childUse
      ? [
          ...contextChain,
          {
            parentUse,
            slotKey,
            childUse,
          },
        ]
      : contextChain;

    return this.normalizeModelTree(value, nextContext, options, false);
  }

  private validateModelNode(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    options: FlowSchemaValidationOptions = {},
    contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const nodeUid = String(node?.uid || '').trim();
    const isExistingNode = !!nodeUid && !!options.existingNodeUids?.has(nodeUid);
    const modelUse = String(node?.use || '').trim();
    const resolved = this.registry.resolveModelSchema(modelUse, contextChain);
    const schemaHash = this.registry.getModelSchemaHash(modelUse, contextChain);
    const missingUid = !String(node?.uid || '').trim();
    const strict = resolved.coverage.strict ?? false;

    if (!isExistingNode) {
      const shellSchema =
        jsonPointer === '#' && options.allowRootObjectLocator && missingUid
          ? MODEL_SHELL_OBJECT_LOCATOR_SCHEMA
          : options.allowRootObjectLocator && missingUid
            ? MODEL_SHELL_CREATE_SCHEMA
            : MODEL_SHELL_SCHEMA;
      const shellOk = this.validateSchema(shellSchema, node);
      if (!shellOk.valid) {
        this.pushAjvIssues(shellOk.errors, issues, {
          level: 'error',
          jsonPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'model',
          schemaHash,
        });
        return;
      }

      if (!this.registry.isDirectUseAllowed(modelUse)) {
        issues.push({
          level: 'error',
          jsonPointer: `${jsonPointer}/use`,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'model',
          keyword: 'unsupported-model-use',
          message: `Model use "${node?.use}" is base/abstract and cannot be submitted directly.`,
          suggestedUses: this.registry.getSuggestedUses(modelUse),
          schemaHash,
        });
        return;
      }

      if (!this.registry.getModel(node.use) && resolved.coverage.status === 'unresolved') {
        issues.push({
          level: 'warning',
          jsonPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'model',
          keyword: 'unresolved-model',
          message: `No schema registered for model use "${node?.use}".`,
          suggestedUses: this.registry.listModelUses({ directUseOnly: true }).slice(0, 20),
          schemaHash,
        });
      }

      if (typeof node?.stepParams !== 'undefined') {
        this.validateSchemaSection({
          issues,
          modelUid: node?.uid,
          modelUse: node?.use,
          jsonPointer: `${jsonPointer}/stepParams`,
          schema: this.registry.buildStaticStepParamsSchema(modelUse, contextChain),
          value: node?.stepParams || {},
          section: 'stepParams',
          strict,
          schemaHash,
        });
      }

      if (typeof node?.flowRegistry !== 'undefined') {
        this.validateSchemaSection({
          issues,
          modelUid: node?.uid,
          modelUse: node?.use,
          jsonPointer: `${jsonPointer}/flowRegistry`,
          schema: this.registry.buildStaticFlowRegistrySchema(modelUse, contextChain),
          value: node?.flowRegistry || {},
          section: 'flowRegistry',
          strict,
          schemaHash,
        });
      }

      this.validateFlowRegistry(node, jsonPointer, issues, strict, schemaHash, contextChain);
      this.validateStepParams(node, jsonPointer, issues, strict, schemaHash, contextChain);
    }

    this.validateSubModels(node, jsonPointer, issues, strict, schemaHash, options, contextChain);
  }

  private validateFlowRegistry(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    strict: boolean,
    schemaHash?: string,
    _contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const flowRegistry = node?.flowRegistry;
    if (!flowRegistry) return;
    if (typeof flowRegistry !== 'object' || Array.isArray(flowRegistry)) {
      issues.push({
        level: 'error',
        jsonPointer: `${jsonPointer}/flowRegistry`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'type',
        message: 'flowRegistry must be an object.',
        expectedType: 'object',
        schemaHash,
      });
      return;
    }

    for (const [flowKey, flowDef] of Object.entries(flowRegistry)) {
      const flowPointer = `${jsonPointer}/flowRegistry/${this.escapeJsonPointer(flowKey)}`;
      if (!flowDef || typeof flowDef !== 'object' || Array.isArray(flowDef)) {
        issues.push({
          level: 'error',
          jsonPointer: flowPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'flowRegistry',
          keyword: 'type',
          message: 'flowRegistry item must be an object.',
          expectedType: 'object',
          schemaHash,
        });
        continue;
      }
      this.validateSchemaSection({
        issues,
        modelUid: node?.uid,
        modelUse: node?.use,
        jsonPointer: flowPointer,
        schema: FLOW_DEFINITION_SHELL_SCHEMA,
        value: flowDef,
        section: 'flowRegistry',
        strict: true,
        schemaHash,
      });
      this.validateFlowOn((flowDef as any).on, `${flowPointer}/on`, node, issues, strict, schemaHash);
      const steps = (flowDef as any).steps;
      if (!steps || typeof steps !== 'object' || Array.isArray(steps)) {
        issues.push({
          level: 'error',
          jsonPointer: `${flowPointer}/steps`,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'flowRegistry',
          keyword: 'type',
          message: 'flowRegistry.steps must be an object.',
          expectedType: 'object',
          schemaHash,
        });
        continue;
      }

      for (const [stepKey, stepDef] of Object.entries(steps as Record<string, any>)) {
        const stepPointer = `${flowPointer}/steps/${this.escapeJsonPointer(stepKey)}`;
        if (!stepDef || typeof stepDef !== 'object' || Array.isArray(stepDef)) {
          issues.push({
            level: 'error',
            jsonPointer: stepPointer,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'flowRegistry',
            keyword: 'type',
            message: 'step definition must be an object.',
            expectedType: 'object',
            schemaHash,
          });
          continue;
        }
        const stepSchema = this.registry.buildStepDefinitionSchema(stepDef as any);
        this.validateSchemaSection({
          issues,
          modelUid: node?.uid,
          modelUse: node?.use,
          jsonPointer: stepPointer,
          schema: stepSchema,
          value: stepDef,
          section: 'flowRegistry',
          strict: true,
          schemaHash,
        });
        if ((stepDef as any).use && !this.registry.getAction((stepDef as any).use)) {
          issues.push({
            level: strict ? 'error' : 'warning',
            jsonPointer: `${stepPointer}/use`,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'flowRegistry',
            keyword: 'unresolved-action',
            message: `step use "${(stepDef as any).use}" has no registered params schema.`,
            suggestedUses: this.registry.listActionNames().slice(0, 20),
            schemaHash,
          });
        }
      }
    }
  }

  private validateStepParams(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    strict: boolean,
    schemaHash?: string,
    contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const stepParams = node?.stepParams;
    if (!stepParams) return;
    if (typeof stepParams !== 'object' || Array.isArray(stepParams)) {
      issues.push({
        level: 'error',
        jsonPointer: `${jsonPointer}/stepParams`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'stepParams',
        keyword: 'type',
        message: 'stepParams must be an object.',
        expectedType: 'object',
        schemaHash,
      });
      return;
    }

    const staticSchema = this.registry.buildStaticStepParamsSchema(node.use, contextChain);
    const staticFlows = (staticSchema.properties || {}) as Record<string, any>;
    const staticFlowRegistrySchema = this.registry.buildStaticFlowRegistrySchema(node.use, contextChain);
    const staticFlowRegistry = (staticFlowRegistrySchema.properties || {}) as Record<string, any>;
    const dynamicFlows = (node?.flowRegistry || {}) as Record<string, any>;
    const shouldValidateAsFlowMap = Object.keys(staticFlowRegistry).length > 0 || Object.keys(dynamicFlows).length > 0;

    if (!shouldValidateAsFlowMap) {
      return;
    }

    for (const [flowKey, flowValue] of Object.entries(stepParams)) {
      const flowPointer = `${jsonPointer}/stepParams/${this.escapeJsonPointer(flowKey)}`;
      if (!flowValue || typeof flowValue !== 'object' || Array.isArray(flowValue)) {
        issues.push({
          level: 'error',
          jsonPointer: flowPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'stepParams',
          keyword: 'type',
          message: 'stepParams flow item must be an object.',
          expectedType: 'object',
          schemaHash,
        });
        continue;
      }
      if (!staticFlows[flowKey] && !dynamicFlows[flowKey]) {
        issues.push({
          level: strict ? 'error' : 'warning',
          jsonPointer: flowPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'stepParams',
          keyword: 'unknown-flow',
          message: `Unknown stepParams flow "${flowKey}" for model "${node.use}".`,
          allowedValues: [...new Set([...Object.keys(staticFlows), ...Object.keys(dynamicFlows)])],
          schemaHash,
        });
      }

      const staticSteps = (staticFlows[flowKey]?.properties || {}) as Record<string, any>;
      const dynamicSteps = (dynamicFlows[flowKey]?.steps || {}) as Record<string, any>;
      const knownStepKeys = new Set<string>([...Object.keys(staticSteps), ...Object.keys(dynamicSteps)]);

      for (const [stepKey, stepValue] of Object.entries(flowValue as Record<string, any>)) {
        const stepPointer = `${flowPointer}/${this.escapeJsonPointer(stepKey)}`;
        const dynamicStep = dynamicSteps[stepKey];
        const schema =
          staticSteps[stepKey] ||
          (dynamicStep
            ? this.registry.resolveStepParamsSchema(dynamicStep as any, `${node?.use}.${flowKey}.${stepKey}`).schema
            : undefined);

        if (!schema) {
          issues.push({
            level: strict ? 'error' : 'warning',
            jsonPointer: stepPointer,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'stepParams',
            keyword: knownStepKeys.has(stepKey) ? 'missing-schema' : 'unknown-step',
            message: knownStepKeys.has(stepKey)
              ? `No params schema resolved for ${flowKey}.${stepKey}.`
              : `Unknown stepParams target ${flowKey}.${stepKey}.`,
            allowedValues: [...knownStepKeys],
            schemaHash,
          });
          continue;
        }

        this.validateSchemaSection({
          issues,
          modelUid: node?.uid,
          modelUse: node?.use,
          jsonPointer: stepPointer,
          schema,
          value: stepValue,
          section: 'stepParams',
          strict,
          schemaHash,
        });
      }
    }
  }

  private validateSubModels(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    strict: boolean,
    schemaHash?: string,
    validationOptions: FlowSchemaValidationOptions = {},
    contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const subModels = node?.subModels;
    const slots = this.registry.resolveModelSchema(String(node.use || ''), contextChain)?.subModelSlots || {};
    const nodeUid = String(node?.uid || '').trim();
    const isExistingNode = !!nodeUid && !!validationOptions.existingNodeUids?.has(nodeUid);
    const allowPartialRequiredSlots =
      isExistingNode || (!!validationOptions.allowRootObjectLocator && jsonPointer !== '#' && !nodeUid);

    if (typeof subModels === 'undefined' || subModels === null) {
      this.validateRequiredSubModelSlots({
        node,
        subModels: undefined,
        slots,
        jsonPointer,
        issues,
        strict,
        schemaHash,
        allowPartialRequiredSlots,
      });
      return;
    }

    if (typeof subModels !== 'object' || Array.isArray(subModels)) {
      issues.push({
        level: 'error',
        jsonPointer: `${jsonPointer}/subModels`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'subModels',
        keyword: 'type',
        message: 'subModels must be an object.',
        expectedType: 'object',
        schemaHash,
      });
      return;
    }

    this.validateRequiredSubModelSlots({
      node,
      subModels,
      slots,
      jsonPointer,
      issues,
      strict,
      schemaHash,
      allowPartialRequiredSlots,
    });

    for (const [slotKey, slotValue] of Object.entries(subModels)) {
      const slotPointer = `${jsonPointer}/subModels/${this.escapeJsonPointer(slotKey)}`;
      const slotSchema = slots[slotKey];
      if (!slotSchema) {
        issues.push({
          level: strict ? 'error' : 'warning',
          jsonPointer: slotPointer,
          modelUid: node?.uid,
          modelUse: node?.use,
          section: 'subModels',
          keyword: 'unknown-slot',
          message: `Unknown subModels slot "${slotKey}" for model "${node.use}".`,
          allowedValues: Object.keys(slots),
          schemaHash,
        });
      }

      if (Array.isArray(slotValue)) {
        if (slotSchema && slotSchema.type !== 'array') {
          issues.push({
            level: strict ? 'error' : 'warning',
            jsonPointer: slotPointer,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'subModels',
            keyword: 'type',
            message: `Slot "${slotKey}" expects ${slotSchema.type}, received array.`,
            expectedType: slotSchema.type,
            suggestedUses: this.registry.resolveSlotAllowedUses(String(node?.use || ''), slotKey, slotSchema),
            schemaHash,
          });
        }
        if (
          !allowPartialRequiredSlots &&
          slotSchema?.type === 'array' &&
          typeof slotSchema.minItems === 'number' &&
          slotValue.length < slotSchema.minItems
        ) {
          issues.push({
            level: strict ? 'error' : 'warning',
            jsonPointer: slotPointer,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'subModels',
            keyword: 'minItems',
            message: `Slot "${slotKey}" requires at least ${slotSchema.minItems} item(s).`,
            schemaHash,
          });
        }
        slotValue.forEach((item, index) => {
          const itemPointer = `${slotPointer}/${index}`;
          const nextContext = this.validateSubModelChildUse({
            parentNode: node,
            slotKey,
            slotSchema,
            value: item,
            jsonPointer: itemPointer,
            issues,
            strict,
            schemaHash,
            contextChain,
          });
          this.validateModelNode(item, itemPointer, issues, validationOptions, nextContext);
        });
      } else {
        if (slotSchema && slotSchema.type !== 'object') {
          issues.push({
            level: strict ? 'error' : 'warning',
            jsonPointer: slotPointer,
            modelUid: node?.uid,
            modelUse: node?.use,
            section: 'subModels',
            keyword: 'type',
            message: `Slot "${slotKey}" expects ${slotSchema.type}, received object.`,
            expectedType: slotSchema.type,
            suggestedUses: this.registry.resolveSlotAllowedUses(String(node?.use || ''), slotKey, slotSchema),
            schemaHash,
          });
        }
        const nextContext = this.validateSubModelChildUse({
          parentNode: node,
          slotKey,
          slotSchema,
          value: slotValue,
          jsonPointer: slotPointer,
          issues,
          strict,
          schemaHash,
          contextChain,
        });
        this.validateModelNode(slotValue, slotPointer, issues, validationOptions, nextContext);
      }
    }
  }

  private validateRequiredSubModelSlots(options: {
    node: any;
    subModels?: Record<string, any>;
    slots: Record<string, FlowSubModelSlotSchema>;
    jsonPointer: string;
    issues: FlowSchemaValidationIssue[];
    strict: boolean;
    schemaHash?: string;
    allowPartialRequiredSlots?: boolean;
  }) {
    if (options.allowPartialRequiredSlots) {
      return;
    }
    for (const [slotKey, slotSchema] of Object.entries(options.slots)) {
      if (!slotSchema?.required) {
        continue;
      }
      if (typeof options.subModels !== 'object' || options.subModels === null || !(slotKey in options.subModels)) {
        options.issues.push({
          level: options.strict ? 'error' : 'warning',
          jsonPointer: `${options.jsonPointer}/subModels/${this.escapeJsonPointer(slotKey)}`,
          modelUid: options.node?.uid,
          modelUse: options.node?.use,
          section: 'subModels',
          keyword: 'required',
          message: `Required subModels slot "${slotKey}" is missing.`,
          suggestedUses: this.registry.resolveSlotAllowedUses(String(options.node?.use || ''), slotKey, slotSchema),
          schemaHash: options.schemaHash,
        });
      }
    }
  }

  private validateSubModelChildUse(options: {
    parentNode: any;
    slotKey: string;
    slotSchema?: FlowSubModelSlotSchema;
    value: any;
    jsonPointer: string;
    issues: FlowSchemaValidationIssue[];
    strict: boolean;
    schemaHash?: string;
    contextChain: FlowSchemaContextEdge[];
  }): FlowSchemaContextEdge[] {
    const childUse = String(options?.value?.use || '').trim();
    const fieldBinding = this.collectRuntimeFieldBindingUses(options.slotSchema, options.parentNode, options.slotKey);
    const allowedUses = fieldBinding.allowedUses || [];
    const allowUnknownUses =
      !!options.slotSchema && !options.slotSchema.fieldBindingContext && slotAllowsUnknownUses(options.slotSchema);

    if (childUse && allowedUses.length > 0 && !allowedUses.includes(childUse) && !allowUnknownUses) {
      options.issues.push({
        level: options.strict ? 'error' : 'warning',
        jsonPointer: `${options.jsonPointer}/use`,
        modelUid: options.parentNode?.uid,
        modelUse: options.parentNode?.use,
        section: 'subModels',
        keyword: 'invalid-use',
        message: `Slot "${options.slotKey}" does not allow child use "${childUse}".`,
        allowedValues: allowedUses,
        suggestedUses: allowedUses,
        fieldInterface: fieldBinding.metadata?.interface,
        fieldType: fieldBinding.metadata?.fieldType,
        targetCollectionTemplate: fieldBinding.metadata?.targetCollectionTemplate,
        schemaHash: options.schemaHash,
      });
    }

    if (!childUse) {
      return options.contextChain;
    }

    return [
      ...options.contextChain,
      {
        parentUse: String(options.parentNode?.use || ''),
        slotKey: options.slotKey,
        childUse,
      },
    ];
  }

  private validateFlowOn(
    on: any,
    jsonPointer: string,
    node: any,
    issues: FlowSchemaValidationIssue[],
    strict: boolean,
    schemaHash?: string,
  ) {
    if (on === undefined || on === null) return;
    if (typeof on === 'string') return;
    if (typeof on !== 'object' || Array.isArray(on)) {
      issues.push({
        level: 'error',
        jsonPointer,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'type',
        message: 'flow.on must be a string or object.',
        expectedType: ['string', 'object'],
        schemaHash,
      });
      return;
    }
    if (!on.eventName || typeof on.eventName !== 'string') {
      issues.push({
        level: 'error',
        jsonPointer,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'required',
        message: 'flow.on.eventName is required.',
        schemaHash,
      });
    }
    if (on.phase && !FLOW_EVENT_PHASES.includes(on.phase)) {
      issues.push({
        level: 'error',
        jsonPointer: `${jsonPointer}/phase`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'enum',
        message: `Invalid flow phase "${on.phase}".`,
        allowedValues: FLOW_EVENT_PHASES,
        schemaHash,
      });
    }
    if (['beforeFlow', 'afterFlow', 'beforeStep', 'afterStep'].includes(on.phase) && !on.flowKey) {
      issues.push({
        level: strict ? 'error' : 'warning',
        jsonPointer: `${jsonPointer}/flowKey`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'required',
        message: `flow.on.flowKey is required when phase is "${on.phase}".`,
        schemaHash,
      });
    }
    if (['beforeStep', 'afterStep'].includes(on.phase) && !on.stepKey) {
      issues.push({
        level: strict ? 'error' : 'warning',
        jsonPointer: `${jsonPointer}/stepKey`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'flowRegistry',
        keyword: 'required',
        message: `flow.on.stepKey is required when phase is "${on.phase}".`,
        schemaHash,
      });
    }
  }

  private validateSchemaSection(options: {
    issues: FlowSchemaValidationIssue[];
    modelUid?: string;
    modelUse?: string;
    jsonPointer: string;
    schema: FlowJsonSchema;
    value: any;
    section: FlowSchemaValidationIssue['section'];
    strict: boolean;
    schemaHash?: string;
  }) {
    const result = this.validateSchema(options.schema, options.value);
    if (!result.valid) {
      this.pushAjvIssues(result.errors, options.issues, {
        level: options.strict ? 'error' : 'warning',
        jsonPointer: options.jsonPointer,
        modelUid: options.modelUid,
        modelUse: options.modelUse,
        section: options.section,
        schemaHash: options.schemaHash,
      });
    }
  }

  private validateSchema(schema: FlowJsonSchema, value: any) {
    const cacheKey = stableStringify(schema);
    let validator = this.validatorCache.get(cacheKey);
    if (!validator) {
      validator = this.ajv.compile(schema);
      this.validatorCache.set(cacheKey, validator);
    }
    const valid = validator(value) as boolean;
    return {
      valid,
      errors: validator.errors || [],
    };
  }

  private pushAjvIssues(
    errors: ErrorObject[],
    issues: FlowSchemaValidationIssue[],
    base: Omit<FlowSchemaValidationIssue, 'keyword' | 'message'>,
  ) {
    for (const error of errors || []) {
      const legacyDataPath = (error as ErrorObject & { dataPath?: string }).dataPath;
      const errorPath = error.instancePath || legacyDataPath || '';
      const params = (error.params || {}) as Record<string, any>;
      issues.push({
        ...base,
        jsonPointer: `${base.jsonPointer}${errorPath}` || base.jsonPointer,
        keyword: error.keyword,
        message: error.message || 'Invalid payload.',
        expectedType: error.keyword === 'type' ? params.type : undefined,
        allowedValues:
          error.keyword === 'enum'
            ? params.allowedValues
            : error.keyword === 'const'
              ? [params.allowedValue]
              : undefined,
      });
    }
  }

  private escapeJsonPointer(value: string) {
    return String(value).replace(/~/g, '~0').replace(/\//g, '~1');
  }
}
