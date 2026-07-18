/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction, type Database, type Model } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { createHash } from 'crypto';
import path from 'path';
import type { Readable } from 'stream';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionRepoRecord } from '../../shared/types';
import { prepareClientAppArchive, type PreparedClientAppArchive } from './ClientAppArchive';
import type { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionRepoService, LightExtensionServiceContext } from './LightExtensionRepoService';
import type { ClientAppAssetStorage, ClientAppStoredFile } from './ClientAppStorage';

export interface ClientAppDescriptor {
  entryId: string;
  repoId: string;
  key: string;
  kind: 'client-app';
  title: string;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[];
  sort: number | null;
  entryHtml: string;
  staticRoot: string;
  contentHash: string;
  fileCount: number;
  byteSize: number;
  updatedAt: string | null;
  available: true;
  enabled: true;
  ready: true;
}

export interface ClientAppSummary extends ClientAppDescriptor {
  repoTitle: string;
}

export interface ClientAppAsset {
  relativePath: string;
  clientAppContentHash: string;
  contentHash: string;
  size: number;
  mimeType?: string;
  stream: Readable;
}

export interface ClientAppOpenOptions {
  expectedContentHash?: string;
}

export interface ClientAppServiceHooks {
  afterAssetStaged?: (relativePath: string) => Promise<void> | void;
  beforePointerSwitch?: () => Promise<void> | void;
  beforeOldAssetCleanup?: (assetSetId: string) => Promise<void> | void;
  onCleanupError?: (error: unknown, assetSetId: string) => void;
}

export interface ClientAppAssetSweepOptions {
  stagingOlderThanMs?: number;
}

export interface ClientAppAssetSweepResult {
  assetSets: number;
  assets: number;
}

const DEFAULT_STAGING_RETENTION_MS = 60 * 60 * 1000;

interface StagedClientAppAsset {
  relativePath: string;
  contentHash: string;
  storedFile: ClientAppStoredFile;
}

interface ClientAppRecords {
  entry: Model;
  app: Model;
  repo: Model;
}

