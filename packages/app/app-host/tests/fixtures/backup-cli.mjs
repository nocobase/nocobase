// A stand-in for an application's `dist/cli/index.js`: the four `backup` commands with their `--json` documents,
// backing up `data.txt` of the App's storage. It records each command in `$BACKUP_CLI_LOG` with the first line of
// its configuration file, writes its process ID to `$BACKUP_CLI_PID` and, with `$BACKUP_CLI_HOLD`, waits until that
// file disappears before it writes anything. `$BACKUP_CLI_FAIL_RESTORE` makes `restore` fail after it checked the
// archive.
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const [topic, command, ...rest] = process.argv.slice(2);
const name = `${topic} ${command}`;
const storage = process.env.APP_STORAGE_DIR;
const flag = (key) => {
  const index = rest.indexOf(key);
  return index >= 0 ? rest[index + 1] : undefined;
};
const print = (document) => {
  process.stdout.write(
    `${JSON.stringify({ schemaVersion: 1, command: name, warnings: [], ...document })}\n`,
  );
};
const succeed = (result) => print({ ok: true, status: 'success', result });
const fail = (code, message, details) => {
  print({
    ok: false,
    status: 'failure',
    error: { code, message, suggestions: [], details },
  });
  process.exit(1);
};
const sha256 = (file) =>
  createHash('sha256').update(readFileSync(file)).digest('hex');

if (process.env.BACKUP_CLI_PID)
  writeFileSync(process.env.BACKUP_CLI_PID, String(process.pid));
if (process.env.BACKUP_CLI_LOG)
  appendFileSync(
    process.env.BACKUP_CLI_LOG,
    `${name} ${process.env.APP_CONFIG_FILE ? readFileSync(process.env.APP_CONFIG_FILE, 'utf8').split('\n')[0] : 'no-config'}\n`,
  );
const hold = process.env.BACKUP_CLI_HOLD;
while (hold && existsSync(hold))
  await new Promise((resolve) => setTimeout(resolve, 20));

if (topic !== 'backup')
  fail('INVALID_USAGE', `command ${topic}:${command} not found`);
const manifest = {
  app: { name: 'demo', version: '0.0.1' },
  connections: [
    {
      name: 'main',
      mode: 'dump',
      snapshot: { time: '2026-11-22T00:00:00.000Z' },
    },
  ],
  disks: [{ name: 'local', mode: 'files', count: 1, size: 1 }],
  limitations: [],
  ...JSON.parse(process.env.BACKUP_CLI_MANIFEST ?? '{}'),
};
switch (command) {
  case 'create': {
    const output = flag('--output');
    if (existsSync(output))
      fail('BACKUP_OUTPUT_EXISTS', `${output} already exists`);
    writeFileSync(
      output,
      JSON.stringify({
        data: readFileSync(path.join(storage, 'data.txt'), 'utf8'),
        manifest,
      }),
    );
    succeed({
      file: output,
      size: statSync(output).size,
      sha256: sha256(output),
      manifest,
    });
    break;
  }
  case 'verify': {
    const file = rest[0];
    if (!existsSync(file))
      fail('BACKUP_ARCHIVE_NOT_FOUND', `${file} does not exist.`);
    if (flag('--sha256') !== sha256(file))
      fail('BACKUP_DIGEST_MISMATCH', 'The archive checksum does not match.');
    succeed({ ok: true, sha256: sha256(file), manifest });
    break;
  }
  case 'inspect':
    succeed(JSON.parse(readFileSync(rest[0], 'utf8')).manifest);
    break;
  case 'restore': {
    const file = rest[0];
    if (flag('--sha256') !== sha256(file))
      fail('BACKUP_DIGEST_MISMATCH', 'The archive checksum does not match.', {
        connections: [{ name: 'main', status: 'not-started' }],
      });
    if (process.env.BACKUP_CLI_FAIL_RESTORE)
      fail('RESTORE_IMPORT_FAILED', 'The database import failed.', {
        connections: [{ name: 'main', status: 'rolled-back' }],
      });
    writeFileSync(
      path.join(storage, 'data.txt'),
      JSON.parse(readFileSync(file, 'utf8')).data,
    );
    succeed({
      connections: [{ name: 'main', status: 'restored' }],
      disks: [{ name: 'local', status: 'restored' }],
      missingFiles: [],
    });
    break;
  }
  default:
    fail('INVALID_USAGE', `command backup:${command} not found`);
}
