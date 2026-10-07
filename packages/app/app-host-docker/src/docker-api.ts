/**
 * The part of the Docker Engine API the backend uses, as one narrow interface: tests pass a fake, production passes
 * `createDockerApi`, which talks to the daemon through dockerode (the local socket, or a socket proxy over TCP). Request and
 * response bodies keep the Engine API's own field names (https://docs.docker.com/reference/api/engine/).
 */
import type { Readable } from 'node:stream';

import Docker from 'dockerode';

import type { DockerEndpoint, RegistryAuth } from './config.js';

export interface ContainerCreateBody {
  readonly Image: string;
  readonly Env?: readonly string[];
  readonly Labels?: Readonly<Record<string, string>>;
  readonly Cmd?: readonly string[];
  readonly Entrypoint?: readonly string[];
  readonly User?: string;
  readonly WorkingDir?: string;
  readonly ExposedPorts?: Readonly<Record<string, object>>;
  readonly Healthcheck?: {
    readonly Test: readonly string[];
    /** Nanoseconds, as the Engine API counts them. */
    readonly Interval?: number;
    readonly Timeout?: number;
    readonly StartPeriod?: number;
    readonly StartInterval?: number;
    readonly Retries?: number;
  };
  readonly HostConfig?: Readonly<Record<string, unknown>>;
  readonly NetworkingConfig?: {
    readonly EndpointsConfig: Readonly<
      Record<string, { readonly Aliases?: readonly string[] }>
    >;
  };
  readonly StopTimeout?: number;
}

export interface ContainerSummary {
  readonly Id: string;
  readonly Names: readonly string[];
  readonly Image: string;
  readonly Labels: Readonly<Record<string, string>>;
  /** `created`, `running`, `exited`, … */
  readonly State: string;
  readonly Created: number;
}

export interface ContainerInspect {
  readonly Id: string;
  readonly Name: string;
  readonly Created: string;
  readonly Image: string;
  readonly Config: {
    readonly Image: string;
    readonly Env?: readonly string[] | null;
    readonly Labels?: Readonly<Record<string, string>> | null;
    readonly Cmd?: readonly string[] | null;
    readonly Entrypoint?: readonly string[] | null;
    readonly User?: string;
    readonly WorkingDir?: string;
    readonly ExposedPorts?: Readonly<Record<string, object>> | null;
    readonly Healthcheck?: ContainerCreateBody['Healthcheck'] | null;
  };
  readonly State: {
    readonly Status: string;
    readonly Running: boolean;
    readonly ExitCode: number;
    readonly Error?: string;
    readonly StartedAt: string;
    readonly FinishedAt?: string;
    readonly Health?: {
      readonly Status: string;
      readonly Log?: readonly { readonly Output?: string }[] | null;
    } | null;
  };
  readonly HostConfig: Readonly<Record<string, unknown>>;
  readonly Mounts?: readonly {
    readonly Type: string;
    readonly Name?: string;
    readonly Source?: string;
    readonly Destination: string;
  }[];
  readonly NetworkSettings: {
    readonly Networks?: Readonly<
      Record<
        string,
        {
          readonly Aliases?: readonly string[] | null;
          readonly IPAddress?: string;
        }
      >
    > | null;
    /** Published ports by `<port>/tcp`, once the container runs. */
    readonly Ports?: Readonly<
      Record<
        string,
        readonly { readonly HostIp: string; readonly HostPort: string }[] | null
      >
    > | null;
  };
}

export interface LogLine {
  readonly stream: 'stdout' | 'stderr';
  /** RFC 3339 with nanoseconds, as Docker stamps it. */
  readonly time: string;
  readonly text: string;
}

