import type { ScheduleEvent } from '@nocobase/jobs';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

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
  type ScheduleOccurrenceRange,
  type ScheduleStore,
} from '../store.js';
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

export class DefaultSchedulerService implements SchedulerService {
  private readonly manifest: ScheduleManifestEntry[] = [];

  public constructor(
    private readonly store: ScheduleStore,
    private readonly occurrences: ScheduleOccurrenceStore,
    private readonly targets: ScheduleTargetRegistry,
  ) {}

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
      reportCompletion: (occurrenceId, reference, completion) =>
        this.occurrences.complete(occurrenceId, reference, completion, type),
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
        return {
          ...record,
          targetState: target
            ? ((await this.targets.describe(target.type, target.config))
                .state ?? 'invalid')
            : 'missing',
          targetSummary: target
            ? await this.targets.describe(target.type, target.config)
            : { targetLabel: record.targetType, state: 'missing' },
        };
      }),
    );
  }

  /** One schedule with the same projection as `list()`, or `undefined` when this application has no such schedule. */
  public async get(id: string): Promise<ScheduleListItem | undefined> {
    return (await this.list()).find((entry) => entry.id === id);
  }

  public async listOccurrences(
    scheduleId: string,
    range: ScheduleOccurrenceRange = {},
  ): Promise<readonly ScheduleOccurrenceView[]> {
    const occurrences = await this.store.listOccurrences(scheduleId, range);
    return occurrences.map((occurrence) => {
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
    });
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
    return this.store.recordEvent(event);
  }

  /** Observes occurrences whose target completed without notifying us. */
  public reconcileOccurrences(): Promise<number> {
    return this.occurrences.reconcile(this.targets);
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
