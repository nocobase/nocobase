import type { ServiceToken } from '@nocobase/service-provider';

import type { JsonObject, ScheduleDefinition } from './schedules/define.js';
import type {
  ScheduleTargetHandle,
  ScheduleTargetType,
} from './schedules/registry.js';
import { schedulerServiceToken as concreteSchedulerServiceToken } from './services/scheduler.js';

export interface SchedulerService {
  /**
   * Stops new reconciliation and drains this process's executor, inspections,
   * event records and accepted completion reports before releasing subscriptions.
   * Concurrent/repeated calls and provider shutdown share one promise, including
   * rejection. Reports remain accepted until executor and inspections settle;
   * later reports reject before storage access. This does not drain host requests
   * or wait for all durable waiting targets (such as human approvals).
   */
  drain(): Promise<void>;

  /**
   * Registers what a schedule can point at: how its configuration is
   * validated, how a firing starts, and — for anything that finishes later —
   * how a run is inspected. The returned handle is how that target reports a
   * terminal outcome back.
   */
  registerTarget<TConfig extends JsonObject>(
    target: ScheduleTargetType<TConfig>,
  ): ScheduleTargetHandle;

  /**
   * Registers a scheduled task this app should run. Call during `register()`
   * or `boot()`, the same way as `registerTarget` — schedules are read once
   * when `sync()` runs during `start()`, so anything defined afterward has no
   * effect until the next sync. `key` is the schedule's stable, application-
   * wide identity.
   */
  defineSchedule(definition: ScheduleDefinition): void;
}

/**
 * The scheduler's one public service, carrying its one extension point.
 * Reading and changing schedules is reachable through the plugin's HTTP API
 * and its `scheduler sync` command; the store, the target registry and the
 * occurrence history stay private to this package.
 */
export const schedulerServiceToken: ServiceToken<SchedulerService> =
  concreteSchedulerServiceToken;
