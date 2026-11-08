// Runs the daemon as a per-user service: a launchd agent on macOS, a systemd user unit on Linux. The service runs
// `nocobase-runner service run` through the current launcher and restarts after every exit unless explicitly stopped.
// The launcher owns daemon log rotation. Each plan
// lists the file it writes and the commands it runs, so `--dry-run` can show them. The service gets the installing
// shell's PATH, proxy and CA variables and `--pass-env` names (`serviceEnvironment`), and its file is readable by its
// owner only. Installing again replaces the service in place. A label other than the default lets a second runner (a
// test, or another state directory) run beside the first.
import { execFile } from 'node:child_process';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { CA_ENV, forbidden, PROXY_ENV } from '../agent/env.ts';
import type { RunnerPaths } from '../lib/home.ts';

const run = promisify(execFile);

export const LAUNCHD_LABEL = 'com.nocobase.runner';
export const SYSTEMD_UNIT = 'nocobase-runner.service';

/** Set in the service's environment: the daemon is supervised, so it may exit to restart on an update. */
export const SERVICE_ENV = 'NOCOBASE_RUNNER_SERVICE';

export const SERVICE_LABEL_PATTERN: RegExp =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

/** The systemd unit for `label`: `nocobase-runner.service` for the default label. */
export function systemdUnit(label: string = LAUNCHD_LABEL): string {
  return label === LAUNCHD_LABEL ? SYSTEMD_UNIT : `${label}.service`;
}

/** The leading underscore cannot collide with a valid custom runner service label. */
function reloadLabel(label: string): string {
  return `_nocobase-runner.reload.${label}`;
}

function serviceFile(
  label: string,
  platform: NodeJS.Platform,
  home: string,
): string {
  if (!SERVICE_LABEL_PATTERN.test(label))
    throw new Error(`Not a service label: ${label}`);
  if (platform === 'darwin')
    return path.join(home, 'Library', 'LaunchAgents', `${label}.plist`);
  if (platform === 'linux')
    return path.join(home, '.config', 'systemd', 'user', systemdUnit(label));
  throw new Error(
    `Running the runner as a service is not supported on ${platform}.`,
  );
}

export interface ServicePlan {
  platform: 'launchd' | 'systemd';
  label: string;
  file: string;
  content: string;
  /** The variables written into the service from the installing environment, by name (`serviceEnvironment`). */
  captured: string[];
  install: string[][];
  uninstall: string[][];
}

