// `<bin> acp start`: connects this computer to the signed-in person's agent sessions and keeps it connected until it
// is stopped; `<bin> acp service install` does the same at every login, in the background (`acp-service.ts`). The
// bridge itself is `@nocobase/acp-bridge`; this command hands it the server, the person's credentials and the file that
// remembers this computer and its key for the profile, and keeps a second bridge for that profile from starting.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, open, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Flags, type Command } from '@oclif/core';

import {
  BridgeStopped,
  BridgeUpgradeRequired,
  runBridge,
} from '@nocobase/acp-bridge';
import { EXIT_CODES } from '@nocobase/agent-protocol';

import {
  acpServiceLoaded,
  acpServicePlan,
  capture,
  installAcpService,
  NETWORK_ENV,
  uninstallAcpService,
  type AcpServicePlan,
} from './acp-service.ts';
import type { AppCliConfig } from './config.ts';
import { currentSession, type Session } from './dynamic/session.ts';
import { detectInstallation } from './install.ts';
import { readUserConfig } from './lib/credentials.ts';
import {
  hasStudioSkill,
  prepareSessionSkill,
  skillsEnvironment,
} from './skills.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import { globalFlags } from './lib/globals.ts';
import {
  updateCli,
  updateEnvironment,
  type CliUpdateResult,
} from './update.ts';

