/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import {
  FlowSchemaRegistry,
  type ActionDefinition,
  type FlowActionSchemaManifest,
  type FlowSchemaInventoryContribution,
  type FlowModelSchemaManifest,
  type FlowSchemaBundleDocument,
  type FlowSchemaContextEdge,
  type FlowJsonSchema,
  type FlowSchemaDocument,
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
    props: { type: 'object' },
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
    props: { type: 'object' },
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

function collectSlotSuggestedUses(slot?: FlowSubModelSlotSchema): string[] | undefined {
  if (!slot) return undefined;
  if (Array.isArray(slot.uses) && slot.uses.length > 0) {
    return slot.uses.filter(Boolean);
  }
  if (slot.use) {
    return [slot.use];
  }
  return undefined;
}

export class FlowSchemaService {
  readonly registry = new FlowSchemaRegistry();
  private readonly ajv = new Ajv({
    allErrors: true,
  });
  private readonly validatorCache = new Map<string, ValidateFunction>();

  constructor() {
    this.registry.registerModel('FlowModel', {
      title: 'FlowModel',
      coverage: {
        status: 'manual',
        source: 'official',
        strict: false,
      },
      exposure: 'internal',
      allowDirectUse: false,
    });
  }

  registerModels(models: Record<string, ModelConstructor>) {
    this.registry.registerModels(models);
  }

  registerActions(actions: Record<string, ActionDefinition>) {
    this.registry.registerActions(actions);
  }

  registerActionManifests(manifests: FlowActionSchemaManifest[] | Record<string, FlowActionSchemaManifest>) {
    this.registry.registerActionManifests(manifests);
  }

  registerModelManifests(manifests: FlowModelSchemaManifest[] | Record<string, FlowModelSchemaManifest>) {
    this.registry.registerModelManifests(manifests);
  }

  registerInventory(
    inventory: FlowSchemaInventoryContribution | undefined,
    source: 'official' | 'plugin' | 'third-party',
  ) {
    this.registry.registerInventory(inventory, source);
  }

  getDocument(use: string): FlowSchemaDocument | undefined {
    return this.registry.hasPublicModel(use) ? this.registry.getModelDocument(use) : undefined;
  }

  getDocuments(uses?: string[]): FlowSchemaDocument[] {
    if (!Array.isArray(uses) || uses.length === 0) {
      return this.registry.listModelDocuments({ publicOnly: true });
    }
    return uses.filter((use) => this.registry.hasPublicModel(use)).map((use) => this.registry.getModelDocument(use));
  }

  getBundle(uses?: string[]): FlowSchemaBundleDocument {
    return this.registry.getSchemaBundle(uses);
  }

  validateModelTree(
    input: any,
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
  ): FlowSchemaValidationIssue[] {
    const issues: FlowSchemaValidationIssue[] = [];
    this.validateModelNode(input, '#', issues, options, []);
    return issues;
  }

  private validateModelNode(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
    contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const modelUse = String(node?.use || '').trim();
    const modelDocument = this.registry.getModelDocument(modelUse, contextChain);
    const schemaHash = modelDocument.hash;
    const shellSchema =
      jsonPointer === '#' && options.allowRootObjectLocator && !String(node?.uid || '').trim()
        ? MODEL_SHELL_OBJECT_LOCATOR_SCHEMA
        : MODEL_SHELL_SCHEMA;
    const shellCacheKey =
      jsonPointer === '#' && options.allowRootObjectLocator && !String(node?.uid || '').trim()
        ? `shell-object-locator:${node?.use || 'unknown'}`
        : `shell:${node?.use || 'unknown'}`;
    const shellOk = this.validateSchema(shellCacheKey, shellSchema, node);
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

    const resolved = this.registry.resolveModelSchema(modelUse, contextChain);
    const strict =
      resolved.coverage.strict ??
      (resolved.coverage.source !== 'third-party' && resolved.coverage.status !== 'unresolved');

    if (!this.registry.isDirectUseAllowed(modelUse)) {
      issues.push({
        level: 'error',
        jsonPointer: `${jsonPointer}/use`,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'model',
        keyword: 'unsupported-model-use',
        message: `Model use "${node?.use}" is internal and cannot be submitted directly.`,
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
        suggestedUses: this.registry.listModelUses({ publicOnly: true, directUseOnly: true }).slice(0, 20),
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
        cacheKey: `step-params-shell:${schemaHash}`,
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
        cacheKey: `flow-registry-shell:${schemaHash}`,
        schemaHash,
      });
    }

    this.validateFlowRegistry(node, jsonPointer, issues, strict, schemaHash, contextChain);
    this.validateStepParams(node, jsonPointer, issues, strict, schemaHash, contextChain);
    this.validateSubModels(node, jsonPointer, issues, strict, schemaHash, contextChain);
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
        cacheKey: 'flow-definition-shell',
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
        const stepSchema = this.registry.buildStepDefinitionSchema(
          stepDef as any,
          `${node?.use}.${flowKey}.${stepKey}`,
        );
        this.validateSchemaSection({
          issues,
          modelUid: node?.uid,
          modelUse: node?.use,
          jsonPointer: stepPointer,
          schema: stepSchema,
          value: stepDef,
          section: 'flowRegistry',
          strict: true,
          cacheKey: `flow-step:${schemaHash}:${flowKey}:${stepKey}`,
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
          cacheKey: `step-params:${schemaHash}:${flowKey}:${stepKey}`,
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
    contextChain: FlowSchemaContextEdge[] = [],
  ) {
    const subModels = node?.subModels;
    if (!subModels) return;
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

    const slots = this.registry.resolveModelSchema(String(node.use || ''), contextChain)?.subModelSlots || {};
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
            suggestedUses: collectSlotSuggestedUses(slotSchema),
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
          this.validateModelNode(item, itemPointer, issues, {}, nextContext);
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
            suggestedUses: collectSlotSuggestedUses(slotSchema),
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
        this.validateModelNode(slotValue, slotPointer, issues, {}, nextContext);
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
    const allowedUses = collectSlotSuggestedUses(options.slotSchema) || [];

    if (childUse && allowedUses.length > 0 && !allowedUses.includes(childUse)) {
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
    cacheKey: string;
    schemaHash?: string;
  }) {
    const result = this.validateSchema(options.cacheKey, options.schema, options.value);
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

  private validateSchema(cacheKey: string, schema: FlowJsonSchema, value: any) {
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
