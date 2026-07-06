/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { createHash, randomUUID } from 'crypto';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type {
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionPublicationMetadataRecord,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionPublicationRecord,
  publicationFromModel,
  toPublicationMetadata,
} from './LightExtensionPublicationService';

export class LightExtensionPublicationResolveService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
  ) {}

  async getMetadata(
    publicationId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationMetadataRecord> {
    return toPublicationMetadata(await this.getPublication(publicationId, ctx));
  }

  async listMetadataByRepo(
    repoId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationMetadataRecord[]> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'readPublication',
        ctx,
      });
    } catch (error) {
      await this.recordReadDenied(`repo:${repoId}`, { ...ctx, requestId }, error);
      throw error;
    }

    const records = await this.db.getRepository('lightExtensionEntryPublications').find({
      filter: {
        repoId,
      },
      sort: ['entryId', '-createdAt'],
      transaction: ctx.transaction,
    });

    return records.map((record: Model) => toPublicationMetadata(publicationFromModel(record)));
  }

  async getPublication(
    publicationId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationRecord> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'readPublication',
        ctx,
      });
    } catch (error) {
      await this.recordReadDenied(publicationId, { ...ctx, requestId }, error);
      throw error;
    }

    return this.loadPublication(publicationId, ctx);
  }

  async resolveRuntime(
    input: LightExtensionRuntimeResolveInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRuntimeResolveResult> {
    const requestId = ctx.requestId || randomUUID();
    assertRuntimeResolveInput(input);

    const sourceBinding = input.sourceBinding;
    try {
      await this.permissionService.assertActionAllowed({
        action: 'usePublication',
        ctx,
      });
    } catch (error) {
      await this.recordUseDenied(sourceBinding.publicationId, { ...ctx, requestId }, error);
      throw error;
    }

    const publication = await this.loadPublication(sourceBinding.publicationId, ctx);
    assertSourceBindingMatches(sourceBinding, publication);
    await this.assertRuntimeStateAllowsPublication(publication, ctx);
    const settings = resolveSettings(publication, input.settings);

    if (!publication.artifact.code) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        `Light extension publication "${publication.id}" does not contain runtime code`,
      );
    }

    return {
      publicationId: publication.id,
      entryId: publication.entryId,
      runtimeCodeHash: publication.runtimeCodeHash,
      code: publication.artifact.code,
      version: publication.runtimeVersion || publication.artifact.version,
      ...(publication.artifact.sourceMap ? { sourceMap: publication.artifact.sourceMap } : {}),
      settings,
      cache: buildRuntimeCacheMetadata(publication, settings),
    };
  }

  private async loadPublication(
    publicationId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPublicationRecord> {
    const record = await this.db.getRepository('lightExtensionEntryPublications').findOne({
      filterByTk: publicationId,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
        `Light extension publication "${publicationId}" was not found`,
      );
    }

    return publicationFromModel(record);
  }

  private async assertRuntimeStateAllowsPublication(
    publication: LightExtensionPublicationRecord,
    ctx: LightExtensionServiceContext,
  ): Promise<void> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: publication.repoId,
      transaction: ctx.transaction,
    });
    if (!repo) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_REPO_NOT_FOUND',
        `Light extension repository "${publication.repoId}" was not found`,
        {
          details: {
            reasonCode: 'repo_missing',
            repoId: publication.repoId,
            publicationId: publication.id,
          },
        },
      );
    }

    const repoLifecycleStatus = String(repo.get('lifecycleStatus') || '');
    if (repoLifecycleStatus === 'disabled' || repoLifecycleStatus === 'archived') {
      throw runtimeLifecycleError(`Light extension repository lifecycle status is "${repoLifecycleStatus}"`, {
        reasonCode: repoLifecycleStatus === 'disabled' ? 'repo_disabled' : 'repo_archived',
        repoId: publication.repoId,
        entryId: publication.entryId,
        publicationId: publication.id,
        repoLifecycleStatus,
      });
    }

    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: publication.entryId,
      transaction: ctx.transaction,
    });
    if (!entry) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${publication.entryId}" was not found`,
        {
          details: {
            reasonCode: 'entry_missing',
            repoId: publication.repoId,
            entryId: publication.entryId,
            publicationId: publication.id,
          },
        },
      );
    }

    const entryRepoId = String(entry.get('repoId') || '');
    const entryKind = String(entry.get('kind') || '');
    if (entryRepoId !== publication.repoId || entryKind !== publication.kind) {
      throw runtimeLifecycleError('Light extension entry no longer matches the publication snapshot', {
        reasonCode: 'entry_mismatch',
        repoId: publication.repoId,
        entryId: publication.entryId,
        publicationId: publication.id,
        entryRepoId,
        entryKind,
      });
    }

    const entryHealthStatus = String(entry.get('healthStatus') || '');
    if (entryHealthStatus === 'missing' || entryHealthStatus === 'disabled' || entryHealthStatus === 'archived') {
      throw runtimeLifecycleError(`Light extension entry health status is "${entryHealthStatus}"`, {
        reasonCode: entryHealthStatus === 'disabled' ? 'entry_disabled' : 'entry_missing',
        repoId: publication.repoId,
        entryId: publication.entryId,
        publicationId: publication.id,
        entryHealthStatus,
      });
    }
  }

  private async recordReadDenied(
    publicationId: string,
    ctx: LightExtensionServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    try {
      await this.auditService.recordPublicationReadDenied({
        publicationId,
        requestId: ctx.requestId || randomUUID(),
        actorUserId: ctx.actorUserId,
        reasonCode: error.code,
        requestSource: ctx.requestSource,
        transaction: ctx.transaction,
      });
    } catch {
      // Denial must not depend on audit persistence availability.
    }
  }

  private async recordUseDenied(
    publicationId: string,
    ctx: LightExtensionServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    try {
      await this.auditService.recordPublicationUseDenied({
        publicationId,
        requestId: ctx.requestId || randomUUID(),
        actorUserId: ctx.actorUserId,
        reasonCode: error.code,
        requestSource: ctx.requestSource,
        transaction: ctx.transaction,
      });
    } catch {
      // Denial must not depend on audit persistence availability.
    }
  }
}

