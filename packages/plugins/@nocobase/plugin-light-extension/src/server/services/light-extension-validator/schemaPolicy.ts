/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildLightExtensionSettingsSchema,
  LIGHT_EXTENSION_SETTINGS_PROPERTY_PATTERN,
} from '@nocobase/light-extension-sdk/schema';

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URL, LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION } from '../../../constants';
import type { LightExtensionCapabilities } from '../../../shared/types';
import { isPlainRecord, schemaProblem as problem } from './problems';
import type {
  LightExtensionValidatorProblem,
  NormalizedSourceFile,
  ParsedEntryDescriptor,
  ProblemTarget,
} from './types';
import { isValidEntryName } from './workspacePolicy';

const invalidJsonParse = Symbol('invalidJsonParse');
const settingsPropertyPattern = new RegExp(LIGHT_EXTENSION_SETTINGS_PROPERTY_PATTERN);
const unsafePathSegments = new Set(['__proto__', 'prototype', 'constructor']);

interface ConditionOwner {
  schemaPath: string;
  references: Set<string>;
}

interface SettingsSchemaValidationInput {
  filePath: string;
  schemaPath: string;
  propertyPath: string | null;
  depth: number;
  problems: LightExtensionValidatorProblem[];
  target: Omit<ProblemTarget, 'path'>;
  rootSchema: Record<string, unknown>;
  conditionOwners: Map<string, ConditionOwner>;
  insideArray: boolean;
}

interface ConditionComplexityState {
  nodes: number;
  tooComplexPaths: Set<string>;
}

export class LightExtensionSchemaValidator {
  constructor(private readonly capabilities: LightExtensionCapabilities) {}

  validateEntryDescriptor(
    file: NormalizedSourceFile | undefined,
    problems: LightExtensionValidatorProblem[],
    target: Omit<ProblemTarget, 'path'>,
  ): ParsedEntryDescriptor | null {
    if (!file) {
      problems.push(problem('entry_descriptor_missing', 'error', 'Entry root must include entry.json', target));
      return null;
    }

    if (file.size > this.capabilities.limits.maxEntryDescriptorBytes) {
      problems.push(
        problem('entry_descriptor_too_large', 'error', 'entry.json exceeds the 128 KiB size limit', {
          ...target,
          path: file.path,
          details: {
            size: file.size,
            maxEntryDescriptorBytes: this.capabilities.limits.maxEntryDescriptorBytes,
          },
        }),
      );
      return null;
    }

    const json = this.parseJson(file, 'entry_descriptor_json_invalid', problems, target);
    if (json === invalidJsonParse) {
      return null;
    }
    if (!isPlainRecord(json)) {
      problems.push(
        problem('entry_descriptor_invalid', 'error', 'entry.json must contain a JSON object', {
          ...target,
          path: file.path,
        }),
      );
      return null;
    }

    const descriptorTarget = { ...target, path: file.path };
    const allowedKeys = new Set([
      '$schema',
      'schemaVersion',
      'key',
      'title',
      'description',
      'category',
      'icon',
      'tags',
      'sort',
      'settings',
      'settingsSchema',
    ]);
    for (const key of Object.keys(json)) {
      if (!allowedKeys.has(key)) {
        problems.push(
          problem(
            'entry_descriptor_unknown_field',
            'error',
            `entry.json field "${key}" is not supported`,
            descriptorTarget,
          ),
        );
      }
    }

    if (json.schemaVersion !== LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION) {
      problems.push(
        problem(
          typeof json.schemaVersion === 'undefined'
            ? 'entry_descriptor_schema_version_required'
            : 'entry_descriptor_schema_version_unsupported',
          'error',
          `entry.json schemaVersion must be ${LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION}`,
          descriptorTarget,
        ),
      );
    }
    if (typeof json.$schema !== 'undefined' && json.$schema !== LIGHT_EXTENSION_ENTRY_SCHEMA_URL) {
      problems.push(
        problem(
          'entry_descriptor_schema_url_unsupported',
          'error',
          `entry.json $schema must be "${LIGHT_EXTENSION_ENTRY_SCHEMA_URL}"`,
          descriptorTarget,
        ),
      );
    }
    const key = requiredSlugField(json, 'key', problems, descriptorTarget);
    const hasSettings = Object.prototype.hasOwnProperty.call(json, 'settings');
    const hasLegacySettingsSchema = Object.prototype.hasOwnProperty.call(json, 'settingsSchema');
    if (hasSettings && hasLegacySettingsSchema) {
      problems.push(
        problem(
          'entry_descriptor_settings_conflict',
          'error',
          'entry.json must not define both settings and settingsSchema',
          descriptorTarget,
        ),
      );
    }
    const settingsSchema = hasSettings
      ? this.validateSettings(json.settings, problems, descriptorTarget)
      : this.validateLegacySettingsSchema(json.settingsSchema, problems, descriptorTarget);
    if (!key) {
      return null;
    }

    return {
      key,
      title: optionalStringField(json, 'title', problems, descriptorTarget, 120),
      description: optionalStringField(json, 'description', problems, descriptorTarget, 1000),
      category: optionalSlugField(json, 'category', problems, descriptorTarget),
      icon: optionalStringField(json, 'icon', problems, descriptorTarget, 120),
      tags: optionalStringArrayField(json, 'tags', problems, descriptorTarget),
      sort: optionalIntegerField(json, 'sort', problems, descriptorTarget),
      settingsSchema,
    };
  }

