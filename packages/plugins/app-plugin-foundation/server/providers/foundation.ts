import { existsSync } from 'node:fs';
import path from 'node:path';

import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { databaseManagerToken } from '@nocobase/db';
import type { JobExecutor } from '@nocobase/jobs';
import { ServiceProvider } from '@nocobase/service-provider';

import type { FoundationConfig } from '../../config.js';
import { DefaultFoundationService } from '../services/foundation.js';
import { runtimeProviderEvidence } from '../provider-inventory.js';
import { foundationServiceToken } from '../tokens.js';
import { FoundationSnapshots } from '../snapshots.js';

export class FoundationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-foundation';
  private executor?: JobExecutor;
  private service?: FoundationSnapshots;

  public override register(): void {
    // Hosted archives can keep the application package under dist/ while rootDir points to the extraction root.
    // Prefer the source root during development; otherwise use the package containing the resolved server directory.
    const rootDir =
      [this.app.paths.rootDir, this.app.paths.server('..')].find((directory) =>
        existsSync(path.join(directory, 'package.json')),
      ) ?? this.app.paths.rootDir;
    this.app.container.singleton(foundationServiceToken, () => {
      const container = this.app.container;
      const executor = container
        .resolve(jobExecutorServiceToken)
        .getJobExecutor(this.name);
      const service = new FoundationSnapshots({
        database: container.resolve(databaseManagerToken),
        appName: this.app.appName,
        executor,
        collector: (signal) =>
          new DefaultFoundationService({
            signal,
            container: this.app.container,
            config: this.app.config,
            rootDir,
            runtimeProviders: () => runtimeProviderEvidence(this.app),
            serverRegistrationsComplete: () =>
              Array.isArray(this.app.registeredServerPlugins),
            // A deployment serves its built client from `clientDir`; in development that build does not exist yet and
            // Vite serves the sources in `client/`.
            hasClient: [
              this.app.paths.clientDir,
              this.app.paths.root('client'),
            ].some((directory) => existsSync(directory)),
          }),
      });
      this.executor = executor;
      this.service = service;
      executor.registerJob(service.job);
      return service;
    });
  }

  public override async start(): Promise<void> {
    // Applications without a database cannot save foundation results.
    if (!this.app.container.has(databaseManagerToken)) return;
    this.app.container.resolve(foundationServiceToken);
    const jobs = this.app.config.get<{
      default?: string;
      [key: string]: unknown;
    }>('jobs');
    const selected = jobs?.default
      ? (jobs[jobs.default] as { adapter?: string } | undefined)
      : undefined;
    // Recover before setup starts consumption of saved memory jobs.
    if (!selected || selected.adapter === 'memory')
      await this.service!.recoverMemory();
    await this.executor!.setup();
    await this.service!.start(false, {
      scan:
        this.app.config.get<FoundationConfig>('foundation')?.scanOnStart !==
        false,
    });
  }

  public override async shutdown(): Promise<void> {
    await this.executor?.shutdown();
  }
}
