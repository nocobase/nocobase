// Runs the daemon as a per-user service: a launchd agent on macOS, a systemd user unit on Linux. The service runs
// `nocobase-runner start --foreground` (the installation's `current` launcher, or this Node and this entry), restarts it
// whenever it exits, which is also how a self-update takes effect, and writes its output to the daemon log. Each plan
// lists the file it writes and the commands it runs, so `--dry-run` can show them. Installing again replaces the
// service in place. A label other than the default lets a second runner (a test, or another state directory) run
// beside the first.
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

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

export interface ServicePlan {
  platform: 'launchd' | 'systemd';
  label: string;
  file: string;
  content: string;
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
  return /[\s"\\]/.test(value)
    ? `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
    : value;
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
}

export function servicePlan(options: ServiceOptions): ServicePlan {
  const platform = options.platform ?? process.platform;
  const home = options.home ?? os.homedir();
  const args = [...options.command, 'start', '--foreground'];
  const env = options.env ?? process.env;
  const label = options.label ?? LAUNCHD_LABEL;
  if (!SERVICE_LABEL_PATTERN.test(label))
    throw new Error(`Not a service label: ${label}`);
  const environment: Record<string, string> = {
    PATH: env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    NOCOBASE_RUNNER_HOME: options.paths.home,
    NOCOBASE_RUNNER_WORK_ROOT: options.paths.workRoot,
    [SERVICE_ENV]: '1',
  };
  if (platform === 'darwin') {
    const file = path.join(home, 'Library', 'LaunchAgents', `${label}.plist`);
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
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${xml(options.paths.daemonLog)}</string>
  <key>StandardErrorPath</key>
  <string>${xml(options.paths.daemonLog)}</string>
</dict>
</plist>
`;
    const domain = `gui/${uid}`;
    return {
      platform: 'launchd',
      label,
      file,
      content,
      install: [['launchctl', 'bootstrap', domain, file]],
      uninstall: [['launchctl', 'bootout', `${domain}/${label}`]],
    };
  }
  if (platform === 'linux') {
    const unit = systemdUnit(label);
    const file = path.join(home, '.config', 'systemd', 'user', unit);
    const content = `[Unit]
Description=NocoBase runner
After=network-online.target

[Service]
ExecStart=${args.map(systemdQuote).join(' ')}
${Object.entries(environment)
  .map(([key, value]) => `Environment=${systemdQuote(`${key}=${value}`)}`)
  .join('\n')}
Restart=always
RestartSec=10
KillMode=mixed

[Install]
WantedBy=default.target
`;
    return {
      platform: 'systemd',
      label,
      file,
      content,
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
  await writeFile(plan.file, plan.content, { mode: 0o644 });
  for (const [command = '', ...args] of plan.install) {
    // launchd may still be removing the previous instance right after `bootout`; try again for a few seconds.
    for (let attempt = 1; ; attempt += 1) {
      try {
        await run(command, args);
        break;
      } catch (error) {
        if (plan.platform !== 'launchd' || attempt >= 10) throw error;
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
