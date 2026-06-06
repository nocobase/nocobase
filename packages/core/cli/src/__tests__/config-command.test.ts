/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, test, vi } from 'vitest';
import { loadAuthConfig } from '../lib/auth-store.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-config-'));
  const tempWorkspace = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-config-cwd-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempWorkspace);
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
    await rm(tempWorkspace, { recursive: true, force: true });
  }
}

test('nb config set/get/delete updates supported keys', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigGet } = await import('../commands/config/get.js');
    const { default: ConfigDelete } = await import('../commands/config/delete.js');

    const setCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'docker.network',
          value: 'nocobase-team',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCommand);
    expect(setCommand.log).toHaveBeenCalledWith('docker.network=nocobase-team');

    const getCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'docker.network',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getCommand);
    expect(getCommand.log).toHaveBeenCalledWith('nocobase-team');

    const deleteCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'docker.network',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteCommand);
    expect(deleteCommand.log).toHaveBeenCalledWith('Deleted docker.network');

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.settings?.docker?.network).toBe(undefined);
  });
});

test('nb config set/get/delete supports locale', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigGet } = await import('../commands/config/get.js');
    const { default: ConfigDelete } = await import('../commands/config/delete.js');

    const setCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'locale',
          value: 'zh',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCommand);
    expect(setCommand.log).toHaveBeenCalledWith('locale=zh-CN');

    const getCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'locale',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getCommand);
    expect(getCommand.log).toHaveBeenCalledWith('zh-CN');

    const deleteCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'locale',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteCommand);
    expect(deleteCommand.log).toHaveBeenCalledWith('Deleted locale');

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.settings?.locale).toBe(undefined);
  });
});

test('nb config set/get/delete supports update.policy', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigGet } = await import('../commands/config/get.js');
    const { default: ConfigDelete } = await import('../commands/config/delete.js');

    const setCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'update.policy',
          value: 'auto',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCommand);
    expect(setCommand.log).toHaveBeenCalledWith('update.policy=auto');

    const getCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'update.policy',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getCommand);
    expect(getCommand.log).toHaveBeenCalledWith('auto');

    const deleteCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'update.policy',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteCommand);
    expect(deleteCommand.log).toHaveBeenCalledWith('Deleted update.policy');

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.settings?.update?.policy).toBe(undefined);
  });
});

test('nb config set/get/delete supports binary override keys', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigGet } = await import('../commands/config/get.js');
    const { default: ConfigDelete } = await import('../commands/config/delete.js');

    const setCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.docker',
          value: '/usr/local/bin/docker',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCommand);
    expect(setCommand.log).toHaveBeenCalledWith('bin.docker=/usr/local/bin/docker');

    const getCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.docker',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getCommand);
    expect(getCommand.log).toHaveBeenCalledWith('/usr/local/bin/docker');

    const deleteCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.docker',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteCommand);
    expect(deleteCommand.log).toHaveBeenCalledWith('Deleted bin.docker');

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.settings?.bin?.docker).toBe(undefined);
  });
});

test('nb config set/get/delete supports caddy/nginx binaries and proxy path settings', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigGet } = await import('../commands/config/get.js');
    const { default: ConfigDelete } = await import('../commands/config/delete.js');

    const setCaddyCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.caddy',
          value: '/usr/bin/caddy',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCaddyCommand);
    expect(setCaddyCommand.log).toHaveBeenCalledWith('bin.caddy=/usr/bin/caddy');

    const setNginxCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.nginx',
          value: '/usr/sbin/nginx',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setNginxCommand);
    expect(setNginxCommand.log).toHaveBeenCalledWith('bin.nginx=/usr/sbin/nginx');

    const setProxyRootCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.nb-cli-root',
          value: '/workspace',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setProxyRootCommand);
    expect(setProxyRootCommand.log).toHaveBeenCalledWith('proxy.nb-cli-root=/workspace');

    const setProxyHostCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.upstream-host',
          value: 'host.docker.internal',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setProxyHostCommand);
    expect(setProxyHostCommand.log).toHaveBeenCalledWith('proxy.upstream-host=host.docker.internal');

    const getCaddyCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.caddy',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getCaddyCommand);
    expect(getCaddyCommand.log).toHaveBeenCalledWith('/usr/bin/caddy');

    const getNginxCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.nginx',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getNginxCommand);
    expect(getNginxCommand.log).toHaveBeenCalledWith('/usr/sbin/nginx');

    const getProxyRootCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.nb-cli-root',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getProxyRootCommand);
    expect(getProxyRootCommand.log).toHaveBeenCalledWith('/workspace');

    const getProxyHostCommand = Object.assign(Object.create(ConfigGet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.upstream-host',
        },
      })),
      log: vi.fn(),
    });
    await ConfigGet.prototype.run.call(getProxyHostCommand);
    expect(getProxyHostCommand.log).toHaveBeenCalledWith('host.docker.internal');

    const deleteCaddyCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.caddy',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteCaddyCommand);
    expect(deleteCaddyCommand.log).toHaveBeenCalledWith('Deleted bin.caddy');

    const deleteNginxCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'bin.nginx',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteNginxCommand);
    expect(deleteNginxCommand.log).toHaveBeenCalledWith('Deleted bin.nginx');

    const deleteProxyRootCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.nb-cli-root',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteProxyRootCommand);
    expect(deleteProxyRootCommand.log).toHaveBeenCalledWith('Deleted proxy.nb-cli-root');

    const deleteProxyHostCommand = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.upstream-host',
        },
      })),
      log: vi.fn(),
    });
    await ConfigDelete.prototype.run.call(deleteProxyHostCommand);
    expect(deleteProxyHostCommand.log).toHaveBeenCalledWith('Deleted proxy.upstream-host');

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.settings?.bin?.caddy).toBe(undefined);
    expect(config.settings?.bin?.nginx).toBe(undefined);
    expect(config.settings?.proxy?.nbCliRoot).toBe(undefined);
    expect(config.settings?.proxy?.upstreamHost).toBe(undefined);
  });
});

test('nb config list prints only explicit settings', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');
    const { default: ConfigList } = await import('../commands/config/list.js');

    const setCommand = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'license.pkg-url',
          value: 'https://pkg.example.com',
        },
      })),
      log: vi.fn(),
    });
    await ConfigSet.prototype.run.call(setCommand);

    const listCommand = Object.assign(Object.create(ConfigList.prototype), {
      parse: vi.fn(async () => ({})),
      log: vi.fn(),
    });
    await ConfigList.prototype.run.call(listCommand);
    expect(String(listCommand.log.mock.calls[0]?.[0] ?? '')).toContain('license.pkg-url');
    expect(String(listCommand.log.mock.calls[0]?.[0] ?? '')).toContain('https://pkg.example.com/');
  });
});

test('nb config rejects the removed proxy.provider key', async () => {
  await withTempCliHome(async () => {
    const { default: ConfigSet } = await import('../commands/config/set.js');

    const command = Object.assign(Object.create(ConfigSet.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'proxy.provider',
          value: 'nginx',
        },
      })),
    });

    await expect(ConfigSet.prototype.run.call(command)).rejects.toThrow(
      'Unsupported config key "proxy.provider".',
    );
  });
});
