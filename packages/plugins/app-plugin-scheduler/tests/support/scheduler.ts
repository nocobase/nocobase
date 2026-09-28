import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  createDatabaseManager,
  type DatabaseManager,
  type Row,
} from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import {
  createJobExecutorService,
  type ManagedJobExecutorService,
  type ScheduleConfig,
  type ScheduleExecutor,
} from '@nocobase/jobs';

import createDefinitions from '../../database/migrations/202609020001_scheduler_create_definitions.js';
import addRunState from '../../database/migrations/202609240001_scheduler_add_run_state.js';
import { createScheduleDispatchJob } from '../../server/dispatch.js';
import { ScheduleOccurrenceStore } from '../../server/occurrences.js';
import {
  defineSchedule,
  type ScheduleDefinition,
} from '../../server/schedules/define.js';
import { ScheduleTargetRegistry } from '../../server/schedules/registry.js';
import { SCHEDULER_SCOPE } from '../../server/providers/scheduler.js';
import { ScheduleStore } from '../../server/store.js';

/** A SQLite database with the Scheduler's migrations applied. */
export async function createSchedulerDatabase(
  filename: string = ':memory:',
): Promise<DatabaseManager> {
  const database = createDatabaseManager({
    drivers: { sqlite },
    connections: { main: { dialect: 'sqlite', filename } },
  });
  const connection = database.connection();
  const context = {
    builder: connection.builder,
    query: connection.query,
    connection,
  };
  await createDefinitions.up(context);
  await addRunState.up(context);
  return database;
}

export interface ScheduleServiceHarness {
  readonly directory: string;
  readonly service: ManagedJobExecutorService;
  executor(): ScheduleExecutor;
  dispose(): Promise<void>;
}

/** A schedule service on the memory adapter, persisting into a fresh temporary directory. */
export async function createMemoryScheduleService(
  config?: ScheduleConfig,
): Promise<ScheduleServiceHarness> {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-scheduler-'),
  );
  const service = createJobExecutorService(config, {
    appName: 'main',
    storagePath: directory,
  });
  return {
    directory,
    service,
    executor: () => service.getScheduleExecutor(SCHEDULER_SCOPE),
    dispose: async () => {
      await service.shutdown();
      await rm(directory, { recursive: true, force: true });
    },
  };
}

export interface StoreHarness {
  readonly store: ScheduleStore;
  readonly targets: ScheduleTargetRegistry;
  readonly occurrences: ScheduleOccurrenceStore;
}

export function createStore(
  database: DatabaseManager,
  executor: ScheduleExecutor,
  appName: string = 'main',
  now?: () => Date,
): StoreHarness {
  const targets = new ScheduleTargetRegistry();
  const occurrences = new ScheduleOccurrenceStore(database);
  const store = new ScheduleStore(
    database,
    appName,
    executor,
    (spec, limit) =>
      createScheduleDispatchJob(spec, limit, { targets, occurrences }),
    ...(now ? [now] : []),
  );
  return { store, targets, occurrences };
}

export function entry(definition: ScheduleDefinition) {
  return { definition: defineSchedule(definition) };
}

export function baseDefinition(
  overrides: Partial<ScheduleDefinition> = {},
): ScheduleDefinition {
  return {
    key: 'daily',
    title: 'Daily',
    schedule: { cron: '0 0 * * *', timezone: 'UTC' },
    target: { type: 'report', config: { reportKey: 'test' } },
    ...overrides,
  };
}

export function rows(database: DatabaseManager, table: string): Promise<Row[]> {
  return database.query().selectFrom(table).selectAll().execute();
}

export async function definitionRow(
  database: DatabaseManager,
  id: string,
): Promise<Row | undefined> {
  return database
    .query()
    .selectFrom('schedule_definitions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
}
