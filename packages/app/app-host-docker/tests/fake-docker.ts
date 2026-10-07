/**
 * An in-memory Docker Engine for backend tests. A container's health follows `health(version)` (its version label): `healthy` once started, `unhealthy`, or `exit` (the process dies). A running container
 * that publishes its port really listens on a loopback port, so the Host can forward to it: it answers its health
 * path, echoes anything else as JSON (`version`, `container`, `path`, `method`, `body`), streams `/stream`, and joins an
 * upgrade as a raw echo.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';

import type {
  ContainerCreateBody,
  ContainerInspect,
  ContainerSummary,
  DockerApi,
  LogLine,
} from '../src/docker-api.js';

const VERSION_LABEL = 'org.nocobase.app-host.version';

export type Behaviour = 'healthy' | 'unhealthy' | 'exit';

export interface FakeContainer {
  id: string;
  name: string;
  body: ContainerCreateBody;
  status: 'created' | 'running' | 'exited';
  health: 'starting' | 'healthy' | 'unhealthy' | null;
  exitCode: number;
  created: number;
  startedAt: string;
  files: Map<string, Buffer>;
  logs: LogLine[];
  networks: Set<string>;
  server: http.Server | null;
  port: number | null;
}

export interface FakeImage {
  readonly reference: string;
  readonly id: string;
  readonly labels: Record<string, string>;
  readonly created: number;
}

export class FakeDocker implements DockerApi {
  public readonly containers = new Map<string, FakeContainer>();
  public readonly images = new Map<string, FakeImage>();
  public readonly volumes = new Map<string, Record<string, string>>();
  public readonly networks = new Map<string, Record<string, string>>();
  public readonly pulled: string[] = [];
  public readonly pullAuth: {
    reference: string;
    username?: string;
    password?: string;
  }[] = [];
  public readonly calls: string[] = [];
  public health: (
    version: string | undefined,
    container: FakeContainer,
  ) => Behaviour = () => 'healthy';
  /** Runs when a container starts. */
  public onStart?: (container: FakeContainer) => void;
  /** Requests the containers answered, as `<container> <method> <path>`. */
  public readonly served: string[] = [];
  private sequence = 0;
  private clock = 1_000;

  public ping(): Promise<void> {
    return Promise.resolve();
  }

  public version(): Promise<{
    Version: string;
    ApiVersion: string;
    Os: string;
    Arch: string;
  }> {
    return Promise.resolve({
      Version: '28.5.2',
      ApiVersion: '1.51',
      Os: 'linux',
      Arch: 'arm64',
    });
  }

  public imageExists(reference: string): Promise<boolean> {
    return Promise.resolve(this.images.has(reference));
  }

  public pullImage(
    reference: string,
    _platform?: string | null,
    auth?: { readonly username?: string; readonly password?: string },
  ): Promise<void> {
    this.pulled.push(reference);
    if (auth) this.pullAuth.push({ reference, ...auth });
    this.images.set(reference, {
      reference,
      id: `sha256:${(this.sequence += 1)}`,
      labels: {},
      created: (this.clock += 1),
    });
    return Promise.resolve();
  }

  public tagImage(
    source: string,
    repository: string,
    tag: string,
  ): Promise<void> {
    const image = this.images.get(source);
    if (!image) return Promise.reject(new Error(`No such image: ${source}`));
    this.calls.push(`tagImage ${source} ${repository}:${tag}`);
    this.images.set(`${repository}:${tag}`, {
      ...image,
      reference: `${repository}:${tag}`,
    });
    return Promise.resolve();
  }

  public listImagesByReference(reference: string) {
    return Promise.resolve(
      [...this.images.values()]
        .filter((image) => image.reference.startsWith(`${reference}:`))
        .map((image) => ({
          Id: image.id,
          RepoTags: [image.reference],
          Labels: image.labels,
          Created: image.created,
        })),
    );
  }

  public removeImage(reference: string): Promise<void> {
    this.calls.push(`removeImage ${reference}`);
    this.images.delete(reference);
    return Promise.resolve();
  }

  public createContainer(
    name: string,
    body: ContainerCreateBody,
  ): Promise<string> {
    if (
      [...this.containers.values()].some((container) => container.name === name)
    )
      return Promise.reject(new Error(`Conflict: ${name} exists`));
    if (!this.images.has(body.Image))
      return Promise.reject(new Error(`No such image ${body.Image}`));
    const id = `c${(this.sequence += 1)}`.padEnd(16, '0');
    const network = body.HostConfig?.NetworkMode as string | undefined;
    this.containers.set(id, {
      id,
      name,
      body,
      status: 'created',
      health: null,
      exitCode: 0,
      created: (this.clock += 1),
      startedAt: '0001-01-01T00:00:00Z',
      files: new Map(),
      logs: [],
      networks: new Set(network ? [network] : []),
      server: null,
      port: null,
    });
    this.calls.push(`create ${name}`);
    return Promise.resolve(id);
  }

  public find(idOrName: string): FakeContainer | undefined {
    return (
      this.containers.get(idOrName) ??
      [...this.containers.values()].find(
        (container) => container.name === idOrName,
      )
    );
  }

  public inspectContainer(idOrName: string): Promise<ContainerInspect | null> {
    const container = this.find(idOrName);
    if (!container) return Promise.resolve(null);
    if (container.status === 'running' && container.health === 'starting') {
      const behaviour = this.health(
        container.body.Labels?.[VERSION_LABEL],
        container,
      );
      if (behaviour === 'exit') {
        container.status = 'exited';
        container.exitCode = 1;
        container.health = 'unhealthy';
      } else container.health = behaviour;
    }
    return Promise.resolve(inspectOf(container));
  }

  public listContainers(
    labels: Readonly<Record<string, string>>,
  ): Promise<readonly ContainerSummary[]> {
    return Promise.resolve(
      [...this.containers.values()]
        .filter((container) => matches(container.body.Labels ?? {}, labels))
        .map((container) => ({
          Id: container.id,
          Names: [`/${container.name}`],
          Image: container.body.Image,
          Labels: container.body.Labels ?? {},
          State: container.status,
          Created: container.created,
        })),
    );
  }

  public async startContainer(id: string): Promise<void> {
    const container = this.require(id);
    this.calls.push(`start ${container.name}`);
    if (container.status === 'running') return;
    container.status = 'running';
    container.startedAt = new Date().toISOString();
    container.health = container.body.Healthcheck ? 'starting' : null;
    await this.listen(container);
    this.onStart?.(container);
  }

  public async stopContainer(id: string): Promise<void> {
    const container = this.containers.get(id) ?? this.find(id);
    if (!container) return;
    this.calls.push(`stop ${container.name}`);
    container.status = 'exited';
    container.exitCode = 143;
    await this.unlisten(container);
  }

  public async restartContainer(id: string): Promise<void> {
    const container = this.require(id);
    await this.unlisten(container);
    container.status = 'running';
    container.health = container.body.Healthcheck ? 'starting' : null;
    await this.listen(container);
  }

  public async removeContainer(id: string): Promise<void> {
    const container = this.containers.get(id) ?? this.find(id);
    if (container) {
      this.calls.push(`remove ${container.name}`);
      await this.unlisten(container);
      this.containers.delete(container.id);
    }
  }

  /** Stops every listening container, at the end of a test. */
  public async close(): Promise<void> {
    await Promise.all(
      [...this.containers.values()].map((container) =>
        this.unlisten(container),
      ),
    );
  }

  /** A running container that publishes its port listens on a loopback port, as the App inside it would. */
  private async listen(container: FakeContainer): Promise<void> {
    const bindings = container.body.HostConfig?.PortBindings;
    if (!bindings) return;
    const version = container.body.Labels?.[VERSION_LABEL];
    const env = container.body.Env ?? [];
    const base = (
      env.find((entry) => entry.startsWith('APP_BASE_PATH='))?.slice(14) ?? ''
    ).replace(/\/+$/, '');
    const server = http.createServer((req, res) => {
      const url = req.url ?? '/';
      this.served.push(`${container.name} ${req.method} ${url}`);
      if (url === `${base}/api/healthz`) {
        const healthy = this.health(version, container) === 'healthy';
        res.writeHead(healthy ? 200 : 503);
        res.end();
        return;
      }
      if (url === `${base}/stream`) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write('data: one\n\n');
        setTimeout(() => res.end('data: two\n\n'), 20);
        return;
      }
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        res.setHeader('set-cookie', ['a=1; Path=/', 'b=2; Path=/']);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            version,
            container: container.name,
            path: url,
            method: req.method,
            body: Buffer.concat(chunks).toString('utf8'),
            forwardedFor: req.headers['x-forwarded-for'] ?? null,
            host: req.headers.host ?? null,
          }),
        );
      });
    });
    server.on('upgrade', (_req, socket) => {
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\nupgrade: echo\r\nconnection: Upgrade\r\n\r\n',
      );
      socket.pipe(socket);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    container.server = server;
    container.port = (server.address() as AddressInfo).port;
  }

  private async unlisten(container: FakeContainer): Promise<void> {
    const server = container.server;
    if (!server) return;
    container.server = null;
    container.port = null;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  public waitContainer(id: string): Promise<number> {
    const container = this.require(id);
    container.status = 'exited';
    return Promise.resolve(container.exitCode);
  }

  public putArchive(id: string, path: string, archive: Buffer): Promise<void> {
    this.require(id).files.set(path, archive);
    return Promise.resolve();
  }

  public logs(
    id: string,
    options: { tail?: number },
  ): Promise<readonly LogLine[]> {
    const lines = this.require(id).logs;
    return Promise.resolve(
      options.tail === undefined ? lines : lines.slice(-options.tail),
    );
  }

  public ensureVolume(
    name: string,
    labels: Readonly<Record<string, string>>,
  ): Promise<void> {
    if (!this.volumes.has(name)) this.volumes.set(name, { ...labels });
    return Promise.resolve();
  }

  public removeVolume(name: string): Promise<void> {
    this.volumes.delete(name);
    return Promise.resolve();
  }

  public ensureNetwork(
    name: string,
    options: { labels: Readonly<Record<string, string>> },
  ): Promise<void> {
    if (!this.networks.has(name))
      this.networks.set(name, { ...options.labels });
    return Promise.resolve();
  }

  public removeNetwork(name: string): Promise<void> {
    this.networks.delete(name);
    return Promise.resolve();
  }

  public connectNetwork(network: string, container: string): Promise<void> {
    this.require(container).networks.add(network);
    return Promise.resolve();
  }

  public disconnectNetwork(network: string, container: string): Promise<void> {
    this.find(container)?.networks.delete(network);
    return Promise.resolve();
  }

  private require(idOrName: string): FakeContainer {
    const container = this.find(idOrName);
    if (!container)
      throw Object.assign(new Error(`No such container ${idOrName}`), {
        statusCode: 404,
      });
    return container;
  }
}

