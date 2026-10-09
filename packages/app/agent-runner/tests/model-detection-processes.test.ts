import {
  chmod,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { PiAdapter } from '../src/agent/adapters/pi.ts';
import { OpencodeAdapter } from '../src/agent/adapters/opencode.ts';
import { ToolCapabilitiesCache } from '../src/core/tool-capabilities.ts';

async function running(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    // Orphaned zombies await the host's reaper but cannot keep the runner or its pipes alive.
    if (process.platform === 'linux') {
      const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
      return stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0] !== 'Z';
    }
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(process.platform === 'win32')(
  'model discovery process cleanup',
  () => {
    it.each(['pi', 'opencode-starting', 'opencode-listing'] as const)(
      'stop waits for %s and its descendants, including inherited stdout, to exit',
      async (mode) => {
        const dir = await mkdtemp(path.join(tmpdir(), 'model-process-test-'));
        const kind = mode === 'pi' ? 'pi' : 'opencode';
        const binary = path.join(dir, kind);
        const pidsFile = path.join(dir, 'pids.json');
        const readyFile = path.join(dir, 'detected');
        const snapshotFile = path.join(dir, 'environment.json');
        const childSource = `
        process.on('SIGTERM', () => {});
        require('node:fs').writeFileSync(${JSON.stringify(pidsFile)}, JSON.stringify([process.ppid, process.pid]));
        setInterval(() => {}, 1000);
      `;
        await writeFile(
          binary,
          `#!${process.execPath}
        const fs = require('node:fs');
        if (process.argv[2] === '--version') {
          console.log(${JSON.stringify(mode === 'pi' ? '0.99.2' : '2.0.12')});
        } else if (process.argv[2] === 'auth') {
          console.log('Provider API key stored');
        } else if (${JSON.stringify(mode)} === 'pi' && !fs.existsSync(${JSON.stringify(readyFile)})) {
          fs.writeFileSync(${JSON.stringify(readyFile)}, 'ready');
          console.log('provider model context max-out thinking images\\nopenai gpt-6-sol 200K 64K yes yes');
        } else {
          fs.writeFileSync(${JSON.stringify(snapshotFile)}, JSON.stringify({cwd: process.cwd(), keys: Object.keys(process.env), entries: fs.readdirSync('.')}));
          process.on('SIGTERM', () => ${mode === 'pi' ? '{}' : 'process.exit(0)'});
          require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(childSource)}], {stdio: 'inherit'});
          ${mode === 'opencode-listing' ? "console.log('server listening on http://127.0.0.1:4567');" : ''}
          setInterval(() => {}, 1000);
        }
      `,
        );
        await chmod(binary, 0o755);
        let pids: number[] = [];
        let listing = false;
        const adapter =
          kind === 'pi'
            ? new PiAdapter({ searchPath: dir })
            : new OpencodeAdapter({
                searchPath: dir,
                fetch: async (_url, init) => {
                  listing = true;
                  return new Promise<Response>((_resolve, reject) => {
                    const signal = init?.signal;
                    signal?.addEventListener(
                      'abort',
                      () => reject(new Error('aborted')),
                      { once: true },
                    );
                    if (signal?.aborted) reject(new Error('aborted'));
                  });
                },
              });
        const cache = new ToolCapabilitiesCache(new Map([[kind, adapter]]), [
          { kind, authenticated: true },
        ]);
        vi.stubEnv('OPENAI_API_KEY', 'daemon-only-test-value');
        try {
          await adapter.detect();
          cache.refresh();
          await expect
            .poll(async () => {
              try {
                pids = JSON.parse(await readFile(pidsFile, 'utf8')) as number[];
                return pids.length;
              } catch {
                return 0;
              }
            })
            .toBe(2);
          if (mode === 'opencode-listing')
            await expect.poll(() => listing).toBe(true);
          const snapshot = JSON.parse(await readFile(snapshotFile, 'utf8')) as {
            cwd: string;
            keys: string[];
            entries: string[];
          };
          expect(snapshot.keys).not.toContain('OPENAI_API_KEY');
          expect(
            snapshot.keys.some((key) => key.startsWith('NOCOBASE_RUNNER_')),
          ).toBe(false);
          expect(snapshot.cwd).not.toBe(process.cwd());
          expect(snapshot.entries).toEqual([]);
          await cache.stop();
          expect(await Promise.all(pids.map(running))).toEqual([false, false]);
          await expect(readdir(snapshot.cwd)).rejects.toMatchObject({
            code: 'ENOENT',
          });
        } finally {
          vi.unstubAllEnvs();
          for (const pid of pids) {
            try {
              process.kill(pid, 'SIGKILL');
            } catch {
              /* Already exited. */
            }
          }
          await cache.stop();
          await rm(dir, { recursive: true, force: true });
        }
      },
    );
  },
);