export function acpCommands(app: AppCliConfig): Record<string, Command.Class> {
  const placeFlags = {
    name: Flags.string({
      description:
        "The computer's name in the application; its host name by default.",
    }),
    root: Flags.string({
      description:
        'A directory sessions may work in; repeat for several. Your home directory by default.',
      multiple: true,
    }),
  };

  /** The signed-in person, or a usage error saying to sign in. */
  async function signedIn(): Promise<Session> {
    const session = await currentSession();
    if (session?.kind !== 'user') {
      throw new UsageError(
        session
          ? "An agent's run cannot connect a computer. Run this outside the run's working directory."
          : `Not signed in. Run \`${app.bin} login\` first.`,
        EXIT_CODES.auth,
      );
    }
    return session;
  }

  /**
   * The service for the current profile, starting the CLI as it was started now (`root` is its package's); `hidden`
   * leaves the values of the variables written into it out, for printing.
   */
  function servicePlan(
    root: string,
    home: string,
    flags: { name?: string; root?: string[]; 'pass-env'?: string[] },
    hidden = false,
  ): AcpServicePlan {
    const profile = globalFlags().profile;
    const prefix = app.envPrefix;
    const env = {
      PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
      ...capture(process.env, [
        ...(app.homeEnv ? [app.homeEnv] : []),
        ...(app.keychainEnv ? [app.keychainEnv] : []),
        ...(prefix
          ? [`${prefix}_SERVER`, `${prefix}_API_KEY`, `${prefix}_PROFILE`]
          : []),
        ...NETWORK_ENV,
        ...(flags['pass-env'] ?? []),
      ]),
    };
    return acpServicePlan({
      bin: app.bin,
      command: selfCommand(root),
      args: [
        ...(profile ? ['--profile', profile] : []),
        ...(flags.name ? ['--name', flags.name] : []),
        ...(flags.root ?? []).flatMap((root) => [
          '--root',
          path.resolve(expandHome(root)),
        ]),
      ],
      log: path.join(home, 'acp', 'service.log'),
      env: hidden
        ? Object.fromEntries(Object.keys(env).map((name) => [name, '<hidden>']))
        : env,
      profile,
    });
  }

  return {
    'acp:start': class AcpStart extends AppCommand {
      static override summary = 'Run your agent sessions on this computer.';
      static override description =
        `Connects this computer to ${app.displayName} as the signed-in person, so the sessions you start there run ` +
        'here with the coding agents installed here, in the directories you allow. It stays connected until you stop it ' +
        `with Ctrl+C; stopping it stops the agents it started. To keep it running in the background from every login, ` +
        `run \`${app.bin} acp service install\` instead.`;
      static override examples = [
        `${app.bin} acp start`,
        `${app.bin} acp start --name "Work laptop" --root ~/code`,
      ];
      static override flags = {
        ...placeFlags,
        service: Flags.boolean({
          description:
            'Run as the background service does: stop for good when the application no longer accepts this computer.',
          hidden: true,
        }),
      };

      async run(): Promise<void> {
        const { flags } = await this.parse(AcpStart);
        const session = await signedIn();
        const profile = session.profile;
        if (!profile)
          throw new UsageError(
            `Agent sessions require a signed-in profile. Run \`${app.bin} login\` first.`,
            EXIT_CODES.auth,
          );
        const stateFile = stateFileOf(this.paths.home, session);
        const release = await holdLock(`${stateFile}.lock`, app.bin);
        const stop = new AbortController();
        const onSignal = (): void => stop.abort();
        process.once('SIGINT', onSignal);
        process.once('SIGTERM', onSignal);
        const log = (message: string): void =>
          this.log(flags.service ? `${timestamp()} ${message}` : message);
        try {
          await runBridge({
            prepareSession: async (agentId, sessionId) => {
              if (!hasStudioSkill(app) || !app.envPrefix)
                throw new Error(
                  'This CLI does not ship the nb-studio-cli Skill required by agent sessions. Update the CLI.',
                );
              const user = await readUserConfig({
                paths: this.paths,
                config: app,
                profile,
                profileOnly: true,
              });
              if (!user || user.server !== session.server)
                throw new Error(
                  'The bridge-selected profile is no longer available for this server. Sign in and restart the bridge.',
                );
              await prepareSessionSkill(skillsEnvironment(app), agentId);
              return {
                [`${app.envPrefix}_PROFILE`]: profile,
                [`${app.envPrefix}_AGENT_SESSION`]: sessionId,
              };
            },
            server: session.server,
            headers: session.headers,
            client: { name: app.bin, version: this.config.version },
            stateFile,
            ...(flags.name ? { name: flags.name } : {}),
            ...(flags.root
              ? {
                  roots: flags.root.map((root) =>
                    path.resolve(expandHome(root)),
                  ),
                }
              : {}),
            reconnect: !flags.service,
            signal: stop.signal,
            log,
          });
          this.log('Disconnected.');
        } catch (error) {
          if (error instanceof BridgeUpgradeRequired) {
            log(error.message);
            const environment = updateEnvironment(app);
            const outcome = await updateRefusedBridge({
              bin: app.bin,
              refusal: error,
              update:
                environment && (() => updateCli(session, environment, { log })),
            });
            // Never 0: the service manager starts the bridge again, on the new version or to try again.
            if (outcome.updated)
              throw new UsageError(
                flags.service
                  ? `Updated ${app.bin} to ${outcome.version}; the service starts the bridge again on it.`
                  : `Updated ${app.bin} to ${outcome.version}; run \`${app.bin} acp start\` again.`,
                EXIT_CODES.general,
              );
            if (flags.service) await pause(UPGRADE_RETRY_MS, stop.signal);
            throw new UsageError(outcome.reason, EXIT_CODES.general);
          }
          if (!(error instanceof BridgeStopped)) throw error;
          // The service stops for good, exiting 0, rather than being started again to be refused again.
          if (flags.service) {
            this.log(`${timestamp()} ${error.message}`);
            return;
          }
          throw new UsageError(error.message, EXIT_CODES.auth);
        } finally {
          process.off('SIGINT', onSignal);
          process.off('SIGTERM', onSignal);
          await release();
        }
      }
    },

    'acp:service:install': class AcpServiceInstall extends AppCommand {
      static override summary =
        'Keep this computer connected in the background, from every login.';
      static override description =
        `Installs \`${app.bin} acp start\` as a service of your user: a launchd agent on macOS, a systemd user unit on ` +
        'Linux, a script in the Startup folder on Windows. It starts now and at every login, and again when it fails. ' +
        "A service does not read your shell configuration, so this shell's PATH (where the agents are found), proxy and " +
        'CA variables and the --pass-env names are written into it with their values now; install again after ' +
        'changing one, or after installing an agent somewhere new.';
      static override supportsDryRun = true;
      static override examples = [
        `${app.bin} acp service install`,
        `${app.bin} acp service install --root ~/code --pass-env ANTHROPIC_API_KEY`,
      ];
      static override flags = {
        ...placeFlags,
        'pass-env': Flags.string({
          description:
            'An environment variable the agents need, such as an API key kept in your shell; repeat for several.',
          multiple: true,
        }),
      };

      async run(): Promise<{ file: string; installed: boolean }> {
        const { flags } = await this.parse(AcpServiceInstall);
        const session = await signedIn();
        const plan = servicePlan(this.config.root, this.paths.home, flags);
        if (this.dryRun) {
          this.log(`# ${plan.file}`);
          this.log(
            servicePlan(this.config.root, this.paths.home, flags, true).content,
          );
          return { file: plan.file, installed: false };
        }
        const lock = `${stateFileOf(this.paths.home, session)}.lock`;
        const running = await lockHolder(lock);
        if (running !== undefined && !(await acpServiceLoaded(plan)))
          throw new UsageError(
            `This computer is already connected by \`${app.bin} acp start\` (process ${running}). Stop it first, then install the service.`,
          );
        if (plan.platform === 'startup') await stopHolder(lock);
        await installAcpService(plan);
        this.log(
          `Installed ${plan.file}: this computer stays connected from every login.`,
        );
        if (plan.platform === 'systemd')
          this.log(
            'A user service stops when you log out; to keep it running then, run `loginctl enable-linger`.',
          );
        this.log(
          `See how it runs with \`${app.bin} acp service status\`; stop it with \`${app.bin} acp service uninstall\`.`,
        );
        return { file: plan.file, installed: true };
      }
    },

    'acp:service:uninstall': class AcpServiceUninstall extends AppCommand {
      static override summary =
        'Stop keeping this computer connected in the background.';
      static override description =
        'Stops the service `acp service install` installed and removes it. The computer stays in the application, offline, until you remove it there or connect it again.';

      async run(): Promise<{ file: string }> {
        const plan = servicePlan(this.config.root, this.paths.home, {});
        await uninstallAcpService(plan);
        const session = await currentSession();
        // On Windows the file only starts the bridge; the bridge running now is stopped here.
        if (plan.platform === 'startup' && session?.kind === 'user')
          await stopHolder(`${stateFileOf(this.paths.home, session)}.lock`);
        this.log(`Removed ${plan.file}.`);
        return { file: plan.file };
      }
    },

    'acp:service:status': class AcpServiceStatus extends AppCommand {
      static override summary =
        'Show whether this computer is connected in the background.';

      async run(): Promise<{
        installed: boolean;
        running: boolean;
        file: string;
        log: string;
      }> {
        const plan = servicePlan(this.config.root, this.paths.home, {});
        const session = await currentSession();
        const installed = existsSync(plan.file);
        const holder =
          session?.kind === 'user'
            ? await lockHolder(`${stateFileOf(this.paths.home, session)}.lock`)
            : undefined;
        const loaded = installed ? await acpServiceLoaded(plan) : false;
        const log = path.join(this.paths.home, 'acp', 'service.log');
        this.log(
          installed
            ? `Installed: ${plan.file}${loaded === false ? ' (not loaded)' : ''}`
            : `Not installed. Install it with \`${app.bin} acp service install\`.`,
        );
        this.log(
          holder === undefined
            ? 'Not connected now.'
            : `Connected now (process ${holder}).`,
        );
        if (plan.platform === 'systemd')
          this.log(`Its output: journalctl --user -u ${plan.label}`);
        else this.log(`Its output: ${log}`);
        return {
          installed,
          running: holder !== undefined,
          file: plan.file,
          log,
        };
      }
    },
  };
}

