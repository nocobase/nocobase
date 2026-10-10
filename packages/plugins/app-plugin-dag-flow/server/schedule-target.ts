import type { DatabaseManager, Row } from '@nocobase/db';
import type { WorkflowServiceContract } from './tokens.js';
import type {
  JsonObject,
  ScheduleExecutionCompletion,
  ScheduleExecutionContext,
  ScheduleTargetStartResult,
  ScheduleTargetSummary,
  ScheduleTargetType,
  ScheduleTargetObservation,
  TargetValidationResult,
} from '@nocobase/app-plugin-scheduler/server';
import { EXECUTION_STATUS } from './engine/constants.js';

/**
 * Maps a finished workflow run onto the scheduler's completion contract. Both
 * paths that report a run share it: the terminal observer, which notifies as
 * soon as the run ends, and `inspect()`, which recovers a notification that
 * was lost. They must agree, or the same run reads differently depending on
 * which one got there first.
 */
export function workflowCompletion(
  status: number,
  reason: string | null | undefined,
  finishedAt?: Date,
): ScheduleExecutionCompletion {
  if (status === EXECUTION_STATUS.RESOLVED)
    return { status: 'succeeded', finishedAt };
  if (status === EXECUTION_STATUS.ABORTED)
    return reason === 'timeout'
      ? { status: 'timed_out', reason: 'execution-timeout', finishedAt }
      : { status: 'cancelled', reason: 'execution-cancelled', finishedAt };
  return { status: 'failed', reason: 'execution-failed', finishedAt };
}

export type WorkflowScheduleTargetConfig = JsonObject & {
  readonly workflowKey: string;
  readonly input?: JsonObject;
};

interface WorkflowRow extends Row {
  id: string | number;
  key: string;
  title?: string | null;
  enabled: boolean | number;
  current: boolean | number;
}

interface WorkflowRunRow extends Row {
  id: string | number;
  status: number | null;
  reason?: string | null;
  finishedAt?: Date | string | null;
}

export class WorkflowScheduleTarget implements ScheduleTargetType<WorkflowScheduleTargetConfig> {
  public readonly type: string = 'workflow';
  public readonly title: string = 'Workflow';

  public constructor(
    private readonly database: DatabaseManager,
    private readonly workflow: WorkflowServiceContract,
  ) {}

  public validate(config: unknown): TargetValidationResult {
    if (!config || typeof config !== 'object')
      return { valid: false, reason: 'invalid-config' };
    const candidate = config as Partial<WorkflowScheduleTargetConfig>;
    if (typeof candidate.workflowKey !== 'string' || !candidate.workflowKey)
      return { valid: false, reason: 'invalid-config' };
    if (
      candidate.input !== undefined &&
      (!candidate.input ||
        typeof candidate.input !== 'object' ||
        Array.isArray(candidate.input))
    )
      return { valid: false, reason: 'invalid-input' };
    return { valid: true };
  }

  public async describe(
    config: WorkflowScheduleTargetConfig,
  ): Promise<ScheduleTargetSummary> {
    const row = await this.find(config.workflowKey);
    if (!row) return { targetLabel: config.workflowKey, state: 'missing' };
    return {
      targetLabel: row.title ?? row.key,
      href: `/settings/workflow/workflows/${encodeURIComponent(String(row.id))}`,
      state: row.enabled ? 'ready' : 'disabled',
    };
  }

  public async start(
    config: WorkflowScheduleTargetConfig,
    context: ScheduleExecutionContext,
  ): Promise<ScheduleTargetStartResult> {
    const eventKey = `schedule:${context.scheduleId}:${context.occurrenceId}`;
    try {
      const existing = await this.database
        .query()
        .selectFrom('workflow_runs')
        .select('id')
        .where('eventKey', '=', eventKey)
        .executeTakeFirst();
      if (existing)
        return {
          state: 'accepted',
          reference: { type: 'workflow-run', id: String(existing.id) },
          receipt: { eventKey },
        };
      const receipt = await this.workflow.trigger(
        config.workflowKey,
        config.input ?? {},
        { eventKey, sourceType: 'schedule', sourceId: context.occurrenceId },
      );
      if (receipt.status === 'accepted')
        return {
          state: 'accepted',
          reference: { type: 'workflow-run', id: receipt.runId },
          receipt: { eventKey: receipt.eventKey },
        };
      return receipt.reason === 'disabled'
        ? { state: 'skipped', reason: 'target-disabled' }
        : { state: 'failed', reason: 'target-not-found' };
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : undefined;
      if (code === 'INVALID_INPUT' || code === 'INPUT_TOO_LARGE')
        return { state: 'failed', reason: 'invalid-input' };
      if (error instanceof Error && error.message.includes('Artifact'))
        return { state: 'failed', reason: 'artifact-unavailable' };
      return { state: 'failed', reason: 'dispatch-failed' };
    }
  }

  public async inspect(reference: {
    readonly type: string;
    readonly id: string;
  }): Promise<ScheduleTargetObservation> {
    if (reference.type !== 'workflow-run')
      return { state: 'unknown' as const, reason: 'reference-type-mismatch' };
    const run = await this.database
      .query()
      .selectFrom<WorkflowRunRow>('workflow_runs')
      .select(['id', 'status', 'reason', 'finishedAt'])
      .where('id', '=', reference.id)
      .executeTakeFirst<WorkflowRunRow>();
    if (!run) return { state: 'unknown' as const, reason: 'run-not-found' };
    if (run.status == null) return { state: 'pending' as const };
    if (run.status === EXECUTION_STATUS.STARTED)
      return { state: 'running' as const };
    return {
      state: 'completed' as const,
      completion: workflowCompletion(
        run.status,
        run.reason,
        run.finishedAt ? new Date(run.finishedAt) : undefined,
      ),
    };
  }

  public referenceHref(reference: {
    readonly type: string;
    readonly id: string;
  }): string | undefined {
    return reference.type === 'workflow-run'
      ? `/settings/workflow/runs/${encodeURIComponent(reference.id)}`
      : undefined;
  }

  private find(key: string): Promise<WorkflowRow | undefined> {
    return this.database
      .query()
      .selectFrom<WorkflowRow>('workflows')
      .selectAll()
      .where('key', '=', key)
      .where('current', '=', true)
      .executeTakeFirst<WorkflowRow>();
  }
}
