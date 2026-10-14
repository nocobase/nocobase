import { mkdtemp, rm, writeFile, unlink } from 'node:fs/promises';
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
      (await detectTools(loadAdapters(source, passEnv))).find(
        (tool) => tool.kind === 'opencode',
      );
    const install = (version: string) =>
      writeFile(
        binary,
        `#!${process.execPath}\nconst fs = require('node:fs');\nif(process.argv[2] === '--version') console.log('opencode v${version}');\nelse if(fs.existsSync(${JSON.stringify(marker)})) console.log('Provider stored');\nelse if(process.env.OPENAI_API_KEY) console.log('Provider environment');\n`,
        { mode: 0o755 },
      );
    try {
      expect(await inspect()).toBeUndefined();
      await install('1.9.0');
      expect(await inspect()).toBeUndefined();
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
