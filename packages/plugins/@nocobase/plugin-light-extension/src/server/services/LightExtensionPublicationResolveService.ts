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
  LightExtensionEntryPublicationsSelectorResult,
  LightExtensionSelectableEntryRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionRuntimeSourceBinding,
  LightExtensionPublicationMetadataRecord,
} from '../../shared/types';
import { entryFromModel } from './LightExtensionEntryScanner';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionPublicationRecord,
  publicationFromModel,
  toPublicationMetadata,
} from './LightExtensionPublicationService';
import { SettingsResolverService } from './SettingsResolverService';

export class LightExtensionPublicationResolveService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly settingsResolver = new SettingsResolverService(),
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

  async listSelectableEntries(
    input: { repoId?: string } = {},
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSelectableEntryRecord[]> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'usePublication',
        ctx,
      });
    } catch (error) {
      await this.recordUseDenied('selector:entries', { ...ctx, requestId }, error);
      throw error;
    }

    const filter: Record<string, unknown> = {
      healthStatus: 'ready',
    };
    if (input.repoId) {
      filter.repoId = input.repoId;
    }

    const records = await this.db.getRepository('lightExtensionEntries').find({
      filter,
      sort: ['kind', 'entryName'],
      transaction: ctx.transaction,
    });
    const entries: LightExtensionSelectableEntryRecord[] = [];

    for (const record of records) {
      const entry = entryFromModel(record);
      if (
        entry.healthStatus !== 'ready' ||
        !entry.activePublicationId ||
        !(await this.entryRepoIsEnabled(entry.repoId, ctx))
      ) {
        continue;
      }

      const publication = await this.findPublication(entry.activePublicationId, ctx);
      if (!publication || !publicationMatchesEntry(publication, entry)) {
        continue;
      }

      const { settingsSchema: _settingsSchema, activePublicationId, ...entryWithoutSettingsSchema } = entry;
      entries.push({
        ...entryWithoutSettingsSchema,
        activePublicationId,
        activePublication: toPublicationMetadata(publication),
      });
    }

    return entries;
  }

  async listSelectablePublicationsByEntry(
    entryId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionEntryPublicationsSelectorResult> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'usePublication',
        ctx,
      });
    } catch (error) {
      await this.recordUseDenied(`entry:${entryId}`, { ...ctx, requestId }, error);
      throw error;
    }

    const entryRecord = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction: ctx.transaction,
    });
    if (!entryRecord) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${entryId}" was not found`,
      );
    }

    const entry = entryFromModel(entryRecord);
    const activePublicationId =
      entry.healthStatus === 'ready' && entry.activePublicationId && (await this.entryRepoIsEnabled(entry.repoId, ctx))
        ? entry.activePublicationId
        : null;

    if (!activePublicationId) {
      return {
        entryId,
        activePublicationId: null,
        publications: [],
      };
    }

    const records = await this.db.getRepository('lightExtensionEntryPublications').find({
      filter: {
        entryId,
      },
      sort: ['-createdAt'],
      transaction: ctx.transaction,
    });

    return {
      entryId,
      activePublicationId,
      publications: records
        .map((record: Model) => publicationFromModel(record))
        .filter((publication) => publicationMatchesEntry(publication, entry))
        .map((publication) => toPublicationMetadata(publication)),
    };
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

    const versionPolicy = sourceBinding.versionPolicy || 'pinned';
    const publication =
      versionPolicy === 'follow-active'
        ? await this.loadActivePublicationForBinding(sourceBinding, ctx)
        : await this.loadPublication(sourceBinding.publicationId, ctx);
    assertSourceBindingMatches(sourceBinding, publication);
    await this.assertRuntimeStateAllowsPublication(publication, ctx);
    const settings = this.settingsResolver.resolvePublicationSettings(publication, input.settings);

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
      cache: buildRuntimeCacheMetadata(publication, settings, versionPolicy),
    };
  }

  private async loadActivePublicationForBinding(
    sourceBinding: LightExtensionRuntimeSourceBinding,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPublicationRecord> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: sourceBinding.repoId,
      transaction: ctx.transaction,
    });
    if (!repo) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_REPO_NOT_FOUND',
        `Light extension repository "${sourceBinding.repoId}" was not found`,
        {
          details: {
            reasonCode: 'repo_missing',
            repoId: sourceBinding.repoId,
            entryId: sourceBinding.entryId,
          },
        },
      );
    }
    const repoLifecycleStatus = String(repo.get('lifecycleStatus') || '');
    if (repoLifecycleStatus === 'disabled' || repoLifecycleStatus === 'archived') {
      throw runtimeLifecycleError(`Light extension repository lifecycle status is "${repoLifecycleStatus}"`, {
        reasonCode: repoLifecycleStatus === 'disabled' ? 'repo_disabled' : 'repo_archived',
        repoId: sourceBinding.repoId,
        entryId: sourceBinding.entryId,
        repoLifecycleStatus,
      });
    }

    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: sourceBinding.entryId,
      transaction: ctx.transaction,
    });
    if (!entry) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${sourceBinding.entryId}" was not found`,
        {
          details: {
            reasonCode: 'entry_missing',
            repoId: sourceBinding.repoId,
            entryId: sourceBinding.entryId,
          },
        },
      );
    }

    const entryRepoId = String(entry.get('repoId') || '');
    const entryKind = String(entry.get('kind') || '');
    if (entryRepoId !== sourceBinding.repoId || entryKind !== sourceBinding.kind) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_BINDING_OUTDATED',
        'Light extension source binding does not match the entry identity',
        {
          details: {
            reasonCode: 'entry_mismatch',
            repoId: sourceBinding.repoId,
            entryId: sourceBinding.entryId,
            entryRepoId,
            entryKind,
          },
        },
      );
    }

    const entryHealthStatus = String(entry.get('healthStatus') || '');
    if (entryHealthStatus !== 'ready') {
      throw runtimeLifecycleError(`Light extension entry health status is "${entryHealthStatus}"`, {
        reasonCode: entryHealthStatus === 'disabled' ? 'entry_disabled' : 'entry_missing',
        repoId: sourceBinding.repoId,
        entryId: sourceBinding.entryId,
        entryHealthStatus,
      });
    }

    const activePublicationId =
      typeof entry.get('activePublicationId') === 'string' ? entry.get('activePublicationId') : '';
    if (!activePublicationId) {
      throw runtimeLifecycleError('Light extension entry has no active publication', {
        reasonCode: 'no_active_publication',
        repoId: sourceBinding.repoId,
        entryId: sourceBinding.entryId,
      });
    }

    return this.loadPublication(activePublicationId, ctx);
  }

  private async loadPublication(
    publicationId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPublicationRecord> {
    const publication = await this.findPublication(publicationId, ctx);
    if (!publication) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
        `Light extension publication "${publicationId}" was not found`,
      );
    }

    return publication;
  }

  private async findPublication(
    publicationId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPublicationRecord | null> {
    const record = await this.db.getRepository('lightExtensionEntryPublications').findOne({
      filterByTk: publicationId,
      transaction: ctx.transaction,
    });
    if (!record) {
      return null;
    }

    return publicationFromModel(record);
  }

  private async entryRepoIsEnabled(repoId: string, ctx: LightExtensionServiceContext): Promise<boolean> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    return String(repo?.get('lifecycleStatus') || '') === 'enabled';
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
  if (versionPolicy !== 'pinned' && versionPolicy !== 'follow-active') {
    throw invalidInput('sourceBinding.versionPolicy must be "pinned" or "follow-active"');
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

function publicationMatchesEntry(
  publication: LightExtensionPublicationRecord,
  entry: { id: string; repoId: string; kind: string },
): boolean {
  return publication.entryId === entry.id && publication.repoId === entry.repoId && publication.kind === entry.kind;
}

function buildRuntimeCacheMetadata(
  publication: LightExtensionPublicationRecord,
  settings: Record<string, unknown>,
  versionPolicy: string,
): LightExtensionRuntimeResolveResult['cache'] {
  return {
    etag: `"${stableJsonHash({
      versionPolicy,
      publicationId: publication.id,
      runtimeCodeHash: publication.runtimeCodeHash,
      settingsDefaultsHash: publication.settingsDefaultsHash,
      settings,
    })}"`,
    immutable: versionPolicy !== 'follow-active',
  };
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
