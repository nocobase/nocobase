import { demoConfigurationRuntimeToken } from '../configuration/runtime-token.js';
import { resolveDemoAgents, type DemoAgents } from '../integrations/agents.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { DefaultDemoConfigurationService } from '../configuration/service.js';
import { demoWriteGuardToken } from '../guard.js';
import { DEMO_CONFIGURATION_SETTINGS } from '../routes/configuration.js';
import { resolveDemoModeSettings } from '../config.js';
import { DemoModels } from '../data/models.js';
import { DefaultDemoDataService } from '../data/service.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';
import { DEMO_DATA_SETTINGS } from '../routes/data.js';
import {
  demoDataToken,
  demoModeServiceToken,
  demoConfigurationToken,
} from '../tokens.js';

/** The Scheduler target a configured reset schedule points at. */
export const DEMO_DATA_RESET_TARGET = 'demoMode.resetData';

/**
 * The demo dataset service. Applications register their dataset on `demoDataToken`; this provider gives it the
 * accounts, roles and model services of the official plugins it finds, the settings item that guards its routes,
 * and the persisted daily Scheduler configuration that resets it.
 */
export class DemoDataProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-demo-mode/data';
  private service: DefaultDemoDataService | undefined;
  private agents: DemoAgents | undefined;

  public override register(): void {
    const container = this.app.container;
    const optional = <T>(token: Parameters<typeof container.resolve<T>>[0]) =>
      container.has(token) ? container.resolve(token) : undefined;
    this.service = new DefaultDemoDataService({
      withPolicy: (run) =>
        container.resolve(demoConfigurationRuntimeToken).runWithPolicy(run),
      database: container.resolve(databaseManagerToken),
      mode: () => container.resolve(demoModeServiceToken).mode,
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
    if (container.resolve(demoModeServiceToken).mode === 'off') return;
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
    if (container.has(schedulerServiceToken)) this.schedule();
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
      container.resolve(demoModeServiceToken).mode !== 'off' ||
      existingModel?.modelService
    )
      this.agents = await resolveDemoAgents(container);
    await this.app.container
      .resolve(demoConfigurationRuntimeToken)
      .initialize();
    await this.service?.initialize();
  }

  private schedule(): void {
    const service = this.service!;
    const configuration = this.app.container.resolve(
      demoConfigurationRuntimeToken,
    );
    const scheduler = this.app.container.resolve(schedulerServiceToken);
    const handle = scheduler.registerTarget<Record<string, never>>({
      type: DEMO_DATA_RESET_TARGET,
      title: 'Reset demo data',
      validate: (config) =>
        config && typeof config === 'object'
          ? { valid: true }
          : { valid: false, reason: 'config-must-be-an-object' },
      async start(_config, context) {
        try {
          const due = await configuration.claimDaily(new Date());
          if (!due) return { state: 'skipped', reason: 'not-due' };
          await service.reset(undefined, due.language);
        } catch (error) {
          return {
            state: 'failed',
            reason: error instanceof Error ? error.message : String(error),
          };
        }
        const reference = { type: 'demoModeData', id: context.occurrenceId };
        void service.whenIdle().then(async () => {
          const status = await service.status();
          await handle.reportCompletion(context.occurrenceId, reference, {
            status: status.present ? 'succeeded' : 'failed',
            ...(status.failure ? { reason: status.failure.message } : {}),
          });
        });
        return { state: 'accepted', reference };
      },
      async inspect() {
        const status = await service.status();
        if (status.importing) return { state: 'running' };
        return {
          state: 'completed',
          completion: {
            status: status.present ? 'succeeded' : 'failed',
            ...(status.failure ? { reason: status.failure.message } : {}),
          },
        };
      },
    });
    scheduler.defineSchedule({
      key: 'demoMode.dailyReset',
      title: 'Check configured daily demo reset',
      schedule: { cron: '* * * * *', timezone: 'UTC' },
      target: { type: DEMO_DATA_RESET_TARGET, config: {} },
    });
  }

  /** This process's own address, so the gateway's calls to the simulated model never leave the machine. */
  private loopbackModelUrl(): string {
    const server =
      this.app.config.get<{ host?: string; port?: number }>('server') ?? {};
    const host =
      !server.host || ['0.0.0.0', '::', '[::]'].includes(server.host)
        ? '127.0.0.1'
        : server.host.includes(':') && !server.host.startsWith('[')
          ? `[${server.host}]`
          : server.host;
    const api =
      this.app.config.get<AppIdentityConfig>('app')?.publicApiUrl ?? '/api';
    return `http://${host}:${server.port ?? 13000}${api.replace(/\/+$/u, '')}/demoMode/models/v1`;
  }

  private logger() {
    const container = this.app.container;
    return container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('demo-mode')
      : undefined;
  }
}
