import { describe, expect, it } from 'vitest';
import { planDatabaseExecution } from '../src/database/execution-plan.js';
import type { AppDatabaseTask } from '../src/database/plan.js';
import type { AppDatabaseTaskOperation } from '../src/database/tasks.js';

const hooks = ['first', 'second'].map((name) => ({
  name,
  beforeTasks: async () => {},
}));
const task = (
  connection: string,
  kind: AppDatabaseTask['kind'],
  skipReason?: AppDatabaseTask['skipReason'],
): AppDatabaseTask => ({
  connection,
  kind,
  config: { directory: '/unused' },
  skipReason,
});
// Deliberately put the default connection last. Planning must neither reorder it nor perform I/O.
const tasks = [
  task('reports', 'migrations'),
  task('reports', 'seeds'),
  task('main', 'migrations'),
  task('main', 'seeds'),
  task('external', 'migrations', 'external'),
];
function steps({
  withHooks = false,
  fresh = false,
  dryRun = false,
  operation = 'run' as AppDatabaseTaskOperation,
} = {}) {
  return planDatabaseExecution(tasks, {
    hooks: withHooks ? hooks : [],
    fresh,
    dryRun,
    operation,
  }).map((step) =>
    step.type === 'run-task'
      ? `run:${step.index}`
      : step.type === 'before-tasks'
        ? `hook:${step.hook.name}`
        : 'connection' in step
          ? `${step.type}:${step.connection}`
          : step.type,
  );
}

describe('database execution planning', () => {
  it('preserves per-task storage preparation without hooks', () => {
    expect(steps()).toEqual([
      'inspect-installs',
      'prepare-storage:reports',
      'run:0',
      'prepare-storage:reports',
      'run:1',
      'prepare-storage:main',
      'run:2',
      'prepare-storage:main',
      'run:3',
    ]);
  });
  it('keeps each unhooked fresh reset immediately before its migrations', () => {
    expect(steps({ fresh: true })).toEqual([
      'inspect-installs',
      'prepare-storage:reports',
      'reset-schema:reports',
      'run:0',
      'prepare-storage:reports',
      'run:1',
      'prepare-storage:main',
      'reset-schema:main',
      'run:2',
      'prepare-storage:main',
      'run:3',
    ]);
  });
  it('deduplicates selected preparation before hooks on ordinary runs', () => {
    expect(steps({ withHooks: true })).toEqual([
      'prepare-storage:reports',
      'prepare-storage:main',
      'hook:first',
      'hook:second',
      'inspect-installs',
      'run:0',
      'run:1',
      'run:2',
      'run:3',
    ]);
  });
  it('plans all selected fresh resets before hooks and never resets skipped entries', () => {
    expect(steps({ withHooks: true, fresh: true })).toEqual([
      'prepare-storage:reports',
      'reset-schema:reports',
      'prepare-storage:main',
      'reset-schema:main',
      'hook:first',
      'hook:second',
      'inspect-installs',
      'run:0',
      'run:1',
      'run:2',
      'run:3',
    ]);
  });
  it.each([false, true])(
    'plans only read-only previews with hooks=%s',
    (withHooks) => {
      expect(steps({ withHooks, fresh: true, dryRun: true })).toEqual([
        'run:0',
        'run:1',
        'run:2',
        'run:3',
      ]);
    },
  );
  it.each(['repair', 'unlock'] as const)(
    'excludes hooks and install inspection for %s',
    (operation) => {
      expect(steps({ withHooks: true, operation })).toEqual([
        'prepare-storage:reports',
        'run:0',
        'prepare-storage:reports',
        'run:1',
        'prepare-storage:main',
        'run:2',
        'prepare-storage:main',
        'run:3',
      ]);
    },
  );
  it.each(['rollback', 'sample'] as const)(
    'prepares once and runs hooks before %s',
    (operation) => {
      expect(steps({ withHooks: true, operation })).toEqual([
        'prepare-storage:reports',
        'prepare-storage:main',
        'hook:first',
        'hook:second',
        'run:0',
        'run:1',
        'run:2',
        'run:3',
      ]);
    },
  );
  it('has no steps for empty or entirely skipped plans', () => {
    const options = {
      hooks,
      fresh: true,
      dryRun: false,
      operation: 'run' as const,
    };
    expect(planDatabaseExecution([], options)).toEqual([]);
    expect(
      planDatabaseExecution(
        tasks.map((t) => ({ ...t, skipReason: 'auto-run-disabled' })),
        options,
      ),
    ).toEqual([]);
  });
});
