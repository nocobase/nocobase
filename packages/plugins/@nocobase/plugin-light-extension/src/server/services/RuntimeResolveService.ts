/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Filter, Model } from '@nocobase/database';
import { createHash } from 'crypto';

import { LIGHT_EXTENSION_SUPPORTED_KINDS, type LightExtensionKind } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionEntryRecord,
  LightExtensionRuntimeArtifactRecord,
  LightExtensionRuntimeResolveInput,
  LightExtensionRuntimeResolveResult,
  LightExtensionSelectableEntrySummary,
} from '../../shared/types';
import { entryFromModel } from './LightExtensionEntryService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { SettingsResolverService } from './SettingsResolverService';
import { getRuntimeSettingsSource, hasUsableRuntimeArtifact } from './runtimeArtifact';

export interface RuntimeResolveServiceOptions {
  apiBasePath?: string;
}

export class RuntimeResolveService {
  private readonly settingsResolver: SettingsResolverService;

  private readonly options: RuntimeResolveServiceOptions;

  constructor(db: Database, options?: RuntimeResolveServiceOptions);
  constructor(db: Database, settingsResolver?: SettingsResolverService, options?: RuntimeResolveServiceOptions);
  constructor(
    private readonly db: Database,
    settingsResolverOrOptions?: SettingsResolverService | RuntimeResolveServiceOptions,
    options: RuntimeResolveServiceOptions = {},
  ) {
    if (isSettingsResolverService(settingsResolverOrOptions)) {
      this.settingsResolver = settingsResolverOrOptions;
      this.options = options;
      return;
    }

    this.settingsResolver = new SettingsResolverService();
    this.options = settingsResolverOrOptions ?? options;
  }

  async listSelectableEntries(
    input: { repoId?: string; kind?: string } = {},
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSelectableEntrySummary[]> {
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
      fields: [
        'id',
        'repoId',
        'kind',
        'entryName',
        'entryPath',
        'title',
        'category',
        'settingsSchema',
        'settingsSchemaHash',
        'compiledCommitId',
        'runtimeVersion',
        'surfaceStyle',
        'runtimeCodeHash',
        'artifactHash',
        'filesHash',
        'settingsDefaultsHash',
        'healthStatus',
      ],
      sort: ['kind', 'entryName'],
      transaction: ctx.transaction,
    });
    const runtimeEntries = records.map((record) => selectableEntryFromModel(record as Model));
    const repoIds: string[] = [...new Set<string>(runtimeEntries.map((entry) => entry.repoId))];
    const [repoHeadCommitIds, repoLabels] = await Promise.all([
      this.loadEnabledRepoHeadCommitIds(repoIds, ctx),
      this.loadVisibleRepoLabels(repoIds, ctx),
    ]);
    const entries: LightExtensionSelectableEntrySummary[] = [];

    for (const entry of runtimeEntries) {
      const repoHeadCommitId = repoHeadCommitIds.get(entry.repoId) || null;
      if (!isSelectableRuntimeEntry(entry, repoHeadCommitId)) {
        continue;
      }
      entries.push(toSelectableEntrySummary(entry, repoLabels.get(entry.repoId)));
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
    if (!entry.artifactHash || !entry.runtimeCodeHash || !entry.runtimeVersion) {
      throw runtimeUnavailableError('Light extension entry has no compiled runtime artifact', {
        reasonCode: 'runtime_missing',
        repoId: entry.repoId,
        entryId: entry.id,
      });
    }

    return {
      entryId: entry.id,
      entryPath: entry.entryPath,
      artifactHash: entry.artifactHash,
      artifactUrl: buildRuntimeArtifactUrl(entry.artifactHash, this.options.apiBasePath),
      runtimeCodeHash: entry.runtimeCodeHash,
      version: entry.runtimeVersion,
      settings,
      settingsHash: stableJsonHash(settings),
    };
  }