interface SettingsValidationIssue {
  path: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

function assertRuntimeResolveInput(input: LightExtensionRuntimeResolveInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidInput('Runtime resolve input must be an object');
  }
  if (input.sourceMode !== 'light-extension') {
    throw invalidInput('sourceMode must be "light-extension"');
  }

  const sourceBinding = input.sourceBinding;
  if (!sourceBinding || typeof sourceBinding !== 'object' || Array.isArray(sourceBinding)) {
    throw invalidInput('sourceBinding is required');
  }
  if (sourceBinding.type !== 'light-extension-entry') {
    throw invalidInput('sourceBinding.type must be "light-extension-entry"');
  }
  for (const key of ['publicationId', 'repoId', 'entryId', 'kind'] as const) {
    if (typeof sourceBinding[key] !== 'string' || !sourceBinding[key].trim()) {
      throw invalidInput(`sourceBinding.${key} is required`);
    }
  }

  const versionPolicy = sourceBinding.versionPolicy || 'pinned';
  if (versionPolicy === 'follow-active') {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_VERSION_POLICY_UNSUPPORTED',
      'Light extension follow-active runtime resolution is not available yet',
      {
        details: {
          versionPolicy,
        },
      },
    );
  }
  if (versionPolicy !== 'pinned') {
    throw invalidInput('sourceBinding.versionPolicy must be "pinned"');
  }
  if (
    typeof input.settings !== 'undefined' &&
    input.settings !== null &&
    (!isPlainRecord(input.settings) || Array.isArray(input.settings))
  ) {
    throw invalidInput('settings must be an object');
  }
}

function assertSourceBindingMatches(
  sourceBinding: LightExtensionRuntimeSourceBinding,
  publication: LightExtensionPublicationRecord,
): void {
  const mismatches = [
    buildBindingMismatch('repoId', sourceBinding.repoId, publication.repoId),
    buildBindingMismatch('entryId', sourceBinding.entryId, publication.entryId),
    buildBindingMismatch('kind', sourceBinding.kind, publication.kind),
  ].filter((item): item is { field: string; expected: string; actual: string } => Boolean(item));

  if (!mismatches.length) {
    return;
  }

  throw new LightExtensionError(
    'LIGHT_EXTENSION_BINDING_OUTDATED',
    'Light extension source binding does not match the publication snapshot',
    {
      details: {
        publicationId: publication.id,
        mismatches,
      },
    },
  );
}

