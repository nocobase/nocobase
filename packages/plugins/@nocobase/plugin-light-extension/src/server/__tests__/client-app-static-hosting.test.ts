/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { createHash } from 'crypto';
import { defaultTreeAdapter, parse, type DefaultTreeAdapterTypes } from 'parse5';
import { Readable } from 'stream';

import { LightExtensionError } from '../../shared/errors';
import {
  ClientAppService,
  type ClientAppAsset,
  type ClientAppDescriptor,
  type ClientAppStaticRequest,
} from '../services/ClientAppService';
import type { ClientAppAssetStorage, ClientAppStoredFile } from '../services/ClientAppStorage';
import type { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import type { LightExtensionRepoService } from '../services/LightExtensionRepoService';

describe('ClientAppService static hosting', () => {
  it('injects one leading base and one runtime config without rewriting application URLs', async () => {
    const html = [
      '<!doctype html><html><head>',
      '<base href="/old/" target="_self"><base href="/duplicate/">',
      '<link rel="stylesheet" href="assets/app.css">',
      '<script type="module" src="assets/app.js"></script>',
      '</head><body><div id="root"></div></body></html>',
    ].join('');
    const fixture = createStaticFixture({ 'application.html': html });

    const response = await fixture.service.serveClientAppAsset(request());

    expect(response.status).toBe(200);
    expect(response.headers).toMatchObject({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ETag: expect.stringMatching(/^"sha256-[a-f0-9]{64}"$/u),
    });
    const body = requireBuffer(response.body);
    expect(response.headers['Content-Length']).toBe(String(body.length));
    const document = parse(body.toString('utf8'));
    const head = requireElement(findElements(document, 'head')[0]);
    const bases = findElements(document, 'base');
    expect(bases).toHaveLength(1);
    expect(attribute(bases[0], 'href')).toBe('/v/customer/');
    expect(attribute(bases[0], 'target')).toBe('_self');
    expect(head.childNodes[0]).toBe(bases[0]);
    const runtimeScripts = findElements(document, 'script').filter(
      (element) => attribute(element, 'data-nocobase-client-app-runtime') !== undefined,
    );
    expect(runtimeScripts).toHaveLength(1);
    expect(textContent(runtimeScripts[0])).toContain(`window['__nocobase_public_path__'] = "/";`);
    expect(textContent(runtimeScripts[0])).toContain(`window['__nocobase_api_base_url__'] = "/api/";`);
    expect(attribute(findElements(document, 'link')[0], 'href')).toBe('assets/app.css');
    expect(findElements(document, 'script').some((element) => attribute(element, 'src') === 'assets/app.js')).toBe(
      true,
    );
  });

  it('serves real assets first and only falls back for extensionless HTML document navigation', async () => {
    const fixture = createStaticFixture({
      'application.html': '<html><head></head><body>app</body></html>',
      'orders/1': '<html><head></head><body>real order file</body></html>',
    });

    const realFile = await fixture.service.serveClientAppAsset(
      request({ relativePath: 'orders/1', accept: 'text/html' }),
    );
    expect(await responseText(realFile)).toContain('real order file');
    expect(fixture.openedPaths).toEqual(['orders/1']);

    fixture.openedPaths.length = 0;
    const fallback = await fixture.service.serveClientAppAsset(
      request({ relativePath: 'orders/2', fetchDestination: 'document' }),
    );
    expect(fallback.status).toBe(200);
    expect(await responseText(fallback)).toContain('<base href="/v/customer/">');
    expect(fixture.openedPaths).toEqual(['orders/2', 'application.html']);

    fixture.openedPaths.length = 0;
    const missingAsset = await fixture.service.serveClientAppAsset(
      request({ relativePath: 'assets/missing.js', accept: 'text/html' }),
    );
    expect(missingAsset.status).toBe(404);
    expect(missingAsset.headers['Content-Type']).toBe('text/plain; charset=utf-8');
    expect(await responseText(missingAsset)).toBe('Not Found');
    expect(fixture.openedPaths).toEqual(['assets/missing.js']);
  });

  it('supports asset MIME, HEAD, strong and weak If-None-Match validation', async () => {
    const fixture = createStaticFixture({
      'application.html': '<html><head></head><body>app</body></html>',
      'assets/app.js': 'window.clientApp = true;',
    });
    const first = await fixture.service.serveClientAppAsset(request({ relativePath: 'assets/app.js' }));
    expect(first.status).toBe(200);
    expect(first.headers['Content-Type']).toBe('text/javascript; charset=utf-8');
    expect(first.headers['Cache-Control']).toBe('no-cache');
    expect(await responseText(first)).toBe('window.clientApp = true;');

    const notModified = await fixture.service.serveClientAppAsset(
      request({ relativePath: 'assets/app.js', ifNoneMatch: `W/${first.headers.ETag}` }),
    );
    expect(notModified.status).toBe(304);
    expect(notModified.body).toBeUndefined();
    expect(notModified.headers.ETag).toBe(first.headers.ETag);
    expect(notModified.headers['Content-Length']).toBeUndefined();

    const head = await fixture.service.serveClientAppAsset(request({ relativePath: 'assets/app.js', method: 'HEAD' }));
    expect(head.status).toBe(200);
    expect(head.body).toBeUndefined();
    expect(head.headers['Content-Length']).toBe(String(Buffer.byteLength('window.clientApp = true;')));
  });

  it('keys transformed HTML ETags by content, workspace root, and runtime configuration', async () => {
    const fixture = createStaticFixture({
      'application.html': '<html><head><base href="/"></head><body>app</body></html>',
    });
    const customer = await fixture.service.serveClientAppAsset(request());
    const admin = await fixture.service.serveClientAppAsset(
      request({ workspaceRoot: '/v/admin/', apiBaseUrl: '/api/apps/admin/' }),
    );
    expect(customer.headers.ETag).not.toBe(admin.headers.ETag);
    expect(await responseText(admin)).toContain('<base href="/v/admin/">');

    const notModified = await fixture.service.serveClientAppAsset(request({ ifNoneMatch: customer.headers.ETag }));
    expect(notModified.status).toBe(304);
    expect(notModified.body).toBeUndefined();
  });

  it.each(['../secret', '%2e%2e/secret', '\\secret', 'asset\0name'])(
    'rejects unsafe static paths: %s',
    async (relativePath) => {
      const fixture = createStaticFixture({
        'application.html': '<html><head></head><body>app</body></html>',
      });
      await expect(fixture.service.serveClientAppAsset(request({ relativePath }))).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_INVALID_INPUT',
      });
      expect(fixture.openedPaths).toEqual([]);
    },
  );

  it('retries once when an upload switches the current content between resolve and open', async () => {
    const fixture = createStaticFixture({ 'application.html': '<html><head></head><body>new</body></html>' });
    const firstDescriptor = { ...fixture.descriptor, contentHash: 'old-content' };
    vi.spyOn(fixture.service, 'resolveClientApp')
      .mockResolvedValueOnce(firstDescriptor)
      .mockResolvedValueOnce(fixture.descriptor);
    vi.spyOn(fixture.service, 'openClientAppAsset')
      .mockRejectedValueOnce(new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED'))
      .mockImplementation(fixture.openAsset);

    const response = await fixture.service.serveClientAppAsset(request());

    expect(response.status).toBe(200);
    expect(await responseText(response)).toContain('new');
    expect(fixture.service.resolveClientApp).toHaveBeenCalledTimes(2);
  });
});

