// @vitest-environment node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
import type { Application } from '@nocobase/app-server';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { createAppFromRuntime } from '@nocobase/app-server/runtime';
import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ServiceProvider } from '../../../libs/service-provider/src/index.ts';
import {
  runDatabaseApplyCommand,
  runDatabaseSampleCommand,
} from '../src/database-command.ts';
import {
  databaseCommandFixture,
  removeFixtureRoots,
} from './database-command-fixture.ts';

const provisioned: ProvisionedTestDatabases[] = [];
afterEach(async () => {
  removeFixtureRoots();
  for (const databases of provisioned.splice(0)) await databases.drop();
});

const built = vi.fn(async () => {});

class SampleProvider extends ServiceProvider<Application> {
  override boot(): Promise<void> {
    this.app.container.resolve(sampleDataToken).register({
      name: 'demo',
      packageName: 'test-app',
      run: built,
    });
    return Promise.resolve();
  }
}

describe('db sample', () => {
  it('runs the sample seeds and services an installation skipped', async () => {
    const databases = await provisionTestDatabases({ connections: ['main'] });
    provisioned.push(databases);
    const fixture = databaseCommandFixture({
      database: () => ({
        default: 'main',
        connections: { main: databases.connectionConfig('main') },
      }),
    });
    fixture.runtime.createApp = (loaded) => {
      const app = createAppFromRuntime(loaded);
      app.addServiceProvider(DatabaseProvider);
      app.addServiceProvider(IdGeneratorProvider);
      app.addServiceProvider(SampleProvider);
      app.addRuntimeContributions(loaded);
      return app;
    };
    const directory = fixture.paths.database('main/seeds');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_sample.ts'),
      `import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '001_sample', sample: true, async run() {} });`,
    );

    const applied = await runDatabaseApplyCommand(
      fixture.command as never,
      { all: false },
      fixture.runtime,
    );
    expect(
      applied.results.find((entry) => entry.kind === 'seeds'),
    ).toMatchObject({ skippedSamples: ['001_sample'], freshInstall: true });

    const sampled = await runDatabaseSampleCommand(
      fixture.command as never,
      { all: false },
      fixture.runtime,
    );
    expect(sampled.results).toMatchObject([
      { connection: 'main', kind: 'seeds', executed: ['001_sample'] },
    ]);
    expect(sampled.sampleData).toEqual({ executed: ['demo'], failed: [] });
    expect(built).toHaveBeenCalledOnce();

    const again = await runDatabaseSampleCommand(
      fixture.command as never,
      { all: false },
      fixture.runtime,
    );
    expect(again.results).toMatchObject([{ executed: [] }]);
    expect(again.sampleData).toEqual({ executed: [], failed: [] });
    expect(built).toHaveBeenCalledOnce();
  });
});
