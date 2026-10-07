/**
 * The Docker activation backend (`external-service`, named `docker`): each App definition runs as a container, which
 * the App Host's registry starts, stops and retires like any runtime, and the Host's own listener forwards the App's
 * traffic to (see `handle.ts`). On-demand start, the idle stop and dormancy therefore work as for in-process Apps: a
 * request to a stopped App starts its container, an idle App's container is stopped (and kept), a dormant App's
 * container is removed (its volume stays) and created again on the next request.
 *
 * A container runs the release's OCI image for the target's platform, pulled from the environment's registry by
 * digest (tagged `<prefix><app>:d-<digest12>`), so every environment runs the image the App's CI pushed; a release
 * without one cannot run here. A deployment starts the new container beside the running one and the registry switches
 * to it only once its Docker health check passes and the Host reaches it, so a release that never becomes healthy
 * never takes traffic; the previous container then drains and is removed.
 *
 * Every environment (scope) runs with the same built-in settings (`DOCKER_DEFAULT_SETTINGS`) on the local Docker
 * Engine, found as the `docker` CLI finds it; its only credentials are the registry's pull credentials. The Host
 * reaches a container on its Docker network when the Host itself runs in a container on that Engine, and through a
 * port published on `127.0.0.1` otherwise.
 *
 * Everything the backend creates carries labels naming the scope, so it finds its resources again after a restart
 * and never touches containers it did not create.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  deploymentLog,
  type AppActivationRequest,
  type AppDefinition,
  type HostBackendCapabilities,
  type HostDeploymentStatus,
  type HostScopeCheck,
  type ServiceBackend,
  type ServiceScope,
  type ServiceState,
} from '@nocobase/app-host';
import {
  createDiagnosticLogger,
  type JournalPage,
  type JournalQuery,
  type Logger,
} from '@nocobase/logging';

import {
  DOCKER_CONFIG_SCHEMA,
  DOCKER_DEFAULT_SETTINGS,
  DOCKER_SECRET_SCHEMA,
  assertNoDockerConfig,
  detectDockerEndpoint,
  parseDockerSecret,
  parseEndpoint,
  type DockerEndpoint,
  type DockerEnvironmentSecret,
  type DockerSettings,
} from './config.js';
import {
  createDockerApi,
  type ContainerCreateBody,
  type ContainerInspect,
  type ContainerSummary,
  type DockerApi,
} from './docker-api.js';
import { DockerAppHandle, type ContainerEndpoint } from './handle.js';
import { containerLogPage } from './logs.js';
import { APP_ID_PATTERN, LABEL, Names } from './naming.js';
import { tarArchive } from './tar.js';

export const DOCKER_BACKEND_NAME = 'docker';

export const DOCKER_BACKEND_CAPABILITIES: HostBackendCapabilities = {
  onDemand: true,
  rollout: 'start-first',
  images: true,
  backup: false,
  logs: true,
  urlModes: ['path', 'subdomain'],
};

export interface DockerBackendOptions {
  /** Creates the Engine API client for the endpoint; tests pass a fake. */
  readonly createApi?: (endpoint: DockerEndpoint) => DockerApi;
  /** The Engine API endpoint; by default found from `env` as the `docker` CLI finds it (`detectDockerEndpoint`). */
  readonly endpoint?: string;
  /** The environment the endpoint is found from (this process's). */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Replaces built-in container settings for every scope, for tests. */
  readonly settings?: Partial<DockerSettings>;
  readonly logger?: Logger;
  /** Status polling interval while waiting for health checks (1 s by default). */
  readonly pollIntervalMs?: number;
  /** How long the Host tries to reach a healthy container before giving up (15 s by default). */
  readonly reachTimeoutMs?: number;
  /** This process's host name, which names its own container when it runs in one (`os.hostname()`). */
  readonly hostname?: string;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
}

