/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { collectNormalizedProviderCapabilities, type FlowSurfaceCapabilityRegistryLike } from './capability-registry';
import { callFlowSurfaceProvider } from './capability-provider-executor';
import { resolveJsonCreateRecipe } from './capability-recipe';
import { FlowSurfaceContractGuard } from './contract-guard';
import { FlowSurfaceBadRequestError, FlowSurfaceAggregateError, type FlowSurfaceErrorItemInput } from './errors';
import { validateFlowSurfacePayloadShape } from './payload-shape';
import type {
  FlowSurfaceCapabilityValidationError,
  FlowSurfaceDynamicCapabilityCreateActionName,
  FlowSurfaceDynamicCapabilityCreateResponse,
  FlowSurfaceDynamicCapabilityCreateValues,
  FlowSurfaceDynamicCapabilityPublicInput,
  FlowSurfaceJsonSchema,
  FlowSurfaceNodeSpec,
  FlowSurfaceProviderCreateContext,
} from './types';

const DYNAMIC_FORBIDDEN_PUBLIC_KEYS = new Set([
  'capabilityId',
  'modelUse',
  'use',
  'props',
  'decoratorProps',
  'stepParams',
  'flowRegistry',
  'createModelOptions',
  'defaultNode',
  'lens',
  'implementation',
]);

const DYNAMIC_INTERNAL_PROVIDER_TOKENS = new Set([
  ...DYNAMIC_FORBIDDEN_PUBLIC_KEYS,
  'resourceSettings',
  'tableSettings',
  'cardSettings',
  'buttonSettings',
  'formModelSettings',
  'eventSettings',
  'pageSettings',
  'pageTabSettings',
  'ganttSettings',
  'formSettings',
  'detailsSettings',
  'calendarSettings',
  'treeSettings',
  'kanbanSettings',
  'listSettings',
  'gridCardSettings',
  'markdownBlockSettings',
  'iframeBlockSettings',
  'chartSettings',
  'commentsSettings',
  'recordHistorySettings',
  'tableColumnSettings',
  'createModelOptions',
  'subModels',
  'nodeTemplate',
]);

type ResolveDynamicCapabilityCreateOptions = FlowSurfaceDynamicCapabilityCreateValues & {
  enabledPackages: ReadonlySet<string>;
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  providerTimeoutMs?: number;
  actionName?: FlowSurfaceDynamicCapabilityCreateActionName;
};

const PROVIDER_VALIDATION_ERROR_CODES = new Set<FlowSurfaceCapabilityValidationError['code']>([
  'required',
  'invalid-type',
  'invalid-enum',
  'unknown-field',
  'collection-not-found',
  'field-not-found',
  'field-interface-mismatch',
  'target-not-allowed',
  'provider-error',
  'contract-guard-failed',
  'unsupported',
]);

