import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { Flags } from '@oclif/core';
import { readCurrent } from '../lib/current-link.ts';
import {
  endpointsOf,
  healthUrl,
  mountPathOf,
  readAppEnv,
} from '../lib/env-file.ts';
import { checkHealth } from '../lib/health.ts';
import {
  formatCommandLine,
  installerCommand,
  shellQuote,
} from '../lib/invocation.ts';
import { layoutOf, releaseDir } from '../lib/layout.ts';
import { currentNodeMajor } from '../lib/prechecks.ts';
import { resolveTemplateVersion } from '../lib/registry.ts';
import {
  capitalize,
  nodeRebuildAdvice,
  subjectOf,
  templateOf,
} from '../lib/source.ts';
import { findRelease, readState } from '../lib/state.ts';
import type { CommandDeps, CommandOutcome } from './install.ts';

export const STATUS_FLAGS = {
  dir: Flags.string({
    description:
      'Installation root managed by app-installer. Defaults to the current directory.',
  }),
  offline: Flags.boolean({
    default: false,
    description:
      'Skip asking the registry for a newer version of a template installation.',
  }),
  json: Flags.boolean({
    default: false,
    description: 'Print one JSON result on stdout.',
  }),
};

export interface StatusInput {
  flags: { dir?: string; offline: boolean; json: boolean };
}

/** Bytes used by a directory tree, not following symbolic links. */
export async function directorySize(dir: string): Promise<number> {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(full);
    } else if (entry.isFile()) {
      total += (await lstat(full)).size;
    }
  }
  return total;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
    : `${Math.round(bytes / 1024 ** 2)} MB`;
}

export async function status(
  input: StatusInput,
  deps: CommandDeps,
): Promise<CommandOutcome> {
  const root = path.resolve(deps.cwd ?? process.cwd(), input.flags.dir ?? '.');
  const layout = layoutOf(root);
  const state = await readState(layout);
  const subject = subjectOf(state);
  const template = templateOf(state);
  const env = await readAppEnv(layout);
  const link = await readCurrent(layout);

  const releases = [];
  for (const record of state.releases) {
    const dir = releaseDir(layout, record.id);
    releases.push({
      id: record.id,
      version: record.version,
      current: record.id === state.current,
      builtAt: record.builtAt,
      installedAt: record.installedAt,
      nodeMajor: record.buildTarget.nodeMajor,
      sizeBytes: await directorySize(dir),
    });
  }
  const backups = (
    await readdir(layout.backupsDir).catch(() => [] as string[])
  ).sort();

  const endpoints = endpointsOf(env);
  if (endpoints.port === null) {
    deps.reporter.warn(
      `APP_SERVER_PORT in app.env is "${env.APP_SERVER_PORT ?? ''}", which is not a port number; ${subject} cannot listen on it.`,
    );
  }
  const url = healthUrl(env);
  const healthy = await checkHealth(url, deps.fetchImpl);

  let processInfo: Awaited<ReturnType<typeof deps.pm2.describe>> | null = null;
  try {
    processInfo = (await deps.pm2.describe(state.name)) ?? null;
  } catch {
    deps.reporter.warn('pm2 could not be queried; process state is unknown.');
  }

  if (state.pending) {
    deps.reporter.warn(
      `${state.pending.action === 'upgrade' ? 'An' : 'A'} ${state.pending.action} from ${state.pending.from} to ${state.pending.to}, started ${state.pending.startedAt}, did not finish. Recover with \`${installerCommand(`rollback --dir ${shellQuote(root)}`, { registry: state.registry })}\`: it undoes an interrupted upgrade and finishes an interrupted rollback.`,
    );
  }

  const currentRelease = findRelease(state, state.current);
  const nodeMajor = currentNodeMajor();
  const nodeMatches = currentRelease?.buildTarget.nodeMajor === nodeMajor;
  if (!nodeMatches) {
    const advice = nodeRebuildAdvice(state, root)
      .map((step) =>
        step.run
          ? `${step.message} \`${formatCommandLine(step.run)}\``
          : step.message,
      )
      .join(' ');
    deps.reporter.warn(
      `The current release was built for Node ${currentRelease?.buildTarget.nodeMajor ?? '?'}, but this machine runs Node ${nodeMajor}; it will not load its native modules until a release built for this machine replaces it. ${advice}`,
    );
  }

  let latest: string | null = null;
  if (template && !input.flags.offline) {
    try {
      latest = await resolveTemplateVersion(
        state.registry,
        template.package,
        'latest',
        deps.fetchImpl,
      );
    } catch {
      deps.reporter.warn(
        `Could not ask ${state.registry} for the latest version.`,
      );
    }
  }

  return {
    status: 'success',
    result: {
      directory: root,
      name: state.name,
      appName: state.appName,
      // Where the application is mounted now, as app.env says; installer.json keeps the path it was installed at.
      basePath: mountPathOf(env) || '/',
      source: state.source,
      current: state.current,
      version: currentRelease?.version ?? null,
      builtAt: currentRelease?.builtAt ?? null,
      currentLink: link ?? null,
      dialect: state.dialect,
      registry: state.registry,
      endpoints,
      releases,
      backups,
      health: { url, ok: healthy },
      process: processInfo,
      node: {
        machine: nodeMajor,
        release: currentRelease?.buildTarget.nodeMajor ?? null,
        matches: nodeMatches,
      },
      pending: state.pending ?? null,
      latest,
      updateAvailable:
        latest === null ? null : latest !== currentRelease?.version,
    },
    summary: [
      `${capitalize(subject)} ${state.appName} ${currentRelease?.version ?? '?'} at ${root}`,
      `  Release   ${state.current}${currentRelease ? `, built ${currentRelease.builtAt}` : ''}`,
      `  Source    ${template ? `the ${template.name} template` : 'deployment archives'}`,
      `  URL       ${endpoints.url} (listening on ${endpoints.host}:${endpoints.port ?? `invalid port "${env.APP_SERVER_PORT ?? ''}"`})`,
      `  Health    ${healthy ? 'ok' : 'not answering'} (${url})`,
      `  Process   ${processInfo ? `${processInfo.status}, pid ${processInfo.pid}, ${processInfo.restarts} restarts` : 'not registered with pm2'} (${state.name})`,
      `  Node      machine ${nodeMajor}, release ${currentRelease?.buildTarget.nodeMajor ?? '?'}${nodeMatches ? '' : ' — mismatch'}`,
      ...(latest === null
        ? []
        : [
            `  Latest    ${latest}${latest === currentRelease?.version ? ' (installed)' : ' (update available)'}`,
          ]),
      '  Releases',
      ...releases.map(
        (release) =>
          `    ${release.current ? '*' : ' '} ${release.id}  ${formatSize(release.sizeBytes)}  installed ${release.installedAt}`,
      ),
      ...(backups.length > 0
        ? ['  Backups', ...backups.map((backup) => `    ${backup}`)]
        : []),
    ],
  };
}
