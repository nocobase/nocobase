/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DirectoryPortalCatalog } from '../portal-host/portal-catalog';

const tempDirs: string[] = [];

async function createPortalWorkspace(files: string[], packageJson = '{"name":"customer-portal","version":"1.0.0"}\n') {
  const portalsDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-catalog-'));
  tempDirs.push(portalsDir);

  const portalDir = path.join(portalsDir, 'main', 'customer');
  await mkdir(portalDir, { recursive: true });
  await writeFile(path.join(portalDir, 'package.json'), packageJson);

  for (const file of files) {
    const target = path.join(portalDir, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'export const marker = true;\n');
  }

  return { portalsDir };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('DirectoryPortalCatalog', () => {
  it('prefers the built embedded portal entrypoint when package portal metadata is omitted', async () => {
    const { portalsDir } = await createPortalWorkspace(['dist/server/embedded.js', 'server/app.ts']);
    const catalog = new DirectoryPortalCatalog({ portalsDir });

    await expect(catalog.discover()).resolves.toMatchObject([
      {
        id: 'main:customer',
        entrypoint: 'dist/server/embedded.js',
      },
    ]);
  });

  it('prefers the source embedded portal entrypoint before the generic server app', async () => {
    const { portalsDir } = await createPortalWorkspace(['server/embedded.ts', 'server/app.ts']);
    const catalog = new DirectoryPortalCatalog({ portalsDir });

    await expect(catalog.discover()).resolves.toMatchObject([
      {
        id: 'main:customer',
        entrypoint: 'server/embedded.ts',
      },
    ]);
  });

  it('uses the directory path as portal identity when package portal metadata is stale', async () => {
    const { portalsDir } = await createPortalWorkspace(
      ['dist/server/embedded.js'],
      JSON.stringify(
        {
          name: 'customer-portal',
          version: '1.0.0',
          portal: {
            appName: 'main',
            portalName: 'main',
            entrypoint: 'dist/server/embedded.js',
          },
        },
        null,
        2,
      ),
    );
    const catalog = new DirectoryPortalCatalog({ portalsDir });

    await expect(catalog.discover()).resolves.toMatchObject([
      {
        id: 'main:customer',
        appName: 'main',
        portalName: 'customer',
        basePath: '/portals/customer',
        entrypoint: 'dist/server/embedded.js',
      },
    ]);
  });
});
