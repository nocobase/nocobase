import { fileURLToPath } from 'node:url';

import { AppCommand } from '@nocobase/app-cli';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';

import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '../src/cli/index.js';

const fixtureRoot = fileURLToPath(new URL('./fixtures/app', import.meta.url));

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