function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function systemdQuote(value: string): string {
  return /[\s'"\\\p{Cc}]/u.test(value)
    ? `"${value.replace(/[\\"\p{Cc}]/gu, (character) => {
        if (character === '\\' || character === '"') return `\\${character}`;
        const code = character.charCodeAt(0);
        return code < 128
          ? `\\x${code.toString(16).padStart(2, '0')}`
          : `\\u${code.toString(16).padStart(4, '0')}`;
      })}"`
    : value;
}

/** An `Environment=` assignment: quoted, with `%` doubled so systemd expands no specifier in it. */
function systemdEnvironment(key: string, value: string): string {
  return `Environment=${systemdQuote(`${key}=${value}`.replace(/%/g, '%%'))}`;
}

/**
 * What the service takes from the environment it is installed from, beside `PATH`: a service starts without the
 * installing shell's variables, so the proxy and CA variables (`PROXY_ENV`, `CA_ENV`) and the names its owner passes
 * (`--pass-env`) are written into it with their values now. Changing one later means installing the service again.
 */
export function serviceEnvironment(
  env: NodeJS.ProcessEnv,
  passEnv: readonly string[] = [],
): Record<string, string> {
  const captured: Record<string, string> = {};
  for (const name of [...PROXY_ENV, ...CA_ENV, ...passEnv]) {
    const value = env[name];
    if (value?.includes('\0'))
      throw new Error(
        `Cannot write ${name} to a service: environment values cannot contain NUL.`,
      );
    if (value !== undefined && value !== '' && !forbidden(name))
      captured[name] = value;
  }
  return captured;
}

export interface ServiceOptions {
  paths: RunnerPaths;
  /** The program and arguments that start the CLI, such as [node, bin/run.js]. */
  command: string[];
  platform?: NodeJS.Platform;
  home?: string;
  uid?: number;
  env?: NodeJS.ProcessEnv;
  /** `com.nocobase.runner` by default. */
  label?: string;
  /** The names the runner's owner passes (`--pass-env`), written into the service with their values in `env`. */
  passEnv?: readonly string[];
}

export function servicePlan(options: ServiceOptions): ServicePlan {
  const platform = options.platform ?? process.platform;
  const home = options.home ?? os.homedir();
  const args = [...options.command, 'service', 'run'];
  const env = options.env ?? process.env;
  const label = options.label ?? LAUNCHD_LABEL;
  if (!SERVICE_LABEL_PATTERN.test(label))
    throw new Error(`Not a service label: ${label}`);
  const captured = serviceEnvironment(env, options.passEnv);
  const environment: Record<string, string> = {
    ...captured,
    PATH: env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    NOCOBASE_RUNNER_HOME: options.paths.home,
    NOCOBASE_RUNNER_WORK_ROOT: options.paths.workRoot,
    [SERVICE_ENV]: '1',
  };
  if (platform === 'darwin') {
    const file = serviceFile(label, platform, home);
    const uid = options.uid ?? process.getuid?.() ?? 501;
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${xml(label)}</string>
  <key>ProgramArguments</key>
  <array>
${args.map((arg) => `    <string>${xml(arg)}</string>`).join('\n')}
  </array>
  <key>EnvironmentVariables</key>
  <dict>
${Object.entries(environment)
  .map(
    ([key, value]) =>
      `    <key>${xml(key)}</key>\n    <string>${xml(value)}</string>`,
  )
  .join('\n')}
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>60</integer>
  <key>StandardOutPath</key>
  <string>/dev/null</string>
  <key>StandardErrorPath</key>
  <string>/dev/null</string>
</dict>
</plist>
`;
    const domain = `gui/${uid}`;
    return {
      platform: 'launchd',
      label,
      file,
      content,
      captured: Object.keys(captured),
      install: [['launchctl', 'bootstrap', domain, file]],
      uninstall: [
        ['launchctl', 'bootout', `${domain}/${reloadLabel(label)}`],
        ['launchctl', 'bootout', `${domain}/${label}`],
      ],
    };
  }
  if (platform === 'linux') {
    const unit = systemdUnit(label);
    const file = serviceFile(label, platform, home);
    const content = `[Unit]
Description=NocoBase runner
After=network-online.target
StartLimitIntervalSec=0

[Service]
ExecStart=${args.map(systemdQuote).join(' ')}
${Object.entries(environment)
  .map(([key, value]) => systemdEnvironment(key, value))
  .join('\n')}
Restart=always
RestartSec=60
StandardOutput=null
StandardError=journal
KillMode=mixed

[Install]
WantedBy=default.target
`;
    return {
      platform: 'systemd',
      label,
      file,
      content,
      captured: Object.keys(captured),
      install: [
        ['systemctl', '--user', 'daemon-reload'],
        ['systemctl', '--user', 'enable', unit],
        ['systemctl', '--user', 'restart', unit],
      ],
      uninstall: [
        ['systemctl', '--user', 'disable', '--now', unit],
        ['systemctl', '--user', 'daemon-reload'],
      ],
    };
  }
  throw new Error(
    `Running the runner as a service is not supported on ${platform}.`,
  );
}

/** Writes the service and (re)starts it: a service already installed under the label is stopped first. */
export async function installService(
  plan: ServicePlan,
  paths: RunnerPaths,
): Promise<void> {
  if (plan.platform === 'launchd')
    for (const [command = '', ...args] of plan.uninstall)
      await run(command, args).catch(() => undefined);
  await mkdir(path.dirname(plan.file), { recursive: true });
  await mkdir(path.dirname(paths.daemonLog), { recursive: true, mode: 0o700 });
  // Only its owner reads it: the variables written into it may hold a proxy's password or a key.
  await writeFile(plan.file, plan.content, { mode: 0o600 });
  await chmod(plan.file, 0o600);
  await loadService(plan.platform, plan.install);
}

async function loadService(
  platform: ServicePlan['platform'],
  commands: string[][],
): Promise<void> {
  for (const [command = '', ...args] of commands) {
    // launchd may still be removing the previous instance right after `bootout`; try again for a few seconds.
    for (let attempt = 1; ; attempt += 1) {
      try {
        await run(command, args);
        break;
      } catch (error) {
        if (platform !== 'launchd' || attempt >= 10) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}

export async function uninstallService(plan: ServicePlan): Promise<void> {
  for (const [command = '', ...args] of plan.uninstall) {
    // Not loaded is fine: the goal is that it is not.
    await run(command, args).catch(() => undefined);
  }
  await rm(plan.file, { force: true });
}

/** Upgrade only restart policy, retaining the installed command, paths and captured environment. */
export async function migrateService(
  label: string,
  options: {
    platform?: NodeJS.Platform;
    home?: string;
    /** On launchd, submit an independent reload job so bootout cannot kill its own replacement. */
    relaunch?: string[];
  } = {},
): Promise<boolean> {
  const platform = options.platform ?? process.platform;
  const file = serviceFile(label, platform, options.home ?? os.homedir());
  let previous: string;
  try {
    previous = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
  const content =
    platform === 'darwin'
      ? previous.replace(
          /<key>KeepAlive<\/key>\s*(?:<dict>[\s\S]*?<\/dict>|<(?:true|false)\s*\/>)/u,
          '<key>KeepAlive</key>\n  <true/>',
        )
      : previous
          .replace(/^Restart=.*$/mu, 'Restart=always')
          .replace(/^RestartPreventExitStatus=.*\n?/gmu, '')
          .replace(/^StartLimitIntervalSec=.*$/mu, 'StartLimitIntervalSec=0')
          .replace(/^StartLimitBurst=.*\n?/gmu, '');
  if (content === previous) return false;
  await writeFile(file, content, { mode: 0o600 });
  await chmod(file, 0o600);
  try {
    if (platform === 'linux')
      await run('systemctl', ['--user', 'daemon-reload']);
    else if (options.relaunch !== undefined)
      await run('launchctl', [
        'submit',
        '-l',
        reloadLabel(label),
        '--',
        ...options.relaunch,
        'service',
        'restart',
        '--label',
        label,
      ]);
  } catch (error) {
    // Retry migration on the next start if the manager could not load the new policy.
    await writeFile(file, previous, { mode: 0o600 });
    throw error;
  }
  return true;
}

/** Stop through the manager so its always-restart policy knows this stop is intentional. */
export async function stopService(
  label: string,
  platform: NodeJS.Platform = process.platform,
  home: string = os.homedir(),
): Promise<boolean> {
  const file = serviceFile(label, platform, home);
  if (platform === 'linux') {
    try {
      await run('systemctl', ['--user', 'stop', systemdUnit(label)]);
      return true;
    } catch (error) {
      // A remembered label can outlive service uninstall; a manually started daemon still needs stopping.
      if ((error as { code?: number }).code === 5) return false;
      throw error;
    }
  } else {
    await stopLaunchd(reloadLabel(label));
    const content = await readFile(file, 'utf8').catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return '';
        throw error;
      },
    );
    if (
      /<key>KeepAlive<\/key>\s*<dict>\s*<key>SuccessfulExit<\/key>\s*<false\s*\/>\s*<\/dict>/u.test(
        content,
      )
    ) {
      // An older updater invokes the new binary's stop, then kickstarts the still-loaded job. Its old policy
      // already keeps a clean stop stopped; the new launcher migrates and reloads the plist when kickstarted.
      return stopLaunchd(label, 'kill');
    } else return stopLaunchd(label);
  }
}

async function stopLaunchd(
  label: string,
  action: 'kill' | 'bootout' = 'bootout',
): Promise<boolean> {
  try {
    const target = `gui/${process.getuid?.() ?? 501}/${label}`;
    await run(
      'launchctl',
      action === 'bootout' ? ['bootout', target] : ['kill', 'SIGTERM', target],
    );
    return true;
  } catch (error) {
    // ESRCH and launchd's service-not-found code mean it is already unloaded.
    const code = (error as NodeJS.ErrnoException).code as
      string | number | undefined;
    if (code !== 3 && code !== 113) throw error;
    return false;
  }
}

/** Restart an installed service, including one explicitly stopped with bootout on macOS. */
export async function restartService(
  label: string,
  platform: NodeJS.Platform = process.platform,
  /** The independent migration job must survive its own restart until bootstrap succeeds. */
  fromMigration = false,
): Promise<void> {
  if (!SERVICE_LABEL_PATTERN.test(label))
    throw new Error(`Not a service label: ${label}`);
  if (platform === 'darwin') {
    if (fromMigration) await stopLaunchd(label);
    else await stopService(label, platform);
    await loadService('launchd', [
      [
        'launchctl',
        'bootstrap',
        `gui/${process.getuid?.() ?? 501}`,
        serviceFile(label, platform, os.homedir()),
      ],
    ]);
  } else if (platform === 'linux')
    await run('systemctl', ['--user', 'restart', systemdUnit(label)]);
  else
    throw new Error(
      `Running the runner as a service is not supported on ${platform}.`,
    );
}