/** What `backendOptions` of a definition carries (see the Host's managed reconciler). */
interface ServiceOptions {
  readonly scope: string;
  readonly deploymentId: string;
  readonly release: {
    readonly version: string;
    readonly checksum: string;
  };
  readonly images: readonly {
    readonly ref: string;
    readonly digest: string;
    readonly platform: string;
  }[];
  readonly configFile: boolean;
  readonly routing: 'path' | 'subdomain';
}

/** What an image is pulled for: the App, its release and the release's registry images. */
interface ImageTarget {
  readonly appId: string;
  readonly release: ServiceOptions['release'];
  readonly images: ServiceOptions['images'];
}

interface BoundScope {
  readonly key: string;
  readonly secret: DockerEnvironmentSecret;
  readonly docker: DockerApi;
  readonly names: Names;
  /** How the Host reaches containers, found once per scope. */
  reach: Promise<Reach> | null;
}

type Reach =
  | { readonly mode: 'published'; readonly address: string }
  | { readonly mode: 'network'; readonly hostContainer: string };

type ImageRecord = Awaited<
  ReturnType<DockerApi['listImagesByReference']>
>[number];

class DeploymentFailure extends Error {
  public override readonly name: string = 'DeploymentFailure';
}

export function createDockerBackend(
  options: DockerBackendOptions = {},
): DockerBackend {
  return new DockerBackend(options);
}

export class DockerBackend implements ServiceBackend {
  readonly kind = 'external-service' as const;
  readonly name: string = DOCKER_BACKEND_NAME;
  readonly loadsAppCode = false as const;
  readonly replacement = 'start-first' as const;
  readonly capabilities: HostBackendCapabilities = DOCKER_BACKEND_CAPABILITIES;
  readonly configSchema: Record<string, unknown> = DOCKER_CONFIG_SCHEMA;
  readonly secretSchema: Record<string, unknown> = DOCKER_SECRET_SCHEMA;

  private readonly scopes = new Map<string, BoundScope>();
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly diagnostic: ReturnType<typeof createDiagnosticLogger>;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly pollMs: number;
  private readonly settings: DockerSettings;
  private endpointText: string | null = null;
  private versions = 0;