  private validateSettings(
    value: unknown,
    problems: LightExtensionValidatorProblem[],
    target: ProblemTarget,
  ): Record<string, unknown> | null {
    if (typeof value === 'undefined') {
      return null;
    }
    if (!isPlainRecord(value)) {
      problems.push(
        problem('settings_schema_invalid', 'error', 'entry.json settings must be a field definition object', target),
      );
      return null;
    }

    const rootSchema = buildLightExtensionSettingsSchema(value);
    const properties = isPlainRecord(rootSchema.properties) ? rootSchema.properties : {};
    const required = Array.isArray(rootSchema.required)
      ? rootSchema.required.filter((item): item is string => typeof item === 'string')
      : [];
    const conditionOwners = new Map<string, ConditionOwner>();
    this.validateObjectProperties(
      properties,
      required,
      {
        filePath: target.path || '',
        schemaPath: '$.settings',
        propertyPath: null,
        depth: 0,
        problems,
        target,
        rootSchema,
        conditionOwners,
        insideArray: false,
      },
      target,
      '$.settings',
    );
    this.validateConditionCycles(conditionOwners, problems, target);

    return rootSchema;
  }

  private validateLegacySettingsSchema(
    value: unknown,
    problems: LightExtensionValidatorProblem[],
    target: ProblemTarget,
  ): Record<string, unknown> | null {
    if (typeof value === 'undefined') {
      return null;
    }
    if (!isPlainRecord(value)) {
      problems.push(
        problem('settings_schema_invalid', 'error', 'entry.json settingsSchema must be a JSON object schema', target),
      );
      return null;
    }

    const conditionOwners = new Map<string, ConditionOwner>();
    this.validateSettingsSchemaNode(value, {
      filePath: target.path || '',
      schemaPath: '$.settingsSchema',
      propertyPath: null,
      depth: 0,
      problems,
      target,
      rootSchema: value,
      conditionOwners,
      insideArray: false,
    });
    this.validateConditionCycles(conditionOwners, problems, target);

    return value;
  }

  private parseJson(
    file: NormalizedSourceFile,
    code: string,
    problems: LightExtensionValidatorProblem[],
    target: Omit<ProblemTarget, 'path'>,
  ): unknown {
    if (file.size > this.capabilities.limits.maxJsonBytes) {
      problems.push(
        problem('json_file_too_large', 'error', 'JSON metadata file is too large', {
          ...target,
          path: file.path,
          details: {
            size: file.size,
            maxJsonBytes: this.capabilities.limits.maxJsonBytes,
          },
        }),
      );
      return invalidJsonParse;
    }

    try {
      return JSON.parse(file.content);
    } catch (error) {
      problems.push(
        problem(code, 'error', error instanceof Error ? error.message : 'Invalid JSON', {
          ...target,
          path: file.path,
        }),
      );
      return invalidJsonParse;
    }
  }

