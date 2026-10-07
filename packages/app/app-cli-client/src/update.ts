// `<bin> update`, and the hint that a newer CLI is served, for a CLI whose configuration names `selfUpdate`.
//
// A CLI installed alone by the install script (`install.json` says `mode: cli`) updates itself from the server the
// person is signed in to, with their key: it resolves the newest version the server serves for this platform, downloads
// it, checks its SHA-256, unpacks it beside the running version and switches `current`, keeping the previous version
// for a rollback (`install.ts`). An installation the script made for a runner (`mode: runner`) is the runner's, which
// updates itself.
//
// The hint asks at most every `HINT_INTERVAL_MS` per server and remembers the answer in `<state dir>/cache/update.json`,
// so a command waits for the network at most once in that time, and never longer than `HINT_TIMEOUT_MS`.
import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Flags, type Command } from '@oclif/core';

import {
  currentTarget,
  EXIT_CODES,
  type DistArtifact,
} from '@nocobase/agent-protocol';

import { appCliHome, type AppCliConfig, type AppCliSession } from './config.ts';
import { currentSession } from './dynamic/session.ts';
import {
  applyUpdate,
  detectInstallation,
  isNewer,
  latestArtifact,
  type Installation,
} from './install.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import { ApiClient } from './lib/http.ts';
/** How often the hint asks the server. */
export const HINT_INTERVAL_MS: number = 12 * 60 * 60_000;
/** How long the hint waits for the server. */
export const HINT_TIMEOUT_MS: number = 3000;

/** Who updates this installation: `<bin> update` (`cli`), the runner (`runner`), or nobody (`none`). */
export type UpdatedBy = 'cli' | 'runner' | 'none';

export interface UpdateEnvironment {
  /** The command name, such as `acme`. */
  readonly bin: string;
  /** The product the application serves the CLI as; `bin` by default. */
  readonly product?: string;
  /** The running version. */
  readonly running: string;
  readonly installation?: Installation | undefined;
  readonly target?: string;
  /** Where the hint remembers what it found; `<state dir>/cache/update.json` by default. */
  readonly cacheFile?: string;
  readonly now?: () => number;
  readonly fetch?: typeof fetch;
}

/** Who updates the installation `environment` describes. */
export function updatedBy(environment: UpdateEnvironment): UpdatedBy {
  const { installation } = environment;
  if (installation === undefined) return 'none';
  return installation.mode === 'runner' ? 'runner' : 'cli';
}

function clientOf(
  session: AppCliSession,
  environment: UpdateEnvironment,
  timeoutMs?: number,
): ApiClient {
  return new ApiClient({
    server: session.server,
    headers: { ...session.headers },
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(environment.fetch === undefined ? {} : { fetch: environment.fetch }),
  });
}

interface HintCache {
  readonly server: string;
  readonly checkedAt: number;
  readonly latest: string | null;
}

async function readCache(file: string): Promise<HintCache | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as HintCache;
  } catch {
    return undefined;
  }
}

async function writeCache(file: string, value: HintCache): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporary, file);
}

function cacheFileOf(environment: UpdateEnvironment): string {
  return (
    environment.cacheFile ?? path.join(appCliHome(), 'cache', 'update.json')
  );
}

/** The hint line when the server serves a newer CLI for a CLI installed alone; undefined otherwise. */
export async function updateHint(
  session: AppCliSession,
  environment: UpdateEnvironment,
): Promise<string | undefined> {
  if (updatedBy(environment) !== 'cli') return undefined;
  const now = (environment.now ?? Date.now)();
  const cacheFile = cacheFileOf(environment);
  const cached = await readCache(cacheFile);
  let latest: string | null;
  if (
    cached?.server === session.server &&
    now - cached.checkedAt < HINT_INTERVAL_MS
  )
    latest = cached.latest;
  else {
    try {
      latest = (
        await latestArtifact(
          clientOf(session, environment, HINT_TIMEOUT_MS),
          environment.product ?? environment.bin,
          environment.target ?? currentTarget(),
        )
      ).version;
    } catch {
      latest = null;
    }
    await writeCache(cacheFile, {
      server: session.server,
      checkedAt: now,
      latest,
    }).catch(() => undefined);
  }
  return latest !== null && isNewer(latest, environment.running)
    ? `A newer ${environment.bin} (${latest}) is available; run \`${environment.bin} update\`.`
    : undefined;
}

