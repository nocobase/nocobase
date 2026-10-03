// @vitest-environment node
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import type { Application } from '@nocobase/app-server';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import cliPlugin from '../cli/index.ts';
import ScheduleSync from '../cli/sync.ts';
import { schedulerStartupModeToken } from '../server/providers/scheduler.js';

/**
 * `scheduler sync` bound to a stand-in for the application `withApp()` creates: a real container, so the startup mode
 * the command registers can be read back, and a lifecycle that records what happened in which order.
 */
function bindSync(options: { startFails?: boolean } = {}) {
  const events: string[] = [];
  const container = new ServiceContainer();
  const app = {
    container,
    start: vi.fn(async () => {
      events.push(
        `start ${JSON.stringify(container.resolveIfCreated(schedulerStartupModeToken))}`,
      );
      if (options.startFails) throw new Error('Database unreachable');
    }),
    shutdown: vi.fn(async () => {
      events.push('shutdown');
    }),
  } as unknown as Application;
  const Sync = bindAppCommand(ScheduleSync, {
    id: 'scheduler:sync',
    // The stubs below replace everything withApp() would load from the application, so nothing is read from its root.
    rootDir: import.meta.dirname,
    loadRuntime: async () =>
      ({
        env: {},
        scope: {
          destroy: async () => {
            events.push('scope destroyed');
          },
        },
      }) as never,
    createApp: () => app,
  });
  return { Sync, events };
}

describe('scheduler sync', () => {
  it('is contributed under the scheduler topic', () => {
    expect(cliPlugin).toMatchObject({
      topic: 'scheduler',
      commands: { sync: ScheduleSync },
    });
    // `--json` comes from AppCommand rather than a flag of its own.
    expect(ScheduleSync.flags).not.toHaveProperty('json');
  });

  it('prints its result as the --json document', async () => {
    const { Sync } = bindSync();

    const run = await runAppCommand(Sync, ['--json']);

    expect(run.json()).toEqual({
      schemaVersion: 1,
      ok: true,
      command: 'scheduler sync',
      status: 'success',
      result: { finalize: false },
      warnings: [],
    });
  });

  it('starts the application in sync-only mode, then shuts it down and destroys the scope', async () => {
    const { Sync, events } = bindSync();

    await runAppCommand(Sync, []);

    expect(events).toEqual([
      'start {"kind":"sync-only","finalize":false}',
      'shutdown',
      'scope destroyed',
    ]);
  });

  it('passes --finalize to the startup mode and reports it', async () => {
    const { Sync, events } = bindSync();

    const run = await runAppCommand(Sync, ['--finalize']);

    expect(run.result).toEqual({ finalize: true });
    expect(events[0]).toBe('start {"kind":"sync-only","finalize":true}');
  });

  it('still puts the application away when starting it fails', async () => {
    const { Sync, events } = bindSync({ startFails: true });

    const run = await runAppCommand(Sync, []);

    expect(run.error).toMatchObject({ message: 'Database unreachable' });
    expect(run.exitCode).toBe(1);
    expect(events.slice(1)).toEqual(['shutdown', 'scope destroyed']);
  });
});
