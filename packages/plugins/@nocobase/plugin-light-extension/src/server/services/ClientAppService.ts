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
import { contentType as formatContentType, lookup as lookupMimeType } from 'mime-types';
import { defaultTreeAdapter, html, parse, serialize, type DefaultTreeAdapterTypes } from 'parse5';
import path from 'path';
import type { Readable } from 'stream';

import { isLightExtensionError, LightExtensionError } from '../../shared/errors';
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

export interface ClientAppStaticRequest {
  entryId: string;
  relativePath: string;
  workspaceRoot: string;
  publicPath: string;
  apiBaseUrl: string;
  method: 'GET' | 'HEAD';
  accept?: string;
  fetchDestination?: string;
  ifNoneMatch?: string;
}

export interface ClientAppStaticResponse {
  status: 200 | 304 | 404;
  headers: Readonly<Record<string, string>>;
  body?: Buffer | Readable;
}

export type ClientAppEntryDeleteGuard = (entryId: string, transaction: Transaction) => Promise<void>;

export type ClientAppRepoDeleteGuard = (repoId: string, transaction: Transaction) => Promise<void>;

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
const CLIENT_APP_CACHE_CONTROL = 'no-cache';
const CLIENT_APP_RUNTIME_SCRIPT_ATTRIBUTE = 'data-nocobase-client-app-runtime';
const NOT_FOUND_BODY = Buffer.from('Not Found');

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

interface NormalizedClientAppStaticRequest extends ClientAppStaticRequest {
  relativePath: string;
  workspaceRoot: string;
  publicPath: string;
  apiBaseUrl: string;
}

export class ClientAppService {
  private entryDeleteGuard?: ClientAppEntryDeleteGuard;