describe('ClientAppService transaction-aware repo retirement', () => {
  it('uses the caller transaction and defers physical cleanup until commit', async () => {
    let state = 'ready';
    const entry = model({ id: 'entry-1' });
    const asset = model({
      id: 'asset-1',
      assetSetId: 'set-1',
      entryId: 'entry-1',
      extname: '.js',
      filename: 'app.js',
      mimetype: 'application/javascript',
      path: 'set-1',
      size: 3,
      state,
      storageId: 1,
      title: 'app',
    });
    const originalUpdate = asset.update;
    asset.update = vi.fn(async (values: Record<string, unknown>) => {
      if (typeof values.state === 'string') {
        state = values.state;
      }
      await originalUpdate(values);
      return asset;
    });
    asset.get = vi.fn((key: string) => (key === 'state' ? state : asset.values[key]));
    const destroyClientApp = vi.fn(async () => 1);
    const destroyEntry = vi.fn(async () => 1);
    const destroyAssets = vi.fn(async () => 1);
    const storage = { delete: vi.fn(async () => undefined) } as unknown as ClientAppAssetStorage;
    const db = {
      getRepository: (name: string) => ({
        find: vi.fn(async (options: { filter?: Record<string, unknown> }) => {
          if (name === 'lightExtensionEntries') {
            return [entry];
          }
          if (name === 'lightExtensionClientAppAssets') {
            return options.filter?.assetSetId === 'set-1' || options.filter?.entryId === 'entry-1' ? [asset] : [];
          }
          return [];
        }),
      }),
      getModel: (name: string) => ({
        destroy:
          name === 'lightExtensionClientApps'
            ? destroyClientApp
            : name === 'lightExtensionEntries'
              ? destroyEntry
              : destroyAssets,
      }),
    } as unknown as Database;
    let afterCommit: (() => Promise<void>) | undefined;
    const transaction = {
      afterCommit: vi.fn((callback: () => Promise<void>) => {
        afterCommit = callback;
      }),
    } as unknown as Transaction;
    const service = new ClientAppService(
      db,
      {} as LightExtensionRepoService,
      {} as LightExtensionPermissionService,
      storage,
    );

    await expect(service.retireClientAppsForRepo('repo-1', transaction)).resolves.toEqual(['set-1']);
    expect(transaction.afterCommit).toHaveBeenCalledTimes(1);
    expect(destroyClientApp).toHaveBeenCalledWith({ where: { entryId: 'entry-1' }, transaction });
    expect(destroyEntry).toHaveBeenCalledWith({ where: { id: 'entry-1' }, transaction });
    expect(storage.delete).not.toHaveBeenCalled();

    await requireCallback(afterCommit)();
    expect(storage.delete).toHaveBeenCalledWith([expect.objectContaining({ filename: 'app.js', storageId: 1 })]);
    expect(destroyAssets).toHaveBeenCalledWith({ where: { assetSetId: 'set-1' }, hooks: false });
  });

  it('runs the injectable Entry deletion guard under the repo lock before deleting metadata', async () => {
    const calls: string[] = [];
    const entry = model({ id: 'entry-1', kind: 'client-app', repoId: 'repo-1' });
    const transaction = { LOCK: { SHARE: 'SHARE', UPDATE: 'UPDATE' } } as unknown as Transaction;
    const db = {
      options: { dialect: 'sqlite' },
      sequelize: {
        transaction: async (
          _options: Record<string, unknown>,
          run: (currentTransaction: Transaction) => Promise<unknown>,
        ) => run(transaction),
      },
      getRepository: (name: string) => ({
        find: vi.fn(async () => []),
        findOne: vi.fn(async () => (name === 'lightExtensionEntries' ? entry : null)),
      }),
      getModel: (name: string) => ({
        findOne: vi.fn(async () => {
          if (name === 'lightExtensionRepos') {
            calls.push('repo-lock');
            return model({ id: 'repo-1' });
          }
          return null;
        }),
        destroy: vi.fn(async () => {
          calls.push(name === 'lightExtensionClientApps' ? 'client-app-delete' : 'entry-delete');
          return 1;
        }),
      }),
    } as unknown as Database;
    const service = new ClientAppService(
      db,
      {} as LightExtensionRepoService,
      {} as LightExtensionPermissionService,
      {} as ClientAppAssetStorage,
    );
    const guard = vi.fn(async (_entryId: string, currentTransaction: Transaction) => {
      expect(currentTransaction).toBe(transaction);
      calls.push('guard');
    });
    service.useEntryDeleteGuard(guard);

    await service.deleteClientApp('entry-1');

    expect(guard).toHaveBeenCalledWith('entry-1', transaction);
    expect(calls).toEqual(['repo-lock', 'guard', 'client-app-delete', 'entry-delete']);
  });
});