  constructor(private readonly options: DockerBackendOptions = {}) {
    this.diagnostic = createDiagnosticLogger(options.logger);
    this.sleep =
      options.sleep ??
      ((ms: number) =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, ms).unref?.();
        }));
    this.now = options.now ?? (() => Date.now());
    this.pollMs = options.pollIntervalMs ?? 1000;
    this.settings = { ...DOCKER_DEFAULT_SETTINGS, ...options.settings };
  }

  // ---- scopes ---------------------------------------------------------------------------------------------------

  validate(
    rawConfig: Readonly<Record<string, unknown>>,
    rawSecret: Readonly<Record<string, unknown>> | null,
  ): void {
    assertNoDockerConfig(rawConfig);
    parseDockerSecret(rawSecret);
    this.endpoint();
  }

  bindScope(scope: ServiceScope): Promise<void> {
    this.validate(scope.config, scope.secret);
    const key = JSON.stringify(scope.secret);
    if (this.scopes.get(scope.scopeId)?.key === key) return Promise.resolve();
    this.scopes.set(scope.scopeId, {
      key,
      secret: parseDockerSecret(scope.secret),
      docker: (this.options.createApi ?? createDockerApi)(this.endpoint()),
      names: new Names(this.settings, scope.scopeId),
      reach: null,
    });
    return Promise.resolve();
  }

  releaseScope(scopeId: string): Promise<void> {
    this.scopes.delete(scopeId);
    return Promise.resolve();
  }

  async check(scopeId: string): Promise<HostScopeCheck> {
    try {
      const scope = this.scope(scopeId);
      await scope.docker.ping();
      const version = await scope.docker.version();
      const details: Record<string, unknown> = {
        endpoint: this.endpointText,
        version: version.Version,
        apiVersion: version.ApiVersion,
        platform: `${version.Os}/${version.Arch}`,
      };
      const reach = await this.reachOf(scope);
      details.reach =
        reach.mode === 'network'
          ? `network (${reach.hostContainer.slice(0, 12)})`
          : `published (${reach.address})`;
      return { ok: true, details };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  close(): Promise<void> {
    // Nothing is held open: dockerode dials per request, and handles close their own connections.
    this.scopes.clear();
    return Promise.resolve();
  }

  // ---- runtimes -------------------------------------------------------------------------------------------------

  /**
   * Runs the definition's container and answers once the Host can reach it: an existing one is adopted (running and
   * healthy) or started, a missing one is created from the release's image. A container that fails its health check
   * is removed and the activation fails, which leaves the running version, if any, serving.
   */
  async activate(request: AppActivationRequest): Promise<DockerAppHandle> {
    const { definition } = request;
    const service = serviceOptions(definition);
    const scope = this.scope(service.scope);
    const config = this.settings;
    const generation = generationOf(definition);
    return await this.locked(definition.id, async () => {
      const { docker, names } = scope;
      const name = names.container(
        definition.id,
        service.deploymentId,
        generation,
      );
      let container = await docker.inspectContainer(name);
      if (
        container?.State.Running &&
        container.State.Health?.Status === 'healthy'
      )
        deploymentLog('starting', `Adopting running container ${name}`);
      else if (container) {
        deploymentLog('starting', `Starting container ${name}`);
        await this.ensureInfrastructure(scope, definition.id);
        await this.copyConfig(docker, container.Id, definition, config);
        await docker.startContainer(container.Id);
        container = await this.healthy(docker, container.Id, config);
      } else {
        deploymentLog('verifying', 'Preparing the network and volume');
        await this.ensureInfrastructure(scope, definition.id);
        const image = await this.ensureImage(
          scope,
          config,
          imageTargetOf(definition),
        );
        const reach = await this.reachOf(scope);
        deploymentLog('starting', `Creating container ${name}`);
        const id = await docker.createContainer(
          name,
          this.appContainerBody(
            scope,
            config,
            definition,
            image,
            generation,
            reach,
          ),
          config.image.platform,
        );
        await this.copyConfig(docker, id, definition, config);
        await docker.startContainer(id);
        deploymentLog(
          'health_check',
          `Waiting for ${config.healthCheck.path} to answer`,
        );
        container = await this.healthy(docker, id, config);
      }
      const containerId = container.Id;
      const endpoint = await this.endpointOf(scope, config, container);
      await this.reachable(endpoint, definition, config, containerId);
      return new DockerAppHandle({
        definition,
        version: ++this.versions,
        containerId,
        endpoint,
        drainTimeoutMs: config.stopTimeoutSeconds * 1000,
        // A container Docker restarted on its own may publish another port.
        locate: async () => {
          const found = await docker.inspectContainer(containerId);
          if (!found?.State.Running) return null;
          return await this.endpointOf(scope, config, found);
        },
        stop: (retire) =>
          this.locked(definition.id, () =>
            this.stopContainer(scope, config, definition, containerId, retire),
          ),
        restart: () =>
          this.locked(definition.id, async () => {
            await this.copyConfig(docker, containerId, definition, config);
            await docker.restartContainer(
              containerId,
              config.stopTimeoutSeconds,
            );
            const restarted = await this.healthy(docker, containerId, config);
            return await this.endpointOf(scope, config, restarted);
          }),
      });
    });
  }

  /** A dormant App keeps its volume and images; its containers go. */
  async hibernate(definition: AppDefinition): Promise<void> {
    const scope = this.scope(serviceOptions(definition).scope);
    await this.locked(definition.id, async () => {
      for (const container of await scope.docker.listContainers(
        scope.names.selector('app', definition.id),
      ))
        await scope.docker.removeContainer(container.Id);
    });
  }

  materialize(): Promise<void> {
    // The next activation creates the container again from the image.
    return Promise.resolve();
  }

  async inspect(definition: AppDefinition): Promise<ServiceState> {
    const service = serviceOptions(definition);
    const scope = this.scope(service.scope);
    const container = await scope.docker.inspectContainer(
      scope.names.container(
        definition.id,
        service.deploymentId,
        generationOf(definition),
      ),
    );
    if (!container) return 'absent';
    return container.State.Running ? 'running' : 'stopped';
  }

  async dispose(
    definition: AppDefinition,
    options: { readonly purgeData: boolean },
  ): Promise<void> {
    assertAppId(definition.id);
    const service = serviceOptions(definition);
    const scope = this.scope(service.scope);
    const { docker, names } = scope;
    await this.locked(definition.id, async () => {
      for (const container of await docker.listContainers(
        names.selector('app', definition.id),
      ))
        await docker.removeContainer(container.Id);
      if (!options.purgeData) return;
      await docker.removeVolume(names.volume(definition.id));
      for (const image of await this.appImages(scope, definition.id))
        for (const reference of image.RepoTags?.length
          ? image.RepoTags
          : [image.Id])
          await docker
            .removeImage(reference)
            .catch((error: unknown) =>
              this.diagnostic.warn(
                `Could not remove image ${reference}`,
                error,
              ),
            );
    });
  }

  async logs(
    definition: AppDefinition,
    query: JournalQuery,
  ): Promise<JournalPage> {
    const service = serviceOptions(definition);
    const scope = this.scope(service.scope);
    const container = await this.current(scope, definition.id);
    return await containerLogPage(scope.docker, container?.Id ?? null, query);
  }

  // ---- containers -----------------------------------------------------------------------------------------------

  private appContainerBody(
    scope: BoundScope,
    config: DockerSettings,
    definition: AppDefinition,
    image: string,
    generation: string,
    reach: Reach,
  ): ContainerCreateBody {
    const service = serviceOptions(definition);
    const { names } = scope;
    // An App at its own host name runs at `/`; one under a path runs at its base path, as the Host forwards it.
    const basePath = service.routing === 'subdomain' ? '' : definition.basePath;
    // The App's own variables first; the ones the container needs to run come last, so none of them is replaced.
    const env: Record<string, string> = {
      ...definition.env,
      NODE_ENV: 'production',
      APP_BASE_PATH: basePath || '/',
      APP_SERVER_HOST: '0.0.0.0',
      APP_SERVER_PORT: String(config.containerPort),
      ...(service.configFile ? { APP_CONFIG_FILE: config.configPath } : {}),
    };
    const network = names.network();
    const port = `${config.containerPort}/tcp`;
    const hostConfig: Record<string, unknown> = {
      Mounts: [
        {
          Type: 'volume',
          Source: names.volume(definition.id),
          Target: config.storagePath,
        },
      ],
      NetworkMode: network,
      // Docker restarts a crashed container and, after the daemon restarts, a running one; an idle stop stays stopped.
      RestartPolicy: { Name: 'unless-stopped' },
      Init: true,
      // No Linux capabilities and no privilege escalation.
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      ...(reach.mode === 'published'
        ? {
            PortBindings: {
              [port]: [{ HostIp: reach.address, HostPort: '' }],
            },
          }
        : {}),
    };
    return {
      Image: image,
      Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
      Labels: names.labels('app', {
        [LABEL.app]: definition.id,
        [LABEL.deployment]: service.deploymentId,
        [LABEL.generation]: generation,
        [LABEL.version]: service.release.version,
        [LABEL.checksum]: service.release.checksum,
        [LABEL.image]: image,
      }),
      ExposedPorts: { [port]: {} },
      Healthcheck: healthcheck(config, config.containerPort, basePath),
      HostConfig: hostConfig,
      NetworkingConfig: { EndpointsConfig: { [network]: {} } },
      StopTimeout: config.stopTimeoutSeconds,
    };
  }

  /** Stops a runtime's container; a retired one (replaced or removed) is removed too, with release images pruned. */
  private async stopContainer(
    scope: BoundScope,
    config: DockerSettings,
    definition: AppDefinition,
    containerId: string,
    retire: boolean,
  ): Promise<void> {
    await scope.docker.stopContainer(containerId, config.stopTimeoutSeconds);
    if (!retire) return;
    await scope.docker.removeContainer(containerId);
    await this.pruneImages(scope, config, definition.id).catch(
      (error: unknown) =>
        this.diagnostic.warn('Could not prune release images', error),
    );
  }

  /** Copies the App's configuration file into the container (before it starts), when it runs with one. */
  private async copyConfig(
    docker: DockerApi,
    containerId: string,
    definition: AppDefinition,
    config: DockerSettings,
  ): Promise<void> {
    if (!serviceOptions(definition).configFile || !definition.configPath)
      return;
    await this.writeFile(
      docker,
      containerId,
      config.configPath,
      await readFile(definition.configPath, 'utf8'),
    );
  }

  private async writeFile(
    docker: DockerApi,
    containerId: string,
    filePath: string,
    content: string,
  ): Promise<void> {
    await docker.putArchive(
      containerId,
      path.posix.dirname(filePath),
      tarArchive([
        {
          name: path.posix.basename(filePath),
          content,
          options: { mode: 0o644 },
        },
      ]),
    );
  }

  /** Waits for the container's health check; a container that does not pass is removed with its last log lines. */
  private async healthy(
    docker: DockerApi,
    id: string,
    config: DockerSettings,
  ): Promise<ContainerInspect> {
    const failure = await this.waitHealthy(
      docker,
      id,
      config.healthCheck.timeoutSeconds * 1000,
    );
    if (failure) {
      for (const line of await this.logTail(docker, id))
        deploymentLog('health_check', line, { level: 'warn' });
      await docker.removeContainer(id).catch(() => undefined);
      deploymentLog(
        'health_check',
        'The new container was removed; a running version keeps serving',
      );
      throw new DeploymentFailure(failure);
    }
    const container = await docker.inspectContainer(id);
    if (!container) throw new DeploymentFailure('The container disappeared.');
    return container;
  }

  /** Null once the container is healthy; otherwise why it is not. */
  private async waitHealthy(
    docker: DockerApi,
    id: string,
    timeoutMs: number,
  ): Promise<string | null> {
    const deadline = this.now() + timeoutMs;
    while (true) {
      const container = await docker.inspectContainer(id);
      if (!container) return 'The container disappeared.';
      const { State } = container;
      const health = State.Health?.Status ?? null;
      if (!State.Running && !['created', 'restarting'].includes(State.Status))
        return `The container exited with code ${State.ExitCode}.`;
      if (State.Status === 'restarting')
        return `The container keeps restarting (exit code ${State.ExitCode}).`;
      if (health === 'healthy' || (health === null && State.Running))
        return null;
      if (health === 'unhealthy') {
        const output = State.Health?.Log?.at(-1)?.Output?.trim();
        return `The health check failed${output ? `: ${output.slice(0, 500)}` : '.'}`;
      }
      if (this.now() >= deadline)
        return `The health check did not pass within ${Math.round(timeoutMs / 1000)} seconds.`;
      await this.sleep(this.pollMs);
    }
  }

  /** Where the Host reaches a running container: its published port, or its address on the App's network. */
  private async endpointOf(
    scope: BoundScope,
    config: DockerSettings,
    container: ContainerInspect,
  ): Promise<ContainerEndpoint> {
    const reach = await this.reachOf(scope);
    if (reach.mode === 'network') {
      const network = scope.names.network();
      const address =
        container.NetworkSettings.Networks?.[network]?.IPAddress ||
        Object.values(container.NetworkSettings.Networks ?? {}).find(
          (item) => item.IPAddress,
        )?.IPAddress;
      if (!address)
        throw new DeploymentFailure(
          `The container ${container.Name} has no address on ${network}.`,
        );
      return { host: address, port: config.containerPort };
    }
    const published = container.NetworkSettings.Ports?.[
      `${config.containerPort}/tcp`
    ]?.find((binding) => binding.HostPort);
    if (!published)
      throw new DeploymentFailure(
        `The container ${container.Name} publishes no port; it was created for reach.mode network.`,
      );
    return {
      host:
        reach.address === '0.0.0.0' || reach.address === '::'
          ? '127.0.0.1'
          : reach.address,
      port: Number(published.HostPort),
    };
  }

  /**
   * Makes sure the Host reaches the container before it takes traffic: a remote Engine's published port may be
   * filtered, or the Host may not be on the App's network.
   */
  private async reachable(
    endpoint: ContainerEndpoint,
    definition: AppDefinition,
    config: DockerSettings,
    containerId: string,
  ): Promise<void> {
    const basePath =
      serviceOptions(definition).routing === 'subdomain'
        ? ''
        : definition.basePath;
    const host = endpoint.host.includes(':')
      ? `[${endpoint.host}]`
      : endpoint.host;
    const url = `http://${host}:${endpoint.port}${basePath}${config.healthCheck.path}`;
    const deadline = this.now() + (this.options.reachTimeoutMs ?? 15_000);
    let last: string;
    while (true) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(4000),
        });
        await response.body?.cancel();
        if (response.status < 500) return;
        last = `HTTP ${response.status}`;
      } catch (error) {
        last = errorMessage(error);
      }
      if (this.now() >= deadline) break;
      await this.sleep(Math.min(this.pollMs, 500));
    }
    throw new DeploymentFailure(
      `The Host cannot reach the App's container ${containerId.slice(0, 12)} at ${endpoint.host}:${endpoint.port} (${last}); check that the Host can reach the Docker network or 127.0.0.1.`,
    );
  }

  /**
   * How the Host reaches containers on this scope's Engine, found once: on their network when this Host runs in a
   * container on the Engine, through a port published on 127.0.0.1 otherwise.
   */
  private reachOf(scope: BoundScope): Promise<Reach> {
    scope.reach ??= (async (): Promise<Reach> => {
      const name = this.options.hostname ?? os.hostname();
      const own = await scope.docker.inspectContainer(name).catch(() => null);
      if (own) return { mode: 'network', hostContainer: own.Id };
      return { mode: 'published', address: '127.0.0.1' };
    })().catch((error: unknown) => {
      scope.reach = null;
      throw error;
    });
    return scope.reach;
  }

  /** The Engine API endpoint, found once. */
  private endpoint(): DockerEndpoint {
    this.endpointText ??=
      this.options.endpoint ??
      detectDockerEndpoint(this.options.env ?? process.env);
    return parseEndpoint(this.endpointText);
  }

  // ---- shared resources -----------------------------------------------------------------------------------------

  private async ensureInfrastructure(
    scope: BoundScope,
    appId: string,
  ): Promise<void> {
    const { docker, names } = scope;
    const network = names.network();
    await docker.ensureNetwork(network, {
      labels: names.labels('app'),
      internal: false,
    });
    await docker.ensureVolume(
      names.volume(appId),
      names.labels('app', { [LABEL.app]: appId }),
    );
    const reach = await this.reachOf(scope);
    if (reach.mode === 'network')
      await docker.connectNetwork(network, reach.hostContainer);
  }

  /** The platform images run on here: `image.platform`, else the daemon's own (`linux/amd64`). */
  private async targetPlatform(
    docker: DockerApi,
    config: DockerSettings,
  ): Promise<string> {
    if (config.image.platform) return config.image.platform;
    const daemon = await docker.version();
    const arch =
      ({ x86_64: 'amd64', aarch64: 'arm64' } as Record<string, string>)[
        daemon.Arch
      ] ?? daemon.Arch;
    return `${daemon.Os}/${arch}`;
  }

  /**
   * The release's image for this platform, pulled from the environment's registry by digest (or found here from an
   * earlier pull). A release without one cannot run. Reports what it runs (`artifact` in the deployment log).
   */
  private async ensureImage(
    scope: BoundScope,
    config: DockerSettings,
    target: ImageTarget,
  ): Promise<string> {
    const { docker, names } = scope;
    const platform = await this.targetPlatform(docker, config);
    const pulled = target.images.find((image) => image.platform === platform);
    if (pulled) {
      const local = names.pulledImage(target.appId, pulled.digest);
      const reference = `${pulled.ref}@${pulled.digest}`;
      const artifact = { kind: 'image' as const, ...pulled };
      if (await docker.imageExists(local)) {
        deploymentLog('preparing', `Using image ${reference}`, { artifact });
        return local;
      }
      deploymentLog('preparing', `Pulling image ${reference}`, { artifact });
      await docker.pullImage(
        reference,
        pulled.platform,
        scope.secret.registryAuth,
      );
      const colon = local.lastIndexOf(':');
      await docker.tagImage(
        reference,
        local.slice(0, colon),
        local.slice(colon + 1),
      );
      deploymentLog('preparing', `Pulled ${reference}`);
      return local;
    }
    throw new DeploymentFailure(
      target.images.length
        ? `Release ${target.release.version} has no image for ${platform} in this environment's registry (it has ${target.images.map((image) => image.platform).join(', ')}).`
        : `Release ${target.release.version} has no image in this environment's registry; register the image your CI pushed, then deploy again.`,
    );
  }

  /** The App's release images: those pulled by digest, found by their local tag. */
  private async appImages(
    scope: BoundScope,
    appId: string,
  ): Promise<ImageRecord[]> {
    const { docker, names } = scope;
    const repository = names.imageRepository(appId);
    return [...(await docker.listImagesByReference(repository))].filter(
      (image) =>
        (image.RepoTags ?? []).some((tag) =>
          tag.startsWith(`${repository}:d-`),
        ),
    );
  }

  /** Keeps the newest `image.keep` release images of an App, and any a container still uses. */
  private async pruneImages(
    scope: BoundScope,
    config: DockerSettings,
    appId: string,
  ): Promise<void> {
    const { docker, names } = scope;
    const images = (await this.appImages(scope, appId)).sort(
      (a, b) => b.Created - a.Created,
    );
    const inUse = new Set<string>();
    for (const container of await docker.listContainers(
      names.selector('app', appId),
    )) {
      inUse.add(container.Image);
      const label = container.Labels[LABEL.image];
      if (label) inUse.add(label);
    }
    let kept = 0;
    for (const image of images) {
      const tags = image.RepoTags ?? [];
      if (tags.some((tag) => inUse.has(tag)) || inUse.has(image.Id)) {
        kept += 1;
        continue;
      }
      if (kept < config.image.keep) {
        kept += 1;
        continue;
      }
      for (const reference of tags.length ? tags : [image.Id])
        await docker
          .removeImage(reference)
          .catch((error: unknown) =>
            this.diagnostic.warn(`Could not remove image ${reference}`, error),
          );
    }
  }

  /** The App's current container: the newest running one, else the newest that ever started. */
  private async current(
    scope: BoundScope,
    appId: string,
  ): Promise<ContainerSummary | null> {
    return pickCurrent(
      await scope.docker.listContainers(scope.names.selector('app', appId)),
    );
  }

  private async logTail(docker: DockerApi, id: string): Promise<string[]> {
    try {
      return (await docker.logs(id, { tail: 30 })).map((line) => line.text);
    } catch {
      return [];
    }
  }

  private scope(scopeId: string): BoundScope {
    const scope = this.scopes.get(scopeId);
    if (!scope)
      throw new Error(
        `The Docker backend has no settings for scope "${scopeId}" yet`,
      );
    return scope;
  }

  /** Serialises work per App, so an activation, a stop and a removal never race on the same containers. */
  private async locked<T>(appId: string, work: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(appId) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(work);
    const settled = run.catch(() => undefined);
    this.locks.set(appId, settled);
    try {
      return await run;
    } finally {
      if (this.locks.get(appId) === settled) this.locks.delete(appId);
    }
  }
}