  async getArtifact(
    artifactHash: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRuntimeArtifactRecord> {
    if (typeof artifactHash !== 'string' || !/^[a-f0-9]{64}$/u.test(artifactHash)) {
      throw invalidInput('artifactHash must be a SHA-256 hash');
    }
    const record = await this.db.getRepository('lightExtensionRuntimeArtifacts').findOne({
      filterByTk: artifactHash,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ARTIFACT_NOT_FOUND',
        `Light extension runtime artifact "${artifactHash}" was not found`,
        {
          details: {
            reasonCode: 'artifact_missing',
            artifactHash,
          },
        },
      );
    }

    return {
      artifactHash: String(record.get('artifactHash')),
      runtimeCodeHash: String(record.get('runtimeCodeHash')),
      code: String(record.get('code')),
      ...(typeof record.get('sourceMap') === 'string' ? { sourceMap: String(record.get('sourceMap')) } : {}),
      version: String(record.get('version')),
      entryPath: String(record.get('entryPath')),
      runtimeContract: String(record.get('runtimeContract')),
      byteSize: Number(record.get('byteSize')),
    };
  }

  private async loadRuntimeEntry(
    entryId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionEntryRecord> {
    const record = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      except: ['runtimeArtifact', 'diagnostics'],
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

  private async loadEnabledRepoHeadCommitIds(
    repoIds: string[],
    ctx: LightExtensionServiceContext,
  ): Promise<Map<string, string>> {
    const repos = await this.db.getRepository('lightExtensionRepos').find({
      filter: { id: { $in: repoIds } },
      fields: ['id', 'lifecycleStatus', 'headCommitId'],
      transaction: ctx.transaction,
    });
    const heads = new Map<string, string>();
    for (const repo of repos) {
      if (String(repo.get('lifecycleStatus') || '') !== 'enabled') {
        continue;
      }
      const headCommitId = normalizeCommitId(repo.get('headCommitId'));
      if (headCommitId) {
        heads.set(String(repo.get('id')), headCommitId);
      }
    }
    return heads;
  }

  private async loadVisibleRepoLabels(
    repoIds: string[],
    ctx: LightExtensionServiceContext,
  ): Promise<Map<string, SelectableRepoLabel>> {
    if (!ctx.can || repoIds.length === 0) {
      return new Map();
    }
    const permission = await ctx.can({ resource: 'lightExtensionRepos', action: 'list' });
    if (!permission) {
      return new Map();
    }
    const params = getPermissionParams(permission);
    const fields = getVisibleRepoLabelFields(params);
    if (fields.length === 0) {
      return new Map();
    }
    const permissionFilter = await this.parseRepoLabelFilter(params?.filter, ctx);
    const records = await this.db.getRepository('lightExtensionRepos').find({
      filter: permissionFilter ? { $and: [{ id: { $in: repoIds } }, permissionFilter] } : { id: { $in: repoIds } },
      fields: ['id', ...fields],
      transaction: ctx.transaction,
    });
    return new Map(
      records.map((record) => [
        String(record.get('id')),
        {
          ...(fields.includes('name') ? { name: nullableString(record.get('name')) } : {}),
          ...(fields.includes('title') ? { title: nullableString(record.get('title')) } : {}),
        },
      ]),
    );
  }

  private async parseRepoLabelFilter(filter: unknown, ctx: LightExtensionServiceContext): Promise<Filter | undefined> {
    if (!filter) {
      return undefined;
    }
    try {
      checkFilterParams(this.db.getCollection('lightExtensionRepos'), filter);
      return ((await parseJsonTemplate(filter, {
        state: ctx.state || {},
        timezone: ctx.timezone,
        userProvider: createUserProvider({ db: this.db, currentUser: ctx.currentUser }),
      })) ?? filter) as Filter;
    } catch (error) {
      if (error instanceof NoPermissionError) {
        return { id: '__light_extension_repo_label_not_visible__' };
      }
      throw error;
    }
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

export function buildRuntimeArtifactUrl(artifactHash: string, apiBasePath?: string): string {
  return `${normalizeApiBasePath(apiBasePath)}/light-extension-runtime/artifacts/${encodeURIComponent(artifactHash)}`;
}

function normalizeApiBasePath(apiBasePath?: string): string {
  const input = apiBasePath ?? process.env.API_BASE_PATH ?? '/api';
  const normalized = `/${input.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
}

function isSettingsResolverService(
  value: SettingsResolverService | RuntimeResolveServiceOptions | undefined,
): value is SettingsResolverService {
  return typeof (value as SettingsResolverService | undefined)?.resolveRuntimeSettings === 'function';
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
    'repoName',
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

function isSelectableRuntimeEntry(entry: SelectableEntryProjection, repoHeadCommitId: string | null): boolean {
  return (
    entry.healthStatus === 'ready' &&
    isSupportedKind(entry.kind) &&
    entry.compiledCommitId === repoHeadCommitId &&
    Boolean(
      entry.runtimeCodeHash &&
        entry.artifactHash &&
        entry.runtimeVersion &&
        entry.surfaceStyle &&
        entry.filesHash &&
        hasConsistentSettingsHashes(entry),
    )
  );
}

interface SelectableEntryProjection {
  id: string;
  repoId: string;
  kind: string;
  entryName: string;
  entryPath: string;
  title: string | null;
  category: string | null;
  settingsSchema: Record<string, unknown> | null;
  settingsSchemaHash: string | null;
  compiledCommitId: string | null;
  runtimeVersion: string | null;
  surfaceStyle: string | null;
  runtimeCodeHash: string | null;
  artifactHash: string | null;
  filesHash: string | null;
  settingsDefaultsHash: string | null;
  healthStatus: string;
}

function selectableEntryFromModel(record: Model): SelectableEntryProjection {
  return {
    id: String(record.get('id')),
    repoId: String(record.get('repoId')),
    kind: String(record.get('kind')),
    entryName: String(record.get('entryName')),
    entryPath: String(record.get('entryPath')),
    title: nullableString(record.get('title')),
    category: nullableString(record.get('category')),
    settingsSchema: nullableRecord(record.get('settingsSchema')),
    settingsSchemaHash: nullableString(record.get('settingsSchemaHash')),
    compiledCommitId: nullableString(record.get('compiledCommitId')),
    runtimeVersion: nullableString(record.get('runtimeVersion')),
    surfaceStyle: nullableString(record.get('surfaceStyle')),
    runtimeCodeHash: nullableString(record.get('runtimeCodeHash')),
    artifactHash: nullableString(record.get('artifactHash')),
    filesHash: nullableString(record.get('filesHash')),
    settingsDefaultsHash: nullableString(record.get('settingsDefaultsHash')),
    healthStatus: String(record.get('healthStatus')),
  };
}

interface SelectableRepoLabel {
  name?: string | null;
  title?: string | null;
}

function toSelectableEntrySummary(
  entry: SelectableEntryProjection,
  repoLabel?: SelectableRepoLabel,
): LightExtensionSelectableEntrySummary {
  return {
    id: entry.id,
    repoId: entry.repoId,
    ...(typeof repoLabel?.name !== 'undefined' ? { repoName: repoLabel.name } : {}),
    ...(typeof repoLabel?.title !== 'undefined' ? { repoTitle: repoLabel.title } : {}),
    kind: entry.kind,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    title: entry.title,
    category: entry.category,
    settingsSchema: entry.settingsSchema,
    settingsSchemaHash: entry.settingsSchemaHash,
    settingsDefaultsHash: entry.settingsDefaultsHash,
    ...(entry.artifactHash ? { artifactHash: entry.artifactHash } : {}),
    runtimeCodeHash: entry.runtimeCodeHash || '',
    runtimeAvailable: true,
  };
}

function getPermissionParams(permission: unknown): Record<string, unknown> | undefined {
  if (!permission || typeof permission !== 'object' || Array.isArray(permission)) {
    return undefined;
  }
  const params = (permission as { params?: unknown }).params;
  return params && typeof params === 'object' && !Array.isArray(params)
    ? (params as Record<string, unknown>)
    : undefined;
}

function getVisibleRepoLabelFields(params?: Record<string, unknown>): Array<'name' | 'title'> {
  const configuredFields = Array.isArray(params?.fields)
    ? new Set(params.fields.filter((field): field is string => typeof field === 'string'))
    : null;
  const excludedFields = new Set(
    Array.isArray(params?.except) ? params.except.filter((field): field is string => typeof field === 'string') : [],
  );
  return (['name', 'title'] as const).filter(
    (field) => (!configuredFields || configuredFields.has(field)) && !excludedFields.has(field),
  );
}

function hasConsistentSettingsHashes(entry: SelectableEntryProjection): boolean {
  if (!entry.settingsSchema) {
    return entry.settingsSchemaHash === null && entry.settingsDefaultsHash === null;
  }

  return Boolean(entry.settingsSchemaHash && entry.settingsDefaultsHash);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableRecord(value: unknown): Record<string, unknown> | null {
  return isPlainRecord(value) ? value : null;
}

function isSupportedKind(kind: string): boolean {
  return (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind);
}

function normalizeCommitId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
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
