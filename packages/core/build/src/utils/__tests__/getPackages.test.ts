/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fgSync: vi.fn(),
  getPackagesSync: vi.fn(),
}));

vi.mock('fast-glob', () => ({
  default: {
    sync: mocks.fgSync,
  },
  sync: mocks.fgSync,
}));

vi.mock('@lerna/project', () => ({
  getPackagesSync: mocks.getPackagesSync,
}));

let tempRoot: string;

beforeEach(async () => {
  vi.resetModules();
  mocks.fgSync.mockReset();
  mocks.getPackagesSync.mockReset();
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-build-get-packages-'));
});

afterEach(async () => {
  await fs.remove(tempRoot);
});

test('getPackages falls back to Package.lazy for symlink-exposed plugin packages', async () => {
  const packageDir = path.join(tempRoot, 'packages', 'plugins', '@my-plugin', 'plugin-hello');
  await fs.mkdirp(packageDir);
  await fs.writeJson(path.join(packageDir, 'package.json'), {
    name: '@my-plugin/plugin-hello',
    version: '1.0.0',
    dependencies: {},
  });

  mocks.fgSync.mockImplementation((patterns: string[] | string) => {
    const joinedPatterns = Array.isArray(patterns) ? patterns.join(',') : patterns;
    if (joinedPatterns.includes('package.json')) {
      return [path.join(packageDir, 'package.json')];
    }
    return [];
  });
  mocks.getPackagesSync.mockReturnValue([]);

  const { getPackages } = await import('../getPackages');
  const packages = getPackages(['@my-plugin/plugin-hello']);

  expect(packages).toHaveLength(1);
  expect(packages[0]?.name).toBe('@my-plugin/plugin-hello');
  expect(packages[0]?.location).toBe(packageDir);
});
