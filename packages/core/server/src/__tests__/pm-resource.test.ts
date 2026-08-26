/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
    const getSpy = vi
      .spyOn(PackageUrls, 'get')
      .mockResolvedValue(`/static/plugins/${packageName}/dist/client/index.js?hash=12345678`);

    const ctx: any = {
      db: {
        getRepository: () => ({
          find: vi.fn().mockResolvedValue([createPluginRecord('plugin-list-enabled-client', packageName)]),
        }),
      },
    };

    await resourceOptions.actions.listEnabled(ctx, vi.fn());

    expect(getSpy).toHaveBeenCalledWith(packageName, 'client');
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
    const hasClientEntrySpy = vi.spyOn(PackageUrls, 'hasClientEntry').mockImplementation(async (packageName, lane) => {
      expect(lane).toBe('client-v2');
      return packageName === v2PackageName || packageName === disabledPackageName;
    });
    const getSpy = vi
      .spyOn(PackageUrls, 'get')
      .mockImplementation(
        async (packageName, lane) => `/static/plugins/${packageName}/dist/${lane}/index.js?hash=12345678`,
      );

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

    expect(hasClientEntrySpy).toHaveBeenCalledWith(v2PackageName, 'client-v2');
    expect(hasClientEntrySpy).toHaveBeenCalledWith(v1OnlyPackageName, 'client-v2');
    expect(getSpy).toHaveBeenCalledWith(v2PackageName, 'client-v2');
    expect(ctx.body).toEqual([
      expect.objectContaining({
        name: 'plugin-list-enabled-v2',
        packageName: v2PackageName,
        url: expect.stringContaining(`/static/plugins/${v2PackageName}/dist/client-v2/index.js`),
      }),
    ]);
  });

  it('should only cache hashed package urls', async () => {
    const packageName = '@nocobase/plugin-auth';
    const fetchSpy = vi
      .spyOn(PackageUrls, 'fetch')
      .mockResolvedValueOnce(`/static/plugins/${packageName}/dist/client-v2/index.js`)
      .mockResolvedValueOnce(`/static/plugins/${packageName}/dist/client-v2/index.js?hash=12345678`);

    const firstUrl = await PackageUrls.get(packageName, 'client-v2');
    const secondUrl = await PackageUrls.get(packageName, 'client-v2');
    const thirdUrl = await PackageUrls.get(packageName, 'client-v2');

    expect(firstUrl).toBe(`/static/plugins/${packageName}/dist/client-v2/index.js`);
    expect(secondUrl).toBe(`/static/plugins/${packageName}/dist/client-v2/index.js?hash=12345678`);
    expect(thirdUrl).toBe(`/static/plugins/${packageName}/dist/client-v2/index.js?hash=12345678`);
    expect(fetchSpy).toHaveBeenNthCalledWith(1, packageName, 'client-v2');
    expect(fetchSpy).toHaveBeenNthCalledWith(2, packageName, 'client-v2');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('should support array filterByTk for enable and disable', async () => {
    const runAsCLISpy = vi.fn().mockResolvedValue(undefined);
    const next = vi.fn();
    const app: any = {
      runAsCLI: runAsCLISpy,
      log: {
        error: vi.fn(),
      },
    };

    const enableCtx: any = {
      app,
      action: {
        params: {
          filterByTk: ['@nocobase/plugin-a', ' @nocobase/plugin-b,@nocobase/plugin-c '],
        },
      },
      throw: vi.fn(),
    };

    await resourceOptions.actions.enable(enableCtx, next);

    expect(runAsCLISpy).toHaveBeenNthCalledWith(
      1,
      ['pm', 'enable', '@nocobase/plugin-a', '@nocobase/plugin-b', '@nocobase/plugin-c'],
      { from: 'user' },
    );
    expect(enableCtx.body).toEqual(['@nocobase/plugin-a', ' @nocobase/plugin-b,@nocobase/plugin-c ']);

    const disableCtx: any = {
      app,
      action: {
        params: {
          filterByTk: ['@nocobase/plugin-a', '@nocobase/plugin-b'],
          awaitResponse: true,
        },
      },
      throw: vi.fn(),
    };

    await resourceOptions.actions.disable(disableCtx, next);

    expect(runAsCLISpy).toHaveBeenNthCalledWith(2, ['pm', 'disable', '@nocobase/plugin-a', '@nocobase/plugin-b'], {
      from: 'user',
      throwError: true,
    });
    expect(disableCtx.body).toEqual(['@nocobase/plugin-a', '@nocobase/plugin-b']);
  });
});