/**
 * How long the service waits, after the application refused its bridge and no update helped, before exiting for its
 * service manager to start it again: it tries again then, without asking every few seconds.
 */
export const UPGRADE_RETRY_MS: number = 5 * 60_000;

/** What updating a refused bridge came to: the version it now is, or why it is not updated. */
export type BridgeUpdateOutcome =
  | { readonly updated: true; readonly version: string }
  | { readonly updated: false; readonly reason: string };

/**
 * After the application refused the bridge's protocol: updates the CLI as `<bin> update` does (`update`; undefined
 * when this CLI does not update itself) when the bridge is the older side, and says why not otherwise.
 */
export async function updateRefusedBridge(options: {
  readonly bin: string;
  readonly refusal: BridgeUpgradeRequired;
  readonly update: (() => Promise<CliUpdateResult>) | undefined;
}): Promise<BridgeUpdateOutcome> {
  const { bin, refusal, update } = options;
  const needs =
    refusal.protocol === undefined
      ? ''
      : `, the application ${refusal.protocol}`;
  if (!refusal.bridgeIsOlder)
    return {
      updated: false,
      reason: `This ${bin} speaks bridge protocol ${refusal.bridgeProtocol}, newer than the application (${refusal.protocol}): the application has to be updated.`,
    };
  if (update === undefined)
    return {
      updated: false,
      reason: `This ${bin} does not update itself; update it the way it was installed (bridge protocol ${refusal.bridgeProtocol}${needs}).`,
    };
  try {
    const result = await update();
    if (result.updated) return { updated: true, version: result.latest };
    return {
      updated: false,
      reason: `${bin} ${result.current} is the newest the application serves, and it speaks bridge protocol ${refusal.bridgeProtocol}${needs}. Install the ${bin} the application expects.`,
    };
  } catch (error) {
    return {
      updated: false,
      reason: `Could not update ${bin}: ${error instanceof Error ? error.message : String(error)} Run \`${bin} update\`.`,
    };
  }
}

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}

