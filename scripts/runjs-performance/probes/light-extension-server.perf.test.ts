import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import type { Database, Model } from '@nocobase/database';
import { expect } from 'vitest';

import { RuntimeResolveService } from '@nocobase/plugin-light-extension/server/services/RuntimeResolveService';

const execFileAsync = promisify(execFile);
const STARTUP_RESULT_PREFIX = 'RUNJS_PERF_STARTUP_RESULT=';

type StartupMeasurement = {
  bootstrapMs: number;
  isolatedProcess: true;
  moduleLoadMs: number;
  rssDeltaBytes: number;
  wallTimeMs: number;
};

function model(values: Record<string, unknown>): Model {
  return { get: (key: string) => values[key] } as unknown as Model;
}

function selectableEntries(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `entry-${index}`,
    repoId: `repo-${index}`,
    kind: 'js-action',
    entryName: `entry-${index}`,
    entryPath: `src/client/js-actions/entry-${index}/index.ts`,
    title: `Entry ${index}`,
    category: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    compiledCommitId: `commit-${index}`,
    runtimeVersion: 'v2',
    surfaceStyle: 'action',
    runtimeCodeHash: `runtime-${index}`,
    artifactHash: String(index).padStart(64, '0'),
    filesHash: `files-${index}`,
    settingsDefaultsHash: null,
    compiledAt: new Date(0),
    healthStatus: 'ready',
  }));
}

async function selectableQueryCount(count: number): Promise<number> {
  let queries = 0;
  const db = {
    getRepository(name: string) {
      if (name === 'lightExtensionEntries') {
        return { find: async () => ((queries += 1), selectableEntries(count).map(model)) };
      }
      if (name === 'lightExtensionRepos') {
        return {
          find: async (options: { filter: { id: { $in: string[] } } }) => {
            queries += 1;
            return options.filter.id.$in.map((id) => {
              const index = Number(id.slice('repo-'.length));
              return model({ id, lifecycleStatus: 'enabled', headCommitId: `commit-${index}` });
            });
          },
          findOne: async (options: { filterByTk: string }) => {
            queries += 1;
            const index = Number(options.filterByTk.slice('repo-'.length));
            return model({ id: options.filterByTk, lifecycleStatus: 'enabled', headCommitId: `commit-${index}` });
          },
        };
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  await new RuntimeResolveService(db).listSelectableEntries();
  return queries;
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'light-extension-server', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

async function measureStartup(mode: 'disabled' | 'enabled'): Promise<StartupMeasurement> {
  const runner = path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
  const script = path.join(path.dirname(__filename), 'light-extension-server.startup.ts');
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      runner,
      '--tsconfig',
      path.join(process.cwd(), 'tsconfig.server.json'),
      '-r',
      'tsconfig-paths/register',
      script,
      mode,
    ],
    { cwd: process.cwd(), env: process.env, maxBuffer: 10 * 1024 * 1024 },
  );
  const result = stdout.split('\n').find((line) => line.startsWith(STARTUP_RESULT_PREFIX));
  if (!result) {
    throw new Error(`Missing isolated ${mode} startup measurement`);
  }
  return JSON.parse(result.slice(STARTUP_RESULT_PREFIX.length)) as StartupMeasurement;
}

describe('Light Extension server performance probe', () => {
  it('records disabled/enabled startup and selectable query counts', async () => {
    const disabled = await measureStartup('disabled');
    const enabled = await measureStartup('enabled');
    const selectableQueries = {
      oneRepo: await selectableQueryCount(1),
      oneHundredRepos: await selectableQueryCount(100),
    };
    expect(disabled.isolatedProcess).toBe(true);
    expect(enabled.isolatedProcess).toBe(true);
    expect(disabled.wallTimeMs).toBeGreaterThanOrEqual(disabled.moduleLoadMs + disabled.bootstrapMs);
    expect(enabled.wallTimeMs).toBeGreaterThanOrEqual(enabled.moduleLoadMs + enabled.bootstrapMs);
    expect(selectableQueries).toEqual({ oneRepo: 2, oneHundredRepos: 2 });

    writeMeasurement({
      selectableQueries,
      startup: { disabled, enabled },
    });
  });
});
