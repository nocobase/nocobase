import type { JsonObject, ScheduleDefinition } from './define.js';

export interface TargetValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
}
export interface ScheduleExecutionContext {
  readonly scheduleId: string;
  readonly occurrenceId: string;
}
export interface ScheduleTargetSummary {
  readonly targetLabel: string;
  readonly description?: string;
  readonly href?: string;
  readonly state?: 'ready' | 'disabled' | 'missing' | 'invalid';
}
export interface ScheduleTargetReference extends JsonObject {
  readonly type: string;
  readonly id: string;
}
export type ScheduleTerminalStatus =
  'succeeded' | 'failed' | 'cancelled' | 'timed_out';
export interface ScheduleExecutionCompletion {
  readonly status: ScheduleTerminalStatus;
  readonly reason?: string;
  readonly result?: JsonObject;
  readonly finishedAt?: Date;
}
export interface ScheduleExecutionReporter {
  complete(
    occurrenceId: string,
    reference: ScheduleTargetReference,
    completion: ScheduleExecutionCompletion,
  ): Promise<void>;
}
export type ScheduleTargetObservation =
  | { readonly state: 'pending' | 'running' }
  | {
      readonly state: 'completed';
      readonly completion: ScheduleExecutionCompletion;
    }
  | { readonly state: 'unknown'; readonly reason: string };
export interface ScheduleTargetObserver {
  inspect(
    reference: ScheduleTargetReference,
  ): Promise<ScheduleTargetObservation>;
}
export type ScheduleTargetStartResult =
  | {
      readonly state: 'completed';
      readonly outcome: 'succeeded';
      readonly result?: JsonObject;
    }
  | {
      readonly state: 'accepted';
      readonly reference: ScheduleTargetReference;
      readonly receipt?: JsonObject;
    }
  | { readonly state: 'skipped'; readonly reason: string }
  | { readonly state: 'failed'; readonly reason: string };
export interface ScheduleTargetType<TConfig extends JsonObject = JsonObject> {
  readonly type: string;
  readonly title: string;
  validate(config: unknown): TargetValidationResult;
  start(
    config: TConfig,
    context: ScheduleExecutionContext,
  ): Promise<ScheduleTargetStartResult>;
  /** Defaults to the target's own title, in the ready state. */
  describe?: (config: TConfig) => Promise<ScheduleTargetSummary>;
  /** Required for asynchronous execution, so a lost notification recovers. */
  inspect?: ScheduleTargetObserver['inspect'];
  referenceHref?: (reference: ScheduleTargetReference) => string | undefined;
}

/**
 * Returned by `SchedulerService.registerTarget()`. Reporting a terminal
 * outcome is the one thing a target does *to* the scheduler rather than for
 * it, so the capability is handed to whoever registered the target instead of
 * being reachable by anything holding the service.
 */
export interface ScheduleTargetHandle {
  readonly type: string;
  /**
   * Accepted while Scheduler's executor or inspections are still draining.
   * Once that admission window closes, rejects before storage access. Accepted
   * reports are awaited by drain; callers still observe their own write errors.
   */
  reportCompletion(
    occurrenceId: string,
    reference: ScheduleTargetReference,
    completion: ScheduleExecutionCompletion,
  ): Promise<void>;
}

export class ScheduleTargetRegistry {
  private readonly targets = new Map<string, ScheduleTargetType>();
  public register<TConfig extends JsonObject>(
    target: ScheduleTargetType<TConfig>,
  ): void {
    if (this.targets.has(target.type))
      throw new Error(
        `Schedule target type already registered: ${target.type}`,
      );
    // The registry is heterogeneous: each target parses its own config out of
    // the JSON a definition declared, which `validate()` is there to check.
    this.targets.set(target.type, target as ScheduleTargetType);
  }
  public get(type: string): ScheduleTargetType | undefined {
    return this.targets.get(type);
  }
  public validate(
    definition: Pick<ScheduleDefinition, 'target'>,
  ): TargetValidationResult {
    const target = this.get(definition.target.type);
    return target
      ? target.validate(definition.target.config)
      : { valid: false, reason: 'target-not-found' };
  }
  public async describe(
    type: string,
    config: JsonObject,
  ): Promise<ScheduleTargetSummary> {
    const target = this.get(type);
    if (!target) return { targetLabel: type, state: 'missing' };
    return target.describe
      ? target.describe(config)
      : { targetLabel: target.title, state: 'ready' };
  }
  public async start(
    type: string,
    config: JsonObject,
    context: ScheduleExecutionContext,
  ): Promise<ScheduleTargetStartResult> {
    const target = this.get(type);
    if (!target) return { state: 'failed', reason: 'target-not-found' };
    const validation = target.validate(config);
    if (!validation.valid)
      return {
        state: 'failed',
        reason: validation.reason ?? 'invalid-config',
      };
    return target.start(config, context);
  }
  public inspect(
    targetType: string,
    reference: ScheduleTargetReference,
  ): Promise<ScheduleTargetObservation> {
    const target = this.get(targetType);
    return target?.inspect
      ? target.inspect(reference)
      : Promise.resolve({ state: 'unknown', reason: 'observer-unavailable' });
  }
  public referenceHref(
    targetType: string,
    reference: ScheduleTargetReference,
  ): string | undefined {
    return this.get(targetType)?.referenceHref?.(reference);
  }
}
