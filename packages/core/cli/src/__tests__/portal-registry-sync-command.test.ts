/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createPortalWorkspace: vi.fn(),
  syncPortalRegistries: vi.fn(),
  getCurrentEnvName: vi.fn(async () => 'app1'),
  getEnv: vi.fn(),
  ensureCrossEnvConfirmed: vi.fn(async () => true),
  hasExplicitEnvSelection: vi.fn(() => false),
  printInfo: vi.fn(),
  printSuccess: vi.fn(),
  printWarning: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
}));

vi.mock('../lib/env-guard.js', () => ({
  ensureCrossEnvConfirmed: mocks.ensureCrossEnvConfirmed,
  hasExplicitEnvSelection: mocks.hasExplicitEnvSelection,
}));

vi.mock('../lib/portal-create.js', () => ({
  createPortalWorkspace: mocks.createPortalWorkspace,
}));

vi.mock('../lib/portal-registry-sync.js', () => ({
  syncPortalRegistries: mocks.syncPortalRegistries,
}));

vi.mock('../lib/ui.js', () => ({
  printInfo: mocks.printInfo,
  printSuccess: mocks.printSuccess,
  printWarning: mocks.printWarning,
}));

const env = {
  name: 'app1',
  kind: 'local',
  apiBaseUrl: 'http://localhost:13000/api',
  storagePath: '/tmp/storage',
  config: {
    apiBaseUrl: 'http://localhost:13000/api',
    storagePath: '/tmp/storage',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEnv.mockResolvedValue(env);
  mocks.createPortalWorkspace.mockResolvedValue({
    portal: 'customer',
    portalDir: '/tmp/storage/portals/main/customer',
    app: 'main',
    title: 'Customer',
    apiBaseUrl: env.apiBaseUrl,
    portalBase: '/x/customer/',
    installSkipped: false,
    sourceStorage: 'nocobase',
  });
  mocks.syncPortalRegistries.mockResolvedValue({
    portal: 'customer',
    portalDir: '/tmp/storage/portals/main/customer',
    items: ['@nocobase/all'],
    skippedItems: [],
    status: 'installed',
  });
});

test('portal create automatically installs all enabled service Registries', async () => {
  const { default: PortalCreate } = await import('../commands/portal/create.js');
  const command = Object.assign(Object.create(PortalCreate.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      args: { portal: 'customer' },
      flags: {
        template: '@nocobase/portal-template-default',
        force: false,
        'source-storage': 'nocobase',
      },
    })),
    config: { pjson: { version: '2.2.0-test.1' } },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await PortalCreate.prototype.run.call(command);

  expect(mocks.syncPortalRegistries).toHaveBeenCalledWith({
    portal: 'customer',
    env,
    installDependencies: false,
    skipIfUnsupported: true,
    onWarning: expect.any(Function),
  });
});

test('portal registry sync forwards selected items and overwrite/build flags', async () => {
  const { default: PortalRegistrySync } = await import('../commands/portal/registry/sync.js');
  const command = Object.assign(Object.create(PortalRegistrySync.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      args: { portal: 'customer', items: ['ai', 'acl'] },
      flags: { overwrite: true, 'overwrite-ui': true, build: true, yes: false },
    })),
    config: { pjson: { version: '2.2.0-test.1' } },
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await PortalRegistrySync.prototype.run.call(command);

  expect(mocks.syncPortalRegistries).toHaveBeenCalledWith({
    portal: 'customer',
    items: ['ai', 'acl'],
    env,
    overwrite: true,
    overwriteUi: true,
    diff: undefined,
    build: true,
  });
});