  private validateSettingsSchemaNode(node: Record<string, unknown>, input: SettingsSchemaValidationInput): void {
    const keywordSet = new Set<string>(this.capabilities.schemaSubset.allowedKeywords);
    const schemaTarget = { ...input.target, path: input.filePath };

    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.problems.push(
        problem('settings_schema_too_deep', 'error', 'entry.json settings schema is too deeply nested', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
            maxDepth: this.capabilities.limits.maxSettingsSchemaDepth,
          },
        }),
      );
      return;
    }

    for (const key of Object.keys(node)) {
      if (!keywordSet.has(key)) {
        input.problems.push(
          problem(
            'settings_schema_keyword_not_allowed',
            'error',
            `entry.json settings schema keyword "${key}" is not supported`,
            {
              ...schemaTarget,
              details: { schemaPath: input.schemaPath, keyword: key },
            },
          ),
        );
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (typeof child === 'string' && containsExpressionSyntax(child)) {
        input.problems.push(
          problem(
            'settings_expression_not_allowed',
            'error',
            'entry.json settings schema expressions are not supported',
            {
              ...schemaTarget,
              details: { schemaPath: `${input.schemaPath}.${key}`, keyword: key },
            },
          ),
        );
      }
    }
    for (const key of ['default', 'enum', 'x-component-props'] as const) {
      const child = node[key];
      if (Array.isArray(child) || isPlainRecord(child)) {
        this.validateSettingsSchemaValue(child, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }

    if (typeof node.type !== 'undefined') {
      if (typeof node.type !== 'string' || !this.capabilities.schemaSubset.allowedTypes.includes(node.type)) {
        input.problems.push(
          problem('settings_schema_type_not_allowed', 'error', 'entry.json settings schema type is not supported', {
            ...schemaTarget,
            details: { schemaPath: input.schemaPath, type: node.type },
          }),
        );
      }
    }

    validateOptionalString(node, 'title', input.problems, schemaTarget);
    validateOptionalString(node, 'description', input.problems, schemaTarget);
    validateOptionalString(node, 'format', input.problems, schemaTarget);
    validateOptionalNonNegativeInteger(node, 'minLength', input.problems, schemaTarget);
    validateOptionalNonNegativeInteger(node, 'maxLength', input.problems, schemaTarget);
    validateOptionalNumber(node, 'minimum', input.problems, schemaTarget);
    validateOptionalNumber(node, 'maximum', input.problems, schemaTarget);

    if (typeof node['x-component'] !== 'undefined') {
      if (
        typeof node['x-component'] !== 'string' ||
        !this.capabilities.xComponentWhitelist.includes(node['x-component'])
      ) {
        input.problems.push(
          problem(
            'settings_x_component_not_allowed',
            'error',
            'entry.json settings schema x-component is not allowed',
            {
              ...schemaTarget,
              details: { schemaPath: input.schemaPath, component: node['x-component'] },
            },
          ),
        );
      }
    }
    if (typeof node['x-component-props'] !== 'undefined') {
      if (!isPlainRecord(node['x-component-props'])) {
        input.problems.push(
          problem('settings_field_invalid', 'error', 'entry.json x-component-props must be an object', {
            ...schemaTarget,
            details: { schemaPath: `${input.schemaPath}.x-component-props` },
          }),
        );
      } else if (Object.keys(node['x-component-props']).length > 64) {
        input.problems.push(
          problem('settings_field_invalid', 'error', 'entry.json x-component-props contains too many properties', {
            ...schemaTarget,
            details: { schemaPath: `${input.schemaPath}.x-component-props`, maxProperties: 64 },
          }),
        );
      }
    }

    const required = this.validateRequired(node, input, schemaTarget);
    if (typeof node.enum !== 'undefined' && !Array.isArray(node.enum)) {
      input.problems.push(
        problem('settings_enum_invalid', 'error', 'entry.json settings schema enum must be an array', {
          ...schemaTarget,
          details: { schemaPath: input.schemaPath },
        }),
      );
    }

    if (typeof node['x-visible-when'] !== 'undefined') {
      this.validateVisibleCondition(node['x-visible-when'], input, schemaTarget);
    }

    if (typeof node.properties !== 'undefined') {
      if (!isPlainRecord(node.properties)) {
        input.problems.push(
          problem('settings_properties_invalid', 'error', 'entry.json settings schema properties must be an object', {
            ...schemaTarget,
            details: { schemaPath: input.schemaPath },
          }),
        );
      } else {
        this.validateObjectProperties(node.properties, required, input, schemaTarget);
      }
    }

    if (typeof node.items !== 'undefined') {
      if (!isPlainRecord(node.items)) {
        input.problems.push(
          problem('settings_items_invalid', 'error', 'entry.json settings schema items must be a schema object', {
            ...schemaTarget,
            details: { schemaPath: input.schemaPath },
          }),
        );
      } else {
        this.validateSettingsSchemaNode(node.items, {
          ...input,
          schemaPath: `${input.schemaPath}.items`,
          propertyPath: null,
          depth: input.depth + 1,
          insideArray: true,
        });
      }
    }
  }

  private validateRequired(
    node: Record<string, unknown>,
    input: SettingsSchemaValidationInput,
    schemaTarget: ProblemTarget,
  ): string[] {
    if (typeof node.required === 'undefined') {
      return [];
    }
    if (
      !Array.isArray(node.required) ||
      node.required.some((item) => typeof item !== 'string' || !settingsPropertyPattern.test(item))
    ) {
      input.problems.push(
        problem('settings_required_invalid', 'error', 'entry.json settings schema required must be a property array', {
          ...schemaTarget,
          details: { schemaPath: input.schemaPath },
        }),
      );
      return [];
    }
    if (new Set(node.required).size !== node.required.length) {
      input.problems.push(
        problem(
          'settings_required_invalid',
          'error',
          'entry.json settings schema required must not contain duplicates',
          {
            ...schemaTarget,
            details: { schemaPath: input.schemaPath },
          },
        ),
      );
      return [];
    }
    return [...node.required];
  }

  private validateObjectProperties(
    properties: Record<string, unknown>,
    required: string[],
    input: SettingsSchemaValidationInput,
    schemaTarget: ProblemTarget,
    propertiesSchemaPath = `${input.schemaPath}.properties`,
  ): void {
    for (const requiredProperty of required) {
      if (!Object.prototype.hasOwnProperty.call(properties, requiredProperty)) {
        input.problems.push(
          problem('settings_required_invalid', 'error', 'entry.json settings schema required property is not defined', {
            ...schemaTarget,
            details: { schemaPath: `${input.schemaPath}.required`, propertyName: requiredProperty },
          }),
        );
      }
    }

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      const propertySchemaPath = `${propertiesSchemaPath}.${propertyName}`;
      if (!settingsPropertyPattern.test(propertyName) || unsafePathSegments.has(propertyName)) {
        input.problems.push(
          problem('settings_property_name_invalid', 'error', 'entry.json settings property name is invalid', {
            ...schemaTarget,
            details: { schemaPath: propertySchemaPath, propertyName },
          }),
        );
        continue;
      }
      if (!isPlainRecord(propertySchema)) {
        input.problems.push(
          problem('settings_property_schema_invalid', 'error', 'entry.json settings field schema must be an object', {
            ...schemaTarget,
            details: { schemaPath: propertySchemaPath },
          }),
        );
        continue;
      }

      if (required.includes(propertyName) && typeof propertySchema['x-visible-when'] !== 'undefined') {
        if (
          !Object.prototype.hasOwnProperty.call(propertySchema, 'default') ||
          !isValueValidForSchema(propertySchema.default, propertySchema)
        ) {
          input.problems.push(
            problem(
              'settings_condition_required_default_missing',
              'error',
              'Required conditional settings property must define a valid default',
              {
                ...schemaTarget,
                details: { schemaPath: `${propertySchemaPath}.default`, propertyName },
              },
            ),
          );
        }
      }

      this.validateSettingsSchemaNode(propertySchema, {
        ...input,
        schemaPath: propertySchemaPath,
        propertyPath: input.propertyPath ? `${input.propertyPath}.${propertyName}` : propertyName,
        depth: input.depth + 1,
      });
    }
  }

  private validateVisibleCondition(
    value: unknown,
    input: SettingsSchemaValidationInput,
    schemaTarget: ProblemTarget,
  ): void {
    const conditionSchemaPath = `${input.schemaPath}.x-visible-when`;
    if (!input.propertyPath || input.insideArray) {
      input.problems.push(
        problem('settings_condition_invalid', 'error', 'x-visible-when is only allowed on object properties', {
          ...schemaTarget,
          details: { schemaPath: conditionSchemaPath },
        }),
      );
      return;
    }

    const references = new Set<string>();
    const state: ConditionComplexityState = { nodes: 0, tooComplexPaths: new Set() };
    this.validateConditionNode(value, {
      ownerPath: input.propertyPath,
      schemaPath: conditionSchemaPath,
      depth: 1,
      references,
      state,
      input,
      schemaTarget,
    });
    input.conditionOwners.set(input.propertyPath, { schemaPath: conditionSchemaPath, references });
  }

  private validateConditionNode(
    value: unknown,
    context: {
      ownerPath: string;
      schemaPath: string;
      depth: number;
      references: Set<string>;
      state: ConditionComplexityState;
      input: SettingsSchemaValidationInput;
      schemaTarget: ProblemTarget;
    },
  ): void {
    context.state.nodes += 1;
    if (
      context.depth > this.capabilities.conditions.limits.maxDepth ||
      context.state.nodes > this.capabilities.conditions.limits.maxNodes
    ) {
      this.pushConditionTooComplex(context);
      return;
    }
    if (!isPlainRecord(value)) {
      this.pushConditionDiagnostic('settings_condition_invalid', 'Settings condition must be an object', context);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(value, 'logic')) {
      this.validateConditionGroup(value, context);
      return;
    }
    this.validateConditionLeaf(value, context);
  }

  private validateConditionGroup(
    value: Record<string, unknown>,
    context: Parameters<LightExtensionSchemaValidator['validateConditionNode']>[1],
  ): void {
    if (Object.keys(value).some((key) => key !== 'logic' && key !== 'items')) {
      this.pushConditionDiagnostic(
        'settings_condition_invalid',
        'Settings condition group contains unknown fields',
        context,
      );
    }
    if (typeof value.logic !== 'string' || !this.capabilities.conditions.logic.includes(value.logic)) {
      this.pushConditionDiagnostic('settings_condition_invalid', 'Settings condition logic is not supported', context);
      return;
    }
    if (!Array.isArray(value.items)) {
      this.pushConditionDiagnostic(
        'settings_condition_invalid',
        'Settings condition group items must be an array',
        context,
      );
      return;
    }
    if (value.items.length > this.capabilities.conditions.limits.maxItemsPerGroup) {
      this.pushConditionTooComplex(context);
      return;
    }

    value.items.forEach((item, index) => {
      this.validateConditionNode(item, {
        ...context,
        schemaPath: `${context.schemaPath}.items[${index}]`,
        depth: context.depth + 1,
      });
    });
  }

  private validateConditionLeaf(
    value: Record<string, unknown>,
    context: Parameters<LightExtensionSchemaValidator['validateConditionNode']>[1],
  ): void {
    if (Object.keys(value).some((key) => key !== 'path' && key !== 'operator' && key !== 'value')) {
      this.pushConditionDiagnostic(
        'settings_condition_invalid',
        'Settings condition leaf contains unknown fields',
        context,
      );
    }
    if (typeof value.operator !== 'string' || !this.capabilities.conditions.operators.includes(value.operator)) {
      this.pushConditionDiagnostic(
        'settings_condition_operator_not_allowed',
        'Settings condition operator is not supported',
        context,
      );
      return;
    }
    if (typeof value.path !== 'string' || !value.path) {
      this.pushConditionDiagnostic('settings_condition_invalid', 'Settings condition path must be a string', context);
      return;
    }

    const pathResult = validateConditionPath(
      context.input.rootSchema,
      value.path,
      this.capabilities.conditions.limits.maxPathSegments,
    );
    if (pathResult) {
      this.pushConditionDiagnostic(pathResult.code, pathResult.message, context, { conditionPath: value.path });
    } else {
      context.references.add(value.path);
      if (value.path === context.ownerPath || value.path.startsWith(`${context.ownerPath}.`)) {
        this.pushConditionDiagnostic(
          'settings_condition_cycle',
          'Settings property visibility cannot depend on itself or its subtree',
          context,
          { conditionPath: value.path },
        );
      }
    }

    const hasValue = Object.prototype.hasOwnProperty.call(value, 'value');
    if (value.operator === '$empty' || value.operator === '$notEmpty') {
      if (hasValue) {
        this.pushConditionDiagnostic(
          'settings_condition_value_invalid',
          `${value.operator} must not define a value`,
          context,
        );
      }
      return;
    }
    if (!hasValue) {
      this.pushConditionDiagnostic('settings_condition_value_invalid', 'Settings condition value is required', context);
      return;
    }
    if ((value.operator === '$in' || value.operator === '$notIn') && !Array.isArray(value.value)) {
      this.pushConditionDiagnostic(
        'settings_condition_value_invalid',
        `${value.operator} condition value must be an array`,
        context,
      );
    }
    if (containsExpressionValue(value.value)) {
      this.pushConditionDiagnostic(
        'settings_condition_value_invalid',
        'Settings condition value must not contain expression syntax',
        context,
      );
    }
    if (containsUnsafeObjectKey(value.value)) {
      this.pushConditionDiagnostic(
        'settings_condition_value_invalid',
        'Settings condition value contains an unsafe object key',
        context,
      );
    }
  }

  private pushConditionTooComplex(
    context: Parameters<LightExtensionSchemaValidator['validateConditionNode']>[1],
  ): void {
    if (context.state.tooComplexPaths.has(context.schemaPath)) {
      return;
    }
    context.state.tooComplexPaths.add(context.schemaPath);
    this.pushConditionDiagnostic(
      'settings_condition_too_complex',
      'Settings condition exceeds the supported complexity limits',
      context,
    );
  }

  private pushConditionDiagnostic(
    code: string,
    message: string,
    context: Parameters<LightExtensionSchemaValidator['validateConditionNode']>[1],
    details: Record<string, unknown> = {},
  ): void {
    context.input.problems.push(
      problem(code, 'error', message, {
        ...context.schemaTarget,
        details: { schemaPath: context.schemaPath, ...details },
      }),
    );
  }

  private validateConditionCycles(
    owners: Map<string, ConditionOwner>,
    problems: LightExtensionValidatorProblem[],
    target: ProblemTarget,
  ): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stack: string[] = [];
    const diagnosed = new Set<string>();

    const visit = (ownerPath: string) => {
      if (visited.has(ownerPath)) {
        return;
      }
      visiting.add(ownerPath);
      stack.push(ownerPath);
      for (const reference of owners.get(ownerPath)?.references || []) {
        if (!owners.has(reference)) {
          continue;
        }
        if (visiting.has(reference)) {
          const cycleStart = stack.indexOf(reference);
          for (const cyclePath of stack.slice(cycleStart)) {
            if (diagnosed.has(cyclePath)) {
              continue;
            }
            diagnosed.add(cyclePath);
            problems.push(
              problem('settings_condition_cycle', 'error', 'Settings visibility conditions contain a cycle', {
                ...target,
                details: { schemaPath: owners.get(cyclePath)?.schemaPath, propertyPath: cyclePath },
              }),
            );
          }
        } else {
          visit(reference);
        }
      }
      stack.pop();
      visiting.delete(ownerPath);
      visited.add(ownerPath);
    };

    for (const ownerPath of owners.keys()) {
      visit(ownerPath);
    }
  }

  private validateSettingsSchemaValue(value: unknown, input: SettingsSchemaValidationInput): void {
    const schemaTarget = { ...input.target, path: input.filePath };
    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.problems.push(
        problem('settings_schema_too_deep', 'error', 'entry.json settings schema is too deeply nested', {
          ...schemaTarget,
          details: { schemaPath: input.schemaPath, maxDepth: this.capabilities.limits.maxSettingsSchemaDepth },
        }),
      );
      return;
    }
    if (typeof value === 'string') {
      if (containsExpressionSyntax(value)) {
        input.problems.push(
          problem(
            'settings_expression_not_allowed',
            'error',
            'entry.json settings schema expressions are not supported',
            {
              ...schemaTarget,
              details: { schemaPath: input.schemaPath },
            },
          ),
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateSettingsSchemaValue(item, {
          ...input,
          schemaPath: `${input.schemaPath}[${index}]`,
          depth: input.depth + 1,
        });
      });
      return;
    }
    if (isPlainRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (unsafePathSegments.has(key)) {
          input.problems.push(
            problem('settings_field_invalid', 'error', 'Unsafe settings object key is not allowed', {
              ...schemaTarget,
              details: { schemaPath: `${input.schemaPath}.${key}` },
            }),
          );
          continue;
        }
        this.validateSettingsSchemaValue(child, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }
  }
}

