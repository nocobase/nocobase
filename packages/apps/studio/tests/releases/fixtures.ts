/**
 * Release management for Studio's tests: an in-memory deployment driver (registered under any kind, `host` included)
 * and a release archive as `pnpm build --tar` leaves it.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  AppDeploymentSpec,
  AppObservedStatus,
  DeploymentDriver,
} from '@nocobase/app-plugin-releases/server';
import { c as createTar } from 'tar';

export interface FakeDriverState {
  readonly applied: AppDeploymentSpec[];
  readonly running: Map<string, AppDeploymentSpec>;
  /** What `status` reports instead for an App: an on-demand App stopped or dormant, say. */
  readonly reported: Map<string, Partial<AppObservedStatus>>;
}

/**
 * Deploys by remembering; every App answers at `https://<appId>.<kind>.test/`. An environment set up with
 * `{ images: true }` runs image releases, as a Docker one does.
 */
export function createFakeDriver(kind = 'fake'): {
  readonly driver: DeploymentDriver;
  readonly state: FakeDriverState;
} {
  const state: FakeDriverState = {
    applied: [],
    running: new Map(),
    reported: new Map(),
  };
  const observed = (
    spec: AppDeploymentSpec | undefined,
  ): AppObservedStatus => ({
    state: spec ? 'running' : 'stopped',
    version: spec?.release.version ?? null,
    deploymentId: spec?.deploymentId ?? null,
    startedAt: spec ? new Date().toISOString() : null,
    error: null,
  });
  const driver: DeploymentDriver = {
    kind,
    title: { key: `drivers.${kind}`, ns: 'test' },
    configSchema: { type: 'object' },
    capabilities: {
      onDemand: true,
      logs: false,
      urlModes: ['path'],
    },
    capabilitiesOf: (config) => ({
      onDemand: true,
      logs: false,
      urlModes: ['path'],
      images: config.images === true,
    }),
    open: () =>
      Promise.resolve({
        check: () => Promise.resolve({ ok: true }),
        apply(spec, onEvent) {
          state.applied.push(spec);
          const image = spec.images?.[0];
          if (image)
            onEvent?.({
              phase: 'preparing',
              msg: `pull ${image.ref}@${image.digest}`,
              artifact: { kind: 'image', ...image },
            });
          state.running.set(spec.appId, spec);
          return Promise.resolve(observed(spec));
        },
        start(spec) {
          state.running.set(spec.appId, spec);
          return Promise.resolve(observed(spec));
        },
        stop(appId) {
          state.running.delete(appId);
          return Promise.resolve(observed(undefined));
        },
        restart: (appId) => Promise.resolve(observed(state.running.get(appId))),
        remove(appId) {
          state.running.delete(appId);
          return Promise.resolve();
        },
        status: () =>
          Promise.resolve(
            new Map(
              [...state.running].map(([appId, spec]) => [
                appId,
                { ...observed(spec), ...state.reported.get(appId) },
              ]),
            ),
          ),
        restore: () => Promise.resolve(),
        logs: () =>
          Promise.resolve({
            entries: [],
            cursor: '',
            hasMore: false,
            available: false,
            reset: false,
          }),
        url: (appId) => `https://${appId}.${kind}.test/`,
        close: () => Promise.resolve(),
      }),
  };
  return { driver, state };
}

/** A release archive: a manifest and an in-process server entry. */
export async function createArtifact(
  dir: string,
  version: string,
  options: {
    /** Written to `dist/variables.json`, as `pnpm build` does. */
    readonly variables?: unknown;
  } = {},
): Promise<{ readonly file: string; readonly bytes: Buffer }> {
  const source = path.join(dir, `source-${version}`);
  await mkdir(path.join(source, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(source, 'package.json'),
    JSON.stringify({ name: '@example/app', version, type: 'module' }),
  );
  await writeFile(
    path.join(source, 'dist', 'server', 'embedded.js'),
    'export function createServer() { return { fetch: () => new Response("ok") }; }\n',
  );
  const files = ['package.json', 'dist/server/embedded.js'];
  if (options.variables !== undefined) {
    await writeFile(
      path.join(source, 'dist', 'variables.json'),
      JSON.stringify(options.variables),
    );
    files.push('dist/variables.json');
  }
  const file = path.join(dir, `release-${version}.tar.gz`);
  await createTar({ cwd: source, file, gzip: true, portable: true }, files);
  const bytes = await readFile(file);
  return { file, bytes };
}

export function checksumOf(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
