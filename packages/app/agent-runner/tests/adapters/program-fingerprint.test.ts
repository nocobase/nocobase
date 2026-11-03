import { mkdtemp, mkdir, rm, writeFile, utimes } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it, vi } from 'vitest';
import { loadAdapters } from '../../src/agent/adapters/registry.ts';
import {
  ToolCapabilitiesCache,
  MODEL_REFRESH_INTERVAL_MS,
} from '../../src/core/tool-capabilities.ts';
import { waitFor } from '../fake-server.ts';

it
  .skipIf(process.platform === 'win32')
  .each(['codex', 'claude', 'pi', 'opencode'] as const)(
  '%s watches the program actually selected by its native adapter when two installations exist',
  async (kind) => {
    const home = await mkdtemp(path.join(os.tmpdir(), 'native-program-'));
    vi.stubEnv('HOME', home);
    const bin = path.join(home, 'path-bin');
    const extra = path.join(
      home,
      kind === 'opencode' ? '.opencode/bin' : '.local/bin',
    );
    await mkdir(bin, { recursive: true });
    await mkdir(extra, { recursive: true });
    const used = path.join(bin, kind);
    const unused = path.join(extra, kind);
    const install = async (file: string, version: string) => {
      await writeFile(
        file,
        `#!${process.execPath}\nif (process.argv[2] === '--version') console.log('${version}'); else process.exit(1);\n`,
        { mode: 0o755 },
      );
      // Distinct filesystem observations even on a coarse timestamp filesystem.
      const modified = new Date(Number(version.split('.')[0]) * 1_000_000);
      await utimes(file, modified, modified);
    };
    const adapters = () =>
      loadAdapters({ PATH: bin, HOME: home }, [], {}, [kind]);
    let now = 0;
    const cache = new ToolCapabilitiesCache(adapters, [], () => now);
    try {
      await install(used, '9.0.0');
      await install(unused, '1.0.0');
      const first = adapters().get(kind)!;
      const before = await first.fingerprint!();
      expect(await first.detect()).toMatchObject({
        path: used,
        version: '9.0.0',
      });
      cache.refresh();
      await waitFor(
        () => cache.tools[0]?.version === '9.0.0',
        3_000,
        'initial program',
      );
      await install(unused, '2.0.0');
      expect(await adapters().get(kind)!.fingerprint!()).toBe(before);
      await install(used, '10.0.0');
      expect(await adapters().get(kind)!.fingerprint!()).not.toBe(before);
      now += MODEL_REFRESH_INTERVAL_MS;
      cache.refresh();
      await waitFor(
        () => cache.tools[0]?.version === '10.0.0',
        3_000,
        'changed selected program',
      );
      expect(cache.tools[0]?.path).toBe(used);
    } finally {
      await cache.stop();
      vi.unstubAllEnvs();
      await rm(home, { recursive: true, force: true });
    }
  },
);