  private repoDeleteGuard?: ClientAppRepoDeleteGuard;

  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly storage: ClientAppAssetStorage,
    private readonly hooks: ClientAppServiceHooks = {},
  ) {}

  useEntryDeleteGuard(guard: ClientAppEntryDeleteGuard): () => void {
    this.entryDeleteGuard = guard;
    return () => {
      if (this.entryDeleteGuard === guard) {
        this.entryDeleteGuard = undefined;
      }
    };
  }

  useRepoDeleteGuard(guard: ClientAppRepoDeleteGuard): () => void {
    this.repoDeleteGuard = guard;
    return () => {
      if (this.repoDeleteGuard === guard) {
        this.repoDeleteGuard = undefined;
      }
    };
  }

  async upload(
    input: { repoId: string; zipPath: string; expectedEntryId?: string; expectedContentHash?: string },
    ctx: LightExtensionServiceContext = {},
  ): Promise<ClientAppDescriptor> {
    await this.permissionService.assertActionAllowed({ action: 'writeSource', ctx });
    const repo = await this.repoService.getRepo(input.repoId, ctx);
    assertRepoAcceptsClientAppUpload(repo);
    if (input.expectedContentHash && !input.expectedEntryId) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'expectedEntryId is required when expectedContentHash is provided',
      );
    }
    const archive = await prepareClientAppArchive(input.zipPath);
    await this.assertExpectedReplacementTarget(repo.id, input.expectedEntryId, input.expectedContentHash, archive);
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

      const result = await this.publishUpload(
        repo.id,
        assetSetId,
        archive,
        staged,
        input.expectedEntryId,
        input.expectedContentHash,
      );
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

  async serveClientAppAsset(input: ClientAppStaticRequest): Promise<ClientAppStaticResponse> {
    const request = normalizeStaticRequest(input);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const descriptor = await this.resolveClientApp(request.entryId);
      try {
        return await this.serveResolvedClientAppAsset(descriptor, request);
      } catch (error) {
        if (attempt === 0 && isLightExtensionError(error) && error.code === 'LIGHT_EXTENSION_SOURCE_OUTDATED') {
          continue;
        }
        throw error;
      }
    }
    throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED', 'Client app changed while serving its assets');
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
        await this.entryDeleteGuard?.(entryId, transaction);
        return this.retireAndDeleteClientAppEntries(repoId, [entry], transaction);
      },
    );
    for (const assetSetId of assetSetIds) {
      await this.cleanupRetiringAssetSetBestEffort(assetSetId);
    }
  }

  async deleteClientAppsForRepo(repoId: string): Promise<void> {
    await this.db.sequelize.transaction(
      {
        isolationLevel: this.db.options.dialect === 'sqlite' ? undefined : Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      },
      async (transaction) => {
        await lockRepo(this.db, repoId, transaction);
        await this.repoDeleteGuard?.(repoId, transaction);
        return this.retireClientAppsForRepo(repoId, transaction);
      },
    );
  }

  private async assertExpectedReplacementTarget(
    repoId: string,
    expectedEntryId: string | undefined,
    expectedContentHash: string | undefined,
    archive: PreparedClientAppArchive,
  ): Promise<void> {
    if (!expectedEntryId) {
      return;
    }
    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: expectedEntryId,
    });
    if (!entry || entry.get('repoId') !== repoId || entry.get('kind') !== 'client-app') {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Client app Entry "${expectedEntryId}" was not found`,
      );
    }
    const expectedKey = String(entry.get('entryName'));
    if (archive.descriptor.key !== expectedKey) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        `Replacement ZIP entry key must be "${expectedKey}"`,
        {
          details: {
            category: 'client-app-replacement',
            expectedEntryId,
            expectedKey,
            actualKey: archive.descriptor.key,
          },
        },
      );
    }
    if (expectedContentHash) {
      const clientApp = await this.db.getRepository('lightExtensionClientApps').findOne({
        filterByTk: expectedEntryId,
      });
      if (!clientApp || clientApp.get('contentHash') !== expectedContentHash) {
        throw staleReplacementError(expectedEntryId, expectedContentHash, clientApp?.get('contentHash'));
      }
    }
  }

  async retireClientAppsForRepo(repoId: string, transaction: Transaction): Promise<string[]> {
    const entries = await this.db.getRepository('lightExtensionEntries').find({
      filter: { repoId, kind: 'client-app' },
      transaction,
    });
    const assetSetIds = await this.retireAndDeleteClientAppEntries(repoId, entries, transaction);
    if (assetSetIds.length > 0) {
      transaction.afterCommit(async () => {
        for (const assetSetId of assetSetIds) {
          await this.cleanupRetiringAssetSetBestEffort(assetSetId);
        }
      });
    }
    return assetSetIds;
  }

  private async serveResolvedClientAppAsset(
    descriptor: ClientAppDescriptor,
    request: NormalizedClientAppStaticRequest,
  ): Promise<ClientAppStaticResponse> {
    const entryAssetPath = getClientAppEntryAssetPath(descriptor);
    const requestedAssetPath = request.relativePath || entryAssetPath;
    let asset = await this.openClientAppAsset(descriptor.entryId, requestedAssetPath, {
      expectedContentHash: descriptor.contentHash,
    });
    let servesEntryHtml = requestedAssetPath === entryAssetPath;

    if (
      !asset &&
      request.relativePath &&
      isHtmlDocumentNavigation(request) &&
      path.posix.extname(request.relativePath) === ''
    ) {
      asset = await this.openClientAppAsset(descriptor.entryId, entryAssetPath, {
        expectedContentHash: descriptor.contentHash,
      });
      servesEntryHtml = true;
    }

    if (!asset) {
      return notFoundStaticResponse(request.method);
    }
    if (servesEntryHtml) {
      return createEntryHtmlResponse(asset, request);
    }
    return createStaticAssetResponse(asset, request);
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
    expectedEntryId?: string,
    expectedContentHash?: string,
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
      if (expectedEntryId && entry?.get('id') !== expectedEntryId) {
        throw staleReplacementError(expectedEntryId, expectedContentHash, undefined, entry?.get('id'));
      }
      if (expectedEntryId && expectedContentHash) {
        const currentClientApp = await this.db.getRepository('lightExtensionClientApps').findOne({
          filterByTk: expectedEntryId,
          transaction,
        });
        if (!currentClientApp || currentClientApp.get('contentHash') !== expectedContentHash) {
          throw staleReplacementError(
            expectedEntryId,
            expectedContentHash,
            currentClientApp?.get('contentHash'),
            entry?.get('id'),
          );
        }
      }
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

function staleReplacementError(
  expectedEntryId: string,
  expectedContentHash?: string,
  currentContentHash?: unknown,
  currentEntryId?: unknown,
): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_SOURCE_OUTDATED',
    `Client app Entry "${expectedEntryId}" changed before replacement was published`,
    {
      details: {
        category: 'client-app-replacement-stale',
        expectedEntryId,
        expectedContentHash: expectedContentHash || null,
        currentEntryId: typeof currentEntryId === 'string' ? currentEntryId : null,
        currentContentHash: typeof currentContentHash === 'string' ? currentContentHash : null,
      },
    },
  );
}

function normalizeStaticRequest(input: ClientAppStaticRequest): NormalizedClientAppStaticRequest {
  if (input.method !== 'GET' && input.method !== 'HEAD') {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Client app static requests must use GET or HEAD');
  }
  return {
    ...input,
    entryId: requireNonEmptyString(input.entryId, 'entryId'),
    relativePath: normalizeStaticAssetPath(input.relativePath),
    workspaceRoot: normalizeRootRelativeUrl(input.workspaceRoot, 'workspaceRoot'),
    publicPath: normalizeRootRelativeUrl(input.publicPath, 'publicPath'),
    apiBaseUrl: normalizeApiBaseUrl(input.apiBaseUrl),
  };
}

function normalizeStaticAssetPath(value: string): string {
  if (value === '') {
    return '';
  }
  return normalizeAssetPath(assertDecodedPathSafe(value, 'Client app asset path'));
}

function normalizeRootRelativeUrl(value: string, field: string): string {
  const source = requireNonEmptyString(value, field);
  if (!source.startsWith('/') || source.startsWith('//') || source.includes('?') || source.includes('#')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} must be a root-relative URL path`);
  }
  const safePath = assertDecodedPathSafe(source, field);
  const normalized = path.posix.normalize(safePath);
  if (!normalized.startsWith('/')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} must be a root-relative URL path`);
  }
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function normalizeApiBaseUrl(value: string): string {
  const source = requireNonEmptyString(value, 'apiBaseUrl');
  if (source.startsWith('/')) {
    return normalizeRootRelativeUrl(source, 'apiBaseUrl');
  }
  let parsed: URL;
  try {
    parsed = new URL(source);
  } catch (error) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'apiBaseUrl must be an HTTP(S) URL or root path');
  }
  if (
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'apiBaseUrl must be an HTTP(S) URL or root path');
  }
  parsed.pathname = path.posix.normalize(parsed.pathname || '/');
  if (!parsed.pathname.endsWith('/')) {
    parsed.pathname += '/';
  }
  return parsed.toString();
}

function assertDecodedPathSafe(value: string, field: string): string {
  if (value.includes('\0') || value.includes('\\')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} is invalid`);
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch (error) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} is invalid`);
  }
  if (
    decoded.includes('\0') ||
    decoded.includes('\\') ||
    decoded
      .split('/')
      .filter(Boolean)
      .some((segment) => segment === '..')
  ) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} is invalid`);
  }
  return value;
}

