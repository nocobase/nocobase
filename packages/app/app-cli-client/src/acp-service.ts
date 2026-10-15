// `<bin> acp start` as a per-user service that starts at login and starts again when it fails: a launchd agent on
// macOS, a systemd user unit on Linux, and on Windows a script in the Startup folder that runs it without a window. The
// service runs `acp start --service`, which stops for good, exiting 0, when the application no longer accepts the
// computer, rather than failing again and again. Refused for its protocol, it updates the CLI and exits non-zero, so
// the service starts it again on the new version (or, when no update helped, tries again a few minutes later). It gets
// the installing shell's PATH, the CLI's own variables, proxy and CA variables and the `--pass-env` names with their
// values now, since a service reads no shell configuration; its files are readable by their owner only. Each plan
// lists the file it writes and the commands it runs.
import { execFile, spawn } from 'node:child_process';
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export interface AcpServiceOptions {
  /** The CLI's command name, such as `nb-studio`. */
  readonly bin: string;
  /** The program and arguments that start the CLI, such as [node, bin/run.js]. */
  readonly command: readonly string[];
  /** What follows `acp start --service`: the profile, the computer's name and its roots. */
  readonly args: readonly string[];
  /** Where the service's output goes, on macOS and Windows; systemd keeps it in the journal. */
  readonly log: string;
  /** The variables written into the service, with their values. */
  readonly env: Readonly<Record<string, string>>;
  /** Separates the services of several profiles. */
  readonly profile?: string | undefined;
  readonly platform?: NodeJS.Platform;
  readonly home?: string;
  readonly uid?: number;
}

export interface AcpServicePlan {
  readonly platform: 'launchd' | 'systemd' | 'startup';
  readonly label: string;
  readonly file: string;
  readonly content: string;
  readonly install: readonly (readonly string[])[];
  readonly uninstall: readonly (readonly string[])[];
  /** Answers with exit code 0 while the service is loaded; none on Windows, where the file is the service. */
  readonly status?: readonly string[];
}

/** The proxy and CA variables a service needs to reach the application as the shell does. */
export const NETWORK_ENV: readonly string[] = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'NODE_EXTRA_CA_CERTS',
];

/** `names` with their values in `env`, those set; a value with NUL cannot be written into a service. */
export function capture(
  env: NodeJS.ProcessEnv,
  names: readonly string[],
): Record<string, string> {
  const captured: Record<string, string> = {};
  for (const name of names) {
    const value = env[name];
    if (value === undefined || value === '') continue;
    if (value.includes('\0'))
      throw new Error(`Cannot write ${name} into a service: it holds NUL.`);
    captured[name] = value;
  }
  return captured;
}

export function acpServicePlan(options: AcpServiceOptions): AcpServicePlan {
  const platform = options.platform ?? process.platform;
  const home = options.home ?? os.homedir();
  const suffix = options.profile
    ? `-${options.profile.replace(/[^A-Za-z0-9._-]/gu, '_')}`
    : '';
  const name = `${options.bin}-acp${suffix}`;
  const args = [
    ...options.command,
    'acp',
    'start',
    '--service',
    ...options.args,
  ];
  if (platform === 'darwin') {
    const label = `com.nocobase.${name}`;
    const file = path.join(home, 'Library', 'LaunchAgents', `${label}.plist`);
    const domain = `gui/${options.uid ?? process.getuid?.() ?? 501}`;
    return {
      platform: 'launchd',
      label,
      file,
      content: plist(label, args, options.env, options.log),
      install: [
        ['launchctl', 'bootout', `${domain}/${label}`],
        ['launchctl', 'bootstrap', domain, file],
      ],
      uninstall: [['launchctl', 'bootout', `${domain}/${label}`]],
      status: ['launchctl', 'print', `${domain}/${label}`],
    };
  }
  if (platform === 'linux') {
    const unit = `${name}.service`;
    return {
      platform: 'systemd',
      label: unit,
      file: path.join(home, '.config', 'systemd', 'user', unit),
      content: systemdUnit(options.bin, args, options.env),
      install: [
        ['systemctl', '--user', 'daemon-reload'],
        ['systemctl', '--user', 'enable', unit],
        ['systemctl', '--user', 'restart', unit],
      ],
      uninstall: [
        ['systemctl', '--user', 'disable', '--now', unit],
        ['systemctl', '--user', 'daemon-reload'],
      ],
      status: ['systemctl', '--user', 'is-active', '--quiet', unit],
    };
  }
  if (platform === 'win32') {
    const appData =
      process.env.APPDATA ?? path.win32.join(home, 'AppData', 'Roaming');
    const file = path.win32.join(
      appData,
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'Startup',
      `${name}.vbs`,
    );
    return {
      platform: 'startup',
      label: name,
      file,
      content: startupScript(args, options.env, options.log),
      install: [['wscript.exe', '//B', '//Nologo', file]],
      uninstall: [],
    };
  }
  throw new Error(`Running as a service is not supported on ${platform}.`);
}