function buildBindingMismatch(field: string, expected: string, actual: string) {
  return expected === actual
    ? null
    : {
        field,
        expected,
        actual,
      };
}

function resolveSettings(
  publication: LightExtensionPublicationRecord,
  inputSettings: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const defaults = getSettingsDefaults(publication);
  const settings = mergeSettings(defaults, inputSettings || {});
  const issues: SettingsValidationIssue[] = [];

  if (publication.settingsSchemaSnapshot) {
    validateSettingsValue(publication.settingsSchemaSnapshot, settings, '$', issues);
  }

  if (issues.length) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SETTINGS_INVALID',
      'Light extension publication settings are invalid',
      {
        details: {
          reasonCode: 'settings_invalid',
          publicationId: publication.id,
          settingsSchemaHash: publication.settingsSchemaHash,
          issues,
        },
      },
    );
  }

  return settings;
}

function getSettingsDefaults(publication: LightExtensionPublicationRecord): Record<string, unknown> {
  if (isPlainRecord(publication.settingsDefaultsSnapshot)) {
    return cloneRecord(publication.settingsDefaultsSnapshot);
  }

  const extracted = extractSettingsDefaults(publication.settingsSchemaSnapshot);
  return isPlainRecord(extracted) ? extracted : {};
}

function extractSettingsDefaults(schema: Record<string, unknown> | null): unknown {
  if (!schema) {
    return {};
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
    return cloneJsonValue(schema.default);
  }

  const properties = schema.properties;
  if (!isPlainRecord(properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!isPlainRecord(value)) {
      continue;
    }
    const childDefault = extractSettingsDefaults(value);
    if (
      typeof childDefault !== 'undefined' &&
      !(isPlainRecord(childDefault) && Object.keys(childDefault).length === 0)
    ) {
      defaults[key] = childDefault;
    }
  }

  return defaults;
}

function mergeSettings(defaults: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
  const output = cloneRecord(defaults);

  for (const [key, value] of Object.entries(overrides)) {
    const currentValue = output[key];
    if (isPlainRecord(currentValue) && isPlainRecord(value)) {
      output[key] = mergeSettings(currentValue, value);
    } else {
      output[key] = cloneJsonValue(value);
    }
  }

  return output;
}

function validateSettingsValue(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  const type = typeof schema.type === 'string' ? schema.type : undefined;
  const inferredType = type || inferSchemaType(schema);

  if (inferredType && !matchesSettingsType(value, inferredType)) {
    issues.push({
      path,
      code: 'settings_type_mismatch',
      message: `Expected ${inferredType} settings value`,
      details: {
        expectedType: inferredType,
        actualType: getSettingsValueType(value),
      },
    });
    return;
  }

  validateEnum(schema, value, path, issues);
  if (typeof value === 'string') {
    validateStringSettings(schema, value, path, issues);
    validateStringFormatSettings(schema, value, path, issues);
  }
  if (typeof value === 'number') {
    validateNumberSettings(schema, value, path, issues);
  }
  if (isPlainRecord(value)) {
    validateObjectSettings(schema, value, path, issues);
  }
  if (Array.isArray(value)) {
    validateArraySettings(schema, value, path, issues);
  }
}

function inferSchemaType(schema: Record<string, unknown>): string | undefined {
  if (isPlainRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isPlainRecord(schema.items)) {
    return 'array';
  }

  return undefined;
}

function matchesSettingsType(value: unknown, type: string): boolean {
  if (type === 'object') {
    return isPlainRecord(value);
  }
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'integer') {
    return Number.isInteger(value);
  }
  if (type === 'number') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  return typeof value === type;
}

function validateEnum(
  schema: Record<string, unknown>,
  value: unknown,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (!Array.isArray(schema.enum)) {
    return;
  }

  const serializedValue = stableSerialize(value);
  if (!schema.enum.some((item) => stableSerialize(item) === serializedValue)) {
    issues.push({
      path,
      code: 'settings_enum_mismatch',
      message: 'Settings value is not in the allowed enum',
    });
  }
}

