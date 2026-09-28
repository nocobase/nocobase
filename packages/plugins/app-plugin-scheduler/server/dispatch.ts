import type {
  ScheduleExecutionContext as FiringContext,
  ScheduleJob,
  ScheduleJobOption,
} from '@nocobase/jobs';

import type { ScheduleOccurrenceStore } from './occurrences.js';
import type { JsonObject } from './schedules/define.js';
import type { ScheduleTargetRegistry } from './schedules/registry.js';

/** What a schedule's rule and dispatch are built from: a definition or its stored row. */
export interface ScheduleJobSpec {
  readonly id: string;
  readonly cron: string;
  readonly timezone: string;
  readonly from?: Date;
  readonly to?: Date;
  readonly target: { readonly type: string; readonly config: JsonObject };
  readonly definitionHash: string;
}

/** Stored with the rule; a firing reads the job it was created from rather than this. */
export interface ScheduleDispatchPayload {
  readonly target: { readonly type: string; readonly config: JsonObject };
  readonly definitionHash: string;
}

export interface ScheduleDispatchDependencies {
  readonly targets: ScheduleTargetRegistry;
  readonly occurrences: ScheduleOccurrenceStore;
}

/**
 * The executor job of one schedule. Its name is the schedule id, a SHA-256
 * hex digest, so it never contains the `:` job names must not. `limit` is the
 * applied limit — what remains of the definition's limit — or undefined.
 */
export function createScheduleDispatchJob(
  spec: ScheduleJobSpec,
  limit: number | undefined,
  dependencies: ScheduleDispatchDependencies,
): ScheduleJob<ScheduleDispatchPayload> {
  const options: ScheduleJobOption = {
    cron: spec.cron,
    tz: spec.timezone,
    // A schedule's `from` is inclusive, while the executor fires strictly
    // after its start date, as BullMQ does.
    ...(spec.from ? { startDate: new Date(spec.from.getTime() - 1) } : {}),
    ...(spec.to ? { endDate: spec.to } : {}),
    ...(limit !== undefined ? { limit } : {}),
  };
  return {
    name: spec.id,
    options,
    payload: { target: spec.target, definitionHash: spec.definitionHash },
    execute: (context) => dispatch(spec, context, dependencies),
  };
}

async function dispatch(
  spec: ScheduleJobSpec,
  context: FiringContext,
  { targets, occurrences }: ScheduleDispatchDependencies,
): Promise<void> {
  // The occurrence is the firing: its id is the executor's job id, so the same
  // firing delivered twice records, and starts its target, once.
  const occurrenceId = context.jobId;
  const executionContext = { scheduleId: spec.id, occurrenceId };
  const record = {
    scheduleId: spec.id,
    definitionHash: spec.definitionHash,
    targetType: spec.target.type,
    scheduledAt: context.scheduledAt,
  };
  const targetState = (
    await targets.describe(spec.target.type, spec.target.config)
  ).state;
  if (targetState && targetState !== 'ready') {
    await occurrences.skip(occurrenceId, `target-${targetState}`, record);
    return;
  }
  const action = await occurrences.start(
    executionContext,
    spec.definitionHash,
    spec.target.type,
    context.scheduledAt,
  );
  if (action === 'noop') return;
  try {
    const result = await targets.start(
      spec.target.type,
      spec.target.config,
      executionContext,
    );
    switch (result.state) {
      case 'completed':
        await occurrences.succeed(occurrenceId, result.result);
        return;
      case 'accepted': {
        await occurrences.wait(occurrenceId, result.reference, result.receipt);
        const observation = await targets.inspect(
          spec.target.type,
          result.reference,
        );
        if (observation.state === 'completed')
          await occurrences.complete(
            occurrenceId,
            result.reference,
            observation.completion,
          );
        return;
      }
      case 'skipped':
        await occurrences.skip(occurrenceId, result.reason);
        return;
      case 'failed':
        await occurrences.fail(occurrenceId, result.reason);
        return;
    }
  } catch (error) {
    try {
      await occurrences.fail(occurrenceId, 'dispatch-failed');
    } catch (completionError) {
      console.error('Failed to record schedule dispatch failure', {
        occurrenceId,
        error: completionError,
      });
    }
    throw error;
  }
}
