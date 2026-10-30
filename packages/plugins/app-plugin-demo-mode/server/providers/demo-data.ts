import { ApiError } from '@nocobase/app-server/router';
import { demoConfigurationRuntimeToken } from '../configuration/runtime-token.js';
import { resolveDemoAgents, type DemoAgents } from '../integrations/agents.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import type { ScheduleExecutor, ScheduleJob } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import { DefaultDemoConfigurationService } from '../configuration/service.js';
import { demoWriteGuardToken } from '../guard.js';
import { DEMO_CONFIGURATION_SETTINGS } from '../routes/configuration.js';
import { resolveDemoModeSettings } from '../config.js';
import { DemoModels } from '../data/models.js';
import { DefaultDemoDataService } from '../data/service.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';
import type { DemoDailySchedule } from '../../shared/configuration.js';
import { DEMO_DATA_SETTINGS } from '../routes/data.js';
import {
  demoDataToken,
  demoModeServiceToken,
  demoConfigurationToken,
} from '../tokens.js';

/** The recurring job, in the plugin's jobs scope, that resets the demo data at the configured local time. */
export const DEMO_DATA_RESET_JOB = 'daily-reset';
const JOBS_SCOPE = '@nocobase/app-plugin-demo-mode';

interface LoopbackServer {
  readonly host?: string;
  readonly port?: number;
}

/**
 * Where this process's listener answers the simulated model. The listener receives requests under the application's
 * public base path and mounts the API at `/api` below it, so the address follows those rather than `app.publicApiUrl`,
 * which is what browsers use and may be an absolute or proxied URL.
 */
export function demoModelLoopbackUrl(
  server: LoopbackServer,
  publicBasePath: string,
): string {
  const host =
    !server.host || ['0.0.0.0', '::', '[::]'].includes(server.host)
      ? '127.0.0.1'
      : server.host.includes(':') && !server.host.startsWith('[')
        ? `[${server.host}]`
        : server.host;
  const base = publicBasePath.replace(/\/+$/u, '');
  return `http://${host}:${server.port ?? 13000}${base}/api/demoMode/models/v1`;
}

const INTERRUPTION_RECHECK_MS = 10 * 60_000;
/** An operation interrupted this long is presumed abandoned, as after a restart, and the schedule takes it over. */
const INTERRUPTION_TAKEOVER_MS = 60 * 60_000;

/**
 * The demo dataset service. Applications register their dataset on `demoDataToken`; this provider gives it the
 * accounts, roles and model services of the official plugins it finds, the settings item that guards its routes,
 * and the recurring job that resets it on the deployment-owned daily schedule.
 */