/** What `<bin> update` answers. */
export interface CliUpdateResult {
  readonly current: string;
  readonly latest: string;
  readonly updated: boolean;
  /** The version it replaced, kept beside the new one for a rollback. */
  readonly previous?: string;
}

/** Updates a CLI installed alone to the newest version the session's server serves for this platform. */
export async function updateCli(
  session: AppCliSession,
  environment: UpdateEnvironment,
  options: { readonly check?: boolean; readonly log?: (line: string) => void },
): Promise<CliUpdateResult> {
  const { bin } = environment;
  const by = updatedBy(environment);
  if (by === 'none')
    throw new UsageError(
      `This ${bin} was not installed by the install script, so it cannot replace itself. Install it again with the ` +
        'install command, or update it the way it was installed.',
    );
  if (by === 'runner')
    throw new UsageError(
      `This ${bin} was installed for a runner, which keeps it up to date itself.`,
    );
  const client = clientOf(session, environment);
  const latest: DistArtifact = await latestArtifact(
    client,
    environment.product ?? bin,
    environment.target ?? currentTarget(),
  );
  const result = {
    current: environment.running,
    latest: latest.version,
    updated: false,
  };
  if (!isNewer(latest.version, environment.running)) {
    options.log?.(
      `${bin} ${environment.running} is up to date (${session.server} serves ${latest.version}).`,
    );
    return result;
  }
  if (options.check) {
    options.log?.(
      `${bin} ${latest.version} is available (this is ${environment.running}). Run \`${bin} update\`.`,
    );
    return result;
  }
  const installation = environment.installation!;
  const { previous } = await applyUpdate({
    installation,
    bin,
    client,
    update: {
      version: latest.version,
      url: latest.url,
      sha256: latest.sha256,
    },
  });
  options.log?.(
    `Updated ${bin} ${environment.running} → ${latest.version}; ${previous ?? 'the previous version'} stays in ` +
      `${path.join(installation.prefix, 'versions')}.`,
  );
  return {
    ...result,
    updated: true,
    ...(previous === undefined ? {} : { previous }),
  };
}

// src/update.ts and dist/update.js both sit one level below the package root.
const OWN_VERSION: string = (
  JSON.parse(
    readFileSync(
      path.resolve(import.meta.dirname, '..', 'package.json'),
      'utf8',
    ),
  ) as { version: string }
).version;

/** The environment of the running CLI `config` describes; undefined when it does not update itself. */
export function updateEnvironment(
  config: AppCliConfig,
): UpdateEnvironment | undefined {
  const own = config.selfUpdate;
  if (own === undefined) return undefined;
  return {
    bin: config.bin,
    running: config.version ?? OWN_VERSION,
    installation: detectInstallation(own.packageRoot),
    ...(own.product === undefined ? {} : { product: own.product }),
  };
}

/** `<bin> update`, for a CLI whose configuration names `selfUpdate`. */
export function updateCommand(app: AppCliConfig): Command.Class {
  return class Update extends AppCommand {
    static override summary = `Update ${app.bin} to the newest version the server serves.`;
    static override description =
      `Asks the server you are signed in to for the newest ${app.bin} it serves for this platform, downloads it, ` +
      `checks its SHA-256 and switches to it, keeping the previous version beside it. For ${app.bin} installed alone ` +
      'by the install script.';
    static override examples = [
      '<%= config.bin %> update',
      '<%= config.bin %> update --check',
    ];
    static override flags = {
      check: Flags.boolean({
        description: 'Only say whether a newer version is served.',
      }),
    };

    async run(): Promise<CliUpdateResult> {
      const { flags } = await this.parse(Update);
      const environment = updateEnvironment(app);
      if (environment === undefined)
        throw new UsageError(`${app.bin} does not update itself.`);
      const session = await currentSession();
      if (session === undefined)
        throw new UsageError(
          `Sign in first: \`${app.bin} login --server <url>\`.`,
          EXIT_CODES.auth,
        );
      if (session.kind === 'run')
        throw new UsageError(
          `This ${app.bin} belongs to an agent's run; the runner keeps it up to date.`,
        );
      return updateCli(session, environment, {
        check: flags.check === true,
        log: (line) => this.log(line),
      });
    }
  };
}
