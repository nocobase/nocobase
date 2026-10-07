import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import type { ScheduleExecutor } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { CheckpointCleaner } from '../agent/checkpoint/index.js';
import {
  resolveCheckpointCleanupConfig,
  type AIApplicationConfig,
} from '../config.js';
import { repositoryFactoryToken } from '../tokens.js';

/** This plugin's scope on the application's schedule service. */
export const CHECKPOINT_CLEANUP_SCOPE: string =
  '@nocobase/app-plugin-ai-employee';

/** The one rule this plugin keeps under its scope. */
export const CHECKPOINT_CLEANUP_JOB: string = 'checkpoint-cleanup';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Schedules the release of checkpoints that conversations nobody uses any more
 * still hold, as `ai.checkpointCleanup` describes.
 */
export class CheckpointCleanupProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-ai-employee/checkpoint-cleanup';
  private executor: ScheduleExecutor | undefined;

  public override async start(): Promise<void> {
    const container = this.app.container;
    const logger = container
      .resolve(loggingToken)
      .getLogger('ai-employee')
      .child({ module: 'checkpoint-cleanup' });
    const config = resolveCheckpointCleanupConfig(
      this.app.config.get<AIApplicationConfig>('ai')!,
    );
    // An application created before the templates added the jobs service
    // keeps running; it only goes without the cleanup.
    if (!container.has(jobExecutorServiceToken)) {
      if (config.enabled) {
        logger.warn(
          'The application has no jobs service, so AI conversation checkpoints are not cleaned up. Add JobExecutorServiceProvider to server/app.ts to schedule it.',
        );
      }
      return;
    }
    const repositories = container.resolve(repositoryFactoryToken);
    const cleaner = new CheckpointCleaner(
      container.resolve(databaseManagerToken).connection(),
      {
        conversations: repositories.aiConversations,
        messages: repositories.aiMessages,
        checkpoints: repositories.lcCheckpoints,
        blobs: repositories.lcCheckpointBlobs,
        writes: repositories.lcCheckpointWrites,
      },
    );
    const executor = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(
        CHECKPOINT_CLEANUP_SCOPE,
        this.jobsConfiguration(config.jobs),
      );
    this.executor = executor;
    // Registered while disabled as well: another instance may still hold the
    // rule, and this one must be able to run a firing it receives.
    await executor.addJob(
      {
        name: CHECKPOINT_CLEANUP_JOB,
        options: { cron: config.cron, tz: config.tz },
        payload: {},
        execute: async ({ signal }) => {
          const expiredAt = new Date(Date.now() - config.retentionDays * DAY);
          const released = await cleaner.cleanOutdated(expiredAt, {
            batchSize: config.batchSize,
            signal,
          });
          logger.info(
            { released, expiredAt: expiredAt.toISOString() },
            'Released the checkpoints of unused AI conversations',
          );
        },
      },
      !config.enabled,
    );
    await executor.setup();
    // The scope is this plugin's alone, so any other rule under it belongs to
    // a job an earlier version defined, and a disabled cleanup keeps none.
    for (const rule of await executor.listJob(0, -1)) {
      if (!config.enabled || rule.jobName !== CHECKPOINT_CLEANUP_JOB)
        await executor.removeJob(rule.jobName);
    }
  }

  public override async shutdown(): Promise<void> {
    // Waits for a running cleanup and keeps the rule for the other instances.
    await this.executor?.shutdown();
    this.executor = undefined;
  }

  /**
   * The `jobs` configuration `ai.checkpointCleanup.jobs` names. The jobs
   * service falls back to `jobs.default` for a name it does not know, which
   * would move the rule to another backend without a word, so an unknown name
   * refuses to start instead.
   */
  private jobsConfiguration(name: string | undefined): string | undefined {
    if (name === undefined || name === 'default') return name;
    const jobs = this.app.config.get<Record<string, unknown>>('jobs');
    const selected = jobs?.[name];
    if (!selected || typeof selected !== 'object') {
      throw new Error(
        `ai.checkpointCleanup.jobs names "${name}", which is not a jobs configuration.`,
      );
    }
    return name;
  }
}