function matches(
  labels: Readonly<Record<string, string>>,
  selector: Readonly<Record<string, string>>,
): boolean {
  return Object.entries(selector).every(
    ([key, value]) => labels[key] === value,
  );
}

function inspectOf(container: FakeContainer): ContainerInspect {
  return {
    Id: container.id,
    Name: `/${container.name}`,
    Created: new Date(container.created).toISOString(),
    Image: container.body.Image,
    Config: {
      Image: container.body.Image,
      Env: container.body.Env ?? [],
      Labels: container.body.Labels ?? {},
      ExposedPorts: container.body.ExposedPorts ?? null,
      Healthcheck: container.body.Healthcheck ?? null,
    },
    State: {
      Status: container.status,
      Running: container.status === 'running',
      ExitCode: container.exitCode,
      StartedAt: container.startedAt,
      Health: container.health
        ? { Status: container.health, Log: [{ Output: 'probe output' }] }
        : null,
    },
    HostConfig: { ...(container.body.HostConfig ?? {}) },
    Mounts: [],
    NetworkSettings: {
      Networks: Object.fromEntries(
        [...container.networks].map((network) => [
          network,
          { Aliases: [], IPAddress: '127.0.0.1' },
        ]),
      ),
      Ports:
        container.port === null
          ? {}
          : {
              [Object.keys(container.body.ExposedPorts ?? {})[0] ??
              '13000/tcp']: [
                { HostIp: '127.0.0.1', HostPort: String(container.port) },
              ],
            },
    },
  };
}
