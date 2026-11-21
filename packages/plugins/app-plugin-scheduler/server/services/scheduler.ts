import type { ScheduleEvent } from '@nocobase/jobs';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { SchedulerJobsDescription } from '../jobs-info.js';
import type { ScheduleOccurrenceStore } from '../occurrences.js';
import {
  defineSchedule as buildScheduleDefinition,
  type JsonObject,
  type ScheduleDefinition,
} from '../schedules/define.js';
import type {
  ScheduleTargetHandle,
  ScheduleTargetRegistry,
  ScheduleTargetSummary,
  ScheduleTargetType,
} from '../schedules/registry.js';
import {
  ScheduleNotFoundError,
  type ScheduleManifestEntry,
  type ScheduleOccurrenceQuery,
  type ScheduleOccurrenceRange,
  type ScheduleOccurrenceRecord,
  type ScheduleStore,
} from '../store.js';
import { upcomingRuns } from '../upcoming.js';
import type { SchedulerService } from '../tokens.js';

export type ScheduleOccurrenceView = Awaited<
  ReturnType<ScheduleStore['listOccurrences']>
>[number] & {
  readonly target: Awaited<
    ReturnType<ScheduleStore['listOccurrences']>
  >[number]['target'] & { readonly href?: string };
};

export type ScheduleListItem = Awaited<
  ReturnType<ScheduleStore['list']>
>[number] & {
  readonly targetState: 'ready' | 'disabled' | 'missing' | 'invalid';
  readonly targetSummary: ScheduleTargetSummary;
};

/** One Schedule with the next firings it plans, as far as its rule, window and limit allow. */
export type ScheduleDetail = ScheduleListItem & {
  readonly upcomingRuns: readonly string[];
};

/** A Schedule the database still has active but no definition this instance loaded declares. */
export interface ScheduleRemovedFromCode {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly lastRunAt?: string;
  readonly lastRun?: ScheduleListItem['lastRun'];
}

/** How many upcoming firings a Schedule's detail lists. */
const UPCOMING_RUNS = 3;

/** The provider owns resources; the service owns their shared drain boundary. */
export interface SchedulerLifecycle {
  stopReconciliation(): void;
  shutdownExecutor(): Promise<void>;
  unsubscribe(): void;
}

export class DefaultSchedulerService implements SchedulerService {
  private readonly manifest: ScheduleManifestEntry[] = [];
  private readonly reconciliations = new Set<Promise<unknown>>();
  private readonly writes = new Set<Promise<unknown>>();
  private readonly drainErrors: unknown[] = [];
  private drainPromise: Promise<void> | undefined;
  private closing = false;
  private reportsClosed = false;

  public get draining(): boolean {
    return this.closing;
  }

  public drain(): Promise<void> {
    if (!this.drainPromise) {
      this.closing = true;
      // Defer resource callbacks until the shared promise has been assigned.
      this.drainPromise = Promise.resolve().then(() => this.runDrain());
      try {
        this.lifecycle?.stopReconciliation();
      } catch (error) {
        this.drainErrors.push(error);
      }
    }
    return this.drainPromise;
  }

  private async runDrain(): Promise<void> {
    const executor = Promise.resolve().then(() =>
      this.lifecycle?.shutdownExecutor(),
    );
    const [result] = await Promise.allSettled([
      executor,
      ...this.reconciliations,
    ]);
    if (result?.status === 'rejected') this.drainErrors.push(result.reason);
    // No new reports can enter after producers and inspections have settled.
    this.reportsClosed = true;
    await Promise.allSettled([...this.writes]);
    try {
      this.lifecycle?.unsubscribe();
    } catch (error) {
      this.drainErrors.push(error);
    }
    if (this.drainErrors.length === 1) throw this.drainErrors[0];
    if (this.drainErrors.length > 1) {
      throw new AggregateError(this.drainErrors, 'Scheduler drain failed.');
    }
  }

  private track<T>(
    work: () => Promise<T>,
    pending: Set<Promise<unknown>>,
  ): Promise<T> {
    const promise = Promise.resolve().then(work);
    pending.add(promise);
    void promise.then(
      () => pending.delete(promise),
      (error: unknown) => {
        pending.delete(promise);
        if (this.closing) this.drainErrors.push(error);
      },
    );
    return promise;
  }

  public constructor(
    private readonly store: ScheduleStore,
    private readonly occurrences: ScheduleOccurrenceStore,
    private readonly targets: ScheduleTargetRegistry,
    private readonly lifecycle: SchedulerLifecycle | undefined = undefined,
    private readonly describeJobs:
      (() => SchedulerJobsDescription) | undefined = undefined,
  ) {}

  /** The jobs configuration the Schedules run on; `undefined` when the service was composed without one. */
  public jobs(): SchedulerJobsDescription | undefined {
    return this.describeJobs?.();
  }

  public defineSchedule(definition: ScheduleDefinition): void {
    this.manifest.push(
      Object.freeze({ definition: buildScheduleDefinition(definition) }),
    );
  }

  public registerTarget<TConfig extends JsonObject>(
    target: ScheduleTargetType<TConfig>,
  ): ScheduleTargetHandle {
    this.targets.register(target);
    const { type } = target;
    return {
      type,
      reportCompletion: (occurrenceId, reference, completion) => {
        if (this.reportsClosed) {
          return Promise.reject(new Error('The Scheduler has been drained.'));
        }
        return this.track(
          () =>
            this.occurrences.complete(
              occurrenceId,
              reference,
              completion,
              type,
            ),
          this.writes,
        );
      },
    };
  }

