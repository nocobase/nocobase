import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { AppCommand } from '@nocobase/app-cli';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';

import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '../src/cli/index.js';

const fixtureRoot = fileURLToPath(new URL('./fixtures/app', import.meta.url));

class WriteStorage extends AppCommand {
  public async run(): Promise<{ storage: string }> {
    await this.parse(WriteStorage);
    let storage = '';
    await this.withApp(async ({ app }) => {
      await app.start();
      storage = app.paths.storage();
      await mkdir(storage, { recursive: true });
      await writeFile(app.paths.storage('fixture.txt'), 'test data');
    });
    return { storage };
  }
}

it('isolates command storage in each configuration directory and removes it on disposal', async () => {
  const left = await createTestAppConfig();
  const right = await createTestAppConfig();
  try {
    for (const config of [left, right]) {
      const run = await runAppCommand(
        bindTestAppCommand(WriteStorage, { rootDir: fixtureRoot, config }),
        ['--json'],
      );
      expect(run.json()).toMatchObject({
        ok: true,
        result: { storage: path.join(config.directory, 'storage') },
      });
      expect(
        await readFile(
          path.join(config.directory, 'storage/fixture.txt'),
          'utf8',
        ),
      ).toBe('test data');
    }
    expect(left.directory).not.toBe(right.directory);
    await left.dispose();
    expect(existsSync(left.directory)).toBe(false);
    expect(existsSync(path.join(right.directory, 'storage/fixture.txt'))).toBe(
      true,
    );
  } finally {
    await Promise.all([left.dispose(), right.dispose()]);
  }
  expect(existsSync(right.directory)).toBe(false);
});

class CountItems extends AppCommand {
  static override summary = 'Count the fixture items.';

  public async run(): Promise<{ count: number }> {
    let count = 0;
    await this.withApp(async ({ app }) => {
      await app.start();
      const rows = await app.container
        .resolve(databaseManagerToken)
        .connection()
        .query.selectFrom('fixtureItems')
        .select(['name'])
        .execute();
      count = rows.length;
    });
    return { count };
  }
}

it('runs a command against the application on test databases of its own', async () => {
  const config = await createTestAppConfig();
  try {
    const run = await runAppCommand(
      bindTestAppCommand(CountItems, {
        rootDir: fixtureRoot,
        config,
        id: 'fixture:count',
      }),
      ['--json'],
    );
    expect(run.json()).toMatchObject({ ok: true, result: { count: 2 } });
  } finally {
    await config.dispose();
  }
});