export class ClientAppService {
  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly storage: ClientAppAssetStorage,
    private readonly hooks: ClientAppServiceHooks = {},
  ) {}

  async upload(
    input: { repoId: string; zipPath: string },
    ctx: LightExtensionServiceContext = {},
  ): Promise<ClientAppDescriptor> {
    await this.permissionService.assertActionAllowed({ action: 'writeSource', ctx });
    const repo = await this.repoService.getRepo(input.repoId, ctx);
    assertRepoAcceptsClientAppUpload(repo);
    const archive = await prepareClientAppArchive(input.zipPath);
    const assetSetId = `leas_${uid()}`;
    const staged: StagedClientAppAsset[] = [];
    let published = false;
    try {
      for (const asset of archive.assets) {
        const reservedFile = await this.storage.reserve({
          assetSetId,
          relativePath: asset.relativePath,
          byteSize: asset.byteSize,
        });
        await this.persistStagedAsset(repo.id, assetSetId, asset.relativePath, asset.contentHash, reservedFile);
        const storedFile = await this.storage.stage({
          assetSetId,
          relativePath: asset.relativePath,
          filePath: asset.filePath,
          reservedFile,
        });
        staged.push({
          relativePath: asset.relativePath,
          contentHash: asset.contentHash,
          storedFile,
        });
        await this.updateStagedAssetMetadata(assetSetId, asset.relativePath, storedFile);
        await verifyStagedAsset(this.storage, storedFile, asset.contentHash, asset.byteSize, asset.relativePath);
        await this.hooks.afterAssetStaged?.(asset.relativePath);
      }

      const result = await this.publishUpload(repo.id, assetSetId, archive, staged);
      published = true;
      await this.cleanupRetiringAssetSetBestEffort(result.oldAssetSetId);
      return this.resolveClientApp(result.entryId);
    } finally {
      if (!published) {
        await this.retireAssetSetBestEffort(
          repo.id,
          assetSetId,
          staged.map((asset) => asset.storedFile),
          { stagingOlderThanMs: 0 },
        );
      }
      await archive.dispose().catch((error) => {
        this.hooks.onCleanupError?.(error, assetSetId);
      });
    }
  }

  async resolveClientApp(entryId: string): Promise<ClientAppDescriptor> {
    const records = await this.loadClientAppRecords(entryId);
    assertClientAppRecordsAvailable(records, entryId);
    return recordsToDescriptor(records);
  }

  async openClientAppAsset(
    entryId: string,
    relativePath: string,
    options: ClientAppOpenOptions = {},
  ): Promise<ClientAppAsset | null> {
    const normalizedPath = normalizeAssetPath(relativePath);
    return this.db.sequelize.transaction(
      {
        isolationLevel: this.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      },
      async (transaction) => {
        const records = await this.loadClientAppRecords(entryId, transaction, 'share');
        assertClientAppRecordsAvailable(records, entryId);
        const clientAppContentHash = String(records.app.get('contentHash'));
        if (options.expectedContentHash && options.expectedContentHash !== clientAppContentHash) {
          throw new LightExtensionError(
            'LIGHT_EXTENSION_SOURCE_OUTDATED',
            `Client app Entry "${entryId}" changed before its asset was opened`,
            {
              details: {
                entryId,
                expectedContentHash: options.expectedContentHash,
                currentContentHash: clientAppContentHash,
              },
            },
          );
        }
        const asset = await this.db.getRepository('lightExtensionClientAppAssets').findOne({
          filter: {
            assetSetId: records.app.get('assetSetId'),
            relativePath: normalizedPath,
            state: 'ready',
          },
          transaction,
        });
        if (!asset) {
          return null;
        }
        const storedFile = storedFileFromModel(asset);
        const opened = await this.storage.open(storedFile);
        return {
          relativePath: normalizedPath,
          clientAppContentHash,
          contentHash: String(asset.get('contentHash')),
          size: Number(asset.get('size')),
          ...(storedFile.mimetype || opened.contentType ? { mimeType: storedFile.mimetype || opened.contentType } : {}),
          stream: opened.stream,
        };
      },
    );
  }

  async listSelectableClientApps(): Promise<ClientAppSummary[]> {
    const entries = await this.db.getRepository('lightExtensionEntries').find({
      filter: { kind: 'client-app', healthStatus: 'ready' },
      sort: ['sort', 'title', 'entryName'],
    });
    const result: ClientAppSummary[] = [];
    for (const entry of entries) {
      try {
        const descriptor = await this.resolveClientApp(String(entry.get('id')));
        const repo = await this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: descriptor.repoId });
        if (!repo) {
          continue;
        }
        result.push({
          ...descriptor,
          repoTitle: String(repo.get('title') || repo.get('name') || descriptor.repoId),
        });
      } catch (error) {
        if (!(error instanceof LightExtensionError)) {
          throw error;
        }
      }
    }
    return result;
  }

  async listClientApps(repoId: string): Promise<ClientAppDescriptor[]> {
    const entries = await this.db.getRepository('lightExtensionEntries').find({
      filter: { repoId, kind: 'client-app' },
      sort: ['sort', 'title', 'entryName'],
    });
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repoId });
    if (!repo || repo.get('lifecycleStatus') !== 'enabled') {
      return [];
    }
    const result: ClientAppDescriptor[] = [];
    for (const entry of entries) {
      const app = await this.db.getRepository('lightExtensionClientApps').findOne({
        filterByTk: entry.get('id'),
      });
      if (app && entry.get('healthStatus') === 'ready') {
        result.push(recordsToDescriptor({ entry, app, repo }));
      }
    }
    return result;
  }

  async sweepOrphanedAssetSets(options: ClientAppAssetSweepOptions = {}): Promise<ClientAppAssetSweepResult> {
    const assets = await this.db.getRepository('lightExtensionClientAppAssets').find();
    const stagingCutoff = Date.now() - (options.stagingOlderThanMs ?? DEFAULT_STAGING_RETENTION_MS);
    const orphanedAssetSets = new Map<string, { assetSetId: string; repoId: string }>();
    for (const asset of assets) {
      const assetSetId = String(asset.get('assetSetId'));
      const repoId = String(asset.get('repoId') || '');
      if (!repoId) {
        continue;
      }
      if (asset.get('state') === 'staging' && normalizeTimestamp(asset.get('createdAt')) > stagingCutoff) {
        continue;
      }
      orphanedAssetSets.set(`${repoId}\0${assetSetId}`, { assetSetId, repoId });
    }

    const result: ClientAppAssetSweepResult = { assetSets: 0, assets: 0 };
    for (const { assetSetId, repoId } of orphanedAssetSets.values()) {
      const claimedAssets = await this.claimOrphanedAssetSet(repoId, assetSetId, options);
      if (claimedAssets > 0 && (await this.cleanupRetiringAssetSetBestEffort(assetSetId))) {
        result.assetSets += 1;
        result.assets += claimedAssets;
      }
    }
    return result;
  }

  async deleteClientApp(entryId: string): Promise<void> {
    const initialEntry = await this.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId });
    if (!initialEntry || initialEntry.get('kind') !== 'client-app') {
      throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', `Client app Entry "${entryId}" was not found`);
    }
    const repoId = String(initialEntry.get('repoId'));
    const assetSetIds = await this.db.sequelize.transaction(
      {
        isolationLevel: this.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      },
      async (transaction) => {
        await lockRepo(this.db, repoId, transaction);
        const entry = await this.db
          .getRepository('lightExtensionEntries')
          .findOne({ filterByTk: entryId, transaction });
        if (!entry || entry.get('kind') !== 'client-app' || String(entry.get('repoId')) !== repoId) {
          throw new LightExtensionError(
            'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
            `Client app Entry "${entryId}" was not found`,
          );
        }
        return this.retireAndDeleteClientAppEntries(repoId, [entry], transaction);
      },
    );
    for (const assetSetId of assetSetIds) {
      await this.cleanupRetiringAssetSetBestEffort(assetSetId);
    }
  }

  async deleteClientAppsForRepo(repoId: string): Promise<void> {
    const assetSetIds = await this.db.sequelize.transaction(
      {
        isolationLevel: this.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      },
      async (transaction) => {
        await lockRepo(this.db, repoId, transaction);
        const entries = await this.db.getRepository('lightExtensionEntries').find({
          filter: { repoId, kind: 'client-app' },
          transaction,
        });
        return this.retireAndDeleteClientAppEntries(repoId, entries, transaction);
      },
    );
    for (const assetSetId of assetSetIds) {
      await this.cleanupRetiringAssetSetBestEffort(assetSetId);
    }
  }

  private async retireAndDeleteClientAppEntries(
    repoId: string,
    entries: Model[],
    transaction: Transaction,
  ): Promise<string[]> {
    const retiringAssetSetIds = new Set<string>();
    for (const entry of entries) {
      const entryId = String(entry.get('id'));
      const assetModels = await this.db.getRepository('lightExtensionClientAppAssets').find({
        filter: { repoId, entryId },
        transaction,
      });
      for (const asset of assetModels) {
        retiringAssetSetIds.add(String(asset.get('assetSetId')));
        await asset.update({ state: 'retiring' }, { transaction });
      }
      await this.db.getModel('lightExtensionClientApps').destroy({ where: { entryId }, transaction });
      await this.db.getModel('lightExtensionEntries').destroy({ where: { id: entryId }, transaction });
    }
    return [...retiringAssetSetIds];
  }

  private async persistStagedAsset(
    repoId: string,
    assetSetId: string,
    relativePath: string,
    contentHash: string,
    storedFile: ClientAppStoredFile,
  ): Promise<void> {
    const { id: _id, ...storedFileValues } = storedFile;
    await this.db.getRepository('lightExtensionClientAppAssets').create({
      values: {
        ...storedFileValues,
        entryId: null,
        repoId,
        assetSetId,
        relativePath,
        contentHash,
        state: 'staging',
      },
    });
  }

  private async updateStagedAssetMetadata(
    assetSetId: string,
    relativePath: string,
    storedFile: ClientAppStoredFile,
  ): Promise<void> {
    const model = await this.db.getRepository('lightExtensionClientAppAssets').findOne({
      filter: { assetSetId, relativePath, state: 'staging' },
    });
    if (!model) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        `Client app asset "${relativePath}" lost its staging reservation`,
      );
    }
    const { id: _id, ...storedFileValues } = storedFile;
    await model.update(storedFileValues);
  }

  private async publishUpload(
    repoId: string,
    assetSetId: string,
    archive: PreparedClientAppArchive,
    staged: StagedClientAppAsset[],
  ): Promise<{ entryId: string; oldAssetSetId: string | null }> {
    return this.db.sequelize.transaction(async (transaction) => {
      const repo = await lockRepo(this.db, repoId, transaction);
      assertRepoModelAcceptsClientAppUpload(repo, repoId);
      const entryRepository = this.db.getRepository('lightExtensionEntries');
      let entry = await entryRepository.findOne({
        filter: {
          repoId,
          target: 'client',
          kind: 'client-app',
          entryName: archive.descriptor.key,
        },
        transaction,
      });
      const entryValues = {
        repoId,
        target: 'client',
        kind: 'client-app',
        entryName: archive.descriptor.key,
        entryPath: `client-app/${archive.descriptor.key}/${archive.entryHtml}`,
        descriptorPath: `client-app/${archive.descriptor.key}/entry.json`,
        title: archive.descriptor.title || archive.descriptor.key,
        description: archive.descriptor.description || null,
        category: archive.descriptor.category || null,
        icon: archive.descriptor.icon || null,
        tags: archive.descriptor.tags || [],
        sort: archive.descriptor.sort ?? null,
        healthStatus: 'ready',
        diagnostics: [],
      };
      if (entry) {
        await entry.update(entryValues, { transaction });
      } else {
        entry = await entryRepository.create({
          values: {
            id: `lee_${uid()}`,
            ...entryValues,
          },
          transaction,
        });
      }
      const entryId = String(entry.get('id'));
      const appRepository = this.db.getRepository('lightExtensionClientApps');
      const current = await appRepository.findOne({ filterByTk: entryId, transaction });
      const oldAssetSetId = current ? String(current.get('assetSetId')) : null;
      const stagedAssetModels = await this.db.getRepository('lightExtensionClientAppAssets').find({
        filter: { repoId, assetSetId, state: 'staging' },
        transaction,
      });
      assertPersistedStagingMatches(stagedAssetModels, staged, assetSetId);
      for (const asset of stagedAssetModels) {
        await asset.update({ entryId, state: 'ready' }, { transaction });
      }
      await this.hooks.beforePointerSwitch?.();
      const appValues = {
        entryId,
        entryHtml: archive.entryHtml,
        staticRoot: archive.staticRoot,
        assetSetId,
        contentHash: archive.contentHash,
        fileCount: archive.fileCount,
        byteSize: archive.byteSize,
      };
      if (current) {
        await current.update(appValues, { transaction });
      } else {
        await appRepository.create({ values: appValues, transaction });
      }
      if (oldAssetSetId) {
        const oldAssets = await this.db.getRepository('lightExtensionClientAppAssets').find({
          filter: { repoId, assetSetId: oldAssetSetId },
          transaction,
        });
        for (const asset of oldAssets) {
          await asset.update({ state: 'retiring' }, { transaction });
        }
      }
      return {
        entryId,
        oldAssetSetId,
      };
    });
  }

  private async retireAssetSetBestEffort(
    repoId: string,
    assetSetId: string,
    fallbackAssets: readonly ClientAppStoredFile[] = [],
    options: ClientAppAssetSweepOptions = {},
  ): Promise<boolean> {
    try {
      const claimedAssets = await this.claimOrphanedAssetSet(repoId, assetSetId, options);
      if (claimedAssets === 0 && fallbackAssets.length === 0) {
        return false;
      }
      return this.cleanupRetiringAssetSetBestEffort(assetSetId, fallbackAssets);
    } catch (error) {
      this.hooks.onCleanupError?.(error, assetSetId);
      return false;
    }
  }

  private async claimOrphanedAssetSet(
    repoId: string,
    assetSetId: string,
    options: ClientAppAssetSweepOptions,
  ): Promise<number> {
    return this.db.sequelize.transaction(async (transaction) => {
      await lockRepoIfExists(this.db, repoId, transaction);
      const current = await this.db.getRepository('lightExtensionClientApps').findOne({
        filter: { assetSetId },
        transaction,
      });
      if (current) {
        return 0;
      }
      const models = await this.db.getRepository('lightExtensionClientAppAssets').find({
        filter: { repoId, assetSetId },
        transaction,
      });
      if (!models.length) {
        return 0;
      }
      const stagingCutoff = Date.now() - (options.stagingOlderThanMs ?? DEFAULT_STAGING_RETENTION_MS);
      if (
        models.some(
          (model) => model.get('state') === 'staging' && normalizeTimestamp(model.get('createdAt')) > stagingCutoff,
        )
      ) {
        return 0;
      }
      for (const model of models) {
        await model.update({ state: 'retiring' }, { transaction });
      }
      return models.length;
    });
  }

  private async cleanupRetiringAssetSetBestEffort(
    assetSetId: string | null,
    fallbackAssets: readonly ClientAppStoredFile[] = [],
  ): Promise<boolean> {
    if (!assetSetId) {
      return false;
    }
    try {
      await this.hooks.beforeOldAssetCleanup?.(assetSetId);
      const models = await this.db.getRepository('lightExtensionClientAppAssets').find({
        filter: { assetSetId },
      });
      if (models.some((model) => model.get('state') !== 'retiring')) {
        return false;
      }
      const assets = dedupeStoredFiles([...models.map(storedFileFromModel), ...fallbackAssets]);
      if (!assets.length) {
        return false;
      }
      await this.storage.delete(assets);
      await this.db.getModel('lightExtensionClientAppAssets').destroy({
        where: { assetSetId },
        hooks: false,
      });
      return true;
    } catch (error) {
      this.hooks.onCleanupError?.(error, assetSetId);
      return false;
    }
  }

  private async loadClientAppRecords(
    entryId: string,
    transaction?: Transaction,
    lockRepository?: 'share' | 'update',
  ): Promise<ClientAppRecords> {
    let entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction,
    });
    if (!entry || entry.get('kind') !== 'client-app') {
      throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', `Client app Entry "${entryId}" was not found`);
    }
    const repoId = String(entry.get('repoId'));
    const lockedRepo =
      lockRepository && transaction ? await lockRepo(this.db, repoId, transaction, lockRepository) : null;
    if (lockedRepo) {
      entry = await this.db.getRepository('lightExtensionEntries').findOne({ filterByTk: entryId, transaction });
      if (!entry || entry.get('kind') !== 'client-app') {
        throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', `Client app Entry "${entryId}" was not found`);
      }
    }
    const [app, repo] = await Promise.all([
      this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: entryId, transaction }),
      lockedRepo
        ? Promise.resolve(lockedRepo)
        : this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repoId, transaction }),
    ]);
    if (!app || !repo) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
        `Client app Entry "${entryId}" has no assets`,
      );
    }
    return { entry, app, repo };
  }
}