export interface DockerApi {
  ping(): Promise<void>;
  version(): Promise<{
    readonly Version: string;
    readonly ApiVersion: string;
    readonly Os: string;
    readonly Arch: string;
  }>;
  imageExists(reference: string): Promise<boolean>;
  /** Pulls an image, with a registry's credentials when given (`X-Registry-Auth`). */
  pullImage(
    reference: string,
    platform?: string | null,
    auth?: RegistryAuth,
  ): Promise<void>;
  /** Tags an image already present as `repository:tag`. */
  tagImage(source: string, repository: string, tag: string): Promise<void>;
  /** Images whose reference matches (`reference` filter, such as `<prefix><app>`). */
  listImagesByReference(reference: string): Promise<
    readonly {
      readonly Id: string;
      readonly RepoTags: readonly string[] | null;
      readonly Labels: Readonly<Record<string, string>> | null;
      readonly Created: number;
    }[]
  >;
  removeImage(reference: string): Promise<void>;
  createContainer(
    name: string,
    body: ContainerCreateBody,
    platform?: string | null,
  ): Promise<string>;
  /** Null when no such container exists. */
  inspectContainer(idOrName: string): Promise<ContainerInspect | null>;
  listContainers(
    labels: Readonly<Record<string, string>>,
  ): Promise<readonly ContainerSummary[]>;
  startContainer(id: string): Promise<void>;
  stopContainer(id: string, timeoutSeconds: number): Promise<void>;
  restartContainer(id: string, timeoutSeconds: number): Promise<void>;
  /** Removes the container (never its named volumes); absent containers are ignored. */
  removeContainer(id: string): Promise<void>;
  /** Waits for the container to stop and returns its exit code. */
  waitContainer(id: string): Promise<number>;
  /** Extracts an uncompressed tar archive into the container at `path` (works before the container starts). */
  putArchive(id: string, path: string, archive: Buffer): Promise<void>;
  logs(
    id: string,
    options: {
      readonly since?: string;
      readonly until?: string;
      readonly tail?: number;
    },
  ): Promise<readonly LogLine[]>;
  ensureVolume(
    name: string,
    labels: Readonly<Record<string, string>>,
  ): Promise<void>;
  removeVolume(name: string): Promise<void>;
  /** Creates the network unless it exists. */
  ensureNetwork(
    name: string,
    options: {
      readonly labels: Readonly<Record<string, string>>;
      readonly internal: boolean;
    },
  ): Promise<void>;
  removeNetwork(name: string): Promise<void>;
  /** Connects a container to a network; already connected is fine. */
  connectNetwork(network: string, container: string): Promise<void>;
  /** Disconnects a container from a network; not connected is fine. */
  disconnectNetwork(network: string, container: string): Promise<void>;
}

/** Creates the dockerode-backed API for an endpoint. */
export function createDockerApi(endpoint: DockerEndpoint): DockerApi {
  return wrapDockerode(new Docker(dockerodeOptions(endpoint)));
}

export function dockerodeOptions(
  endpoint: DockerEndpoint,
): Docker.DockerOptions {
  return endpoint.kind === 'socket'
    ? { socketPath: endpoint.socketPath }
    : { protocol: 'http', host: endpoint.host, port: endpoint.port };
}

interface DialOptions {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly query?: Readonly<Record<string, unknown>>;
  readonly body?: unknown;
  readonly file?: Buffer | Readable;
  readonly isStream?: boolean;
  readonly statusCodes: Readonly<Record<number, boolean | string>>;
}

interface Modem {
  dial(
    options: Record<string, unknown>,
    callback: (error: Error | null, data: unknown) => void,
  ): void;
}

/** Engine API errors carry the HTTP status; 404 and 304 are expected answers here, not failures. */
function statusOf(error: unknown): number | undefined {
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  return typeof status === 'number' ? status : undefined;
}

