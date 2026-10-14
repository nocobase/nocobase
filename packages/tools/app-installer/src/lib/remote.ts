import { list } from 'tar';
import type { ReleaseManifest } from './release.ts';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Flags } from '@oclif/core';
import { quoteForShell } from '@nocobase/cli-envelope';
import { createOfflineBundle } from './offline-bundle.ts';
import { CommandFailedError, runCommand } from './run-command.ts';
import { EXIT_INVALID, InstallerError, type Suggestion } from './errors.ts';
import { INSTALLER_PACKAGE } from './invocation.ts';
import { checkHealth } from './health.ts';
import type { CommandDeps, CommandOutcome } from '../commands/install.ts';

export const SSH_FLAGS = {
  ssh: Flags.string({
    description:
      'SSH destination (user@host or SSH config alias). The server needs no internet access.',
  }),
  'ssh-port': Flags.integer({
    min: 1,
    max: 65535,
    description: 'SSH port; otherwise use system SSH configuration.',
  }),
  'ssh-identity': Flags.string({
    description:
      'Local SSH private key file; SSH agent and config work without this flag.',
  }),
  'ssh-config': Flags.string({
    description:
      'Local SSH config file, including ProxyJump and remote PATH setup.',
  }),
  'ssh-timeout': Flags.integer({
    min: 1,
    default: 1800,
    description:
      'Maximum seconds for each remote execution or transfer. A timeout does not imply rollback.',
  }),
};
export type RemoteFlags = Record<
  string,
  string | string[] | number | boolean | undefined
>;
export interface RemoteRequest {
  command: string;
  flags: RemoteFlags;
  explicit: string[];
  env: Record<string, string>;
  archive?: { file: string; sha256: string };
}

export async function sha256(file: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file))
    hash.update(chunk as Buffer);
  return hash.digest('hex');
}

export function sshArgs(flags: RemoteFlags, scp = false): string[] {
  const host = flags.ssh;
  if (
    typeof host !== 'string' ||
    !/^(?:[\w.-]+@)?[\w.:[\]-]+$/u.test(host) ||
    host.startsWith('-')
  ) {
    throw new InstallerError(
      'INVALID_USAGE',
      '--ssh must be a host, user@host or SSH config alias, not a shell command or URL.',
      { exitCode: EXIT_INVALID },
    );
  }
  const args = [
    '-o',
    'BatchMode=yes',
    '-o',
    'StrictHostKeyChecking=yes',
    '-o',
    'ConnectTimeout=15',
  ];
  if (flags['ssh-port'])
    args.push(scp ? '-P' : '-p', String(flags['ssh-port']));
  if (flags['ssh-identity']) args.push('-i', String(flags['ssh-identity']));
  if (flags['ssh-config']) args.push('-F', String(flags['ssh-config']));
  return args;
}

/** Keep recovery commands on the machine whose files and processes they address. */
function remoteSuggestion(
  suggestion: Suggestion,
  flags: RemoteFlags,
): Suggestion {
  const run = suggestion.run;
  if (!run) return suggestion;
  const installerIndex =
    run.command === 'npx'
      ? run.args.findIndex((arg) => arg.startsWith(INSTALLER_PACKAGE + '@'))
      : -1;
  if (installerIndex >= 0) {
    const connection = Object.entries(flags)
      .filter(([key, value]) => key in SSH_FLAGS && value !== undefined)
      .flatMap(([key, value]) => [`--${key}`, String(value)]);
    return {
      ...suggestion,
      run: {
        command: process.execPath,
        args: [
          fileURLToPath(new URL('../../bin/run.js', import.meta.url)),
          ...run.args.slice(installerIndex + 1),
          ...connection,
        ],
      },
    };
  }
  // Archive rebuilds and dependency changes belong in the local application project.
  if (run.command === 'pnpm')
    return {
      ...suggestion,
      message: `In the local application project: ${suggestion.message}`,
    };
  return {
    ...suggestion,
    run: {
      command: 'ssh',
      args: [
        ...sshArgs(flags),
        String(flags.ssh),
        [run.command, ...run.args].map(quoteForShell).join(' '),
      ],
    },
  };
}