export async function resolveDynamicCapabilityCreate(
  input: ResolveDynamicCapabilityCreateOptions,
): Promise<FlowSurfaceDynamicCapabilityCreateResponse> {
  const kind = input.kind || 'block';
  if (kind !== 'block') {
    throw new FlowSurfaceBadRequestError(`flowSurfaces dynamic create only supports block capabilities in this slice`);
  }
  const publicType = normalizeRequiredString(input.publicType);
  if (!publicType) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces dynamic create requires publicType`, undefined, {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'registry',
        path: 'publicType',
      },
    });
  }

  const publicInput: FlowSurfaceDynamicCapabilityPublicInput = {
    initParams: normalizeOptionalObject(input.initParams, 'initParams'),
    settings: normalizeOptionalObject(input.settings, 'settings'),
  };
  if (input.rawPublicPayload) {
    assertPublicPayloadDoesNotContainInternalKeys(input.rawPublicPayload);
  }
  const publicPayload = {
    publicType,
    ...(input.target ? { target: input.target } : {}),
    ...(publicInput.initParams ? { initParams: publicInput.initParams } : {}),
    ...(publicInput.settings ? { settings: publicInput.settings } : {}),
  };
  assertPublicPayloadDoesNotContainInternalKeys(publicPayload);

  const providerCapability = (
    await collectNormalizedProviderCapabilities({
      providerRegistry: input.providerRegistry,
      enabledPackages: input.enabledPackages,
      providerTimeoutMs: input.providerTimeoutMs,
    })
  ).find((item) => {
    if (item.publicItem.kind !== kind || item.publicItem.publicType !== publicType) {
      return false;
    }
    return input.ownerPlugin ? item.publicItem.ownerPlugin === input.ownerPlugin : true;
  });

  if (!providerCapability) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces dynamic create capability '${publicType}' is not supported`,
      undefined,
      {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          publicType,
        },
      },
    );
  }
  const resolveCreate = providerCapability.provider.resolveCreate;
  if (!resolveCreate && !providerCapability.createRecipe) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces dynamic create capability '${publicType}' does not declare a create resolver`,
      undefined,
      {
        details: {
          reasonCode: 'missing-create-contract',
          reasonSource: 'registry',
          publicType,
        },
      },
    );
  }
  if (!input.allowUnavailable && !providerCapability.publicItem.availability.create.supported) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces dynamic create capability '${publicType}' is not enabled for writes`,
      undefined,
      {
        details: {
          reasonCode: providerCapability.publicItem.availability.create.reasonCode || 'unsupported',
          reasonSource: providerCapability.publicItem.availability.create.reasonSource || 'registry',
          publicType,
        },
      },
    );
  }

  const validationErrors = [
    ...validateJsonObjectSchema(
      providerCapability.publicItem.initParamsSchema,
      publicInput.initParams || {},
      'initParams',
    ),
    ...validateJsonObjectSchema(providerCapability.publicItem.settingsSchema, publicInput.settings || {}, 'settings'),
  ];
  if (validationErrors.length) {
    throwCapabilityValidationErrors(validationErrors);
  }

  const ctx: FlowSurfaceProviderCreateContext = {
    actionName: input.actionName || 'validateCapabilityCreate',
    enabledPlugins: input.enabledPackages,
    ...(input.target ? { target: input.target } : {}),
  };
  const runtimeCapability = {
    publicItem: providerCapability.publicItem,
    implementation: providerCapability.implementation,
  };

  const validateSettings = providerCapability.provider.validateSettings;
  if (validateSettings) {
    const validation = await callFlowSurfaceProvider({
      provider: providerCapability.provider,
      method: 'validateSettings',
      capabilityId: providerCapability.publicItem.identity?.capabilityId,
      timeoutMs: input.providerTimeoutMs,
      run: () => validateSettings(runtimeCapability, publicInput, ctx),
    });
    if (validation.ok === false) {
      throwCapabilityValidationErrors([
        {
          path: 'settings',
          code: 'provider-error',
          message: sanitizeProviderPublicMessage(validation.message, 'provider validateSettings failed'),
        },
      ]);
    }
    if (!validation.value.ok) {
      throwCapabilityValidationErrors(
        normalizeProviderValidationErrors(validation.value.errors, {
          initParamsSchema: providerCapability.publicItem.initParamsSchema,
          settingsSchema: providerCapability.publicItem.settingsSchema,
        }),
      );
    }
  }

  let createdNode: FlowSurfaceNodeSpec;
  if (providerCapability.createRecipe) {
    createdNode = resolveJsonCreateRecipe({
      recipe: providerCapability.createRecipe,
      publicInput,
    });
  } else {
    const providerResolveCreate = resolveCreate;
    if (!providerResolveCreate) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces dynamic create capability '${publicType}' does not declare a create resolver`,
        undefined,
        {
          details: {
            reasonCode: 'missing-create-contract',
            reasonSource: 'registry',
            publicType,
          },
        },
      );
    }
    const created = await callFlowSurfaceProvider({
      provider: providerCapability.provider,
      method: 'resolveCreate',
      capabilityId: providerCapability.publicItem.identity?.capabilityId,
      timeoutMs: input.providerTimeoutMs,
      run: () => providerResolveCreate(runtimeCapability, publicInput, ctx),
    });
    if (created.ok === false) {
      throwCapabilityValidationErrors([
        {
          path: 'settings',
          code: 'provider-error',
          message: sanitizeProviderPublicMessage(created.message, 'provider resolveCreate failed'),
        },
      ]);
    }
    createdNode = created.value;
  }

  try {
    validateFlowSurfacePayloadShape(ctx.actionName, createdNode, 'node');
    new FlowSurfaceContractGuard().validateNodeTreeAgainstContract(createdNode);
  } catch (error) {
    const message = sanitizeProviderPublicMessage(
      error instanceof Error ? error.message : '',
      'generated node failed contract guard',
    );
    throwCapabilityValidationErrors([
      {
        path: 'settings',
        code: 'contract-guard-failed',
        message,
      },
    ]);
  }

  return {
    capability: providerCapability.publicItem,
    publicPayload,
    node: createdNode,
    warnings: providerCapability.publicItem.warnings || [],
  };
}

function normalizeRequiredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalObject(value: unknown, path: string) {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (!_.isPlainObject(value)) {
    throwCapabilityValidationErrors([
      {
        path,
        code: 'invalid-type',
        message: `${path} must be an object`,
      },
    ]);
  }
  return value as Record<string, unknown>;
}

function assertPublicPayloadDoesNotContainInternalKeys(payload: Record<string, unknown>) {
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!_.isPlainObject(value)) {
      return;
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      const childPath = path ? `${path}.${key}` : key;
      if (DYNAMIC_INTERNAL_PROVIDER_TOKENS.has(key)) {
        errors.push({
          path: childPath,
          code: 'unsupported',
          message: `public payload key '${childPath}' is not supported for dynamic capability create`,
        });
      }
      visit(child, childPath);
    });
  };
  visit(payload, '');
  if (errors.length) {
    throwCapabilityValidationErrors(errors);
  }
}

function validateJsonObjectSchema(
  schema: Record<string, unknown> | undefined,
  value: Record<string, unknown>,
  path: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!schema) {
    return Object.keys(value).map((key) => ({
      path: `${path}.${key}`,
      code: 'unknown-field' as const,
      message: `${path}.${key} is not supported`,
    }));
  }
  if (schema.type !== 'object') {
    return [];
  }
  const properties = (_.isPlainObject(schema.properties) ? schema.properties : {}) as Record<
    string,
    FlowSurfaceJsonSchema
  >;
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === 'string')
    : [];
  required.forEach((key) => {
    if (_.isUndefined(value[key])) {
      errors.push({
        path: `${path}.${key}`,
        code: 'required',
        message: `${path}.${key} is required`,
      });
    }
  });
  if (schema.additionalProperties === false) {
    Object.keys(value)
      .filter((key) => !properties[key])
      .forEach((key) => {
        errors.push({
          path: `${path}.${key}`,
          code: 'unknown-field',
          message: `${path}.${key} is not supported`,
        });
      });
  }
  Object.entries(properties).forEach(([key, propertySchema]) => {
    if (_.isUndefined(value[key])) {
      return;
    }
    errors.push(...validateJsonValue(propertySchema, value[key], `${path}.${key}`));
  });
  return errors;
}

function validateJsonValue(
  schema: FlowSurfaceJsonSchema | undefined,
  value: unknown,
  path: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!schema) {
    return [];
  }
  const type = schema.type;
  if (type === 'string' && typeof value !== 'string') {
    return invalidType(path, 'string');
  }
  if (type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    return invalidType(path, 'number');
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    return invalidType(path, 'boolean');
  }
  if (type === 'object' && !_.isPlainObject(value)) {
    return invalidType(path, 'object');
  }
  if (type === 'array' && !Array.isArray(value)) {
    return invalidType(path, 'array');
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    return [
      {
        path,
        code: 'invalid-enum',
        message: `${path} must be one of: ${schema.enum.join(', ')}`,
      },
    ];
  }
  if (typeof value === 'number' && typeof schema.minimum === 'number' && value < schema.minimum) {
    return [
      {
        path,
        code: 'invalid-type',
        message: `${path} must be >= ${schema.minimum}`,
      },
    ];
  }
  if (typeof value === 'number' && typeof schema.maximum === 'number' && value > schema.maximum) {
    return [
      {
        path,
        code: 'invalid-type',
        message: `${path} must be <= ${schema.maximum}`,
      },
    ];
  }
  return [];
}

function invalidType(path: string, expected: string): FlowSurfaceCapabilityValidationError[] {
  return [
    {
      path,
      code: 'invalid-type',
      message: `${path} must be ${expected}`,
    },
  ];
}

function normalizeProviderValidationErrors(
  errors: FlowSurfaceCapabilityValidationError[] | undefined,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
): FlowSurfaceCapabilityValidationError[] {
  if (errors?.length) {
    return errors.map((error) => sanitizeProviderValidationError(error, schemas));
  }
  return [
    {
      path: 'settings',
      code: 'provider-error',
      message: 'provider validateSettings failed',
    },
  ];
}

function sanitizeProviderValidationError(
  error: FlowSurfaceCapabilityValidationError,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
): FlowSurfaceCapabilityValidationError {
  const pathResult = sanitizeProviderValidationPath(error.path, schemas);
  if (!pathResult) {
    return {
      path: 'settings',
      code: 'provider-error',
      message: 'provider validateSettings failed',
    };
  }
  return {
    path: pathResult.path,
    code: PROVIDER_VALIDATION_ERROR_CODES.has(error.code) ? error.code : 'provider-error',
    message: pathResult.truncated
      ? 'provider validateSettings failed'
      : sanitizeProviderPublicMessage(error.message, 'provider validateSettings failed'),
  };
}

function sanitizeProviderValidationPath(
  path: unknown,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
) {
  const normalized = normalizeRequiredString(path);
  if (!normalized || containsUnsafeProviderFragment(normalized)) {
    return '';
  }
  if (normalized === 'settings' || normalized === 'initParams') {
    return {
      path: normalized,
      truncated: false,
    };
  }
  const [root, ...pathSegments] = normalized.split('.');
  const schema =
    root === 'settings' ? schemas.settingsSchema : root === 'initParams' ? schemas.initParamsSchema : undefined;
  const sanitizedPath = sanitizeSchemaPath(schema, pathSegments);
  if (sanitizedPath) {
    return {
      path: [root, ...sanitizedPath.path].join('.'),
      truncated: sanitizedPath.truncated,
    };
  }
  return null;
}

function sanitizeSchemaPath(schema: FlowSurfaceJsonSchema | undefined, path: string[]) {
  if (!schema || schema.type !== 'object' || !path.length) {
    return null;
  }
  const accepted: string[] = [];
  let currentSchema: FlowSurfaceJsonSchema | undefined = schema;
  for (const segment of path) {
    if (!segment || containsUnsafeProviderFragment(segment) || currentSchema?.type !== 'object') {
      return accepted.length
        ? {
            path: accepted,
            truncated: true,
          }
        : null;
    }
    const properties = _.isPlainObject(currentSchema.properties)
      ? (currentSchema.properties as Record<string, FlowSurfaceJsonSchema>)
      : {};
    if (!Object.prototype.hasOwnProperty.call(properties, segment)) {
      return accepted.length
        ? {
            path: accepted,
            truncated: true,
          }
        : null;
    }
    accepted.push(segment);
    currentSchema = properties[segment];
  }
  return {
    path: accepted,
    truncated: false,
  };
}

function sanitizeProviderPublicMessage(message: unknown, fallback: string) {
  const normalized = normalizeRequiredString(message);
  if (!normalized || containsUnsafeProviderFragment(normalized)) {
    return fallback;
  }
  return normalized;
}

function containsUnsafeProviderFragment(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeProviderFragment(item));
  }
  if (_.isPlainObject(value)) {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => containsUnsafeProviderFragment(key) || containsUnsafeProviderFragment(item),
    );
  }
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return false;
  }
  return normalized
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .some((segment) => DYNAMIC_INTERNAL_PROVIDER_TOKENS.has(segment) || /Model$/.test(segment));
}

function throwCapabilityValidationErrors(errors: FlowSurfaceCapabilityValidationError[]): never {
  throw new FlowSurfaceAggregateError(
    errors.map(
      (error): FlowSurfaceErrorItemInput => ({
        message: error.message,
        path: error.path,
        ruleId: error.code,
        details: error.details,
      }),
    ),
  );
}