export function wrapDockerode(docker: Docker): DockerApi {
  const modem = docker.modem as unknown as Modem;
  const dial = <T>(options: DialOptions): Promise<T> =>
    new Promise((resolve, reject) => {
      const hasQuery = options.query && Object.keys(options.query).length > 0;
      modem.dial(
        {
          path: `${options.path}?`,
          method: options.method,
          // docker-modem puts `_query` into the query string and `_body` into a JSON body.
          options:
            hasQuery || options.body !== undefined
              ? {
                  _query: options.query ?? {},
                  ...(options.body !== undefined
                    ? { _body: options.body }
                    : {}),
                }
              : {},
          file: options.file,
          isStream: options.isStream ?? false,
          allowEmpty: true,
          statusCodes: options.statusCodes,
        },
        (error, data) => (error ? reject(error) : resolve(data as T)),
      );
    });

  const ignore =
    (...statuses: number[]) =>
    (error: unknown): void => {
      if (!statuses.includes(statusOf(error) ?? 0)) throw error;
    };

  const labelFilter = (labels: Readonly<Record<string, string>>) =>
    JSON.stringify({
      label: Object.entries(labels).map(([key, value]) => `${key}=${value}`),
    });

  return {
    async ping() {
      await docker.ping();
    },
    async version() {
      const version = await docker.version();
      return {
        Version: version.Version,
        ApiVersion: version.ApiVersion,
        Os: version.Os,
        Arch: version.Arch,
      };
    },
    async imageExists(reference) {
      try {
        await docker.getImage(reference).inspect();
        return true;
      } catch (error) {
        if (statusOf(error) === 404) return false;
        throw error;
      }
    },
    async pullImage(reference, platform, auth) {
      const stream = await docker.pull(reference, {
        ...(platform ? { platform } : {}),
        ...(auth ? { authconfig: { ...auth } } : {}),
      });
      await new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(
          stream,
          (error: Error | null, output: unknown[]) => {
            if (error) return reject(error);
            const failed = (output as { error?: string }[]).find(
              (item) => item.error,
            );
            if (failed) reject(new Error(failed.error));
            else resolve();
          },
        );
      });
    },
    async tagImage(source, repository, tag) {
      await docker.getImage(source).tag({ repo: repository, tag });
    },
    async listImagesByReference(reference) {
      const images = await docker.listImages({
        filters: JSON.stringify({ reference: [reference] }),
      } as Docker.ListImagesOptions);
      return images.map((image) => ({
        Id: image.Id,
        RepoTags: image.RepoTags ?? null,
        Labels: image.Labels ?? null,
        Created: image.Created,
      }));
    },
    async removeImage(reference) {
      await dial({
        path: `/images/${encodeURIComponent(reference)}`,
        method: 'DELETE',
        statusCodes: { 200: true, 404: 'no such image', 409: 'conflict' },
      }).catch(ignore(404));
    },
    async createContainer(name, body, platform) {
      const created = await dial<{ Id: string }>({
        path: '/containers/create',
        method: 'POST',
        query: { name, ...(platform ? { platform } : {}) },
        body,
        statusCodes: {
          200: true,
          201: true,
          400: 'bad parameter',
          404: 'no such image',
          409: 'conflict',
        },
      });
      return created.Id;
    },
    async inspectContainer(idOrName) {
      try {
        return (await docker
          .getContainer(idOrName)
          .inspect()) as unknown as ContainerInspect;
      } catch (error) {
        if (statusOf(error) === 404) return null;
        throw error;
      }
    },
    async listContainers(labels) {
      return await docker.listContainers({
        all: true,
        filters: labelFilter(labels),
      });
    },
    async startContainer(id) {
      await docker.getContainer(id).start().catch(ignore(304));
    },
    async stopContainer(id, timeoutSeconds) {
      await docker
        .getContainer(id)
        .stop({ t: timeoutSeconds })
        .catch(ignore(304, 404));
    },
    async restartContainer(id, timeoutSeconds) {
      await docker.getContainer(id).restart({ t: timeoutSeconds });
    },
    async removeContainer(id) {
      await docker
        .getContainer(id)
        .remove({ force: true, v: false })
        .catch(ignore(404));
    },
    async waitContainer(id) {
      const result = (await docker.getContainer(id).wait()) as {
        StatusCode: number;
      };
      return result.StatusCode;
    },
    async putArchive(id, path, archive) {
      await dial({
        path: `/containers/${encodeURIComponent(id)}/archive`,
        method: 'PUT',
        query: { path },
        file: archive,
        statusCodes: {
          200: true,
          400: 'bad parameter',
          403: 'read-only',
          404: 'no such container',
        },
      });
    },
    async logs(id, options) {
      const raw = await docker.getContainer(id).logs({
        stdout: true,
        stderr: true,
        timestamps: true,
        follow: false,
        ...(options.since ? { since: options.since } : {}),
        ...(options.until ? { until: options.until } : {}),
        ...(options.tail !== undefined ? { tail: options.tail } : {}),
      } as Docker.ContainerLogsOptions & { follow: false });
      return demuxLogs(raw);
    },
    async ensureVolume(name, labels) {
      try {
        await docker.getVolume(name).inspect();
      } catch (error) {
        if (statusOf(error) !== 404) throw error;
        await docker.createVolume({ Name: name, Labels: { ...labels } });
      }
    },
    async removeVolume(name) {
      await docker.getVolume(name).remove().catch(ignore(404));
    },
    async ensureNetwork(name, options) {
      try {
        await docker.getNetwork(name).inspect();
      } catch (error) {
        if (statusOf(error) !== 404) throw error;
        await docker
          .createNetwork({
            Name: name,
            Driver: 'bridge',
            Internal: options.internal,
            Labels: { ...options.labels },
          })
          .catch(ignore(409));
      }
    },
    async removeNetwork(name) {
      await docker.getNetwork(name).remove().catch(ignore(404));
    },
    async connectNetwork(network, container) {
      try {
        await docker.getNetwork(network).connect({ Container: container });
      } catch (error) {
        // Docker answers 403 (older) or 409 when the container is already on the network.
        const status = statusOf(error);
        const message = error instanceof Error ? error.message : '';
        if (
          (status === 403 || status === 409 || status === 500) &&
          /already exists|already attached/i.test(message)
        )
          return;
        throw error;
      }
    },
    async disconnectNetwork(network, container) {
      await docker
        .getNetwork(network)
        .disconnect({ Container: container, Force: true })
        .catch((error: unknown) => {
          const status = statusOf(error);
          // Absent network or container, or not connected.
          if (status === 404 || status === 403 || status === 409) return;
          throw error;
        });
    },
  };
}