function request(overrides: Partial<ClientAppStaticRequest> = {}): ClientAppStaticRequest {
  return {
    entryId: 'entry-1',
    relativePath: '',
    workspaceRoot: '/v/customer/',
    publicPath: '/',
    apiBaseUrl: '/api/',
    method: 'GET',
    ...overrides,
  };
}

function createStaticFixture(files: Record<string, string | Buffer>) {
  const descriptor: ClientAppDescriptor = {
    entryId: 'entry-1',
    repoId: 'repo-1',
    key: 'customer',
    kind: 'client-app',
    title: 'Customer',
    description: null,
    category: null,
    icon: null,
    tags: [],
    sort: null,
    entryHtml: 'dist/application.html',
    staticRoot: 'dist',
    contentHash: 'client-app-content',
    fileCount: Object.keys(files).length,
    byteSize: Object.values(files).reduce((total, value) => total + toBuffer(value).length, 0),
    updatedAt: null,
    available: true,
    enabled: true,
    ready: true,
  };
  const openedPaths: string[] = [];
  const openAsset = async (
    _entryId: string,
    relativePath: string,
    _options?: { expectedContentHash?: string },
  ): Promise<ClientAppAsset | null> => {
    openedPaths.push(relativePath);
    const value = files[relativePath];
    if (typeof value === 'undefined') {
      return null;
    }
    const content = toBuffer(value);
    return {
      relativePath,
      clientAppContentHash: descriptor.contentHash,
      contentHash: createHash('sha256').update(content).digest('hex'),
      size: content.length,
      stream: Readable.from(content),
    };
  };
  const service = new ClientAppService(
    {} as Database,
    {} as LightExtensionRepoService,
    {} as LightExtensionPermissionService,
    {} as ClientAppAssetStorage,
  );
  vi.spyOn(service, 'resolveClientApp').mockResolvedValue(descriptor);
  vi.spyOn(service, 'openClientAppAsset').mockImplementation(openAsset);
  return { descriptor, openedPaths, openAsset, service };
}

