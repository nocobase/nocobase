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
  entryHtml: string;
  contentHash: string;
  fileCount: number;
  byteSize: number;
  updatedAt: string | null;
}

export interface ClientAppSummary {
  entryId: string;
  repoId: string;
  key: string;
  title: string;
  repoTitle: string;
}

export interface ClientAppAsset {
  relativePath: string;
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
}

export interface ClientAppStaticResponse {
  status: 200 | 404;
  headers: Readonly<Record<string, string>>;
  body?: Buffer | Readable;
}

export interface ClientAppReference {
  entryId: string;
  ownerKind: string;
  ownerId: string;
}

export type ClientAppReferenceResolver = (
  entryIds: readonly string[],
  transaction: Transaction,
) => Promise<readonly ClientAppReference[]>;

export interface ClientAppServiceOptions {
  onCleanupError?: (error: unknown, assetSetId: string) => void;
}

const CLIENT_APP_CACHE_CONTROL = 'no-cache';
const CLIENT_APP_RUNTIME_SCRIPT_ATTRIBUTE = 'data-nocobase-client-app-runtime';
const NOT_FOUND_BODY = Buffer.from('Not Found');

interface StagedClientAppAsset {
  relativePath: string;
  storedFile: ClientAppStoredFile;
}

interface ClientAppRecords {
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
  private readonly referenceResolvers = new Set<ClientAppReferenceResolver>();

  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly storage: ClientAppAssetStorage,
    private readonly options: ClientAppServiceOptions = {},
  ) {}

  useReferenceResolver(resolver: ClientAppReferenceResolver): () => void {
    this.referenceResolvers.add(resolver);
    return () => {
      this.referenceResolvers.delete(resolver);
    };
  }

  async upload(
    input: { repoId: string; zipPath: string; expectedEntryId?: string },
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
      await this.assertExpectedReplacementTarget(repo.id, input.expectedEntryId, archive);
      for (const asset of archive.assets) {
        const storedFile = await this.storage.store({
          assetSetId,
          relativePath: asset.relativePath,
          filePath: asset.filePath,
          byteSize: asset.byteSize,
        });
        staged.push({ relativePath: asset.relativePath, storedFile });
      }
      await this.persistStagedAssets(repo.id, assetSetId, staged);
      const result = await this.publishUpload(repo.id, assetSetId, archive, input.expectedEntryId);
      published = true;
      await this.cleanupAssetSetBestEffort(result.oldAssetSetId);
      return this.resolveClientApp(result.entryId);
    } finally {
      if (!published) {
        await this.discardStagedAssetSetBestEffort(
          assetSetId,
          staged.map((asset) => asset.storedFile),
        );
      }
      await archive.dispose().catch((error) => this.options.onCleanupError?.(error, assetSetId));
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
            `Client app "${entryId}" changed before its asset was opened`,
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
    const apps = await this.db.getRepository('lightExtensionClientApps').find({ sort: ['title', 'key'] });
    const repoIds = [...new Set(apps.map((app) => String(app.get('repoId'))))];
    const repos = repoIds.length
      ? await this.db.getRepository('lightExtensionRepos').find({ filter: { id: { $in: repoIds } } })
      : [];
    const repoById = new Map<string, Model>(
      repos.map((repo: Model): [string, Model] => [String(repo.get('id')), repo]),
    );
    return apps.flatMap((app) => {
      const repo = repoById.get(String(app.get('repoId')));
      if (!repo || repo.get('lifecycleStatus') !== 'enabled') {
        return [];
      }
      return [
        {
          entryId: String(app.get('id')),
          repoId: String(app.get('repoId')),
          key: String(app.get('key')),
          title: String(app.get('title') || app.get('key')),
          repoTitle: String(repo.get('title') || repo.get('name') || app.get('repoId')),
        },
      ];
    });
  }

  async listClientApps(repoId: string): Promise<ClientAppDescriptor[]> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repoId });
    if (!repo || repo.get('lifecycleStatus') !== 'enabled') {
      return [];
    }
    const apps = await this.db.getRepository('lightExtensionClientApps').find({
      filter: { repoId },
      sort: ['title', 'key'],
    });
    return apps.map((app) => recordsToDescriptor({ app, repo }));
  }

  async deleteClientApp(entryId: string): Promise<void> {
    const initial = await this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: entryId });
    if (!initial) {
      throw clientAppNotFound(entryId);
    }
    const repoId = String(initial.get('repoId'));
    const assetSetId = await this.db.sequelize.transaction(async (transaction) => {
      await lockRepo(this.db, repoId, transaction);
      const app = await this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: entryId, transaction });
      if (!app || String(app.get('repoId')) !== repoId) {
        throw clientAppNotFound(entryId);
      }
      await this.assertEntriesNotReferenced([entryId], transaction);
      const currentAssetSetId = String(app.get('assetSetId'));
      await this.db.getRepository('lightExtensionClientApps').destroy({ filterByTk: entryId, transaction });
      return currentAssetSetId;
    });
    await this.cleanupAssetSetBestEffort(assetSetId);
  }

  async listReferencesForRepo(repoId: string, transaction: Transaction): Promise<ClientAppReference[]> {
    const apps = await this.db.getRepository('lightExtensionClientApps').find({
      filter: { repoId },
      fields: ['id'],
      transaction,
    });
    return this.resolveReferences(
      apps.map((app) => String(app.get('id'))),
      transaction,
    );
  }

  async retireClientAppsForRepo(repoId: string, transaction: Transaction): Promise<void> {
    const apps = await this.db.getRepository('lightExtensionClientApps').find({ filter: { repoId }, transaction });
    const assetSetIds = apps.map((app) => String(app.get('assetSetId'))).filter(Boolean);
    if (assetSetIds.length) {
      await this.db.getRepository('lightExtensionClientApps').destroy({ filter: { repoId }, transaction });
      transaction.afterCommit(async () => {
        for (const assetSetId of assetSetIds) {
          await this.cleanupAssetSetBestEffort(assetSetId);
        }
      });
    }
  }

  private async assertExpectedReplacementTarget(
    repoId: string,
    expectedEntryId: string | undefined,
    archive: PreparedClientAppArchive,
  ): Promise<void> {
    if (!expectedEntryId) {
      return;
    }
    const app = await this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: expectedEntryId });
    if (!app || app.get('repoId') !== repoId) {
      throw clientAppNotFound(expectedEntryId);
    }
    const expectedKey = String(app.get('key'));
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
    return servesEntryHtml ? createEntryHtmlResponse(asset, request) : createStaticAssetResponse(asset, request);
  }

  private async persistStagedAssets(repoId: string, assetSetId: string, assets: StagedClientAppAsset[]): Promise<void> {
    await this.db.getModel<Model>('lightExtensionClientAppAssets').bulkCreate(
      assets.map((asset) => {
        const { id: _id, ...storedFile } = asset.storedFile;
        return {
          ...storedFile,
          repoId,
          assetSetId,
          relativePath: asset.relativePath,
        };
      }),
    );
  }

  private async publishUpload(
    repoId: string,
    assetSetId: string,
    archive: PreparedClientAppArchive,
    expectedEntryId?: string,
  ): Promise<{ entryId: string; oldAssetSetId: string | null }> {
    return this.db.sequelize.transaction(async (transaction) => {
      const repo = await lockRepo(this.db, repoId, transaction);
      assertRepoModelAcceptsClientAppUpload(repo, repoId);
      const repository = this.db.getRepository('lightExtensionClientApps');
      const current = await repository.findOne({
        filter: { repoId, key: archive.descriptor.key },
        transaction,
      });
      if (expectedEntryId && current?.get('id') !== expectedEntryId) {
        throw staleReplacementError(expectedEntryId, current?.get('id'));
      }

      const entryId = current ? String(current.get('id')) : `leca_${uid()}`;

      const values = {
        id: entryId,
        repoId,
        key: archive.descriptor.key,
        title: archive.descriptor.title || archive.descriptor.key,
        entryHtml: archive.entryHtml,
        assetSetId,
        contentHash: archive.contentHash,
        fileCount: archive.fileCount,
        byteSize: archive.byteSize,
      };
      const oldAssetSetId = current ? String(current.get('assetSetId')) : null;
      if (current) {
        await current.update(values, { transaction });
      } else {
        await repository.create({ values, transaction });
      }
      return { entryId, oldAssetSetId };
    });
  }

  private async discardStagedAssetSetBestEffort(
    assetSetId: string,
    files: readonly ClientAppStoredFile[],
  ): Promise<void> {
    try {
      if (files.length) {
        await this.storage.delete(dedupeStoredFiles(files));
      }
      await this.db.getModel('lightExtensionClientAppAssets').destroy({ where: { assetSetId }, hooks: false });
    } catch (error) {
      this.options.onCleanupError?.(error, assetSetId);
    }
  }

  private async cleanupAssetSetBestEffort(assetSetId: string | null): Promise<void> {
    if (!assetSetId) {
      return;
    }
    try {
      const models = await this.db.getRepository('lightExtensionClientAppAssets').find({ filter: { assetSetId } });
      if (!models.length) {
        return;
      }
      await this.storage.delete(dedupeStoredFiles(models.map(storedFileFromModel)));
      await this.db.getModel('lightExtensionClientAppAssets').destroy({ where: { assetSetId }, hooks: false });
    } catch (error) {
      this.options.onCleanupError?.(error, assetSetId);
    }
  }

  private async assertEntriesNotReferenced(entryIds: readonly string[], transaction: Transaction): Promise<void> {
    const references = await this.resolveReferences(entryIds, transaction);
    if (!references.length) {
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_REFERENCE_EXISTS',
      'Client app is referenced and cannot be deleted',
      {
        details: {
          entryId: entryIds.length === 1 ? entryIds[0] : undefined,
          referenceCount: references.length,
          references,
        },
      },
    );
  }

  private async resolveReferences(
    entryIds: readonly string[],
    transaction: Transaction,
  ): Promise<ClientAppReference[]> {
    if (!entryIds.length || !this.referenceResolvers.size) {
      return [];
    }
    const references = (
      await Promise.all([...this.referenceResolvers].map((resolver) => resolver(entryIds, transaction)))
    ).flat();
    const unique = new Map<string, ClientAppReference>();
    for (const reference of references) {
      if (!entryIds.includes(reference.entryId) || !reference.ownerKind || !reference.ownerId) {
        continue;
      }
      unique.set(`${reference.entryId}\0${reference.ownerKind}\0${reference.ownerId}`, reference);
    }
    return [...unique.values()].sort(
      (left, right) =>
        left.entryId.localeCompare(right.entryId) ||
        left.ownerKind.localeCompare(right.ownerKind) ||
        left.ownerId.localeCompare(right.ownerId),
    );
  }

  private async loadClientAppRecords(
    entryId: string,
    transaction?: Transaction,
    lockRepository?: 'share' | 'update',
  ): Promise<ClientAppRecords> {
    let app = await this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: entryId, transaction });
    if (!app) {
      throw clientAppNotFound(entryId);
    }
    const repoId = String(app.get('repoId'));
    const lockedRepo =
      lockRepository && transaction ? await lockRepo(this.db, repoId, transaction, lockRepository) : null;
    if (lockedRepo) {
      app = await this.db.getRepository('lightExtensionClientApps').findOne({ filterByTk: entryId, transaction });
      if (!app || String(app.get('repoId')) !== repoId) {
        throw clientAppNotFound(entryId);
      }
    }
    const repo =
      lockedRepo || (await this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repoId, transaction }));
    if (!repo) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', `Client app "${entryId}" has no repository`);
    }
    return { app, repo };
  }
}