/** Read the manifest without extracting executable files on the local machine. */
export async function inspectArchive(
  file: string,
): Promise<{ manifest: ReleaseManifest; bytes: number }> {
  let text = '';
  let bytes = 0;
  let manifests = 0;
  await list({
    file,
    onReadEntry(entry) {
      bytes += entry.size;
      if (entry.path.replace(/^\.\//u, '') === 'dist/package.json') {
        manifests += 1;
        if (entry.size > 1024 * 1024)
          throw new Error('Archive manifest is too large');
        entry.on('data', (chunk: Buffer) => {
          text += chunk.toString();
        });
      }
    },
  });
  if (manifests !== 1)
    throw new InstallerError(
      'ARCHIVE_INVALID',
      'Archive must contain exactly one dist/package.json.',
    );
  return { manifest: JSON.parse(text) as ReleaseManifest, bytes };
}

/** Runs before upload. Node and standard Linux tools are prerequisites, not downloaded on the server. */
const PREFLIGHT = `
const fs = require('node:fs'); const path = require('node:path');
const {spawnSync} = require('node:child_process');
let input=''; process.stdin.setEncoding('utf8'); process.stdin.on('data',x=>input+=x);
process.stdin.on('end',()=>{try {
 const r=JSON.parse(input);
 if(process.platform!=='linux'||Number(process.versions.node.split('.')[0])<24) throw Error('Linux and Node.js 24+ are required');
 const t=r.target; const libc=process.report.getReport().header.glibcVersionRuntime?'glibc':'musl';
 if(t&&(t.platform!==process.platform||t.arch!==process.arch||t.nodeMajor!==Number(process.versions.node.split('.')[0])||(t.libc&&t.libc!==libc)))throw Error('Archive build target does not match remote platform, architecture, libc or Node major');
 for(const bin of ['tar','pm2']) {const p=spawnSync('sh',['-c','command -v '+bin],{encoding:'utf8'});if(p.status!==0)throw Error(bin+' is missing from the SSH session PATH');}
 let parent=r.dir;while(!fs.existsSync(parent))parent=path.dirname(parent);
 if(!fs.statSync(parent).isDirectory())throw Error('Target parent is not a directory');
 fs.accessSync(parent,fs.constants.W_OK|fs.constants.X_OK);
 for(const dir of [parent,'/tmp']) {const disk=fs.statfsSync(dir);if(disk.bavail*disk.bsize<r.bytes)throw Error('Insufficient disk space in '+dir);}
 fs.mkdirSync(r.staging,{mode:0o700});
 console.log(JSON.stringify({platform:process.platform,arch:process.arch,node:process.versions.node}));
 }catch(e){console.error(e.message);process.exitCode=2;}});
`;

export async function runRemote(
  command: string,
  flags: RemoteFlags,
  directory: string | undefined,
  explicit: string[],
  deps: CommandDeps,
): Promise<CommandOutcome> {
  const ssh = sshArgs(flags);
  const host = String(flags.ssh);
  const root = directory ?? flags.dir;
  if (
    typeof root !== 'string' ||
    !path.posix.isAbsolute(root) ||
    path.posix.normalize(root) === '/' ||
    root.includes('\0') ||
    root.includes('\n')
  ) {
    throw new InstallerError(
      'INVALID_USAGE',
      'SSH operations require an explicit absolute target --dir other than /.',
      { exitCode: EXIT_INVALID },
    );
  }
  if (directory && flags.dir && directory !== flags.dir)
    throw new InstallerError(
      'INVALID_USAGE',
      'Directory argument and --dir disagree.',
      { exitCode: EXIT_INVALID },
    );
  if (flags.app || flags.rebuild || (command === 'upgrade' && flags.to))
    throw new InstallerError(
      'INVALID_USAGE',
      'SSH deployment is archive-only; --app, --rebuild and npm --to require server internet access.',
      { exitCode: EXIT_INVALID },
    );
  if (['deploy', 'install', 'upgrade'].includes(command) && !flags.archive)
    throw new InstallerError(
      'INVALID_USAGE',
      '--archive is required for SSH installation and upgrade.',
      { exitCode: EXIT_INVALID },
    );
  const env: Record<string, string> = {};
  for (const setting of (flags['set-from-env'] ?? []) as string[]) {
    const name = setting.slice(setting.indexOf('=') + 1);
    if (
      !setting.includes('=') ||
      !/^[A-Za-z_][A-Za-z0-9_]*$/u.test(name) ||
      process.env[name] === undefined
    )
      throw new InstallerError(
        'INVALID_USAGE',
        '--set-from-env must name an existing local environment variable.',
        { exitCode: EXIT_INVALID },
      );
    // Restrict transport to generated names: a user setting must not override PATH, NODE_OPTIONS or the remote runtime.
    const generated = `NOCOBASE_REMOTE_SECRET_${Object.keys(env).length}`;
    env[generated] = process.env[name]!;
  }
  const secrets = Object.values(env).filter(Boolean);
  const redact = (text: string) =>
    secrets.reduce(
      (out, secret) =>
        out
          .split(JSON.stringify(secret).slice(1, -1))
          .join('[REDACTED]')
          .split(secret)
          .join('[REDACTED]'),
      text,
    );
  const local = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ssh-'));
  const staging = `/tmp/nocobase-deploy-${randomUUID()}`;
  const run = deps.run ?? runCommand;
  const timeoutMs = Number(flags['ssh-timeout'] ?? 1800) * 1000;
  let executing = false;
  let staged = false;
  try {
    const bundle = path.join(local, 'installer.tar.gz');
    await createOfflineBundle(bundle);
    const archive =
      typeof flags.archive === 'string'
        ? path.resolve(deps.cwd ?? process.cwd(), flags.archive)
        : undefined;
    const bundleHash = await sha256(bundle);
    const archiveHash = archive ? await sha256(archive) : undefined;
    const inspected = archive ? await inspectArchive(archive) : undefined;
    if (inspected && !inspected.manifest.nocobase?.buildTarget)
      throw new InstallerError(
        'ARCHIVE_INVALID',
        'Archive is missing its build target.',
      );
    const bytes = (await stat(bundle)).size * 10 + (inspected?.bytes ?? 0) * 2;
    deps.reporter.progress(`Checking SSH target ${host}`);
    await run('ssh', [...ssh, host, `node -e ${quoteForShell(PREFLIGHT)}`], {
      input: JSON.stringify({
        dir: root,
        staging,
        bytes,
        target: inspected?.manifest.nocobase?.buildTarget,
      }),
      timeoutMs: 30_000,
    });
    staged = true;
    deps.reporter.progress(
      'Uploading offline installer and application archive',
    );
    await run(
      'scp',
      [...sshArgs(flags, true), bundle, `${host}:${staging}/installer.tar.gz`],
      { timeoutMs },
    );
    if (archive)
      await run(
        'scp',
        [...sshArgs(flags, true), archive, `${host}:${staging}/app.tar.gz`],
        { timeoutMs },
      );
    const verify = `const fs=require('node:fs'),crypto=require('node:crypto');(async()=>{for(const [file,expected] of ${JSON.stringify([[`${staging}/installer.tar.gz`, bundleHash], ...(archive ? [[`${staging}/app.tar.gz`, archiveHash]] : [])])}){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))hash.update(chunk);if(hash.digest('hex')!==expected)throw Error('Upload checksum mismatch');}})().catch(e=>{console.error(e.message);process.exitCode=2});`;
    await run(
      'ssh',
      [
        ...ssh,
        host,
        `node -e ${quoteForShell(verify)} && tar -xzf ${quoteForShell(staging + '/installer.tar.gz')} -C ${quoteForShell(staging)}`,
      ],
      { timeoutMs },
    );
    const forwarded = Object.fromEntries(
      Object.entries(flags).filter(([key]) => !(key in SSH_FLAGS)),
    );
    forwarded.dir = root;
    forwarded.archive = archive ? staging + '/app.tar.gz' : undefined;
    if (flags['set-from-env'])
      forwarded['set-from-env'] = (flags['set-from-env'] as string[]).map(
        (x, i) => `${x.slice(0, x.indexOf('='))}=NOCOBASE_REMOTE_SECRET_${i}`,
      );
    const request: RemoteRequest = {
      command,
      flags: forwarded,
      explicit,
      env,
      ...(archive
        ? { archive: { file: staging + '/app.tar.gz', sha256: archiveHash! } }
        : {}),
    };
    executing = true;
    let response: { stdout: string; stderr: string };
    let exitCode = 0;
    try {
      response = await run(
        'ssh',
        [
          ...ssh,
          host,
          `node ${quoteForShell(staging + '/installer/dist/remote-entry.js')}`,
        ],
        { input: JSON.stringify(request), timeoutMs },
      );
    } catch (error) {
      if (error instanceof InstallerError && error.code === 'INTERRUPTED')
        throw new Error(
          'Local SSH execution was interrupted before returning a remote result.',
          { cause: error },
        );
      if (
        !(error instanceof CommandFailedError) ||
        error.exitCode === 255 ||
        error.exitCode === null
      )
        throw error;
      response = error;
      exitCode = error.exitCode;
    }
    let envelope: {
      ok: boolean;
      status?: 'success' | 'success-noop';
      result?: Record<string, unknown>;
      error?: {
        code: string;
        message: string;
        suggestions?: Suggestion[];
        details?: Record<string, unknown>;
      };
      warnings?: string[];
    };
    try {
      envelope = JSON.parse(redact(response.stdout)) as typeof envelope;
    } catch {
      throw new Error('Remote installer did not return a JSON result');
    }
    for (const warning of envelope.warnings ?? []) deps.reporter.warn(warning);
    if (envelope.ok && exitCode !== 0)
      throw new Error(
        'Remote process exited nonzero despite a success envelope',
      );
    if (!envelope.ok)
      throw new InstallerError(
        envelope.error?.code ?? 'REMOTE_FAILED',
        envelope.error?.message ?? 'Remote operation failed.',
        {
          exitCode: exitCode || 1,
          details: {
            ...envelope.error?.details,
            ssh: host,
            directory: root,
            staging,
          },
          suggestions: (envelope.error?.suggestions ?? []).map((suggestion) =>
            remoteSuggestion(suggestion, flags),
          ),
        },
      );
    const result = envelope.result ?? {};
    let publicHealth: boolean | null = null;
    const url =
      typeof result.url === 'string'
        ? result.url
        : (result.endpoints as { url?: string } | undefined)?.url;
    if (url && result.started !== false) {
      publicHealth = await checkHealth(
        url.replace(/\/$/u, '') + '/api/healthz',
        deps.fetchImpl,
      );
      if (!publicHealth)
        deps.reporter.warn(
          'Remote operation succeeded, but the public health URL is not reachable from this machine. Check routing, firewall and reverse proxy.',
        );
    }
    await run('ssh', [...ssh, host, `rm -rf -- ${quoteForShell(staging)}`], {
      timeoutMs: 30_000,
    }).catch(() =>
      deps.reporter.warn(
        `Could not remove remote staging directory ${staging}.`,
      ),
    );
    return {
      status: envelope.status ?? 'success',
      result: {
        ...result,
        remote: {
          host,
          directory: root,
          publicHealth,
          archiveSha256: archiveHash ?? null,
        },
      },
      summary: [
        `Remote ${command} succeeded on ${host}`,
        `  Directory ${root}`,
        ...(url ? [`  URL ${url}`] : []),
      ],
    };
  } catch (error) {
    if (error instanceof InstallerError) throw error;
    throw new InstallerError(
      executing ? 'REMOTE_STATE_UNKNOWN' : 'SSH_TRANSFER_FAILED',
      executing
        ? 'SSH execution did not return a complete result. The server may still be deploying; query status before retrying.'
        : 'SSH precheck or transfer failed; the application was not changed.',
      {
        details: {
          ssh: host,
          directory: root,
          ...(staged ? { staging } : {}),
          diagnostic: redact(
            error instanceof CommandFailedError
              ? error.stderr
              : error instanceof Error
                ? error.message
                : String(error),
          ),
        },
      },
    );
  } finally {
    await rm(local, { recursive: true, force: true });
  }
}