/** Where the bridge remembers this computer and its key, for the profile and server. */
function stateFileOf(home: string, session: Session): string {
  return path.join(
    home,
    'acp',
    `${createHash('sha256').update(session.cacheKey).update(session.server).digest('hex').slice(0, 16)}.json`,
  );
}

/**
 * Makes this process the one running the bridge for the state file `lock` stands beside, or refuses when another
 * running process is; answers what lets go of it.
 */
async function holdLock(
  lock: string,
  bin: string,
): Promise<() => Promise<void>> {
  await mkdir(path.dirname(lock), { recursive: true, mode: 0o700 });
  for (;;) {
    try {
      const handle = await open(lock, 'wx', 0o600);
      await handle.writeFile(String(process.pid));
      await handle.close();
      return () => rm(lock, { force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const holder = await lockHolder(lock);
    if (holder !== undefined)
      throw new UsageError(
        `This computer is already connected (process ${holder}), in a terminal or by the background service (\`${bin} acp service status\`).`,
      );
    // Left behind by a bridge that did not stop cleanly.
    await rm(lock, { force: true });
  }
}

/** The running process holding `lock`, if any. */
async function lockHolder(lock: string): Promise<number | undefined> {
  const pid = Number(await readFile(lock, 'utf8').catch(() => ''));
  if (!Number.isInteger(pid) || pid <= 0) return undefined;
  try {
    process.kill(pid, 0);
    return pid;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM' ? pid : undefined;
  }
}

/** Stops the bridge holding `lock`, with what it started. */
async function stopHolder(lock: string): Promise<void> {
  const pid = await lockHolder(lock);
  if (pid === undefined) return;
  if (process.platform === 'win32') {
    const { execFile } = await import('node:child_process');
    await new Promise<void>((resolve) => {
      execFile(
        'taskkill',
        ['/pid', String(pid), '/T', '/F'],
        { windowsHide: true },
        () => resolve(),
      );
    });
  } else process.kill(pid, 'SIGTERM');
}

/**
 * How a service starts this CLI: this Node and this entry, through `<prefix>/current` when the CLI was installed by
 * the application's install script, so that the service runs whichever version an update made current.
 */
function selfCommand(root: string): string[] {
  const installation = detectInstallation(root);
  const throughCurrent = (file: string): string =>
    installation && file.startsWith(installation.versionDir)
      ? path.join(
          installation.current,
          file.slice(installation.versionDir.length),
        )
      : file;
  return [
    throughCurrent(process.execPath),
    ...process.execArgv,
    throughCurrent(process.argv[1] ?? ''),
  ];
}

function timestamp(): string {
  return new Date().toISOString();
}

function expandHome(dir: string): string {
  return dir === '~' || dir.startsWith('~/') || dir.startsWith('~\\')
    ? path.join(os.homedir(), dir.slice(1))
    : dir;
}
