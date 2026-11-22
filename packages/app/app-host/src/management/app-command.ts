/**
 * Runs an in-process App's command-line tool as a child process of the Host: `node dist/cli/index.js` of the App's
 * release, in the release directory, with the App's own environment, configuration file and data directory, so the
 * command works on exactly what the App runs on. The Host's own environment does not reach it beyond what a process
 * needs to run (`PATH`, `HOME`, temporary directories, locale), as an in-process App's never does.
 */
import { spawn } from 'node:child_process';
import { access, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

import type { AppDefinition } from '../app-types.ts';
import type { AppCommandOutput, AppCommandRunner } from '../service-backend.ts';
import { HostManagementError } from './scopes.ts';

/** What a backup command child keeps of the Host's environment. */
const INHERITED_ENV = [
  'PATH',
  'HOME',
  'TMPDIR',
  'TMP',
  'TEMP',
  'LANG',
  'LC_ALL',
  'TZ',
  'SYSTEMROOT',
] as const;

/**
 * Runs the command as a grandchild and ends it (SIGTERM, which a backup command answers by aborting and cleaning up)
 * once its stdin closes, which is when the Host process exits for any reason: a command never outlives its Host to
 * race the repeat a restarted Host runs.
 */
const SUPERVISE = `const { spawn } = require('node:child_process');
const child = spawn(process.execPath, process.argv.slice(1), { stdio: ['ignore', 'inherit', 'inherit'] });
const stop = () => child.kill('SIGTERM');
process.stdin.on('end', stop);
process.stdin.on('error', stop);
process.stdin.resume();
child.on('error', (error) => { console.error(error.message); process.exit(1); });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 128 : 1)));`;

/** Bytes of output kept per stream; backup commands print one JSON document. */
const OUTPUT_LIMIT = 16 * 1024 * 1024;

export class InProcessCommandRunner implements AppCommandRunner {
  constructor(
    private readonly definition: AppDefinition,
    readonly backupsDir: string,
  ) {}

  async run(args: readonly string[]): Promise<AppCommandOutput> {
    const rootDir = this.definition.rootDir;
    if (!rootDir)
      throw new HostManagementError(
        `App "${this.definition.id}" has no release directory to run its command-line tool from`,
        'BACKUP_COMMAND_UNAVAILABLE',
      );
    const cli = path.join(rootDir, 'dist', 'cli', 'index.js');
    try {
      await access(cli);
    } catch {
      throw new HostManagementError(
        `The release of App "${this.definition.id}" has no command-line tool (dist/cli/index.js); rebuild it with an @nocobase/app-cli that has the backup commands`,
        'BACKUP_COMMAND_UNAVAILABLE',
      );
    }
    await mkdir(this.backupsDir, { recursive: true, mode: 0o700 });
    const env: Record<string, string> = {};
    for (const name of INHERITED_ENV) {
      const value = process.env[name];
      if (value !== undefined) env[name] = value;
    }
    Object.assign(env, this.definition.env, {
      NODE_ENV: 'production',
      ...(this.definition.dataDir
        ? { APP_STORAGE_DIR: this.definition.dataDir }
        : {}),
      ...(this.definition.configPath
        ? { APP_CONFIG_FILE: this.definition.configPath }
        : {}),
    });
    return await new Promise<AppCommandOutput>((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', SUPERVISE, cli, ...args], {
        cwd: rootDir,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const stdout = collect(child.stdout);
      const stderr = collect(child.stderr);
      child.once('error', reject);
      child.once('close', (code, signal) => {
        resolve({
          exitCode: code ?? (signal ? 128 : 1),
          stdout: stdout(),
          stderr: stderr(),
        });
      });
    });
  }

  async removeBackupFile(name: string): Promise<void> {
    await rm(path.join(this.backupsDir, path.basename(name)), { force: true });
  }
}

function collect(stream: NodeJS.ReadableStream): () => string {
  const chunks: Buffer[] = [];
  let size = 0;
  stream.on('data', (chunk: Buffer) => {
    if (size >= OUTPUT_LIMIT) return;
    chunks.push(chunk);
    size += chunk.length;
  });
  return () => Buffer.concat(chunks).toString('utf8');
}