  public async list(): Promise<readonly ScheduleListItem[]> {
    const [records, targets] = await Promise.all([
      this.store.list(),
      this.store.listTargets(),
    ]);
    const byId = new Map(targets.map((target) => [target.id, target]));
    return Promise.all(
      records.map(async (record): Promise<ScheduleListItem> => {
        const target = byId.get(record.id);
        const targetSummary: ScheduleTargetSummary = target
          ? await this.targets.describe(target.type, target.config)
          : { targetLabel: record.targetType, state: 'missing' };
        return {
          ...record,
          targetState: target ? (targetSummary.state ?? 'invalid') : 'missing',
          targetSummary,
        };
      }),
    );
  }

  /** One schedule with the same projection as `list()`, or `undefined` when this application has no such schedule. */
  public async get(id: string): Promise<ScheduleListItem | undefined> {
    return (await this.list()).find((entry) => entry.id === id);
  }

  /** One Schedule with its next firings, or `undefined` when this application has no such schedule. */
  public async detail(id: string): Promise<ScheduleDetail | undefined> {
    const item = await this.get(id);
    if (!item) return undefined;
    return {
      ...item,
      upcomingRuns:
        item.scheduleStatus === 'active'
          ? upcomingRuns(item, UPCOMING_RUNS, new Date())
          : [],
    };
  }

  /**
   * Schedules the database holds as active and defined in code that no definition this instance loaded declares:
   * what `scheduler sync --finalize` would deactivate. Firing, they only log a warning.
   */
  public removedFromCode(
    items: readonly ScheduleListItem[],
  ): readonly ScheduleRemovedFromCode[] {
    const defined = new Set(
      this.manifest.map((entry) => this.store.idOf(entry.definition.key)),
    );
    return items
      .filter(
        (item) =>
          item.sourceType === 'code' &&
          item.lifecycleState === 'active' &&
          !defined.has(item.id),
      )
      .map((item) => ({
        id: item.id,
        key: item.key,
        title: item.title,
        ...(item.lastRunAt ? { lastRunAt: item.lastRunAt } : {}),
        ...(item.lastRun ? { lastRun: item.lastRun } : {}),
      }));
  }

  public async listOccurrences(
    scheduleId: string,
    range: ScheduleOccurrenceRange = {},
  ): Promise<readonly ScheduleOccurrenceView[]> {
    return (await this.store.listOccurrences(scheduleId, range)).map(
      (occurrence) => this.withHref(occurrence),
    );
  }

  /** The history of every Schedule of the application, newest first; see `ScheduleStore.listAllOccurrences`. */
  public async listAllOccurrences(
    query: ScheduleOccurrenceQuery,
  ): Promise<readonly ScheduleOccurrenceView[]> {
    return (await this.store.listAllOccurrences(query)).map((occurrence) =>
      this.withHref(occurrence),
    );
  }

  private withHref(
    occurrence: ScheduleOccurrenceRecord,
  ): ScheduleOccurrenceView {
    const href = occurrence.target.reference
      ? this.targets.referenceHref(
          occurrence.target.type,
          occurrence.target.reference,
        )
      : undefined;
    return {
      ...occurrence,
      target: { ...occurrence.target, ...(href ? { href } : {}) },
    };
  }

  public async sync(finalize: boolean = false): Promise<void> {
    const manifest = this.manifest;
    const identities = new Set<string>();
    for (const entry of manifest) {
      const identity = entry.definition.key;
      if (identities.has(identity)) {
        throw new Error(
          `Duplicate Schedule definition: ${entry.definition.key}`,
        );
      }
      identities.add(identity);
      const validation = this.targets.validate(entry.definition);
      if (!validation.valid) {
        throw new Error(
          `Invalid Schedule target for ${entry.definition.key}: ${validation.reason ?? 'invalid-config'}`,
        );
      }
    }
    await this.store.reconcile(manifest, finalize);
  }

  public async setEnabled(
    id: string,
    enabled: boolean,
  ): Promise<ScheduleListItem> {
    await this.store.setEnabled(id, enabled);
    const item = await this.get(id);
    if (!item) throw new ScheduleNotFoundError(id);
    return item;
  }

  /** Finishes a sync that ran before the executor was set up; see `ScheduleStore.activate`. */
  public activate(): Promise<void> {
    return this.store.activate();
  }

  /** Records a firing this instance ran on its schedule's run state. */
  public recordEvent(event: ScheduleEvent): Promise<void> {
    return this.track(() => this.store.recordEvent(event), this.writes);
  }

  /** Observes occurrences whose target completed without notifying us. */
  public reconcileOccurrences(): Promise<number> {
    if (this.closing) return Promise.resolve(0);
    return this.track(
      () =>
        this.occurrences.reconcile(this.targets, (error) => {
          if (this.closing) this.drainErrors.push(error);
        }),
      this.reconciliations,
    );
  }
}

// The token is declared against the concrete service so that the code inside
// this plugin — the provider, the HTTP routes and the CLI — reaches the
// administration methods above. `server/tokens.ts` republishes this same
// object narrowed to `SchedulerService`, which is all another plugin sees.
export const schedulerServiceToken: ServiceToken<DefaultSchedulerService> =
  createServiceToken<DefaultSchedulerService>(
    '@nocobase/app-plugin-scheduler/service',
  );
