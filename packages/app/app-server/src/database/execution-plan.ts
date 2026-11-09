import type { AppDatabaseTask } from './plan.js';
import type { DatabaseTaskHook } from './task-hooks.js';
import type { AppDatabaseTaskOperation } from './tasks.js';

/** Internal, linear execution steps; planning performs no storage or business I/O. */
export type DatabaseExecutionStep =
  | { type: 'prepare-storage'; connection: string }
  | { type: 'reset-schema'; connection: string }
  | { type: 'before-tasks'; hook: DatabaseTaskHook }
  | { type: 'inspect-installs' }
  | { type: 'run-task'; index: number };

export function planDatabaseExecution(
  tasks: readonly AppDatabaseTask[],
  options: {
    hooks: readonly DatabaseTaskHook[];
    fresh: boolean;
    operation: AppDatabaseTaskOperation;
    dryRun: boolean;
  },
): DatabaseExecutionStep[] {
  const { fresh, operation, dryRun } = options;
  const executable = tasks.flatMap((task, index) =>
    task.skipReason ? [] : [{ task, index }],
  );
  if (!executable.length) return [];
  const hooks =
    !dryRun && ['run', 'rollback', 'sample'].includes(operation)
      ? [...options.hooks]
      : [];
  const steps: DatabaseExecutionStep[] = [];
  if (hooks.length) {
    const connections = new Set<string>();
    const resets = new Set<string>();
    for (const { task } of executable) {
      if (!connections.has(task.connection)) {
        steps.push({ type: 'prepare-storage', connection: task.connection });
        connections.add(task.connection);
      }
      if (fresh && task.kind === 'migrations' && !resets.has(task.connection)) {
        steps.push({ type: 'reset-schema', connection: task.connection });
        resets.add(task.connection);
      }
    }
    steps.push(
      ...hooks.map((hook): DatabaseExecutionStep => ({
        type: 'before-tasks',
        hook,
      })),
    );
  }
  // First-install history must be read before any migration/seed changes it.
  if (
    operation === 'run' &&
    !dryRun &&
    executable.some(({ task }) => task.kind === 'seeds')
  ) {
    steps.push({ type: 'inspect-installs' });
  }
  for (const { task, index } of executable) {
    if (!hooks.length && !dryRun) {
      // Preserve the original prepare call per task, including repeated connections.
      steps.push({ type: 'prepare-storage', connection: task.connection });
      if (fresh && task.kind === 'migrations') {
        steps.push({ type: 'reset-schema', connection: task.connection });
      }
    }
    steps.push({ type: 'run-task', index });
  }
  return steps;
}