/** Writes the service and starts it, replacing one installed before. */
export async function installAcpService(plan: AcpServicePlan): Promise<void> {
  await mkdir(path.dirname(plan.file), { recursive: true });
  // Only its owner reads it: the variables written into it may hold a proxy's password or a key.
  await writeFile(plan.file, plan.content, { mode: 0o600 });
  await chmod(plan.file, 0o600);
  if (plan.platform === 'startup') {
    // The script starts at the next login by itself; this starts it now, outliving this command.
    const [command = '', ...args] = plan.install[0] ?? [];
    spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
    return;
  }
  for (const [index, [command = '', ...args]] of plan.install.entries()) {
    // launchd's `bootout` of a service that is not loaded fails, which is fine; it may also still be removing the
    // previous instance right after it, so `bootstrap` is tried again for a few seconds.
    if (plan.platform === 'launchd' && index === 0) {
      await run(command, args).catch(() => undefined);
      continue;
    }
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

/** Stops the service and removes it; on Windows the running bridge is stopped by the caller. */
export async function uninstallAcpService(plan: AcpServicePlan): Promise<void> {
  for (const [command = '', ...args] of plan.uninstall)
    // Not loaded is fine: the goal is that it is not.
    await run(command, args).catch(() => undefined);
  await rm(plan.file, { force: true });
}

/** Whether the service is loaded (launchd, systemd); undefined where only its file says so. */
export async function acpServiceLoaded(
  plan: AcpServicePlan,
): Promise<boolean | undefined> {
  if (!plan.status) return undefined;
  const [command = '', ...args] = plan.status;
  return run(command, args).then(
    () => true,
    () => false,
  );
}

function xml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

function plist(
  label: string,
  args: readonly string[],
  env: Readonly<Record<string, string>>,
  log: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
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
${Object.entries(env)
  .map(
    ([key, value]) =>
      `    <key>${xml(key)}</key>\n    <string>${xml(value)}</string>`,
  )
  .join('\n')}
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>StandardOutPath</key>
  <string>${xml(log)}</string>
  <key>StandardErrorPath</key>
  <string>${xml(log)}</string>
</dict>
</plist>
`;
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

function systemdUnit(
  bin: string,
  args: readonly string[],
  env: Readonly<Record<string, string>>,
): string {
  return `[Unit]
Description=${bin} agent sessions on this computer
After=network-online.target

[Service]
ExecStart=${args.map(systemdQuote).join(' ')}
${Object.entries(env)
  // Quoted, with `%` doubled so systemd expands no specifier in it.
  .map(
    ([key, value]) =>
      `Environment=${systemdQuote(`${key}=${value}`.replace(/%/gu, '%%'))}`,
  )
  .join('\n')}
Restart=on-failure
RestartSec=10
KillMode=mixed

[Install]
WantedBy=default.target
`;
}

/** `value` as one argument of a cmd.exe command line. */
function cmdQuote(value: string): string {
  return /^[\w@+=:,./\\-]+$/u.test(value)
    ? value
    : `"${value.replace(/"/gu, '""')}"`;
}

/** `value` as a VBScript string literal. */
function vbsString(value: string): string {
  return `"${value.replace(/"/gu, '""')}"`;
}

/**
 * A script Windows runs at login from the Startup folder: it runs the CLI without a window, its output appended to the
 * log, and again 10 seconds after it fails, until the CLI exits 0 or the script is removed.
 */
function startupScript(
  args: readonly string[],
  env: Readonly<Record<string, string>>,
  log: string,
): string {
  const line = `cmd.exe /d /s /c "${args.map(cmdQuote).join(' ')} >> ${cmdQuote(log)} 2>&1"`;
  return [
    "' Runs the agent sessions bridge at login, without a window; remove this file to stop it starting.",
    'Set shell = CreateObject("WScript.Shell")',
    'Set files = CreateObject("Scripting.FileSystemObject")',
    'Set env = shell.Environment("Process")',
    ...Object.entries(env).map(
      ([key, value]) => `env(${vbsString(key)}) = ${vbsString(value)}`,
    ),
    'Do',
    `  code = shell.Run(${vbsString(line)}, 0, True)`,
    '  If code = 0 Or Not files.FileExists(WScript.ScriptFullName) Then Exit Do',
    '  WScript.Sleep 10000',
    'Loop',
    '',
  ].join('\r\n');
}