function assertPersistedStagingMatches(models: Model[], staged: StagedClientAppAsset[], assetSetId: string): void {
  if (models.length !== staged.length) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_ERROR',
      `Client app asset set "${assetSetId}" has incomplete staging metadata`,
    );
  }
  const persistedByPath = new Map(models.map((model) => [String(model.get('relativePath')), model]));
  for (const expected of staged) {
    const persisted = persistedByPath.get(expected.relativePath);
    if (!persisted || persisted.get('contentHash') !== expected.contentHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        `Client app asset set "${assetSetId}" has inconsistent staging metadata`,
      );
    }
  }
}

async function lockRepo(
  db: Database,
  repoId: string,
  transaction: Transaction,
  lockMode: 'share' | 'update' = 'update',
): Promise<Model> {
  const repo = await lockRepoIfExists(db, repoId, transaction, lockMode);
  if (!repo) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REPO_NOT_FOUND',
      `Light extension repository "${repoId}" was not found`,
    );
  }
  return repo;
}

async function lockRepoIfExists(
  db: Database,
  repoId: string,
  transaction: Transaction,
  lockMode: 'share' | 'update' = 'update',
): Promise<Model | null> {
  return db.getModel('lightExtensionRepos').findOne({
    where: { id: repoId },
    transaction,
    lock: lockMode === 'share' ? transaction.LOCK.SHARE : transaction.LOCK.UPDATE,
  });
}

