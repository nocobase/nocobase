/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { Readable } from 'stream';

import { JsPortalStorage, type JsPortalWorkspaceFile } from '../services/JsPortalStorage';

describe('JsPortalStorage', () => {
  let root: string;
  let storage: JsPortalStorage;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'js-portal-storage-'));
    storage = new JsPortalStorage(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('round-trips recursive text and binary files through one portal snapshot', async () => {
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]);
    await storage.replaceWorkspaceFiles('repo-1', [
      ...portalFiles('customer'),
      {
        path: 'src/client/js-portals/customer/assets/logo.png',
        content: binary.toString('base64'),
        encoding: 'base64',
        size: binary.length,
      },
    ]);

    await expect(storage.listPortals('repo-1')).resolves.toMatchObject([
      { repoId: 'repo-1', key: 'customer', entryHtml: 'index.html', fileCount: 3 },
    ]);
    const files = await storage.listWorkspaceFiles('repo-1');
    expect(files.find((file) => file.path.endsWith('logo.png'))).toEqual({
      path: 'src/client/js-portals/customer/assets/logo.png',
      content: binary.toString('base64'),
      encoding: 'base64',
      size: binary.length,
    });
    const asset = await storage.openAsset('repo-1', 'customer', 'assets/logo.png');
    await expect(readStream(asset?.stream)).resolves.toEqual(binary);
  });

  it('validates a complete snapshot before replacing the previous portals', async () => {
    await storage.replaceWorkspaceFiles('repo-1', portalFiles('customer'));
    const invalid = portalFiles('replacement').filter((file) => !file.path.endsWith('index.html'));

    expect(() => storage.validateWorkspaceFiles(invalid)).toThrow(/index\.html/u);
    await expect(storage.replaceWorkspaceFiles('repo-1', invalid)).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
    });
    await expect(storage.listPortals('repo-1')).resolves.toMatchObject([{ key: 'customer' }]);
  });

  it.each([
    'src/client/js-portals/customer/../outside.js',
    'src/client/js-portals/Customer/index.html',
    '/src/client/js-portals/customer/index.html',
  ])('rejects unsafe workspace paths: %s', (filePath) => {
    expect(() => storage.validateWorkspaceFiles([{ path: filePath, content: 'unsafe' }])).toThrow();
  });
});

function portalFiles(key: string): JsPortalWorkspaceFile[] {
  return [
    {
      path: `src/client/js-portals/${key}/entry.json`,
      content: JSON.stringify({ schemaVersion: 1, key, title: 'Customer Portal' }),
    },
    { path: `src/client/js-portals/${key}/index.html`, content: '<html><head></head><body>portal</body></html>' },
  ];
}

async function readStream(stream: Readable | undefined): Promise<Buffer> {
  if (!stream) {
    throw new Error('Expected asset stream');
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