function imageTargetOf(definition: AppDefinition): ImageTarget {
  const service = serviceOptions(definition);
  return {
    appId: definition.id,
    release: service.release,
    images: service.images,
  };
}

function serviceOptions(definition: AppDefinition): ServiceOptions {
  const options = definition.backendOptions as Partial<ServiceOptions> | null;
  if (
    !options ||
    typeof options.scope !== 'string' ||
    !options.release ||
    typeof options.deploymentId !== 'string'
  )
    throw new Error(
      `App "${definition.id}" has no Docker settings in its definition`,
    );
  return {
    scope: options.scope,
    deploymentId: options.deploymentId,
    release: options.release,
    images: options.images ?? [],
    configFile: options.configFile === true,
    routing: options.routing === 'subdomain' ? 'subdomain' : 'path',
  };
}

/**
 * A short hash of what a container is created from. The configuration file's content is not part of it: it is copied
 * in each time the container starts.
 */
function generationOf(definition: AppDefinition): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        definition.backendOptions,
        definition.basePath,
        definition.hostname ?? null,
      ]),
    )
    .digest('hex')
    .slice(0, 6);
}

/** A Docker health check probing the App over HTTP from inside its container, with the image's own Node. */
function healthcheck(
  config: DockerSettings,
  port: number,
  basePath: string,
): NonNullable<ContainerCreateBody['Healthcheck']> {
  const { healthCheck } = config;
  const url = `http://127.0.0.1:${port}${basePath.replace(/\/+$/, '')}${healthCheck.path}`;
  return {
    Test: [
      'CMD',
      'node',
      '-e',
      `fetch(${JSON.stringify(url)},{signal:AbortSignal.timeout(4000)}).then((r)=>process.exit(r.ok?0:1),()=>process.exit(1))`,
    ],
    Interval: healthCheck.intervalSeconds * 1e9,
    Timeout: 5e9,
    StartPeriod: healthCheck.timeoutSeconds * 1e9,
    StartInterval: 1e9,
    Retries: 3,
  };
}