function assertRepoAcceptsClientAppUpload(repo: LightExtensionRepoRecord): void {
  if (repo.lifecycleStatus === 'archived') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', 'Archived repositories cannot upload client apps');
  }
  if (repo.lifecycleStatus === 'disabled') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_DISABLED', 'Disabled repositories cannot upload client apps');
  }
}

function assertRepoModelAcceptsClientAppUpload(repo: Model, repoId: string): void {
  const lifecycleStatus = repo.get('lifecycleStatus');
  if (lifecycleStatus === 'archived') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', `Repository "${repoId}" is archived`);
  }
  if (lifecycleStatus !== 'enabled') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_DISABLED', `Repository "${repoId}" is disabled`);
  }
}

function assertClientAppRecordsAvailable(records: ClientAppRecords, entryId: string): void {
  const lifecycleStatus = records.repo.get('lifecycleStatus');
  if (lifecycleStatus === 'archived') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', `Client app Entry "${entryId}" is archived`);
  }
  if (lifecycleStatus !== 'enabled') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_DISABLED', `Client app Entry "${entryId}" is disabled`);
  }
  if (records.entry.get('healthStatus') !== 'ready') {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
      `Client app Entry "${entryId}" is unavailable`,
    );
  }
}

function recordsToDescriptor(records: ClientAppRecords): ClientAppDescriptor {
  return {
    entryId: String(records.entry.get('id')),
    repoId: String(records.entry.get('repoId')),
    key: String(records.entry.get('entryName')),
    kind: 'client-app',
    title: String(records.entry.get('title') || records.entry.get('entryName')),
    description: nullableString(records.entry.get('description')),
    category: nullableString(records.entry.get('category')),
    icon: nullableString(records.entry.get('icon')),
    tags: Array.isArray(records.entry.get('tags'))
      ? (records.entry.get('tags') as unknown[]).filter((item): item is string => typeof item === 'string')
      : [],
    sort: nullableNumber(records.entry.get('sort')),
    entryHtml: String(records.app.get('entryHtml')),
    staticRoot: String(records.app.get('staticRoot') || ''),
    contentHash: String(records.app.get('contentHash')),
    fileCount: Number(records.app.get('fileCount')),
    byteSize: Number(records.app.get('byteSize')),
    updatedAt: normalizeDate(records.app.get('updatedAt')),
    available: true,
    enabled: true,
    ready: true,
  };
}

