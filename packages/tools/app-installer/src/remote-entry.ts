import { Writable } from 'node:stream';
import { readAppEnv, endpointsOf } from './lib/env-file.ts';
import { layoutOf } from './lib/layout.ts';
/** Private SSH entry: the request and secrets arrive over stdin, never in process arguments or files. */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { runInstaller } from './cli.ts';
import { INSTALL_FLAGS } from './commands/install.ts';
import { UPGRADE_FLAGS } from './commands/upgrade.ts';
import { ROLLBACK_FLAGS } from './commands/rollback.ts';
import { STATUS_FLAGS } from './commands/status.ts';
import { errorEnvelope, exitCodeOf } from './lib/output.ts';
import { InstallerError } from './lib/errors.ts';
import { sha256, type RemoteRequest } from './lib/remote.ts';

let input = '';
for await (const chunk of process.stdin) input += String(chunk);
let command = 'remote';
try {
  const request = JSON.parse(input) as RemoteRequest;
  command = request.command;
  const root = String(request.flags.dir);
  if (!path.isAbsolute(root) || root === '/')
    throw new InstallerError(
      'INVALID_USAGE',
      'An absolute application directory is required.',
    );
  if (
    request.archive &&
    (await sha256(request.archive.file)) !== request.archive.sha256
  )
    throw new InstallerError(
      'CHECKSUM_MISMATCH',
      'Application archive checksum does not match.',
    );
  for (const [key, value] of Object.entries(request.env)) {
    if (!/^NOCOBASE_REMOTE_SECRET_\d+$/u.test(key))
      throw new InstallerError(
        'INVALID_USAGE',
        'Invalid transported environment variable.',
      );
    process.env[key] = value;
  }
  const stateFile = path.join(root, 'installer.json');
  if (command === 'deploy')
    command = existsSync(stateFile) ? 'upgrade' : 'install';
  if (command === 'upgrade') {
    const state = JSON.parse(await readFile(stateFile, 'utf8')) as {
      source?: { kind?: string };
    };
    if (state.source?.kind !== 'archive')
      throw new InstallerError(
        'REMOTE_SOURCE_UNSUPPORTED',
        'Offline SSH upgrades require an archive installation.',
      );
    const installOnly = request.explicit.filter(
      (key) =>
        key in INSTALL_FLAGS && !(key in UPGRADE_FLAGS) && key !== 'json',
    );
    if (installOnly.length)
      throw new InstallerError(
        'INVALID_USAGE',
        `An existing installation preserves its configuration; remove install-only flags: ${installOnly.map((x) => '--' + x).join(', ')}.`,
      );
  }
  const definitions = {
    install: INSTALL_FLAGS,
    upgrade: UPGRADE_FLAGS,
    rollback: ROLLBACK_FLAGS,
    status: STATUS_FLAGS,
  };
  if (!(command in definitions))
    throw new InstallerError('INVALID_USAGE', 'Unsupported remote operation.');
  const definition = definitions[command as keyof typeof definitions];
  const argv = [command, '--json'];
  for (const [key, value] of Object.entries(request.flags)) {
    if (key === 'json' || !(key in definition) || value === undefined) continue;
    if (typeof value === 'boolean') {
      if (value) argv.push('--' + key);
      else if (['start', 'restore'].includes(key)) argv.push('--no-' + key);
    } else if (Array.isArray(value))
      for (const item of value) argv.push(`--${key}=${item}`);
    else argv.push(`--${key}=${value}`);
  }
  const metadata = createRequire(import.meta.url)('../package.json') as {
    version: string;
  };
  let output = '';
  const stdout = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  process.exitCode = await runInstaller({
    argv,
    version: metadata.version,
    stdout,
  });
  const envelope = JSON.parse(output) as {
    ok: boolean;
    result?: Record<string, unknown>;
  };
  if (
    envelope.ok &&
    envelope.result &&
    ['upgrade', 'rollback'].includes(command)
  ) {
    envelope.result.endpoints = endpointsOf(await readAppEnv(layoutOf(root)));
  }
  process.stdout.write(JSON.stringify(envelope) + '\n');
} catch (error) {
  process.stdout.write(
    JSON.stringify(errorEnvelope(command, error, [])) + '\n',
  );
  process.exitCode = exitCodeOf(error);
}
