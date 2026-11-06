/**
 * The coding agents a bridge starts over ACP, and how it finds them on this computer. A person signs in to an agent
 * with its own command line, so the bridge offers the agents installed here: the agent's program run in its ACP mode,
 * or the ACP adapter for it. Sessions run with the agent's full access, as they would in its own terminal: the person
 * is the one asking, on their own computer. An agent offering a mode for that opens in it (`modes`); one offering
 * none has what it asks permission for allowed by the bridge (`allowAll`).
 *
 * The adapters for Codex and Claude Code are managed by the bridge: installed from npm once for each version pinned
 * here (`./managed-adapters.ts`) and run with the Node.js running the bridge against the agent installed here, so a
 * session does not depend on npx. An adapter installed on PATH always takes precedence.
 */
import { execFile } from 'node:child_process';
import { stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  adapterDir,
  installAdapter,
  installedAdapter,
  type AdapterPackage,
} from './managed-adapters.js';
import { findProgram } from './programs.js';
import { startupDetail } from './startup-detail.js';

export { findProgram, variable } from './programs.js';

import type { AgentLauncher, AgentSpec } from './catalog.js';
export { AGENTS } from './catalog.js';
export type { AgentLauncher, AgentSpec } from './catalog.js';

export interface ResolvedAgent {
  readonly spec: AgentSpec;
  /** The absolute path of the program to run. */
  readonly command: string;
  readonly args: readonly string[];
  /** Environment this launcher adds, over the agent's own. */
  readonly env?: Readonly<Record<string, string>>;
  /** The launcher is an adapter the bridge manages (`AgentLauncher.managed`). */
  readonly managed?: boolean;
}

export interface ResolveOptions {
  /**
   * The directory the managed adapters are installed in, one directory for each package and version. Without it no
   * adapter is installed or run that way.
   */
  readonly adapters?: string;
  /**
   * False starts installation in the background and reports that it is in progress, so the initial connection does
   * not wait for npm. Other values await the installation (bounded by its timeout).
   */
  readonly waitForInstall?: boolean | number;
  /** The Node.js that runs a managed adapter: the one running the bridge by default. */
  readonly node?: string;
  /** Told about installing a managed adapter, and why one is passed over for an agent it cannot drive. */
  readonly log?: (message: string) => void;
  /** Reports a managed installation before waiting for it, so other agents can be offered meanwhile. */
  readonly installing?: (detail: string) => void;
  /** Stops an installation started by this resolution when the bridge shuts down. */
  readonly signal?: AbortSignal;
}

/** How to start `spec` here, or undefined when none of its launchers can run. */
export async function resolveAgent(
  spec: AgentSpec,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  options: ResolveOptions = {},
): Promise<ResolvedAgent | undefined> {
  for (const launcher of ordered(spec.launchers)) {
    const requires = launcher.requires
      ? await findProgram(launcher.requires, [], env, platform)
      : undefined;
    if (launcher.requires && !requires) continue;
    if (launcher.managed) {
      const resolved = await resolveManaged(
        spec,
        launcher.command,
        launcher.managed,
        requires!,
        env,
        platform,
        options,
      );
      if (resolved) return resolved;
      continue;
    }
    const command = await findProgram(
      launcher.command,
      (launcher.dirs ?? []).map((dir) =>
        dir.startsWith('~/')
          ? path.join(env.HOME ?? env.USERPROFILE ?? os.homedir(), dir.slice(2))
          : dir,
      ),
      env,
      platform,
    );
    if (command) return { spec, command, args: launcher.args };
  }
  return undefined;
}

/** An existing adapter always comes before a managed installation. */
function ordered(
  launchers: readonly AgentLauncher[],
): readonly AgentLauncher[] {
  const rank = (launcher: AgentLauncher): number =>
    launcher.managed ? 1 : launcher.requires ? 2 : 0;
  return [...launchers].sort((a, b) => rank(a) - rank(b));
}

async function resolveManaged(
  spec: AgentSpec,
  bin: string,
  managed: NonNullable<AgentLauncher['managed']>,
  agent: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  options: ResolveOptions,
): Promise<ResolvedAgent | undefined> {
  if (options.adapters === undefined) return undefined;
  const batch = platform === 'win32' && BATCH_FILE.test(agent);
  if (batch && !managed.batchFiles)
    throw new Error(
      startupDetail(
        agent,
        [],
        `${spec.name}'s managed ACP adapter cannot start the batch file ${agent}. Install a native agent executable or an ACP adapter on PATH.`,
      ),
    );
  const version = await agentVersion(agent, batch);
  if (!version || compareVersions(version, managed.minVersion) < 0) {
    throw new Error(
      startupDetail(
        agent,
        ['--version'],
        `${spec.name} at ${agent} ${version ? `is version ${version}` : 'did not report its version'}; the ACP adapter ${managed.package}@${managed.version} needs ${managed.minVersion} or newer. Update the agent or install an ACP adapter on PATH.`,
      ),
    );
  }
  const pkg: AdapterPackage = {
    name: managed.package,
    version: managed.version,
    bin,
  };
  let file = await installedAdapter(adapterDir(options.adapters, pkg), pkg);
  if (!file) {
    options.installing?.(
      startupDetail(
        'npm',
        [
          'install',
          '--prefix',
          adapterDir(options.adapters, pkg),
          `${pkg.name}@${pkg.version}`,
        ],
        'ACP adapter installation is in progress. The bridge will check again automatically.',
      ),
    );
    const install = installAdapter(pkg, {
      dir: options.adapters,
      env,
      platform,
      log: options.log,
      signal: options.signal,
    });
    if (options.waitForInstall === false) {
      void install.catch(() => undefined);
      throw new Error(
        startupDetail(
          'npm',
          [
            'install',
            '--prefix',
            adapterDir(options.adapters, pkg),
            `${pkg.name}@${pkg.version}`,
          ],
          'ACP adapter installation is in progress. The bridge will check again automatically.',
        ),
      );
    }
    file = await install;
  }
  return {
    spec,
    command: options.node ?? process.execPath,
    args: [file],
    env: { [managed.variable]: agent },
    managed: true,
  };
}

const BATCH_FILE = /\.(?:cmd|bat)$/iu;
const VERSION_TIMEOUT_MS = 10_000;
/** Versions already read, by program, while the program is unchanged; one that could not be read is asked again. */
const versions = new Map<
  string,
  { readonly modified: number; readonly version: Promise<string | undefined> }
>();

/**
 * The version the program at `file` prints for `--version`, or undefined when it prints none. A Windows batch file
 * (`batch`) runs only through cmd.exe.
 */
async function agentVersion(
  file: string,
  batch = false,
): Promise<string | undefined> {
  let modified: number;
  try {
    modified = (await stat(file)).mtimeMs;
  } catch {
    return undefined;
  }
  const known = versions.get(file);
  if (known?.modified === modified) return known.version;
  const version = new Promise<string | undefined>((resolve) => {
    execFile(
      batch ? `"${file}"` : file,
      ['--version'],
      { timeout: VERSION_TIMEOUT_MS, windowsHide: true, shell: batch },
      (error, stdout) =>
        resolve(error ? undefined : /\d+\.\d+\.\d+/u.exec(String(stdout))?.[0]),
    );
  });
  versions.set(file, { modified, version });
  void version.then((read) => {
    if (read === undefined && versions.get(file)?.version === version)
      versions.delete(file);
  });
  return version;
}

/** Compares two `major.minor.patch` versions. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
