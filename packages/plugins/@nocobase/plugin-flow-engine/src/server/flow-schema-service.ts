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
  FlowModel,
  FlowSchemaRegistry,
  type ActionDefinition,
  type FlowActionSchemaManifest,
  type FlowModelSchemaManifest,
  type FlowSchemaBundleDocument,
  type FlowJsonSchema,
  type FlowSchemaDocument,
  type ModelConstructor,
  type FlowSubModelSlotSchema,
} from '@nocobase/flow-engine';

export interface FlowSchemaValidationIssue {
  level: 'error' | 'warning';
  jsonPointer: string;
  modelUid?: string;
  modelUse?: string;
  section: 'model' | 'props' | 'stepParams' | 'subModels' | 'flowRegistry';
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
    this.registry.registerModels({ FlowModel });
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

  getDocument(use: string): FlowSchemaDocument {
    return this.registry.getModelDocument(use);
  }

  getDocuments(uses?: string[]): FlowSchemaDocument[] {
    if (!Array.isArray(uses) || uses.length === 0) {
      return this.registry.listModelDocuments();
    }
    return uses.map((use) => this.registry.getModelDocument(use));
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
    this.validateModelNode(input, '#', issues, options);
    return issues;
  }

  private validateModelNode(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    options: {
      allowRootObjectLocator?: boolean;
    } = {},
  ) {
    const modelDocument = this.registry.getModelDocument(String(node?.use || ''));
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

    const registered = this.registry.getModel(node.use);
    const strict = registered
      ? registered.coverage.strict ??
        (registered.coverage.source !== 'third-party' && registered.coverage.status !== 'unresolved')
      : false;

    if (!registered) {
      issues.push({
        level: 'warning',
        jsonPointer,
        modelUid: node?.uid,
        modelUse: node?.use,
        section: 'model',
        keyword: 'unresolved-model',
        message: `No schema registered for model use "${node?.use}".`,
        suggestedUses: this.registry.listModelUses().slice(0, 20),
        schemaHash,
      });
    }

    this.validateSchemaSection({
      issues,
      modelUid: node?.uid,
      modelUse: node?.use,
      jsonPointer: `${jsonPointer}/props`,
      schema: registered?.propsSchema || { type: 'object', additionalProperties: true },
      value: node?.props || {},
      section: 'props',
      strict,
      cacheKey: `props:${node?.use || 'unknown'}`,
      schemaHash,
    });

    this.validateFlowRegistry(node, jsonPointer, issues, strict, schemaHash);
    this.validateStepParams(node, jsonPointer, issues, strict, schemaHash);
    this.validateSubModels(node, jsonPointer, issues, strict, schemaHash);
  }

  private validateFlowRegistry(
    node: any,
    jsonPointer: string,
    issues: FlowSchemaValidationIssue[],
    strict: boolean,
    schemaHash?: string,
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
          cacheKey: `flow-step:${node?.use}:${flowKey}:${stepKey}`,
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

    const staticSchema = this.registry.buildStaticStepParamsSchema(node.use);
    const staticFlows = (staticSchema.properties || {}) as Record<string, any>;
    const dynamicFlows = (node?.flowRegistry || {}) as Record<string, any>;

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
          cacheKey: `step-params:${node?.use}:${flowKey}:${stepKey}`,
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

    const slots = this.registry.getModel(node.use)?.subModelSlots || {};
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
        slotValue.forEach((item, index) => this.validateModelNode(item, `${slotPointer}/${index}`, issues));
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
        this.validateModelNode(slotValue, slotPointer, issues);
      }
    }
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
      const errorPath = (error as ErrorObject & { instancePath?: string }).instancePath || error.dataPath || '';
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
