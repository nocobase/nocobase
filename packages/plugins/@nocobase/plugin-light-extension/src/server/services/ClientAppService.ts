/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { contentType as formatContentType, lookup as lookupMimeType } from 'mime-types';
import { defaultTreeAdapter, html, parse, serialize, type DefaultTreeAdapterTypes } from 'parse5';
import path from 'path';
import type { Readable } from 'stream';

import { LightExtensionError } from '../../shared/errors';
import { JsPortalStorage, type JsPortalAsset, type JsPortalDescriptor } from './JsPortalStorage';

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

const CLIENT_APP_CACHE_CONTROL = 'no-cache';
const CLIENT_APP_RUNTIME_SCRIPT_ATTRIBUTE = 'data-nocobase-client-app-runtime';
const NOT_FOUND_BODY = Buffer.from('Not Found');

interface NormalizedClientAppStaticRequest extends ClientAppStaticRequest {
  relativePath: string;
  workspaceRoot: string;
  publicPath: string;
  apiBaseUrl: string;
}

type ClientAppPortalStorage = Pick<JsPortalStorage, 'listPortals' | 'openAsset' | 'removeRepo' | 'resolvePortal'>;

export class ClientAppService {
  private referenceResolver?: ClientAppReferenceResolver;

  constructor(
    private readonly db: Database,
    private readonly storage: ClientAppPortalStorage = new JsPortalStorage(),
  ) {}

  useReferenceResolver(resolver: ClientAppReferenceResolver): () => void {
    this.referenceResolver = resolver;
    return () => {
      if (this.referenceResolver === resolver) {
        this.referenceResolver = undefined;
      }
    };
  }

  async resolveClientApp(entryId: string): Promise<ClientAppDescriptor> {
    const locator = parseEntryId(entryId);
    const repo = await this.requireEnabledRepo(locator.repoId, entryId);
    const portal = await this.storage.resolvePortal(locator.repoId, locator.portalKey);
    if (!portal) {
      throw clientAppNotFound(entryId);
    }
    return toClientAppDescriptor(portal, repo);
  }

  async listSelectableClientApps(): Promise<ClientAppSummary[]> {
    const repos = await this.db.getRepository('lightExtensionRepos').find({
      filter: { lifecycleStatus: 'enabled' },
      fields: ['id', 'name', 'title'],
      sort: ['title', 'name'],
    });
    const items: ClientAppSummary[] = [];
    for (const repo of repos) {
      const repoId = String(repo.get('id'));
      const repoTitle = String(repo.get('title') || repo.get('name') || repoId);
      for (const portal of await this.storage.listPortals(repoId)) {
        items.push({
          entryId: createEntryId(repoId, portal.key),
          repoId,
          key: portal.key,
          title: portal.title,
          repoTitle,
        });
      }
    }
    return items;
  }

  async serveClientAppAsset(input: ClientAppStaticRequest): Promise<ClientAppStaticResponse> {
    const request = normalizeStaticRequest(input);
    const locator = parseEntryId(request.entryId);
    await this.requireEnabledRepo(locator.repoId, request.entryId);
    const portal = await this.storage.resolvePortal(locator.repoId, locator.portalKey);
    if (!portal) {
      throw clientAppNotFound(request.entryId);
    }
    const requestedAssetPath = request.relativePath || portal.entryHtml;
    let asset = await this.storage.openAsset(locator.repoId, locator.portalKey, requestedAssetPath);
    let servesEntryHtml = requestedAssetPath === portal.entryHtml;
    if (
      !asset &&
      request.relativePath &&
      isHtmlDocumentNavigation(request) &&
      path.posix.extname(request.relativePath) === ''
    ) {
      asset = await this.storage.openAsset(locator.repoId, locator.portalKey, portal.entryHtml);
      servesEntryHtml = true;
    }
    if (!asset) {
      return notFoundStaticResponse(request.method);
    }
    return servesEntryHtml ? createEntryHtmlResponse(asset, request) : createStaticAssetResponse(asset, request);
  }

  async listReferencesForRepo(repoId: string, transaction: Transaction): Promise<ClientAppReference[]> {
    const entryIds = (await this.storage.listPortals(repoId)).map((portal) => createEntryId(repoId, portal.key));
    if (!entryIds.length || !this.referenceResolver) {
      return [];
    }
    return (await this.referenceResolver(entryIds, transaction)).filter(
      (reference) => entryIds.includes(reference.entryId) && reference.ownerKind && reference.ownerId,
    );
  }

  async retireClientAppsForRepo(repoId: string, transaction: Transaction): Promise<void> {
    transaction.afterCommit(() => this.storage.removeRepo(repoId));
  }

  private async requireEnabledRepo(repoId: string, entryId: string): Promise<Model> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: repoId });
    if (!repo) {
      throw clientAppNotFound(entryId);
    }
    const lifecycleStatus = repo.get('lifecycleStatus');
    if (lifecycleStatus === 'archived') {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', `Client app "${entryId}" is archived`);
    }
    if (lifecycleStatus !== 'enabled') {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_DISABLED', `Client app "${entryId}" is disabled`);
    }
    return repo;
  }
}

function createEntryId(repoId: string, portalKey: string): string {
  return `${repoId}:${portalKey}`;
}

function parseEntryId(entryId: string): { repoId: string; portalKey: string } {
  const normalized = requireNonEmptyString(entryId, 'entryId');
  const separator = normalized.lastIndexOf(':');
  const repoId = normalized.slice(0, separator);
  const portalKey = normalized.slice(separator + 1);
  if (separator < 1 || !/^[A-Za-z0-9_-]+$/u.test(repoId) || !/^[a-z0-9][a-z0-9-]{0,62}$/u.test(portalKey)) {
    throw clientAppNotFound(entryId);
  }
  return { repoId, portalKey };
}

function toClientAppDescriptor(portal: JsPortalDescriptor, repo: Model): ClientAppDescriptor {
  return {
    entryId: createEntryId(portal.repoId, portal.key),
    repoId: portal.repoId,
    key: portal.key,
    kind: 'client-app',
    title: portal.title,
    entryHtml: portal.entryHtml,
    contentHash: portal.contentHash,
    fileCount: portal.fileCount,
    byteSize: portal.byteSize,
    updatedAt: normalizeDate(repo.get('updatedAt')),
  };
}

function clientAppNotFound(entryId: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', `Client app "${entryId}" was not found`);
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
  asset: JsPortalAsset,
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
  asset: JsPortalAsset,
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

function resolveAssetContentType(asset: JsPortalAsset): string {
  const logicalType = asset.mimeType || lookupMimeType(asset.relativePath) || 'application/octet-stream';
  return formatContentType(logicalType) || String(logicalType);
}

async function readAssetBuffer(asset: JsPortalAsset): Promise<Buffer> {
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
