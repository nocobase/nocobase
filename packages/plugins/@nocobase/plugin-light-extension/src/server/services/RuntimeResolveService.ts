/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { createHash } from 'crypto';

import { LIGHT_EXTENSION_SUPPORTED_KINDS, type LightExtensionKind } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionEntryRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionSelectableEntryRecord,
} from '../../shared/types';
import { entryFromModel } from './LightExtensionEntryService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { SettingsResolverService } from './SettingsResolverService';
import { getRuntimeSettingsSource, hasUsableRuntimeArtifact } from './runtimeArtifact';

export class RuntimeResolveService {
  constructor(
    private readonly db: Database,
    private readonly settingsResolver = new SettingsResolverService(),
  ) {}

  async listSelectableEntries(
    input: { repoId?: string; kind?: string } = {},
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSelectableEntryRecord[]> {
    const filter: Record<string, unknown> = {
      healthStatus: 'ready',
    };
    if (input.repoId) {
      filter.repoId = input.repoId;
    }
    if (input.kind) {
      const kind = assertSupportedKind(input.kind);
      filter.kind = kind;
    }

    const records = await this.db.getRepository('lightExtensionEntries').find({
      filter,
      sort: ['kind', 'entryName'],
      transaction: ctx.transaction,
    });
    const runtimeEntries = records.map((record) => entryFromModel(record as Model));
    const repoHeadCommitIds = new Map(
      await Promise.all(
        [...new Set(runtimeEntries.map((entry) => entry.repoId))].map(
          async (repoId) => [repoId, await this.loadEnabledRepoHeadCommitId(repoId, ctx)] as const,
        ),
      ),
    );
    const entries: LightExtensionSelectableEntryRecord[] = [];

    for (const entry of runtimeEntries) {
      const repoHeadCommitId = repoHeadCommitIds.get(entry.repoId) || null;
      if (!isSelectableRuntimeEntry(entry, repoHeadCommitId)) {
        continue;
      }
      entries.push(entry);
    }

    return entries;
  }

  async resolve(
    input: LightExtensionRuntimeResolveInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRuntimeResolveResult> {
    assertRuntimeResolveInput(input);

    const sourceBinding = input.sourceBinding;
    const entry = await this.loadRuntimeEntry(sourceBinding.entryId, ctx);
    assertSourceBindingMatches(sourceBinding, entry);
    await this.assertRuntimeStateAllowsEntry(entry, ctx);
    const settingsSource = getRuntimeSettingsSource(entry);
    const settings = this.settingsResolver.resolveRuntimeSettings(settingsSource, input.settings);
    const artifact = entry.runtimeArtifact;
    if (!artifact?.code) {
      throw runtimeUnavailableError('Light extension entry has no compiled runtime artifact', {
        reasonCode: 'runtime_missing',
        repoId: entry.repoId,
        entryId: entry.id,
      });
    }

    return {
      entryId: entry.id,
      entryPath: artifact.entryPath || entry.entryPath,
      runtimeCodeHash: entry.runtimeCodeHash || stableJsonHash(artifact.code),
      code: artifact.code,
      version: entry.runtimeVersion || artifact.version,
      ...(artifact.sourceMap ? { sourceMap: artifact.sourceMap } : {}),
      settings,
      cache: buildRuntimeCacheMetadata(entry, settings),
    };
  }

  private async loadRuntimeEntry(
    entryId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionEntryRecord> {
    const record = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${entryId}" was not found`,
        {
          details: {
            reasonCode: 'entry_missing',
            entryId,
          },
        },
      );
    }

    return entryFromModel(record);
  }

  private async loadEnabledRepoHeadCommitId(repoId: string, ctx: LightExtensionServiceContext): Promise<string | null> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    if (String(repo?.get('lifecycleStatus') || '') !== 'enabled') {
      return null;
    }

    return normalizeCommitId(repo?.get('headCommitId'));
  }