function pickCurrent(
  containers: readonly ContainerSummary[],
): ContainerSummary | null {
  const sorted = [...containers].sort((a, b) => b.Created - a.Created);
  return (
    sorted.find((container) => container.State === 'running') ??
    sorted.find((container) => container.State !== 'created') ??
    null
  );
}

/** How a container stands, as the Host reports a deployment. */
export function observedFromInspect(container: ContainerInspect): {
  readonly state: HostDeploymentStatus['observedState'];
  readonly error: string | null;
} {
  const { State } = container;
  const health = State.Health?.Status ?? null;
  if (State.Running) {
    if (health === 'unhealthy')
      return { state: 'failed', error: 'The health check fails.' };
    if (health === 'starting') return { state: 'pending', error: null };
    return { state: 'running', error: null };
  }
  if (State.Status === 'created') return { state: 'pending', error: null };
  if (State.Status === 'restarting')
    return {
      state: 'failed',
      error: `The container keeps restarting (exit code ${State.ExitCode}).`,
    };
  // `docker stop` ends Node with SIGTERM (143) or SIGKILL (137): stopped, not failed.
  if ([0, 137, 143].includes(State.ExitCode) && !State.Error)
    return { state: 'stopped', error: null };
  return {
    state: 'failed',
    error: State.Error || `The container exited with code ${State.ExitCode}.`,
  };
}

function assertAppId(appId: string): void {
  if (!APP_ID_PATTERN.test(appId)) throw new Error('Invalid app ID.');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