function requireNonEmptyString(value: string, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} is required`);
  }
  return value.trim();
}

function getClientAppEntryAssetPath(descriptor: ClientAppDescriptor): string {
  const prefix = descriptor.staticRoot ? `${descriptor.staticRoot}/` : '';
  if (prefix && !descriptor.entryHtml.startsWith(prefix)) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
      `Client app Entry "${descriptor.entryId}" has an invalid static root`,
    );
  }
  return normalizeAssetPath(prefix ? descriptor.entryHtml.slice(prefix.length) : descriptor.entryHtml);
}

function isHtmlDocumentNavigation(request: NormalizedClientAppStaticRequest): boolean {
  const destination = request.fetchDestination?.trim().toLowerCase();
  if (destination) {
    return destination === 'document' || destination === 'frame' || destination === 'iframe';
  }
  return (request.accept || '')
    .split(',')
    .map((value) => value.split(';', 1)[0].trim().toLowerCase())
    .some((value) => value === 'text/html' || value === 'application/xhtml+xml');
}

async function createEntryHtmlResponse(
  asset: ClientAppAsset,
  request: NormalizedClientAppStaticRequest,
): Promise<ClientAppStaticResponse> {
  const source = await readAssetBuffer(asset);
  const body = Buffer.from(
    transformClientAppHtml(source.toString('utf8'), {
      apiBaseUrl: request.apiBaseUrl,
      publicPath: request.publicPath,
      workspaceRoot: request.workspaceRoot,
    }),
  );
  const etag = formatEntityTag(createHash('sha256').update(body).digest('hex'));
  const headers = staticHeaders('text/html; charset=utf-8', etag, body.length);
  if (entityTagMatches(request.ifNoneMatch, etag)) {
    return { status: 304, headers: withoutContentLength(headers) };
  }
  return {
    status: 200,
    headers,
    ...(request.method === 'GET' ? { body } : {}),
  };
}

function createStaticAssetResponse(
  asset: ClientAppAsset,
  request: NormalizedClientAppStaticRequest,
): ClientAppStaticResponse {
  const etag = formatEntityTag(asset.contentHash);
  const contentType = resolveAssetContentType(asset);
  const headers = staticHeaders(contentType, etag, asset.size);
  if (entityTagMatches(request.ifNoneMatch, etag)) {
    asset.stream.destroy();
    return { status: 304, headers: withoutContentLength(headers) };
  }
  if (request.method === 'HEAD') {
    asset.stream.destroy();
    return { status: 200, headers };
  }
  return { status: 200, headers, body: asset.stream };
}

function notFoundStaticResponse(method: 'GET' | 'HEAD'): ClientAppStaticResponse {
  return {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Length': String(NOT_FOUND_BODY.length),
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
    ...(method === 'GET' ? { body: NOT_FOUND_BODY } : {}),
  };
}

function staticHeaders(contentType: string, etag: string, contentLength: number): Readonly<Record<string, string>> {
  return {
    'Cache-Control': CLIENT_APP_CACHE_CONTROL,
    'Content-Length': String(contentLength),
    'Content-Type': contentType,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
  };
}

function withoutContentLength(headers: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  const { 'Content-Length': _contentLength, ...rest } = headers;
  return rest;
}

function resolveAssetContentType(asset: ClientAppAsset): string {
  const logicalType = asset.mimeType || lookupMimeType(asset.relativePath) || 'application/octet-stream';
  return formatContentType(logicalType) || String(logicalType);
}

function formatEntityTag(contentHash: string): string {
  return `"sha256-${contentHash}"`;
}

function entityTagMatches(ifNoneMatch: string | undefined, entityTag: string): boolean {
  if (!ifNoneMatch) {
    return false;
  }
  const expected = normalizeEntityTag(entityTag);
  return ifNoneMatch.split(',').some((value) => {
    const candidate = value.trim();
    return candidate === '*' || normalizeEntityTag(candidate) === expected;
  });
}

function normalizeEntityTag(value: string): string {
  return value.replace(/^W\//u, '');
}

async function readAssetBuffer(asset: ClientAppAsset): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let byteSize = 0;
  for await (const chunk of asset.stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    byteSize += buffer.length;
    chunks.push(buffer);
  }
  if (byteSize !== asset.size) {
    throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Client app HTML asset size is invalid');
  }
  return Buffer.concat(chunks, byteSize);
}

function transformClientAppHtml(
  source: string,
  runtime: { workspaceRoot: string; publicPath: string; apiBaseUrl: string },
): string {
  const document = parse(source);
  const head = findFirstElement(document, 'head');
  if (!head) {
    throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'Client app HTML has no document head');
  }

  const bases = findElements(document, 'base');
  const base = bases.shift() || defaultTreeAdapter.createElement('base', html.NS.HTML, []);
  setElementAttribute(base, 'href', runtime.workspaceRoot);
  for (const duplicate of bases) {
    defaultTreeAdapter.detachNode(duplicate);
  }
  defaultTreeAdapter.detachNode(base);
  if (head.childNodes[0]) {
    defaultTreeAdapter.insertBefore(head, base, head.childNodes[0]);
  } else {
    defaultTreeAdapter.appendChild(head, base);
  }

  for (const script of findElements(document, 'script').filter((element) =>
    element.attrs.some((attribute) => attribute.name === CLIENT_APP_RUNTIME_SCRIPT_ATTRIBUTE),
  )) {
    defaultTreeAdapter.detachNode(script);
  }
  const runtimeScript = defaultTreeAdapter.createElement('script', html.NS.HTML, [
    { name: CLIENT_APP_RUNTIME_SCRIPT_ATTRIBUTE, value: '' },
  ]);
  defaultTreeAdapter.insertText(
    runtimeScript,
    [
      `window['__nocobase_public_path__'] = ${serializeInlineScriptValue(runtime.publicPath)};`,
      `window['__nocobase_api_base_url__'] = ${serializeInlineScriptValue(runtime.apiBaseUrl)};`,
    ].join('\n'),
  );
  if (head.childNodes[1]) {
    defaultTreeAdapter.insertBefore(head, runtimeScript, head.childNodes[1]);
  } else {
    defaultTreeAdapter.appendChild(head, runtimeScript);
  }
  return serialize(document);
}

function findFirstElement(node: DefaultTreeAdapterTypes.Node, tagName: string): DefaultTreeAdapterTypes.Element | null {
  return findElements(node, tagName)[0] || null;
}

function findElements(node: DefaultTreeAdapterTypes.Node, tagName: string): DefaultTreeAdapterTypes.Element[] {
  const matches: DefaultTreeAdapterTypes.Element[] = [];
  const visit = (current: DefaultTreeAdapterTypes.Node) => {
    if (defaultTreeAdapter.isElementNode(current) && current.tagName === tagName) {
      matches.push(current);
    }
    if ('childNodes' in current) {
      for (const child of current.childNodes) {
        visit(child);
      }
    }
  };
  visit(node);
  return matches;
}

function setElementAttribute(element: DefaultTreeAdapterTypes.Element, name: string, value: string): void {
  element.attrs = [...element.attrs.filter((attribute) => attribute.name !== name), { name, value }];
}

function serializeInlineScriptValue(value: string): string {
  return JSON.stringify(value)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
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