export class DemoDataProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-demo-mode/data';
  private service: DefaultDemoDataService | undefined;
  private agents: DemoAgents | undefined;
  private resetJobs: ScheduleExecutor | undefined;
  /** When the paused schedule rereads the data status next, so an interruption is not reread every minute. */
  private interruptionRecheckAt: number | undefined;
  /** Whether this interruption was logged, so it is reported once instead of every recheck. */
  private interruptionReported = false;

  public override register(): void {
    const container = this.app.container;
    const optional = <T>(token: Parameters<typeof container.resolve<T>>[0]) =>
      container.has(token) ? container.resolve(token) : undefined;
    this.service = new DefaultDemoDataService({
      withPolicy: (run) =>
        container.resolve(demoConfigurationRuntimeToken).runWithPolicy(run),
      database: container.resolve(databaseManagerToken),
      enabled: () => container.resolve(demoModeServiceToken).enabled,
      models: new DemoModels(),
      modelBaseUrl: () => this.loopbackModelUrl(),
      users: () => optional(userManagementServiceToken),
      authorization: () => optional(authorizationToken),
      agents: () => this.agents,
      logger: {
        info: (details, message) => this.logger()?.info(details, message),
        warn: (details, message) => this.logger()?.warn(details, message),
      },
    });
    container.instance(demoDataToken, this.service);
    const configuration = new DefaultDemoConfigurationService(
      container.resolve(databaseManagerToken),
      resolveDemoModeSettings(this.app.config),
      container.resolve(demoWriteGuardToken),
      () => this.service!.status(),
    );
    container.instance(demoConfigurationToken, configuration);
    container.instance(demoConfigurationRuntimeToken, configuration);
    const models = this.service.models;
    configuration.registerMock({
      id: 'dataset.model',
      title: 'Dataset model',
      kind: 'model',
      scope: 'demo-model',
      defaultEnabled: true,
      invoke: (input) =>
        models.simulate(input as Parameters<typeof models.simulate>[0]),
    });
    models.setAdapter((request) =>
      configuration.invokeMock('dataset.model', request),
    );
  }

  public override async boot(): Promise<void> {
    const container = this.app.container;
    if (!container.resolve(demoModeServiceToken).enabled) return;
    if (container.has(authorizationToken)) {
      const authz = container.resolve(authorizationToken);
      authz.ui.sections.add({
        name: 'demo-mode',
        title: { key: 'authorization.configuration', ns: DEMO_MODE_NAMESPACE },
        parent: 'administration',
      });
      authz.settings.add({
        id: DEMO_CONFIGURATION_SETTINGS,
        title: { key: 'authorization.configuration', ns: DEMO_MODE_NAMESPACE },
        actions: [
          {
            name: 'read',
            title: { key: 'authorization.read', ns: DEMO_MODE_NAMESPACE },
          },
          {
            name: 'configure',
            title: { key: 'authorization.configure', ns: DEMO_MODE_NAMESPACE },
          },
        ],
      });
      for (const id of [DEMO_DATA_SETTINGS, DEMO_CONFIGURATION_SETTINGS])
        authz.ui.place({ type: 'settings', id }, { section: 'demo-mode' });
      authz.settings.add({
        id: DEMO_DATA_SETTINGS,
        title: { key: 'authorization.title', ns: DEMO_MODE_NAMESPACE },
        actions: [
          {
            name: 'read',
            title: { key: 'authorization.read', ns: DEMO_MODE_NAMESPACE },
          },
          {
            name: 'manage',
            title: { key: 'authorization.manage', ns: DEMO_MODE_NAMESPACE },
          },
        ],
      });
    }
  }

  public override async ready(): Promise<void> {
    const container = this.app.container;
    const existingModel = await container
      .resolve(databaseManagerToken)
      .query()
      .selectFrom('demoModeModel')
      .select('modelService')
      .where('id', '=', 'default')
      .executeTakeFirst();
    if (
      container.resolve(demoModeServiceToken).enabled ||
      existingModel?.modelService
    )
      this.agents = await resolveDemoAgents(container);
    const configuration = this.app.container.resolve(
      demoConfigurationRuntimeToken,
    );
    await configuration.initialize();
    await this.service?.initialize();
    if (
      !container.resolve(demoModeServiceToken).enabled ||
      !container.has(jobExecutorServiceToken)
    )
      return;
    this.resetJobs = container
      .resolve(jobExecutorServiceToken)
      .getScheduleExecutor(JOBS_SCOPE);
    const schedule = resolveDemoModeSettings(this.app.config).dailyReset;
    // Register the handler before setup() starts the worker, then replace any persisted rule with deployment values.
    await this.resetJobs.addJob(this.dailyResetJob(schedule), true);
    await this.resetJobs.setup();
    await this.resetJobs.addJob(this.dailyResetJob(schedule));
  }

  public override async shutdown(): Promise<void> {
    // Waits for a running reset firing; the rule stays in the backend for the other instances.
    await this.resetJobs?.shutdown();
    this.resetJobs = undefined;
  }

  private dailyResetJob(
    schedule: Pick<DemoDailySchedule, 'hour' | 'minute' | 'timezone'>,
  ): ScheduleJob<Record<string, never>> {
    return {
      name: DEMO_DATA_RESET_JOB,
      options: {
        cron: '* * * * *',
        tz: schedule.timezone,
      },
      payload: {},
      // A rule armed while a request ran would otherwise carry that request's policy snapshot into every firing.
      // The rule fires every minute; idle minutes stop at the cheap admission check.
      execute: async (context) => {
        const configuration = this.app.container.resolve(
          demoConfigurationRuntimeToken,
        );
        if (!(await configuration.dailyDue(context.runAt))) return;
        await configuration.withFreshPolicy(() =>
          this.runDailyReset(context.runAt),
        );
      },
    };
  }

  private async runDailyReset(scheduledAt: Date): Promise<void> {
    const configuration = this.app.container.resolve(
      demoConfigurationRuntimeToken,
    );
    // Manual recovery settles the daily claims itself; until it or the takeover is due, recheck rarely.
    if (
      this.interruptionRecheckAt !== undefined &&
      Date.now() < this.interruptionRecheckAt
    )
      return;
    const status = await this.service!.status();
    if (status.state === null) return;
    // A lease cannot fence arbitrary application callbacks, so a recent interruption waits for manual recovery. One
    // that has not moved for an hour is presumed abandoned and taken over, so unattended demos keep resetting.
    if (status.failure?.code === 'DEMO_DATA_INTERRUPTED') {
      const since = await this.service!.interruptedSince();
      // The operation moved on since the status was read; the next minute sees its current state.
      if (!since) return;
      const takeoverAt = since.getTime() + INTERRUPTION_TAKEOVER_MS;
      if (Date.now() < takeoverAt) {
        // The management page shows the interruption; report it once instead of every minute.
        if (!this.interruptionReported)
          this.logger()?.warn(
            {
              dataset: status.datasetId,
              takeoverAt: new Date(takeoverAt).toISOString(),
            },
            'Daily demo reset paused by an interrupted operation; recover it manually or it is taken over later',
          );
        this.interruptionReported = true;
        this.interruptionRecheckAt = Math.min(
          Date.now() + INTERRUPTION_RECHECK_MS,
          takeoverAt,
        );
        return;
      }
      this.logger()?.warn(
        { dataset: status.datasetId, interruptedSince: since.toISOString() },
        'Daily demo reset is taking over an abandoned interrupted operation',
      );
    }
    this.interruptionRecheckAt = undefined;
    this.interruptionReported = false;
    const claim = await configuration.claimDaily(scheduledAt, {
      settled:
        status.state === 'ready' || status.state === 'failed'
          ? {
              ready: status.state === 'ready',
              finishedAt: status.finishedAt
                ? new Date(status.finishedAt)
                : null,
            }
          : undefined,
    });
    if (!claim) return;
    let renewing: Promise<void> | undefined;
    const heartbeat = setInterval(() => {
      if (renewing) return;
      renewing = configuration
        .renewDaily(claim)
        .catch((err: unknown) => {
          this.logger()?.warn(
            { err, day: claim.day, attempt: claim.attempt },
            'Could not renew daily demo reset claim',
          );
        })
        .finally(() => {
          renewing = undefined;
        });
    }, 30_000);
    heartbeat.unref();
    try {
      await this.service!.reset(undefined, claim.language, {
        wait: true,
        scheduled: true,
      });
    } catch (err) {
      this.logger()?.warn(
        { err, day: claim.day, attempt: claim.attempt },
        'The daily demo data reset failed',
      );
      // Only a settled cleanup/generation failure or admission contention is safe to retry. Lease loss and
      // validation/policy errors require intervention.
      const after = await this.service!.status().catch(() => null);
      const retryable =
        err instanceof ApiError
          ? err.reason === 'DEMO_DATA_BUSY'
          : after?.state === 'failed' &&
            after.failure?.code !== 'DEMO_DATA_INTERRUPTED';
      // Recording the outcome must not replace the reset's own error.
      await configuration
        .finishDaily(claim, err, retryable)
        .catch((finishErr: unknown) => {
          this.logger()?.warn(
            { err: finishErr, day: claim.day, attempt: claim.attempt },
            'Could not record the failed daily demo reset',
          );
        });
      throw err;
    } finally {
      clearInterval(heartbeat);
      await renewing;
    }
    // Outside the failure path: a reset that completed is never recorded as failed. If this acknowledgement fails,
    // the claim goes stale and is closed without repetition once the settled data is seen.
    await configuration.finishDaily(claim).catch((err: unknown) => {
      this.logger()?.warn(
        { err, day: claim.day, attempt: claim.attempt },
        'Could not acknowledge the completed daily demo reset',
      );
    });
  }

  /** This process's own address, so the gateway's calls to the simulated model never leave the machine. */
  private loopbackModelUrl(): string {
    return demoModelLoopbackUrl(
      this.app.config.get<LoopbackServer>('server') ?? {},
      this.app.publicBasePath,
    );
  }

  private logger() {
    const container = this.app.container;
    return container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('demo-mode')
      : undefined;
  }
}