/**
 * Splits Docker's multiplexed log stream (8-byte frame headers: stream type, three zero bytes, big-endian length) into
 * timestamped lines. A container with a TTY has no frames; its output is all stdout.
 */
export function demuxLogs(raw: Buffer | string): LogLine[] {
  const buffer = typeof raw === 'string' ? Buffer.from(raw) : raw;
  const chunks: { stream: 'stdout' | 'stderr'; text: string }[] = [];
  const framed =
    buffer.length >= 8 &&
    (buffer[0] === 1 || buffer[0] === 2) &&
    buffer[1] === 0 &&
    buffer[2] === 0 &&
    buffer[3] === 0;
  if (framed) {
    let offset = 0;
    while (offset + 8 <= buffer.length) {
      const type = buffer[offset];
      const size = buffer.readUInt32BE(offset + 4);
      const text = buffer
        .subarray(offset + 8, offset + 8 + size)
        .toString('utf8');
      chunks.push({ stream: type === 2 ? 'stderr' : 'stdout', text });
      offset += 8 + size;
    }
  } else chunks.push({ stream: 'stdout', text: buffer.toString('utf8') });
  const lines: LogLine[] = [];
  // Frames do not follow line boundaries; join each stream's text before splitting into lines.
  const pending: Record<'stdout' | 'stderr', string> = {
    stdout: '',
    stderr: '',
  };
  const flush = (stream: 'stdout' | 'stderr', text: string) => {
    const match = /^(\d{4}-\d{2}-\d{2}T[0-9:.]+Z) ?(.*)$/s.exec(text);
    if (match) lines.push({ stream, time: match[1], text: match[2] });
    else if (text) lines.push({ stream, time: '', text });
  };
  for (const chunk of chunks) {
    const parts = (pending[chunk.stream] + chunk.text).split('\n');
    pending[chunk.stream] = parts.pop() ?? '';
    for (const part of parts) flush(chunk.stream, part.replace(/\r$/, ''));
  }
  for (const stream of ['stdout', 'stderr'] as const)
    if (pending[stream]) flush(stream, pending[stream]);
  return lines;
}