function model(initialValues: Record<string, unknown>) {
  const values = { ...initialValues };
  return {
    values,
    get: vi.fn((key: string) => values[key]),
    update: vi.fn(async (next: Record<string, unknown>) => {
      Object.assign(values, next);
    }),
  };
}

function findElements(node: DefaultTreeAdapterTypes.Node, tagName: string): DefaultTreeAdapterTypes.Element[] {
  const result: DefaultTreeAdapterTypes.Element[] = [];
  const visit = (current: DefaultTreeAdapterTypes.Node) => {
    if (defaultTreeAdapter.isElementNode(current) && current.tagName === tagName) {
      result.push(current);
    }
    if ('childNodes' in current) {
      current.childNodes.forEach(visit);
    }
  };
  visit(node);
  return result;
}

function attribute(element: DefaultTreeAdapterTypes.Element, name: string): string | undefined {
  return element.attrs.find((item) => item.name === name)?.value;
}

function textContent(element: DefaultTreeAdapterTypes.Element): string {
  return element.childNodes
    .filter(defaultTreeAdapter.isTextNode)
    .map((node) => node.value)
    .join('');
}

async function responseText(response: { body?: Buffer | Readable }): Promise<string> {
  const body = response.body;
  if (Buffer.isBuffer(body)) {
    return body.toString('utf8');
  }
  if (!body) {
    return '';
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function toBuffer(value: string | Buffer): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

function requireBuffer(value: Buffer | Readable | undefined): Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new Error('Expected a Buffer body');
  }
  return value;
}

function requireElement(value: DefaultTreeAdapterTypes.Element | undefined): DefaultTreeAdapterTypes.Element {
  if (!value) {
    throw new Error('Expected an HTML element');
  }
  return value;
}

function requireCallback(value: (() => Promise<void>) | undefined): () => Promise<void> {
  if (!value) {
    throw new Error('Expected an afterCommit callback');
  }
  return value;
}
