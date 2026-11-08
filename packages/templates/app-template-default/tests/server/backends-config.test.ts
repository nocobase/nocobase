import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { createJobExecutorService } from '@nocobase/jobs';
import { createQueueService } from '@nocobase/queue';
import appRuntime from '../../server/runtime.ts';

const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});
async function runtime(yaml: string) {
  const root = await mkdtemp(path.join(tmpdir(), 'backends-template-'));
  directories.push(root);
  const configPath = path.join(root, 'config.yml');
  await writeFile(configPath, yaml);
  return resolveStandaloneAppRuntime(appRuntime, {
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    configPath,
    env: { AUTH_SECRET: 'test-auth-secret-at-least-32-characters' },
  });
}
describe('merged backend configuration in the real template', () => {
  it('keeps local defaults without additional user configuration', async () => {
    const resolved = await runtime('{}');
    expect(resolved.config.get('concurrency.default')).toBe('memory');
    expect(resolved.config.get('concurrency.backends.memory')).toEqual({
      adapter: 'mutex',
    });
    expect(resolved.config.get('jobs.default')).toBeUndefined();
    expect(resolved.config.get('queue.default')).toBeUndefined();
    expect(resolved.config.get('jobs.backends.memory')).toEqual({
      adapter: 'memory',
      persistence: { path: resolved.paths.storage('jobs') },
    });
    expect(resolved.config.get('queue.backends.memory')).toEqual({
      adapter: 'inMemory',
      persistence: { path: resolved.paths.storage('queue') },
    });
    const issues = await resolved.config.validate();
    expect(
      issues.filter((issue) =>
        /^(concurrency|jobs|queue)(\.|$)/u.test(issue.path),
      ),
    ).toEqual([]);
    const jobs = createJobExecutorService(resolved.config.get('jobs'), {
      appName: 'app',
      storagePath: resolved.paths.storage('jobs'),
    });
    const queue = createQueueService(resolved.config.get('queue'), {
      appName: 'app',
      storagePath: resolved.paths.storage('queue'),
    });
    try {
      expect(jobs.getJobExecutor('scope')).toBeDefined();
      await queue.setup();
    } finally {
      await jobs.shutdown();
      await queue.shutdown();
    }
  });
  it.each(['concurrency', 'jobs', 'queue'])(
    'rejects old user YAML merged over new %s defaults, selected or not',
    async (section) => {
      const adapter =
        section === 'concurrency'
          ? 'mutex'
          : section === 'queue'
            ? 'inMemory'
            : 'memory';
      for (const selector of [
        '',
        '  default: memory\n',
        '  default: legacy\n',
      ]) {
        const resolved = await runtime(
          `${section}:\n${selector}  legacy:\n    adapter: ${adapter}\n`,
        );
        const issues = await resolved.config.validate();
        expect(issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              level: 'error',
              message: expect.stringContaining('old configuration format'),
            }),
          ]),
        );
        expect(JSON.stringify(issues)).toContain(`${section}.backends.legacy`);
      }
    },
  );
  it.each(['concurrency', 'jobs', 'queue'])(
    'rejects same-name legacy overrides for %s',
    async (section) => {
      const adapter =
        section === 'concurrency'
          ? 'mutex'
          : section === 'queue'
            ? 'inMemory'
            : 'memory';
      const resolved = await runtime(
        `${section}:\n  default: memory\n  memory:\n    adapter: ${adapter}\n`,
      );
      expect(await resolved.config.validate()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            level: 'error',
            message: expect.stringContaining(`${section}.backends.memory`),
          }),
        ]),
      );
    },
  );
});