function validateStringSettings(
  schema: Record<string, unknown>,
  value: string,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
    issues.push({
      path,
      code: 'settings_min_length',
      message: `Settings value must contain at least ${schema.minLength} characters`,
    });
  }
  if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
    issues.push({
      path,
      code: 'settings_max_length',
      message: `Settings value must contain at most ${schema.maxLength} characters`,
    });
  }
}

function validateStringFormatSettings(
  schema: Record<string, unknown>,
  value: string,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.format !== 'string') {
    return;
  }

  const formatValidators: Record<string, (value: string) => boolean> = {
    date: (item) => /^\d{4}-\d{2}-\d{2}$/.test(item) && !Number.isNaN(Date.parse(`${item}T00:00:00.000Z`)),
    'date-time': (item) => !Number.isNaN(Date.parse(item)),
    email: (item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item),
    time: (item) => /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(item),
    uri: isValidUrl,
    url: isValidUrl,
  };
  const validate = formatValidators[schema.format];
  if (validate && !validate(value)) {
    issues.push({
      path,
      code: 'settings_format',
      message: `Settings value must match ${schema.format} format`,
      details: {
        format: schema.format,
      },
    });
  }
}

function validateNumberSettings(
  schema: Record<string, unknown>,
  value: number,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (typeof schema.minimum === 'number' && value < schema.minimum) {
    issues.push({
      path,
      code: 'settings_minimum',
      message: `Settings value must be greater than or equal to ${schema.minimum}`,
    });
  }
  if (typeof schema.maximum === 'number' && value > schema.maximum) {
    issues.push({
      path,
      code: 'settings_maximum',
      message: `Settings value must be less than or equal to ${schema.maximum}`,
    });
  }
}

function validateObjectSettings(
  schema: Record<string, unknown>,
  value: Record<string, unknown>,
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (typeof key === 'string' && !Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push({
          path: `${path}.${key}`,
          code: 'settings_required',
          message: `Settings field "${key}" is required`,
        });
      }
    }
  }

  if (!isPlainRecord(schema.properties)) {
    return;
  }

  for (const key of Object.keys(value)) {
    if (!Object.prototype.hasOwnProperty.call(schema.properties, key)) {
      issues.push({
        path: `${path}.${key}`,
        code: 'settings_unknown_property',
        message: `Settings field "${key}" is not defined by the publication settings schema`,
      });
    }
  }

  for (const [key, childSchema] of Object.entries(schema.properties)) {
    if (!Object.prototype.hasOwnProperty.call(value, key) || !isPlainRecord(childSchema)) {
      continue;
    }

    validateSettingsValue(childSchema, value[key], `${path}.${key}`, issues);
  }
}

function validateArraySettings(
  schema: Record<string, unknown>,
  value: unknown[],
  path: string,
  issues: SettingsValidationIssue[],
): void {
  if (!isPlainRecord(schema.items)) {
    return;
  }

  value.forEach((item, index) => {
    validateSettingsValue(schema.items as Record<string, unknown>, item, `${path}[${index}]`, issues);
  });
}

function buildRuntimeCacheMetadata(
  publication: LightExtensionPublicationRecord,
  settings: Record<string, unknown>,
): LightExtensionRuntimeResolveResult['cache'] {
  return {
    etag: `"${stableJsonHash({
      publicationId: publication.id,
      runtimeCodeHash: publication.runtimeCodeHash,
      settingsDefaultsHash: publication.settingsDefaultsHash,
      settings,
    })}"`,
    immutable: true,
  };
}

function getSettingsValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  if (Number.isInteger(value)) {
    return 'integer';
  }

  return typeof value;
}

function stableJsonHash(value: unknown): string {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message, {
    status: 422,
    details: {
      reasonCode: 'invalid_input',
    },
  });
}

function runtimeLifecycleError(message: string, details: Record<string, unknown>): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_LIFECYCLE_CONFLICT', message, {
    details,
  });
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return Boolean(url.protocol && url.hostname);
  } catch {
    return false;
  }
}
