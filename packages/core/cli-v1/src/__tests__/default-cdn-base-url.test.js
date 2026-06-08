/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { resolveDefaultCdnBaseUrlFromActiveVersion } = require('../util');

describe('cli-v1 default CDN_BASE_URL', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('prefers the extracted dist-client active version when available', async () => {
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-dist-client-'));
    const distClientRoot = path.join(storagePath, 'dist-client');
    await fs.ensureDir(distClientRoot);
    await fs.writeFile(path.join(distClientRoot, 'active-version'), '2.1.0-beta.45\n', 'utf8');
    process.env.STORAGE_PATH = storagePath;

    expect(resolveDefaultCdnBaseUrlFromActiveVersion('/console/')).toBe('/console/dist/2.1.0-beta.45/');
    expect(resolveDefaultCdnBaseUrlFromActiveVersion('/')).toBe('/dist/2.1.0-beta.45/');

    await fs.remove(storagePath);
  });

  test('returns undefined when the active version file is missing', async () => {
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-dist-client-empty-'));
    process.env.STORAGE_PATH = storagePath;

    expect(resolveDefaultCdnBaseUrlFromActiveVersion('/console/')).toBeUndefined();

    await fs.remove(storagePath);
  });
});
