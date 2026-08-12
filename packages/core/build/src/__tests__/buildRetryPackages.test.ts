/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { selectRetryPackages } from '../build';

function retryPackage(name: string) {
  return { name };
}

describe('retry package selection', () => {
  it('continues from a cached package that belongs to the current selection', () => {
    const selection = selectRetryPackages([retryPackage('A'), retryPackage('B'), retryPackage('C')], 'B');

    expect(selection.cacheMatched).toBe(true);
    expect(selection.packages.map((pkg) => pkg.name)).toEqual(['B', 'C']);
  });

  it('preserves the complete selection when the cached package is stale', () => {
    const selection = selectRetryPackages([retryPackage('A'), retryPackage('B')], 'stale-package');

    expect(selection.cacheMatched).toBe(false);
    expect(selection.packages.map((pkg) => pkg.name)).toEqual(['A', 'B']);
  });

  it('warns and clears stale cache before continuing the complete selection', async () => {
    const originalArgv = process.argv;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const runScript = vi.fn().mockRejectedValue(new Error('stop after retry selection'));
    const writeToCache = vi.fn();
    const selectedPackages = [
      { name: '@nocobase/cli', location: '/repository/packages/core/cli' },
      { name: 'plugin', location: '/repository/packages/plugins/plugin' },
    ];

    try {
      process.argv = [...originalArgv, '--retry'];
      vi.resetModules();
      vi.doMock('../utils/getPackages', async () => ({
        ...(await vi.importActual<typeof import('../utils/getPackages')>('../utils/getPackages')),
        getPackages: vi.fn(() => selectedPackages),
      }));
      vi.doMock('../utils', async () => ({
        ...(await vi.importActual<typeof import('../utils')>('../utils')),
        readFromCache: vi.fn(() => ({ pkg: 'stale-package' })),
        runScript,
        writeToCache,
      }));
      const { build: buildWithStaleCache } = await import('../build');

      await expect(buildWithStaleCache(['plugin'])).rejects.toThrow('stop after retry selection');
      expect(runScript).toHaveBeenCalledWith(['build'], '/repository/packages/core/cli');
      expect(writeToCache).toHaveBeenCalledWith('build-error', {});
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("cached retry package 'stale-package'"));
    } finally {
      process.argv = originalArgv;
      warning.mockRestore();
      vi.doUnmock('../utils/getPackages');
      vi.doUnmock('../utils');
      vi.resetModules();
    }
  });
});
