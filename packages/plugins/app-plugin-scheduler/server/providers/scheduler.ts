import { type AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { databaseManagerToken } from '@nocobase/db';
import type { ScheduleExecutor, Unsubscribe } from '@nocobase/jobs';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { SchedulerConfig } from '../config.js';
import { createScheduleDispatchJob } from '../dispatch.js';
import { ScheduleOccurrenceStore } from '../occurrences.js';
import { ScheduleTargetRegistry } from '../schedules/registry.js';
import {
  DefaultSchedulerService,
  schedulerServiceToken,
} from '../services/scheduler.js';
import { ScheduleStore } from '../store.js';

export interface SchedulerStartupMode {
  readonly kind: 'sync-only';
  readonly finalize: boolean;
}

/**
 * Injected by `nocobase scheduler sync` before the application starts, so the CLI
 * synchronizes the manifest without leaving a worker behind. It carries a
 * startup switch rather than a service, and stays internal to this package.
 */
export const schedulerStartupModeToken: ServiceToken<SchedulerStartupMode> =
  createServiceToken<SchedulerStartupMode>(
    '@nocobase/app-plugin-scheduler/startup-mode',
  );

/** This plugin's scope on the application's schedule service. */
export const SCHEDULER_SCOPE: string = '@nocobase/app-plugin-scheduler';

interface SchedulerInternals {
  readonly executor: ScheduleExecutor;
  readonly service: DefaultSchedulerService;
}

export class SchedulerProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-scheduler';
  private reconcileTimer: ReturnType<typeof setInterval> | undefined;
  private unsubscribe: Unsubscribe | undefined;
  private internals: SchedulerInternals | undefined;

  public override register(): void {
    // One service reaches the container. The target registry, the executor
    // and both stores are this provider's own parts, handed to whatever needs
    // them instead of being resolvable by anyone holding the container.
    this.app.container.singleton(
      schedulerServiceToken,
      () => this.compose().service,
    );
  }

  public override async start(): Promise<void> {
    const { executor, service } = this.compose();
    const startupMode = this.app.container.resolveIfCreated(
      schedulerStartupModeToken,
    );
    const consume = startupMode?.kind !== 'sync-only';
    // Registers every definition's handler, and the rules of the enabled ones,
    // before setup() writes the rules and starts the worker: a due firing must
    // never reach this instance ahead of its handler.
    await service.sync(startupMode?.finalize ?? false);
    if (consume) {
      this.unsubscribe = executor.subscribe(async (event) => {
        if (event.reason === 'handler-not-registered') {
          // Nothing reaches the occurrence history: no dispatch ran.
          console.warn(
            'A schedule fired that this instance has no definition for',
            { scheduleId: event.jobName, occurrenceId: event.jobId },
          );
        }
        await service.recordEvent(event);
      });
    }
    await executor.setup({ consume });
    await service.activate();
    if (!consume) return;
    this.reconcileTimer = setInterval(() => {
      void service.reconcileOccurrences().catch((error: unknown) => {
        console.error('Scheduler occurrence reconciliation failed', error);
      });
    }, 60_000);
    this.reconcileTimer.unref?.();
  }

  public override async shutdown(): Promise<void> {
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    this.reconcileTimer = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    // Waits for a running firing to finish before what it uses is released.
    // The rules stay in the backend for the other instances.
    await this.internals?.executor.shutdown();
    this.internals = undefined;
  }

  /**
   * The `jobs` configuration `scheduler.jobs` names. The jobs service would
   * fall back to `jobs.default` for a name it does not know, which would put
   * the schedules on another backend without a word, so an unknown name
   * refuses to start instead.
   */
  private jobsConfiguration(): string | undefined {
    const name = this.app.config.get<SchedulerConfig>('scheduler')?.jobs;
    if (name === undefined) return undefined;
    const jobs = this.app.config.get<Record<string, unknown>>('jobs');
    const selected = name === 'default' ? undefined : jobs?.[name];
    if (!selected || typeof selected !== 'object') {
      throw new Error(
        `scheduler.jobs names "${name}", which is not a jobs configuration.`,
      );
    }
    return name;
  }

  private compose(): SchedulerInternals {
    if (this.internals) return this.internals;
    const container = this.app.container;
    const database = container.resolve(databaseManagerToken);
    const targets = new ScheduleTargetRegistry();
    const occurrences = new ScheduleOccurrenceStore(database);
    // Concurrency and attempts are the selected configuration's. A failed
    // dispatch is recorded as the occurrence's outcome, so a retry of the same
    // firing finds it recorded and does nothing: keep attempts at 1 there.
    const executor = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(SCHEDULER_SCOPE, this.jobsConfiguration());
    const store = new ScheduleStore(
      database,
      this.app.appName,
      executor,
      (spec, limit) =>
        createScheduleDispatchJob(spec, limit, { targets, occurrences }),
    );
    this.internals = {
      executor,
      service: new DefaultSchedulerService(store, occurrences, targets),
    };
    return this.internals;
  }
}
