/**
 * Builds the plugin's services from the application: its database, the `releases` configuration, the drivers
 * registered on `releasesDriversToken` and the roles bound on `releasesAccessToken`. With `releases.host.enabled` it
 * supervises the App Host that runs Apps in process and registers the `host` driver; with `releases.docker.enabled` it
 * also supervises a second Host that runs Apps in Docker containers, which environments choose as their run mode. At
 * start it restores every environment's Apps.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loggingToken } from '@nocobase/app-server/logging';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import type { AppConfigAccessor } from '@nocobase/app-server/config';
import { normalizeBasePath } from '@nocobase/app-server/support';
import { AppHostSupervisor } from '@nocobase/app-host/supervisor';
import { databaseManagerToken } from '@nocobase/db';
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';

import { createReleases } from '../composition.js';
import { createReleasesSecretsStores } from '../secrets-stores.js';
import type {
  ReleasesDockerHostConfig,
  ReleasesPluginConfig,
} from '../config.js';
import {
  DOCKER_BACKEND,
  IN_PROCESS_BACKEND,
  createHostDriver,
  writeHostConfig,
  type HostDeploymentDriver,
  type HostEndpointOptions,
} from '../drivers/host/driver.js';
import { createDriverRegistry } from '../drivers/types.js';
import {
  releasesAccessToken,
  releasesDriversToken,
  releasesEventsToken,
  releasesHostToken,
  releasesToken,
} from '../tokens.js';

export interface ReleasesProviderApplication {
  readonly container: ServiceContainer;
  readonly config: AppConfigAccessor;
}

export class ReleasesProvider extends ServiceProvider<ReleasesProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-releases';
  private supervisor?: AppHostSupervisor;
  private dockerSupervisor?: AppHostSupervisor;
  private hostDriver?: HostDeploymentDriver;

  public override register(): void {
    const { container } = this.app;
    if (container.has(secretsServiceToken)) {
      const secrets = container.resolve(secretsServiceToken);
      for (const store of createReleasesSecretsStores(() =>
        container.resolve(databaseManagerToken).connection(),
      ))
        secrets.registerStore(store);
    }
    container.singleton(releasesDriversToken, () => createDriverRegistry());
    container.singleton(releasesHostToken, (resolver) => {
      resolver.resolve(releasesToken);
      return {
        proxyTarget: () => this.hostDriver?.proxyTarget() ?? null,
      };
    });
    container.singleton(releasesToken, (resolver) => {
      const config = this.config();
      const logger = resolver.has(loggingToken)
        ? resolver.resolve(loggingToken).getLogger('releases')
        : undefined;
      const drivers = resolver.resolve(releasesDriversToken);
      if (config.host?.enabled) {
        const { host } = config;
        this.supervisor = AppHostSupervisor.initialize({
          mode: 'managed',
          driver: host.driver ?? 'auto',
          appRevisionsDir: host.appRevisionsDir,
          appVolumesDir: host.appVolumesDir,
          configPath: host.configPath,
          childOutputDir: host.childOutputDir,
          host: host.host,
          port: host.port,
          startTimeoutMs: host.startTimeoutMs,
          ipcTimeoutMs: host.ipcTimeoutMs,
          shutdownTimeoutMs: host.shutdownTimeoutMs,
          autoRestart: host.autoRestart,
          maxAutomaticRestarts: host.maxAutomaticRestarts,
          automaticRestartWindowMs: host.automaticRestartWindowMs,
          automaticRestartBaseDelayMs: host.automaticRestartBaseDelayMs,
          entrypoint: host.entrypoint,
          tsxCli: host.tsxCli,
          tsconfig: host.tsconfig,
          env: host.env,
          uid: host.uid,
          gid: host.gid,
          launchPrefix: host.launchPrefix,
          logger: resolver.has(loggingToken)
            ? resolver.resolve(loggingToken).getLogger('host-supervisor')
            : undefined,
        });
        const hosts: Record<string, HostEndpointOptions> = {
          [IN_PROCESS_BACKEND]: {
            controller: this.supervisor,
            prepare: () =>
              writeHostConfig(host.configPath, {
                artifact: config.artifact,
                appVolumesDir: host.appVolumesDir,
                appRevisionsDir: host.appRevisionsDir,
                ...(host.controlDir ? { controlDir: host.controlDir } : {}),
                logging: host.logging,
                sweepIntervalSeconds: host.sweepIntervalSeconds,
                activationHoldMs: host.activationHoldMs,
                activationWaitMs: host.activationWaitMs,
              }),
            ...(host.publicUrl ? { publicUrl: host.publicUrl } : {}),
            ...(host.restartAfterChurn
              ? { restartAfterChurn: host.restartAfterChurn }
              : {}),
          },
        };
        const docker = config.docker;
        if (docker?.enabled) {
          this.dockerSupervisor = this.startDockerHost(docker, resolver);
          hosts[DOCKER_BACKEND] = {
            controller: this.dockerSupervisor,
            prepare: () =>
              writeHostConfig(docker.configPath, {
                artifact: config.artifact,
                appVolumesDir: docker.appVolumesDir,
                appRevisionsDir: docker.appRevisionsDir,
                ...(docker.controlDir ? { controlDir: docker.controlDir } : {}),
                logging: docker.logging,
                sweepIntervalSeconds: docker.sweepIntervalSeconds,
                activationHoldMs: docker.activationHoldMs,
                activationWaitMs: docker.activationWaitMs,
                ...(docker.backend
                  ? { backends: { docker: { ...docker.backend } } }
                  : {}),
              }),
            ...(docker.publicUrl ? { publicUrl: docker.publicUrl } : {}),
          };
        }
        this.hostDriver = createHostDriver({
          hosts,
          appLogging: config.logging?.apps,
          churnCheckIntervalMs: host.churnCheckIntervalMs,
          // How the application set up each Host, shown read-only with an environment's settings. Only variable
          // names: values set for a child may be secrets.
          facts: {
            [IN_PROCESS_BACKEND]: {
              envAllow: host.env?.allow ?? null,
              envSet: Object.keys(host.env?.set ?? {}),
              launchPrefix: host.launchPrefix ?? null,
              publicUrl: host.publicUrl ?? null,
            },
            ...(docker?.enabled
              ? {
                  [DOCKER_BACKEND]: {
                    publicUrl: docker.publicUrl ?? null,
                    listen: `${docker.host ?? '127.0.0.1'}:${docker.port ?? 'auto'}`,
                  },
                }
              : {}),
          },
          logger,
        });
        drivers.register(this.hostDriver);
      }
      return createReleases({
        database: resolver.resolve(databaseManagerToken),
        config,
        drivers,
        access: () =>
          resolver.has(releasesAccessToken)
            ? resolver.resolve(releasesAccessToken)
            : undefined,
        ...(resolver.has(secretsServiceToken)
          ? { secrets: resolver.resolve(secretsServiceToken) }
          : {}),
        reservedBasePath: normalizeBasePath(
          this.app.config.get<string>('app.publicBasePath') ?? '',
        ),
        publicOrigin: this.app.config.get<string>('app.publicOrigin') ?? null,
        logger,
      });
    });
    container.singleton(
      releasesEventsToken,
      (resolver) => resolver.resolve(releasesToken).events,
    );
  }

  public override async start(): Promise<void> {
    const releases = this.app.container.resolve(releasesToken);
    await releases.releases.restore();
  }

  public override async shutdown(): Promise<void> {
    try {
      await this.app.container
        .resolveIfCreated(releasesToken)
        ?.releases.shutdown();
    } finally {
      await Promise.allSettled([
        this.supervisor?.shutdown(),
        this.dockerSupervisor?.shutdown(),
      ]);
    }
  }

  /**
   * The Docker Host: a second managed Host child with the Docker backend only (`@nocobase/app-host-docker`). It runs
   * no App code, which is what allows it the Docker credentials; it inherits this application's environment unless
   * `env` says otherwise, so an environment's `env.allow` can pass variables to its Apps.
   */
  private startDockerHost(
    docker: ReleasesDockerHostConfig,
    resolver: Pick<ServiceContainer, 'has' | 'resolve'>,
  ): AppHostSupervisor {
    let entrypoint = docker.entrypoint;
    if (!entrypoint)
      try {
        entrypoint = fileURLToPath(
          import.meta.resolve('@nocobase/app-host-docker/cli'),
        );
      } catch (error) {
        throw new Error(
          'releases.docker needs @nocobase/app-host-docker: install it in the application, or set releases.docker.entrypoint.',
          { cause: error },
        );
      }
    return AppHostSupervisor.create({
      mode: 'managed',
      driver: docker.driver ?? 'auto',
      entrypoint,
      appRevisionsDir: docker.appRevisionsDir,
      appVolumesDir: docker.appVolumesDir,
      configPath: docker.configPath,
      childOutputDir:
        docker.childOutputDir ??
        path.join(path.dirname(docker.configPath), 'child-output'),
      host: docker.host,
      port: docker.port,
      startTimeoutMs: docker.startTimeoutMs,
      ipcTimeoutMs: docker.ipcTimeoutMs,
      shutdownTimeoutMs: docker.shutdownTimeoutMs,
      autoRestart: docker.autoRestart,
      tsxCli: docker.tsxCli,
      tsconfig: docker.tsconfig,
      env: docker.env,
      logger: resolver.has(loggingToken)
        ? resolver.resolve(loggingToken).getLogger('docker-host-supervisor')
        : undefined,
    });
  }

  private config(): ReleasesPluginConfig {
    const config = this.app.config.get<ReleasesPluginConfig>('releases');
    if (!config?.artifact || !config.dataDir)
      throw new Error(
        'Release management needs a `releases` configuration with `artifact` and `dataDir`.',
      );
    return config;
  }
}
