/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import type Application from '../application';
import { collectEnabledPortalRegistryItems, createPortalRegistryDigest } from '../portal-registry';

describe('Portal Registry server', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-portal-registry-server-'));
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  function createApp(enabled = true) {
    const plugin = {
      enabled,
      options: {
        packageName: '@nocobase/plugin-example',
      },
    };
    return {
      pm: {
        getPlugins: () => new Map([[class ExamplePlugin {}, plugin]]),
      },
    } as unknown as Application;
  }

  async function writeRegistryPackage() {
    const registryRoot = path.resolve(root, 'dist/portal-registry');
    await fs.ensureDir(registryRoot);
    await fs.writeJson(path.resolve(root, 'package.json'), {
      name: '@nocobase/plugin-example',
      version: '2.2.0-test.1',
    });
    const item = {
      name: 'example',
      type: 'registry:block',
      files: [{ path: 'source/example.ts', type: 'registry:file', target: 'src/extensions/example/example.ts' }],
    };
    const itemContent = `${JSON.stringify(item, null, 2)}\n`;
    await fs.writeFile(path.resolve(registryRoot, 'example.json'), itemContent);
    await fs.writeJson(path.resolve(registryRoot, 'manifest.json'), {
      schemaVersion: 1,
      packageName: '@nocobase/plugin-example',
      packageVersion: '2.2.0-test.1',
      items: [
        {
          name: 'example',
          type: 'registry:block',
          title: 'Example',
          file: 'example.json',
          digest: createPortalRegistryDigest(itemContent),
        },
      ],
    });
  }

  it('collects packaged Registry items from enabled plugins only', async () => {
    await writeRegistryPackage();
    const resolvePackagePath = async () => root;

    const enabledItems = await collectEnabledPortalRegistryItems(createApp(), { resolvePackagePath });
    const disabledItems = await collectEnabledPortalRegistryItems(createApp(false), { resolvePackagePath });

    expect([...enabledItems.keys()]).toEqual(['example']);
    expect(enabledItems.get('example')?.targets).toEqual(['src/extensions/example/example.ts']);
    expect(disabledItems.size).toBe(0);
  });

  it('rejects a packaged item whose content no longer matches its digest', async () => {
    await writeRegistryPackage();
    await fs.writeFile(path.resolve(root, 'dist/portal-registry/example.json'), '{}');

    await expect(
      collectEnabledPortalRegistryItems(createApp(), { resolvePackagePath: async () => root }),
    ).rejects.toThrow('Portal Registry item digest mismatch');
  });
});
