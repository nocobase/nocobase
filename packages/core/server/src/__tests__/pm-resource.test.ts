/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fse from 'fs-extra';
import resourceOptions, { PackageUrls } from '../plugin-manager/options/resource';

function createPluginRecord(name: string, packageName: string, enabled = true) {
  return {
    enabled,
    packageName,
    toJSON() {
      return {
        name,
        packageName,
        enabled,
        options: {},
      };
    },
  };
}

describe('pm resource', () => {
  const originalCdnBaseUrl = process.env.CDN_BASE_URL;

  beforeEach(() => {
    process.env.CDN_BASE_URL = '';
  });

  afterEach(() => {
    process.env.CDN_BASE_URL = originalCdnBaseUrl;
    PackageUrls.clear();
    vi.restoreAllMocks();
  });

  it('should keep listEnabled using the client lane', async () => {
    const packageName = '@nocobase/plugin-list-enabled-client';
    const packageDir = `${process.env.NODE_MODULES_PATH}/${packageName}`;
    const clientEntry = `${packageDir}/dist/client/index.js`;

    vi.spyOn(fse, 'exists').mockImplementation(async (target: string) => {
      return target === packageDir || target === clientEntry;
    });
    vi.spyOn(fse, 'stat').mockResolvedValue({
      mtime: new Date('2026-03-19T00:00:00.000Z'),
    } as any);
    vi.spyOn(fse, 'readJson').mockResolvedValue({
      version: '1.0.0',
    } as any);

    const ctx: any = {
      db: {
        getRepository: () => ({
          find: vi.fn().mockResolvedValue([createPluginRecord('plugin-list-enabled-client', packageName)]),
        }),
      },
    };

    await resourceOptions.actions.listEnabled(ctx, vi.fn());

    expect(ctx.body).toEqual([
      expect.objectContaining({
        name: 'plugin-list-enabled-client',
        packageName,
        url: expect.stringContaining(`/static/plugins/${packageName}/dist/client/index.js`),
      }),
    ]);
  });

  it('should filter listEnabledV2 by client-v2.js and enabled state', async () => {
    const v2PackageName = '@nocobase/plugin-list-enabled-v2';
    const v1OnlyPackageName = '@nocobase/plugin-list-enabled-v1-only';
    const disabledPackageName = '@nocobase/plugin-list-enabled-v2-disabled';

    const v2PackageDir = `${process.env.NODE_MODULES_PATH}/${v2PackageName}`;
    const v1OnlyPackageDir = `${process.env.NODE_MODULES_PATH}/${v1OnlyPackageName}`;
    const disabledPackageDir = `${process.env.NODE_MODULES_PATH}/${disabledPackageName}`;

    vi.spyOn(fse, 'exists').mockImplementation(async (target: string) => {
      return [
        v2PackageDir,
        v1OnlyPackageDir,
        disabledPackageDir,
        `${v2PackageDir}/client-v2.js`,
        `${disabledPackageDir}/client-v2.js`,
        `${v2PackageDir}/dist/client-v2/index.js`,
        `${disabledPackageDir}/dist/client-v2/index.js`,
        `${v1OnlyPackageDir}/dist/client/index.js`,
      ].includes(target);
    });
    vi.spyOn(fse, 'stat').mockResolvedValue({
      mtime: new Date('2026-03-19T00:00:00.000Z'),
    } as any);
    vi.spyOn(fse, 'readJson').mockResolvedValue({
      version: '1.0.0',
    } as any);

    const ctx: any = {
      db: {
        getRepository: () => ({
          find: vi.fn().mockImplementation(async ({ filter }) => {
            return [
              createPluginRecord('plugin-list-enabled-v2', v2PackageName),
              createPluginRecord('plugin-list-enabled-v1-only', v1OnlyPackageName),
              createPluginRecord('plugin-list-enabled-v2-disabled', disabledPackageName, false),
            ].filter((item) => item.enabled === filter.enabled);
          }),
        }),
      },
    };

    await resourceOptions.actions.listEnabledV2(ctx, vi.fn());

    expect(ctx.body).toEqual([
      expect.objectContaining({
        name: 'plugin-list-enabled-v2',
        packageName: v2PackageName,
        url: expect.stringContaining(`/static/plugins/${v2PackageName}/dist/client-v2/index.js`),
      }),
    ]);
  });
});
