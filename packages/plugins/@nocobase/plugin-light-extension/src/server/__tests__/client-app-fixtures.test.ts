/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import fs from 'fs/promises';
import JSZip from 'jszip';
import os from 'os';
import path from 'path';

import {
  CLIENT_APP_FIXTURE_IDS,
  generateClientAppFixtureZip,
  getClientAppFixtureMetadata,
  writeClientAppFixtureZip,
} from '../../client-v2/__e2e__/fixtures/client-app';
import { prepareClientAppArchive } from '../services/ClientAppArchive';

describe('client-app E2E fixture generator', () => {
  it('generates byte-identical root archives with browser SDK, API, font, PNG, and WASM coverage', async () => {
    const first = await generateClientAppFixtureZip('root-v1');
    const second = await generateClientAppFixtureZip('root-v1');
    expect(createHash('sha256').update(first).digest('hex')).toBe(createHash('sha256').update(second).digest('hex'));
    expect(first.equals(second)).toBe(true);

    const zip = await JSZip.loadAsync(first);
    const descriptor = JSON.parse(await requireZipEntry(zip, 'entry.json').async('string'));
    expect(descriptor).toMatchObject({ key: 'e2e-root-client-app', entry: 'index.html' });
    expect(await requireZipEntry(zip, 'assets/main.source.ts').async('string')).toContain(
      `from '@nocobase/sdk/client'`,
    );
    const browserBundle = await requireZipEntry(zip, 'assets/app.js').async('string');
    expect(browserBundle).toContain('native-post');
    expect(browserBundle).toContain('X-CSRF-Token');
    expect(browserBundle).toContain('sdk-get');
    expect(browserBundle).toContain('Fixture font failed to load');
    expect(await requireZipEntry(zip, 'assets/app.css').async('string')).toContain(
      `url('./fixture-font.woff2') format('woff2')`,
    );
    expect(await requireZipEntry(zip, 'index.html').async('string')).toContain(
      'data-font-status="pending" data-testid="fixture-font"',
    );
    expect(
      Buffer.from(await requireZipEntry(zip, 'assets/fixture-font.woff2').async('uint8array')).subarray(0, 4),
    ).toEqual(Buffer.from('wOF2'));
    expect(Buffer.from(await requireZipEntry(zip, 'assets/pixel.png').async('uint8array')).subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(Buffer.from(await requireZipEntry(zip, 'assets/module.wasm').async('uint8array'))).toEqual(
      Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    );
  });

  it('generates replaceable root and nested v1/v2 archives plus deterministic bad packages', async () => {
    for (const family of ['root', 'nested'] as const) {
      const v1 = getClientAppFixtureMetadata(`${family}-v1`);
      const v2 = getClientAppFixtureMetadata(`${family}-v2`);
      expect(v1.key).toBe(v2.key);
      expect(v1.entry).toBe(family === 'root' ? 'index.html' : 'dist/application.html');
      const zip = await JSZip.loadAsync(await generateClientAppFixtureZip(`${family}-v2`));
      const assetPrefix = family === 'root' ? 'assets' : 'dist/assets';
      expect(zip.file(v1.entry)).not.toBeNull();
      expect(zip.file(`${assetPrefix}/app.css`)).not.toBeNull();
      expect(zip.file(`${assetPrefix}/app.js`)).not.toBeNull();
      expect(zip.file(`${assetPrefix}/fixture-font.woff2`)).not.toBeNull();
    }

    expect(CLIENT_APP_FIXTURE_IDS).toContain('bad-traversal');
    const traversal = await generateClientAppFixtureZip('bad-traversal');
    expect(traversal.includes(Buffer.from('../escape.txt'))).toBe(true);
    const missingEntry = await JSZip.loadAsync(await generateClientAppFixtureZip('bad-missing-entry'));
    expect(JSON.parse(await requireZipEntry(missingEntry, 'entry.json').async('string')).entry).toBe('missing.html');
    expect(missingEntry.file('missing.html')).toBeNull();
    expect(getClientAppFixtureMetadata('bad-wrong-key')).toMatchObject({
      key: 'e2e-wrong-key',
      expectedFailure: 'replacement-key-mismatch',
    });

    const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'client-app-e2e-fixtures-'));
    try {
      const nestedPath = await writeClientAppFixtureZip('nested-v2', path.join(temporaryRoot, 'nested-v2.zip'));
      const nested = await prepareClientAppArchive(nestedPath);
      expect(nested).toMatchObject({
        descriptor: { key: 'e2e-nested-client-app', entry: 'dist/application.html' },
        entryHtml: 'dist/application.html',
        staticRoot: 'dist',
      });
      expect(nested.assets.map((asset) => asset.relativePath)).toEqual(
        expect.arrayContaining([
          'application.html',
          'assets/app.css',
          'assets/app.js',
          'assets/fixture-font.woff2',
          'assets/pixel.png',
        ]),
      );
      await nested.dispose();

      const traversalPath = await writeClientAppFixtureZip(
        'bad-traversal',
        path.join(temporaryRoot, 'bad-traversal.zip'),
      );
      await expect(prepareClientAppArchive(traversalPath)).rejects.toThrow(/invalid relative path|escapes/u);
      const missingPath = await writeClientAppFixtureZip(
        'bad-missing-entry',
        path.join(temporaryRoot, 'bad-missing-entry.zip'),
      );
      await expect(prepareClientAppArchive(missingPath)).rejects.toThrow(/was not found/u);
    } finally {
      await fs.rm(temporaryRoot, { force: true, recursive: true });
    }
  });
});

function requireZipEntry(zip: JSZip, name: string): JSZip.JSZipObject {
  const entry = zip.file(name);
  if (!entry) {
    throw new Error(`Expected ZIP entry "${name}"`);
  }
  return entry;
}
