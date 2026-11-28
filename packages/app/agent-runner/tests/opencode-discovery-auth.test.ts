import { mkdir, mkdtemp, rm, writeFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { loadAdapters } from '../src/agent/adapters/registry.ts';
import { detectTools } from '../src/core/tool-capabilities.ts';

it.skipIf(process.platform === 'win32')(
  'rediscovers upgrades and login changes while preserving application environment isolation',
  async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'opencode-status-'));
    const binary = path.join(root, 'opencode');
    const marker = path.join(root, 'signed-in-marker');
    const source = {
      HOME: root,
      PATH: root,
      OPENAI_API_KEY: 'synthetic-environment-key',
    };
    const inspect = async (passEnv: string[] = []) =>
      (await detectTools(loadAdapters(source, passEnv, {}, ['opencode']))).find(
        (tool) => tool.kind === 'opencode',
      );
    const install = (version: string) =>
      writeFile(
        binary,
        `#!${process.execPath}\nconst fs = require('node:fs');\nif(process.argv[2] === '--version') console.log('opencode v${version}');\nelse if(fs.existsSync(${JSON.stringify(marker)})) console.log('Provider stored');\nelse if(process.env.OPENAI_API_KEY) console.log('Provider environment');\n`,
        { mode: 0o755 },
      );
    try {
      expect(await inspect()).toMatchObject({
        status: 'notInstalled',
        authenticated: false,
      });
      await install('1.9.0');
      expect(await inspect()).toMatchObject({
        status: 'notInstalled',
        authenticated: false,
      });
      await install('2.0.28');
      expect(await inspect()).toMatchObject({
        version: '2.0.28',
        path: binary,
        authenticated: false,
      });
      await writeFile(marker, 'ready');
      expect(await inspect()).toMatchObject({ authenticated: true });
      await install('2.0.29');
      expect(await inspect()).toMatchObject({
        version: '2.0.29',
        path: binary,
        authenticated: true,
      });
      await unlink(marker);
      expect(await inspect()).toMatchObject({ authenticated: false });
      expect(await inspect(['OPENAI_API_KEY'])).toMatchObject({
        authenticated: true,
      });
      expect(await inspect()).toMatchObject({ authenticated: false });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

it.each([
  [
    'global JSONC',
    'global',
    '{"providers":{"local":{"settings":{"apiKey":"synthetic-inline-key",},},},}',
    [],
    true,
  ],
  [
    'explicit JSON file with the legacy layout',
    'file',
    '{"provider":{"local":{"options":{"apiKey":"synthetic-inline-key"}}}}',
    [],
    true,
  ],
  [
    'explicit config directory',
    'dir',
    '{"providers":{"local":{"settings":{"apiKey":"synthetic-inline-key"}}}}',
    [],
    true,
  ],
  [
    'a configured environment reference',
    'dir',
    '{"providers":{"local":{"settings":{"apiKey":"{env:OPENAI_API_KEY}"}}}}',
    ['OPENAI_API_KEY'],
    true,
  ],
  [
    'an isolated environment reference',
    'dir',
    '{"providers":{"local":{"settings":{"apiKey":"{env:OPENAI_API_KEY}"}}}}',
    [],
    false,
  ],
  [
    'a missing environment reference',
    'global',
    '{"providers":{"local":{"settings":{"apiKey":"{env:UNSET}"}}}}',
    [],
    false,
  ],
  [
    'an empty key',
    'global',
    '{"providers":{"local":{"settings":{"apiKey":"   "}}}}',
    [],
    false,
  ],
  [
    'malformed config',
    'global',
    '{"providers":{"local":{"settings":{"apiKey":"synthetic-inline-key"}}}',
    [],
    false,
  ],
  ['a missing config', 'global', undefined, [], false],
] as const)(
  'recognizes %s with an empty auth list',
  async (_label, location, config, passEnv, authenticated) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'opencode-config-test-'));
    try {
      const source = {
        HOME: root,
        PATH: root,
        OPENAI_API_KEY: 'synthetic-env-key',
      };
      const binary = path.join(root, 'opencode');
      const global = path.join(root, '.config', 'opencode');
      const custom = path.join(root, 'custom');
      await mkdir(global, { recursive: true });
      await mkdir(custom);
      const filename =
        location === 'global'
          ? path.join(global, 'opencode.jsonc')
          : path.join(custom, 'opencode.jsonc');
      if (config !== undefined)
        await writeFile(filename, '// Synthetic provider config\n' + config);
      await writeFile(
        binary,
        '#!' +
          process.execPath +
          '\nif (process.argv[2] === "--version") console.log("2.3.2");\n',
        { mode: 0o755 },
      );
      const [tool] = await detectTools(
        loadAdapters(
          {
            ...source,
            ...(location === 'file' ? { OPENCODE_CONFIG: filename } : {}),
            ...(location === 'dir' ? { OPENCODE_CONFIG_DIR: custom } : {}),
          },
          [...passEnv],
          {},
          ['opencode'],
        ),
      );
      expect(tool).toMatchObject({
        authenticated,
        status: authenticated ? 'ready' : 'needsLogin',
      });
      expect(JSON.stringify(tool)).not.toContain('synthetic-');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

it('passes only the selected OpenCode switches and configuration paths to the tool', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'opencode-offline-test-'));
  try {
    const binary = path.join(root, 'opencode');
    const flags = {
      OPENCODE_DISABLE_MODELS_FETCH: 'true',
      OPENCODE_DISABLE_AUTOUPDATE: 'true',
      OPENCODE_CONFIG: path.join(root, 'custom.json'),
      OPENCODE_CONFIG_DIR: path.join(root, 'custom'),
      OPENCODE_DISABLE_LSP_DOWNLOAD: 'true',
      OPENCODE_DISABLE_DEFAULT_PLUGINS: 'true',
    };
    const excluded = [
      'OPENCODE_SERVER_USERNAME',
      'OPENCODE_SERVER_PASSWORD',
      'OPENCODE_API_KEY',
      'OPENAI_API_KEY',
      'OPENCODE_CONFIG_CONTENT',
    ];
    await writeFile(
      binary,
      '#!' +
        process.execPath +
        '\n' +
        'const flags = ' +
        JSON.stringify(flags) +
        ';\n' +
        'const excluded = ' +
        JSON.stringify(excluded) +
        ';\n' +
        'if (Object.entries(flags).every(([k,v]) => process.env[k] === v) && excluded.every(k => !(k in process.env))) console.log(process.argv[2] === "--version" ? "2.3.2" : "Provider stored");\n',
      { mode: 0o755 },
    );
    const [tool] = await detectTools(
      loadAdapters(
        {
          HOME: root,
          PATH: root,
          ...flags,
          ...Object.fromEntries(
            excluded.map((key) => [key, 'synthetic-excluded']),
          ),
        },
        [],
        {},
        ['opencode'],
      ),
    );
    expect(tool).toMatchObject({ status: 'ready', authenticated: true });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