function validateConditionPath(
  rootSchema: Record<string, unknown>,
  path: string,
  maxPathSegments: number,
): { code: string; message: string } | null {
  const segments = path.split('.');
  if (segments.length > maxPathSegments) {
    return { code: 'settings_condition_too_complex', message: 'Settings condition path has too many segments' };
  }
  if (segments.some((segment) => unsafePathSegments.has(segment))) {
    return { code: 'settings_condition_path_unsafe', message: 'Settings condition path contains an unsafe segment' };
  }
  if (segments.some((segment) => !settingsPropertyPattern.test(segment))) {
    return { code: 'settings_condition_invalid', message: 'Settings condition path is invalid' };
  }

  let current: Record<string, unknown> = rootSchema;
  for (const segment of segments) {
    if (current.type === 'array' || (typeof current.type !== 'undefined' && current.type !== 'object')) {
      return {
        code: 'settings_condition_path_not_found',
        message: 'Settings condition path may only traverse object properties',
      };
    }
    if (!isPlainRecord(current.properties) || !isPlainRecord(current.properties[segment])) {
      return { code: 'settings_condition_path_not_found', message: 'Settings condition path does not exist' };
    }
    current = current.properties[segment] as Record<string, unknown>;
  }
  return null;
}

function isValueValidForSchema(value: unknown, schema: Record<string, unknown>): boolean {
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => strictJsonEqual(item, value))) {
    return false;
  }
  const schemaType =
    typeof schema.type === 'string'
      ? schema.type
      : isPlainRecord(schema.properties)
        ? 'object'
        : isPlainRecord(schema.items)
          ? 'array'
          : undefined;
  switch (schemaType) {
    case 'string':
      return (
        typeof value === 'string' &&
        (typeof schema.minLength !== 'number' || value.length >= schema.minLength) &&
        (typeof schema.maxLength !== 'number' || value.length <= schema.maxLength) &&
        isValidStringFormat(schema.format, value)
      );
    case 'number':
      return isNumberWithinBounds(value, schema, false);
    case 'integer':
      return isNumberWithinBounds(value, schema, true);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return (
        Array.isArray(value) &&
        (!isPlainRecord(schema.items) ||
          value.every((item) => isValueValidForSchema(item, schema.items as Record<string, unknown>)))
      );
    case 'object':
      return isObjectValueValid(value, schema);
    case undefined:
      return isJsonValue(value);
    default:
      return false;
  }
}

