/**
 * The runners on the platform, at boot: realtime announcements of runners, the sweeper, and wake-ups for work sent
 * back with a back-off.
 *
 * The sweeper runs as the `RunnersSweep` schedule every 30 seconds on the application's jobs service, which fires it
 * on one instance at a time. Without a jobs service an in-process timer runs it instead; with several instances each
 * then sweeps, which is safe. Wake-ups are in-process timers: a missed one only waits for the next sweep.
 *
 * Beside it, `SkillBlobsCollect` deletes the stored contents of skills' files no version names, hourly, sparing what
 * was stored or named in the last hour (an upload for a save still to come).
 */
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { ServiceProvider } from '@nocobase/service-provider';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { RUNNERS_TOPIC, type RunnersChanged } from '../../shared/realtime.js';
import type { Agents } from '../composition.js';
import { agentsToken } from '../tokens.js';

/** How often the sweeper runs. */
export const SWEEP_INTERVAL_MS = 30_000;

/** The schedule's stable identity in this plugin's scope. */
const SWEEP_SCHEDULE = 'RunnersSweep';

/** How often unnamed skill contents are collected, and how long one is spared after it was last used. */
export const SKILL_BLOBS_COLLECT_MS: number = 60 * 60_000;
const COLLECT_SCHEDULE = 'SkillBlobsCollect';

export class RunnersProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = `${ACCESS_NAMESPACE}/runners`;
  private readonly releases: (() => void)[] = [];
  private executor: ScheduleExecutor | undefined;

  public override async boot(): Promise<void> {
    if (this.releases.length > 0) return;
    const services = this.app.container.resolve(agentsToken);
    this.announce(services);
    await this.schedule(services);
  }

  public override async shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    // Waits for a running sweep to finish; the rule stays in the backend for the other instances.
    const executor = this.executor;
    this.executor = undefined;
    await executor?.shutdown();
  }

  /** Tells open pages what changed; they fetch the details through the API, which checks access. */
  private announce(services: Agents): void {
    const { container } = this.app;
    if (!container.has(realtimeServiceToken)) return;
    const realtime = container.resolve(realtimeServiceToken);
    const publish = (topic: string, payload: RunnersChanged) => {
      try {
        realtime.publish(topic, payload);
      } catch (error) {
        console.error('Runners realtime announcement failed.', error);
      }
    };
    this.releases.push(
      services.events.onAny((event) => {
        switch (event.type) {
          case 'runner.changed':
            publish(RUNNERS_TOPIC, {
              kind: 'runners.changed',
              runnerId: event.runnerId,
            });
            return;
          default:
            return;
        }
      }),
    );
  }

  private async schedule(services: Agents): Promise<void> {
    const { container } = this.app;
    const sweep = this.guarded(() => services.sweeper.sweep());
    const collect = this.guarded(
      () => services.skills.collectGarbage(SKILL_BLOBS_COLLECT_MS),
      'Skill contents collection',
    );
    const wake = () => services.signal.notify();
    if (container.has(jobExecutorServiceToken)) {
      const executor = container
        .resolve(jobExecutorServiceToken)
        .getScheduleExecutor(ACCESS_NAMESPACE);
      await executor.addJob({
        name: SWEEP_SCHEDULE,
        options: { every: SWEEP_INTERVAL_MS },
        payload: {},
        execute: sweep,
      });
      await executor.addJob({
        name: COLLECT_SCHEDULE,
        options: { every: SKILL_BLOBS_COLLECT_MS },
        payload: {},
        execute: collect,
      });
      await executor.setup();
      this.executor = executor;
    } else {
      const timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
      timer.unref();
      const collector = setInterval(
        () => void collect(),
        SKILL_BLOBS_COLLECT_MS,
      );
      collector.unref();
      this.releases.push(() => {
        clearInterval(timer);
        clearInterval(collector);
      });
    }

    const timers = new Set<ReturnType<typeof setTimeout>>();
    // Work that went back to the queue with a back-off: wake the runners when it may be claimed.
    const wakeAt = (availableAt: string | null) => {
      if (!availableAt) return;
      const delay = Math.max(0, Date.parse(availableAt) - Date.now());
      const timer = setTimeout(() => {
        timers.delete(timer);
        wake();
      }, delay + 1000);
      timer.unref();
      timers.add(timer);
    };
    this.releases.push(
      services.events.on('run.requeued', (event) => wakeAt(event.availableAt)),
      services.events.on('job.queued', (event) => wakeAt(event.availableAt)),
      () => {
        for (const timer of timers) clearTimeout(timer);
        timers.clear();
      },
    );
  }

  /** `fn`, skipped while a previous call is still running, its errors logged. */
  private guarded(
    fn: () => Promise<unknown>,
    what = 'Runners sweep',
  ): () => Promise<void> {
    let running = false;
    return async () => {
      if (running) return;
      running = true;
      try {
        await fn();
      } catch (error) {
        console.error(`${what} failed.`, error);
      } finally {
        running = false;
      }
    };
  }
}
