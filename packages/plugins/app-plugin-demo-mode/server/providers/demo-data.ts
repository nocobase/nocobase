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

/**
 * The demo dataset service. Applications register their dataset on `demoDataToken`; this provider gives it the
 * accounts, roles and model services of the official plugins it finds, the settings item that guards its routes,
 * and the recurring job that resets it on the persisted daily schedule.
 */
export class DemoDataProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-demo-mode/data';
  private service: DefaultDemoDataService | undefined;
  private agents: DemoAgents | undefined;
  private resetJobs: ScheduleExecutor | undefined;

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
      onSettled: () => {
        void this.syncDailyReset().catch((error: unknown) =>
          this.logger()?.warn(
            { error },
            'Could not update the daily demo reset schedule',
          ),
        );
      },
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
      async () => {
        const status = await this.service!.status();
        const language = status.language ?? status.languages[0];
        return {
          ...status,
          ...(language ? { timeZone: this.service!.timeZone(language) } : {}),
        };
      },
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
    configuration.onScheduleChange(() => this.syncDailyReset());
    // The handler is registered before setup() starts the worker, even while the schedule is off, so a rule another
    // instance enables finds it here. A firing of a rule saved earlier is checked against the current schedule.
    await this.resetJobs.addJob(
      this.dailyResetJob({ hour: 3, minute: 0, timezone: 'UTC' }),
      true,
    );
    await this.resetJobs.setup();
    await this.syncDailyReset();
  }

  public override async shutdown(): Promise<void> {
    // Waits for a running reset firing; the rule stays in the backend for the other instances.
    await this.resetJobs?.shutdown();
    this.resetJobs = undefined;
  }

  /**
   * Keeps the daily reset job on the configured local time: one cron firing a day, in the schedule's time zone. Runs
   * at startup, after the schedule is saved and after each data operation, which can change the default schedule's
   * language and time zone.
   */
  private async syncDailyReset(): Promise<void> {
    const executor = this.resetJobs;
    if (!executor) return;
    const configuration = this.app.container.resolve(
      demoConfigurationRuntimeToken,
    );
    const { schedule } = await configuration.read(false);
    if (!schedule?.enabled) {
      await executor.removeJob(DEMO_DATA_RESET_JOB);
      return;
    }
    await executor.addJob(this.dailyResetJob(schedule));
  }

  private dailyResetJob(
    schedule: Pick<DemoDailySchedule, 'hour' | 'minute' | 'timezone'>,
  ): ScheduleJob<Record<string, never>> {
    return {
      name: DEMO_DATA_RESET_JOB,
      options: {
        cron: `${schedule.minute} ${schedule.hour} * * *`,
        tz: schedule.timezone,
      },
      payload: {},
      // A rule armed while a request ran would otherwise carry that request's policy snapshot into every firing.
      execute: (context) =>
        this.app.container
          .resolve(demoConfigurationRuntimeToken)
          .withFreshPolicy(() => this.runDailyReset(context.scheduledAt)),
    };
  }

  private async runDailyReset(scheduledAt: Date): Promise<void> {
    const service = this.service!;
    // Nothing to reset before the first generation, which also names the account resets run as.
    if ((await service.status()).state === null) return;
    const due = await this.app.container
      .resolve(demoConfigurationRuntimeToken)
      .claimDaily(scheduledAt);
    if (!due) {
      // Another process claimed the day, or the schedule changed elsewhere: follow what is saved now.
      await this.syncDailyReset();
      return;
    }
    await service.reset(undefined, due.language, { wait: true });
    const status = await service.status();
    if (status.failure)
      this.logger()?.warn(
        { failure: status.failure },
        'The daily demo data reset failed',
      );
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
