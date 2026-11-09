import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server';
import {
  idGeneratorLifecycleToken,
  idGeneratorToken,
} from '@nocobase/app-server/id-generator';
import { AppCommand } from '../src/context.ts';
import Apply from '../src/commands/db/apply.ts';
import Reset from '../src/commands/db/reset.ts';
import Rollback from '../src/commands/db/rollback.ts';
import Repair from '../src/commands/db/repair.ts';
import Unlock from '../src/commands/db/unlock.ts';
import {
  databaseCommandFixture,
  removeFixtureRoots,
} from './database-command-fixture.ts';
import { runAppCommand } from './command-output.ts';

const provisioned: ProvisionedTestDatabases[] = [];
afterEach(async () => {
  for (const databases of provisioned.splice(0)) await databases.drop();
  removeFixtureRoots();
});

async function fixture(failInitialize = false) {
  const databases = await provisionTestDatabases({ connections: ['main'] });
  provisioned.push(databases);
  const initialize = vi.fn(async () => {
    if (failInitialize) throw new Error('allocation failed');
  });
  const shutdown = vi.fn(async () => {});
  let sequence = 0;
  const factory = vi.fn(() => ({
    initialize,
    shutdown,
    generate: () => ++sequence,
    generateString: () => String(++sequence),
  }));
  class AllocationProvider extends ServiceProvider<Application> {
    public readonly name = 'allocation';
    public override register(): void {
      this.app.container
        .resolve(idGeneratorLifecycleToken)
        .registerFactory(factory);
    }
  }
  return {
    ...databaseCommandFixture({
      database: () => ({
        default: 'main',
        connections: { main: databases.connectionConfig('main') },
      }),
      snowflake: { mode: 'auto' },
      serviceProviders: [AllocationProvider],
    }),
    factory,
    initialize,
    shutdown,
  };
}

class ManagementCommand extends AppCommand {
  public override async run(): Promise<{ registered: boolean }> {
    await this.parse(ManagementCommand);
    return this.withApp(async ({ app }) => {
      app.registerProviders();
      app.container.resolve(idGeneratorToken);
      return { registered: true };
    });
  }
}

describe('ID lifecycle through application CLI commands', () => {
  it('does not allocate for a management command using withApp and registerProviders', async () => {
    const { bind, factory } = await fixture();
    const run = await runAppCommand(bind(ManagementCommand), ['--json']);
    expect(run.json()).toMatchObject({
      ok: true,
      result: { registered: true },
    });
    expect(factory).not.toHaveBeenCalled();
  });

  it.each([
    [Apply, ['--dry-run']],
    [Rollback, ['--dry-run']],
    [Repair, ['--dry-run']],
    [Repair, ['--force']],
    [Unlock, []],
  ] as const)('does not allocate for %s inspection', async (command, flags) => {
    const { bind, factory, migration } = await fixture();
    migration('main');
    const run = await runAppCommand(bind(command), [...flags, '--json']);
    expect(run.json().ok).toBe(true);
    expect(factory).not.toHaveBeenCalled();
  });

  it('initializes and returns on CLI exit, with one allocation per command and no app boot', async () => {
    const { bind, factory, initialize, shutdown, migration, seed } =
      await fixture();
    migration('main');
    seed('main');
    const apply = await runAppCommand(bind(Apply), ['--json']);
    expect(apply.json().ok).toBe(true);
    expect(factory).toHaveBeenCalledOnce();
    expect(initialize).toHaveBeenCalledOnce();
    expect(shutdown).toHaveBeenCalledOnce();
    const rollback = await runAppCommand(bind(Rollback), ['--force', '--json']);
    expect(rollback.json().ok).toBe(true);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(shutdown).toHaveBeenCalledTimes(2);
  });

  it('cleans up a partial allocation after a failed CLI initialization', async () => {
    const { bind, initialize, shutdown, migration } = await fixture(true);
    migration('main');
    const run = await runAppCommand(bind(Apply), ['--json']);
    expect(run.json().ok).toBe(false);
    expect(initialize).toHaveBeenCalledOnce();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it.each(['--force', '--dry-run'])(
    'allows auto reset %j and keeps previews allocation-free',
    async (flag) => {
      const { bind, factory, migration } = await fixture();
      migration('main');
      const run = await runAppCommand(bind(Reset), [flag, '--json']);
      expect(run.json().ok).toBe(true);
      expect(factory).toHaveBeenCalledTimes(flag === '--force' ? 1 : 0);
    },
  );
});
