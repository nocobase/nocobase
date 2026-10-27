import { demoConfigurationRuntimeToken } from '../configuration/runtime-token.js';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { registerDemoPreferences } from '../preferences.js';
import { resolveDemoModeSettings } from '../config.js';
import { DemoReadOnlyError } from '../errors.js';
import {
  DemoWriteGuard,
  demoWriteGuardToken,
  type GuardedKnex,
} from '../guard.js';
import {
  createDemoModeMiddleware,
  type DemoModeLogger,
} from '../middleware.js';
import { DefaultDemoModeService } from '../services/demo-mode.js';
import { demoModeServiceToken } from '../tokens.js';

/** A table that never exists: if the guard ever fails to refuse the probe, the database rejects it instead. */
const PROBE_SQL = 'DELETE FROM __nocobase_demo_mode_probe__ WHERE 1 = 0';

interface ProbedKnex extends GuardedKnex {
  raw(sql: string): PromiseLike<unknown>;
}

export class DemoModeProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-demo-mode';
  private guard: DemoWriteGuard | undefined;
  private connectionNames: readonly string[] | undefined;

  public override register(): void {
    const settings = resolveDemoModeSettings(this.app.config);
    this.app.container.instance(
      demoModeServiceToken,
      new DefaultDemoModeService(settings),
    );
    const guard = new DemoWriteGuard();
    this.app.container.instance(demoWriteGuardToken, guard);
    if (!settings.enabled) return;

    // Register defaults before Authentication's lazy service is created. Only HTTPS demos can use these cookies;
    // ordinary deployments and HTTP development keep their existing policy. Deployment overrides still win.
    if (
      this.app.config
        .get<AppIdentityConfig>('app')
        ?.publicOrigin?.startsWith('https://')
    ) {
      this.app.config.mergeDefaults({
        auth: {
          advanced: {
            defaultCookieAttributes: {
              sameSite: 'none',
              secure: true,
              partitioned: true,
            },
          },
        },
      });
    }

    this.guard = guard;
    // The root router runs this before every route, including those contributed later and the WebSocket upgrade.
    this.app.router.use(
      '*',
      createDemoModeMiddleware({
        guard,
        runWithPolicy: (run) =>
          this.app.container
            .resolve(demoConfigurationRuntimeToken)
            .runWithPolicy(run),
        allowed: () =>
          this.app.container
            .resolve(demoConfigurationRuntimeToken)
            .wholeCollectionRules(),
        attachConnections: () => this.attachConnections(),
        logger: {
          info: (details, message) => this.logger()?.info(details, message),
        },
      }),
    );
  }

  public override async boot(): Promise<void> {
    if (resolveDemoModeSettings(this.app.config).enabled)
      registerDemoPreferences(this.app);
  }

  /** Guards every connection and proves it with a probe write, refusing to start when a connection is not guarded. */
  public override async ready(): Promise<void> {
    const guard = this.guard;
    if (!guard) return;
    await this.attachConnections();
    for (const name of this.connections()) {
      const knex = await this.client(name);
      try {
        await guard.run(
          { method: 'PROBE', path: '', blocked: [] },
          async () => await knex.raw(PROBE_SQL),
        );
      } catch (error) {
        if (error instanceof DemoReadOnlyError) continue;
        throw new Error(
          `Demo mode could not guard database connection "${name}"; refusing to start.`,
          { cause: error },
        );
      }
      throw new Error(
        `Demo mode could not guard database connection "${name}"; refusing to start.`,
      );
    }
    const { enabled, allowCollections } =
      this.app.container.resolve(demoModeServiceToken);
    this.logger()?.warn(
      { enabled, allowCollections, connections: this.connections() },
      'Demo mode is on: requests cannot change the database except authorized demo imports and allowed collections',
    );
  }

  private async attachConnections(): Promise<void> {
    const guard = this.guard;
    if (!guard) return;
    for (const name of this.connections()) {
      guard.attach(await this.client(name), name);
    }
  }

  private async client(name: string): Promise<ProbedKnex> {
    return this.app.container
      .resolve(databaseManagerToken)
      .connection(name)
      .client<ProbedKnex>();
  }

  private connections(): readonly string[] {
    this.connectionNames ??= Object.keys(
      this.app.config.get<{ connections?: Record<string, unknown> }>('database')
        ?.connections ?? {},
    );
    return this.connectionNames;
  }

  private logger(): DemoModeLogger | undefined {
    const container = this.app.container;
    return container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('demo-mode')
      : undefined;
  }
}