function isObjectValueValid(value: unknown, schema: Record<string, unknown>): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  const properties = isPlainRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === 'string')
    : [];
  if (required.some((propertyName) => !Object.prototype.hasOwnProperty.call(value, propertyName))) {
    return false;
  }
  return Object.entries(value).every(
    ([propertyName, propertyValue]) =>
      Object.prototype.hasOwnProperty.call(properties, propertyName) &&
      isPlainRecord(properties[propertyName]) &&
      isValueValidForSchema(propertyValue, properties[propertyName] as Record<string, unknown>),
  );
}

function isNumberWithinBounds(value: unknown, schema: Record<string, unknown>, integer: boolean): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    (!integer || Number.isInteger(value)) &&
    (typeof schema.minimum !== 'number' || value >= schema.minimum) &&
    (typeof schema.maximum !== 'number' || value <= schema.maximum)
  );
}

function strictJsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => strictJsonEqual(item, right[index]))
    );
  }
  if (!isPlainRecord(left) || !isPlainRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && strictJsonEqual(left[key], right[key]))
  );
}

function isJsonValue(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  return (
    isPlainRecord(value) &&
    Object.entries(value).every(([key, child]) => !unsafePathSegments.has(key) && isJsonValue(child))
  );
}

function containsExpressionValue(value: unknown): boolean {
  if (typeof value === 'string') return containsExpressionSyntax(value);
  if (Array.isArray(value)) return value.some(containsExpressionValue);
  return isPlainRecord(value) && Object.values(value).some(containsExpressionValue);
}

function containsUnsafeObjectKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsUnsafeObjectKey);
  return (
    isPlainRecord(value) &&
    Object.entries(value).some(([key, child]) => unsafePathSegments.has(key) || containsUnsafeObjectKey(child))
  );
}

function isValidStringFormat(format: unknown, value: string): boolean {
  if (typeof format !== 'string') return true;
  if (format === 'date') {
    return /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }
  if (format === 'date-time') return !Number.isNaN(Date.parse(value));
  if (format === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
  if (format === 'time') return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/u.test(value);
  if (format === 'uri' || format === 'url') {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }
  return true;
}

function containsExpressionSyntax(value: string): boolean {
  return value.includes('{{') || value.includes('}}') || value.includes('${');
}

function optionalStringField(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
  maxLength: number,
): string | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) return null;
  if (typeof value !== 'string') {
    problems.push(
      problem('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a string`, target),
    );
    return null;
  }
  if (value.length > maxLength) {
    problems.push(problem('entry_descriptor_field_too_long', 'error', `entry.json field "${key}" is too long`, target));
    return null;
  }
  return value;
}

function optionalSlugField(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): string | null {
  const value = optionalStringField(record, key, problems, target, 80);
  if (value && !isValidEntryName(value)) {
    problems.push(
      problem('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a slug`, target),
    );
    return null;
  }
  return value;
}

function optionalStringArrayField(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): string[] | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) return null;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    problems.push(
      problem('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be a string array`, target),
    );
    return null;
  }
  if (value.length > 20) {
    problems.push(
      problem('entry_descriptor_field_too_large', 'error', `entry.json field "${key}" has too many items`, target),
    );
    return null;
  }
  return value;
}