function clientAppNotFound(entryId: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', `Client app "${entryId}" was not found`);
}

function staleReplacementError(expectedEntryId: string, currentEntryId?: unknown): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_SOURCE_OUTDATED',
    `Client app "${expectedEntryId}" changed before replacement was published`,
    {
      details: {
        category: 'client-app-replacement-stale',
        expectedEntryId,
        currentEntryId: typeof currentEntryId === 'string' ? currentEntryId : null,
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
  return value === '' ? '' : normalizeAssetPath(assertDecodedPathSafe(value, 'Client app asset path'));
}

function normalizeRootRelativeUrl(value: string, field: string): string {
  const source = requireNonEmptyString(value, field);
  if (!source.startsWith('/') || source.startsWith('//') || source.includes('?') || source.includes('#')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${field} must be a root-relative URL path`);
  }
  const normalized = path.posix.normalize(assertDecodedPathSafe(source, field));
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
  } catch {
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
  } catch {
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
  return normalizeAssetPath(path.posix.basename(descriptor.entryHtml));
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
  const headers = staticHeaders('text/html; charset=utf-8', body.length);
  return { status: 200, headers, ...(request.method === 'GET' ? { body } : {}) };
}

function createStaticAssetResponse(
  asset: ClientAppAsset,
  request: NormalizedClientAppStaticRequest,
): ClientAppStaticResponse {
  const headers = staticHeaders(resolveAssetContentType(asset), asset.size);
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

function staticHeaders(contentType: string, contentLength: number): Readonly<Record<string, string>> {
  return {
    'Cache-Control': CLIENT_APP_CACHE_CONTROL,
    'Content-Length': String(contentLength),
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  };
}

function resolveAssetContentType(asset: ClientAppAsset): string {
  const logicalType = asset.mimeType || lookupMimeType(asset.relativePath) || 'application/octet-stream';
  return formatContentType(logicalType) || String(logicalType);
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

function lockRepoIfExists(
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
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', `Client app "${entryId}" is archived`);
  }
  if (lifecycleStatus !== 'enabled') {
    throw new LightExtensionError('LIGHT_EXTENSION_REPO_DISABLED', `Client app "${entryId}" is disabled`);
  }
}

function recordsToDescriptor(records: ClientAppRecords): ClientAppDescriptor {
  return {
    entryId: String(records.app.get('id')),
    repoId: String(records.app.get('repoId')),
    key: String(records.app.get('key')),
    kind: 'client-app',
    title: String(records.app.get('title') || records.app.get('key')),
    entryHtml: String(records.app.get('entryHtml')),
    contentHash: String(records.app.get('contentHash')),
    fileCount: Number(records.app.get('fileCount')),
    byteSize: Number(records.app.get('byteSize')),
    updatedAt: normalizeDate(records.app.get('updatedAt')),
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

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' && value ? value : null;
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