function storedFileFromModel(model: Model): ClientAppStoredFile {
  const storageId = model.get('storageId');
  if (typeof storageId !== 'string' && typeof storageId !== 'number') {
    throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Client app asset storage is unavailable');
  }
  return {
    id: model.get('id') as string | number,
    title: String(model.get('title') || ''),
    filename: String(model.get('filename')),
    ...(typeof model.get('extname') === 'string' ? { extname: model.get('extname') as string } : {}),
    size: Number(model.get('size')),
    ...(typeof model.get('mimetype') === 'string' ? { mimetype: model.get('mimetype') as string } : {}),
    path: String(model.get('path') || ''),
    ...(typeof model.get('url') === 'string' ? { url: model.get('url') as string } : {}),
    storageId,
    ...(isRecord(model.get('meta')) ? { meta: model.get('meta') as Record<string, unknown> } : {}),
  };
}

function normalizeAssetPath(value: string): string {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.includes('\\') || value.startsWith('/')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Client app asset path is invalid');
  }
  const normalized = path.posix.normalize(value);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../') || normalized !== value) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Client app asset path is invalid');
  }
  return normalized;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' && value ? value : null;
}

function normalizeTimestamp(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  return 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function dedupeStoredFiles(files: readonly ClientAppStoredFile[]): ClientAppStoredFile[] {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${String(file.storageId)}\0${file.path}\0${file.filename}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function verifyStagedAsset(
  storage: ClientAppAssetStorage,
  storedFile: ClientAppStoredFile,
  expectedHash: string,
  expectedSize: number,
  relativePath: string,
): Promise<void> {
  const { stream } = await storage.open(storedFile);
  const hash = createHash('sha256');
  let byteSize = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteSize += buffer.length;
    hash.update(buffer);
  }
  if (byteSize !== expectedSize || hash.digest('hex') !== expectedHash) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_ERROR',
      `Client app asset "${relativePath}" failed storage verification`,
      {
        details: { relativePath, expectedSize, actualSize: byteSize },
      },
    );
  }
}