function optionalIntegerField(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): number | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    problems.push(
      problem('entry_descriptor_field_invalid', 'error', `entry.json field "${key}" must be an integer`, target),
    );
    return null;
  }
  return value;
}

function validateOptionalString(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'string') {
    problems.push(
      problem('settings_field_invalid', 'error', `entry.json settings schema field "${key}" must be a string`, target),
    );
  }
}

function validateOptionalNumber(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'number') {
    problems.push(
      problem('settings_field_invalid', 'error', `entry.json settings schema field "${key}" must be a number`, target),
    );
  }
}

function validateOptionalNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): void {
  const value = record[key];
  if (typeof value !== 'undefined' && (typeof value !== 'number' || !Number.isInteger(value) || value < 0)) {
    problems.push(
      problem(
        'settings_field_invalid',
        'error',
        `entry.json settings schema field "${key}" must be a non-negative integer`,
        target,
      ),
    );
  }
}

function requiredSlugField(
  record: Record<string, unknown>,
  key: string,
  problems: LightExtensionValidatorProblem[],
  target: ProblemTarget,
): string | null {
  if (typeof record[key] === 'undefined' || record[key] === null || record[key] === '') {
    problems.push(problem('entry_descriptor_key_required', 'error', 'entry.json field "key" is required', target));
    return null;
  }
  return optionalSlugField(record, key, problems, target);
}
