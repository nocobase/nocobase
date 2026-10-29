import { spawn } from 'node:child_process';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { createTestApp } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

it('atomically admits only one of two independent application processes', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  const children: ReturnType<typeof spawn>[] = [];
  try {
    const values = JSON.parse(await readFile(app.config.path, 'utf8'));
    for (const connection of Object.values(
      values.database.connections,
    ) as Record<string, unknown>[]) {
      connection.migrations = { autoRun: false };
      connection.seeds = { autoRun: false };
    }
    const config = path.join(app.config.directory, 'child.json');
    await writeFile(config, JSON.stringify(values));
    const gate = path.join(app.config.directory, 'gate');
    const outputs = [0, 1].map((index) =>
      path.join(app.config.directory, `claim-${index}.json`),
    );
    const finished = outputs.map((output) => {
      const child = spawn(
        process.execPath,
        [
          'node_modules/vitest/vitest.mjs',
          'run',
          'tests/resources/claim-process.test.ts',
          '--project',
          'resources',
        ],
        {
          cwd: path.resolve(import.meta.dirname, '../..'),
          env: {
            ...process.env,
            DEMO_CLAIM_CONFIG: config,
            DEMO_CLAIM_OUTPUT: output,
            DEMO_CLAIM_GATE: gate,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      children.push(child);
      let log = '';
      child.stdout!.on('data', (chunk) => {
        log += String(chunk);
      });
      child.stderr!.on('data', (chunk) => {
        log += String(chunk);
      });
      return new Promise<void>((resolve, reject) => {
        child.on('error', reject);
        child.on('exit', (code, signal) =>
          code === 0 && !signal ? resolve() : reject(new Error(log)),
        );
      });
    });
    const done = Promise.all(finished);
    // Observe failures while waiting for the startup barrier, so a failed child cannot become an unhandled rejection.
    void done.catch(() => undefined);
    const deadline = Date.now() + 25_000;
    while (
      !(
        await Promise.all(
          outputs.map((file) =>
            access(`${file}.ready`).then(
              () => true,
              () => false,
            ),
          ),
        )
      ).every(Boolean)
    ) {
      expect(Date.now()).toBeLessThan(deadline);
      await setTimeout(20);
    }
    await writeFile(gate, 'go');
    await done;
    const claims = await Promise.all(
      outputs.map(async (file) => JSON.parse(await readFile(file, 'utf8'))),
    );
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(
      await app.connection.query
        .selectFrom('demoModeDailyResets')
        .select(['state', 'attempt'])
        .execute(),
    ).toEqual([{ state: 'running', attempt: 1 }]);
  } finally {
    for (const child of children)
      if (child.exitCode === null) child.kill('SIGKILL');
    await app.close();
  }
}, 40_000);