  private async assertRuntimeStateAllowsEntry(
    entry: LightExtensionEntryRecord,
    ctx: LightExtensionServiceContext,
  ): Promise<void> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: entry.repoId,
      transaction: ctx.transaction,
    });
    if (!repo) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_REPO_NOT_FOUND',
        `Light extension repository "${entry.repoId}" was not found`,
        {
          details: {
            reasonCode: 'repo_missing',
            repoId: entry.repoId,
            entryId: entry.id,
          },
        },
      );
    }

    const repoLifecycleStatus = String(repo.get('lifecycleStatus') || '');
    if (repoLifecycleStatus === 'disabled' || repoLifecycleStatus === 'archived') {
      throw runtimeUnavailableError(`Light extension repository lifecycle status is "${repoLifecycleStatus}"`, {
        reasonCode: repoLifecycleStatus === 'disabled' ? 'repo_disabled' : 'repo_archived',
        repoId: entry.repoId,
        entryId: entry.id,
        repoLifecycleStatus,
      });
    }
    if (!isSupportedKind(entry.kind)) {
      throw runtimeUnavailableError(`Light extension kind "${entry.kind}" is not supported`, {
        reasonCode: 'kind_unsupported',
        repoId: entry.repoId,
        entryId: entry.id,
        kind: entry.kind,
      });
    }
    if (entry.healthStatus === 'missing') {
      throw runtimeUnavailableError(`Light extension entry health status is "${entry.healthStatus}"`, {
        reasonCode: 'entry_missing',
        repoId: entry.repoId,
        entryId: entry.id,
        entryHealthStatus: entry.healthStatus,
      });
    }
    if (entry.healthStatus !== 'ready') {
      throw runtimeUnavailableError(`Light extension entry health status is "${entry.healthStatus}"`, {
        reasonCode: 'runtime_missing',
        repoId: entry.repoId,
        entryId: entry.id,
        entryHealthStatus: entry.healthStatus,
      });
    }
    if (!hasUsableRuntimeArtifact(entry, normalizeCommitId(repo.get('headCommitId')))) {
      throw runtimeUnavailableError('Light extension entry has no compiled runtime artifact', {
        reasonCode: 'runtime_missing',
        repoId: entry.repoId,
        entryId: entry.id,
      });
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
  const allowedSourceBindingKeys = new Set([
    'type',
    'repoId',
    'repoTitle',
    'entryId',
    'entryTitle',
    'entryName',
    'entryPath',
    'kind',
  ]);
  if (Object.keys(sourceBinding).some((key) => !allowedSourceBindingKeys.has(key))) {
    throw invalidInput('sourceBinding contains unsupported fields');
  }
  for (const key of ['repoId', 'entryId', 'kind'] as const) {
    if (typeof sourceBinding[key] !== 'string' || !sourceBinding[key].trim()) {
      throw invalidInput(`sourceBinding.${key} is required`);
    }
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
  sourceBinding: LightExtensionRuntimeResolveInput['sourceBinding'],
  entry: LightExtensionEntryRecord,
): void {
  const mismatches = [
    buildBindingMismatch('repoId', sourceBinding.repoId, entry.repoId),
    buildBindingMismatch('entryId', sourceBinding.entryId, entry.id),
    buildBindingMismatch('kind', sourceBinding.kind, entry.kind),
  ].filter((item): item is { field: string; expected: string; actual: string } => Boolean(item));

  if (!mismatches.length) {
    return;
  }

  throw new LightExtensionError(
    'LIGHT_EXTENSION_BINDING_OUTDATED',
    'Light extension source binding does not match the entry identity',
    {
      details: {
        entryId: entry.id,
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

function assertSupportedKind(kind: string): LightExtensionKind {
  if ((LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind)) {
    return kind as LightExtensionKind;
  }

  throw invalidInput(`kind must be one of: ${LIGHT_EXTENSION_SUPPORTED_KINDS.join(', ')}`);
}

function isSelectableRuntimeEntry(
  entry: LightExtensionEntryRecord,
  repoHeadCommitId: string | null,
): entry is LightExtensionSelectableEntryRecord {
  return (
    entry.healthStatus === 'ready' &&
    isSupportedKind(entry.kind) &&
    hasUsableRuntimeArtifact(entry, repoHeadCommitId) &&
    Boolean(
      entry.runtimeVersion && entry.surfaceStyle && entry.filesHash && entry.settingsDefaultsHash && entry.compiledAt,
    )
  );
}

function isSupportedKind(kind: string): boolean {
  return (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind);
}

function normalizeCommitId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function buildRuntimeCacheMetadata(
  entry: LightExtensionEntryRecord,
  settings: Record<string, unknown>,
): LightExtensionRuntimeResolveResult['cache'] {
  return {
    etag: `"${stableJsonHash({
      entryId: entry.id,
      compiledCommitId: entry.compiledCommitId,
      runtimeCodeHash: entry.runtimeCodeHash,
      settingsDefaultsHash: entry.settingsDefaultsHash,
      settings,
    })}"`,
    immutable: false,
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

function runtimeUnavailableError(message: string, details: Record<string, unknown>): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', message, {
    details,
  });
}
