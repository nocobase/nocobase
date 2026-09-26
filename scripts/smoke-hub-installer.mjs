#!/usr/bin/env node
// Installs, checks, upgrades and rolls back a Hub with hub-installer. CI runs it against the published template with
// the installer from the checkout; `pnpm unreleased:hub-smoke` runs it against the unreleased snapshot. Keeping one
// script keeps the two from drifting apart.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export const OLDER_VERSION = '0.0.0-smoke';

/** The App Host the Hub starts listens here, so the Hub itself cannot. */
export const APP_HOST_PORT = 13010;

/** Above OLDER_VERSION, so `upgrade` does not refuse it as a downgrade. */
export const BROKEN_VERSION = '0.0.1-broken';

const usage = `Usage: node scripts/smoke-hub-installer.mjs --root DIR [--port 13000] [-- INSTALLER...]

Runs install, status, upgrade and rollback against a new Hub at DIR. INSTALLER is the
command that runs hub-installer, "node packages/tools/hub-installer/bin/run.js" by default.
pm2 must be on PATH; set PM2_HOME to keep the test away from your own pm2 processes.`;

export function parseArgs(argv) {
  const separator = argv.indexOf('--');
  const own = separator === -1 ? argv : argv.slice(0, separator);
  const installer =
    separator === -1
      ? ['node', 'packages/tools/hub-installer/bin/run.js']
      : argv.slice(separator + 1);
  const options = { port: 13000, installer };
  for (let i = 0; i < own.length; i++) {
    const key = own[i];
    const value = own[i + 1];
    if (!['--root', '--port'].includes(key) || !value || value.startsWith('--'))
      throw new Error(`Invalid option: ${key}\n\n${usage}`);
    options[key.slice(2)] = value;
    i++;
  }
  if (!options.root) throw new Error(`--root is required.\n\n${usage}`);
  options.root = path.resolve(options.root);
  options.port = Number(options.port);
  if (
    !Number.isInteger(options.port) ||
    options.port < 1 ||
    options.port > 65535
  )
    throw new Error('Invalid --port.');
  if (options.port === APP_HOST_PORT)
    throw new Error(
      `--port ${APP_HOST_PORT} is where the Hub's App Host listens; choose another port.`,
    );
  if (installer.length === 0)
    throw new Error('The installer command is empty.');
  return options;
}

/**
 * Registers a copy of the installed release as an older version and makes it current.
 *
 * Only the newest Hub template is guaranteed to build (it ships no lockfile), so there is no second version to upgrade
 * from. An upgrade to a version already on disk skips the build and still goes through the whole downtime path — stop,
 * backup, switch, migrate, start — which is what this test is for.
 */
export function registerOlderRelease(root, version = OLDER_VERSION) {
  const stateFile = path.join(root, 'installer.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const installed = state.releases.find(
    (release) => release.version === state.current,
  );
  fs.cpSync(
    path.join(root, 'releases', state.current),
    path.join(root, 'releases', version),
    {
      recursive: true,
      verbatimSymlinks: true,
    },
  );
  state.releases.unshift({
    ...installed,
    version,
    installedAt: '2000-01-01T00:00:00.000Z',
  });
  const upgradeTarget = state.current;
  state.current = version;
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  const temporary = path.join(root, 'current.smoke.tmp');
  fs.rmSync(temporary, { force: true });
  fs.symlinkSync(path.join('releases', version, 'hub'), temporary);
  fs.renameSync(temporary, path.join(root, 'current'));
  return { name: state.name, upgradeTarget };
}

/**
 * Registers a copy of `source` whose server entry throws, as a newer release on disk. Its CLI still works, so the
 * upgrade's own checks pass and it fails only once it starts — the path that ends in an automatic rollback.
 */
export function registerBrokenRelease(root, source, version = BROKEN_VERSION) {
  const stateFile = path.join(root, 'installer.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const record = state.releases.find((release) => release.version === source);
  const target = path.join(root, 'releases', version);
  fs.cpSync(path.join(root, 'releases', source), target, {
    recursive: true,
    verbatimSymlinks: true,
  });
  const entry = path.join(target, 'hub', 'dist', 'server', 'standalone.js');
  fs.writeFileSync(
    entry,
    `throw new Error('smoke test: this release fails to start');\n${fs.readFileSync(entry, 'utf8')}`,
  );
  state.releases.push({
    ...record,
    version,
    installedAt: new Date().toISOString(),
  });
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  return version;
}

/**
 * Records the last upgrade as having migrated, so the rollback after it restores the database. Upgrading to a copy of
 * the same release applies nothing, and without this the restore path would never run.
 */
export function markLastUpgradeMigrated(root) {
  const stateFile = path.join(root, 'installer.json');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const last = state.history.findLast((entry) => entry.action === 'upgrade');
  if (!last) throw new Error('installer.json records no upgrade.');
  last.migrations = 1;
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

/** Opens the Hub's SQLite database with the better-sqlite3 a release ships. */
function openDatabase(root, release, options = {}) {
  const require = createRequire(
    path.join(root, 'releases', release, 'hub', 'dist', 'package.json'),
  );
  const Database = require('better-sqlite3');
  const database = new Database(
    path.join(root, 'storage', 'hub', 'database', 'main.sqlite'),
    options,
  );
  database.pragma('busy_timeout = 5000');
  return database;
}

const MARKER_TABLE = 'hub_installer_smoke_marker';

export function writeMarker(root, release) {
  const database = openDatabase(root, release);
  try {
    database.exec(`CREATE TABLE IF NOT EXISTS ${MARKER_TABLE} (id INTEGER)`);
  } finally {
    database.close();
  }
}

export function hasMarker(root, release) {
  const database = openDatabase(root, release, { readonly: true });
  try {
    return Boolean(
      database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get(MARKER_TABLE),
    );
  } finally {
    database.close();
  }
}

/** A running process's command line: from /proc on Linux, from ps elsewhere. */
export function processCommandLine(pid) {
  try {
    return fs
      .readFileSync(`/proc/${pid}/cmdline`, 'utf8')
      .split('\0')
      .filter(Boolean)
      .join(' ');
  } catch {
    return spawnSync('ps', ['-o', 'args=', '-p', String(pid)], {
      encoding: 'utf8',
    }).stdout.trim();
  }
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

/**
 * Runs the whole check. `installer` is the command that runs hub-installer; `env` must reach pm2 and a registry that
 * serves the Hub template. Throws on the first failed expectation, leaving the Hub root in place for inspection.
 */
export function runHubSmoke({
  root,
  port,
  installer,
  env = process.env,
  log = console.error,
}) {
  const run = (args) => {
    const result = spawnSync(
      installer[0],
      [...installer.slice(1), ...args, '--json'],
      {
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
        maxBuffer: 16 * 1024 * 1024,
      },
    );
    if (result.error)
      fail(`hub-installer ${args[0]} did not run: ${result.error.message}`);
    let envelope;
    try {
      envelope = JSON.parse(result.stdout);
    } catch {
      fail(
        `hub-installer ${args[0]} printed no JSON result (exit ${result.status}).`,
      );
    }
    return { exitCode: result.status, envelope };
  };
  const hub = (args) => {
    const { envelope } = run(args);
    if (!envelope.ok)
      fail(
        `hub-installer ${args[0]} failed with ${envelope.error.code}: ${envelope.error.message}`,
      );
    return envelope.result;
  };
  const pm2 = (args) => {
    const result = spawnSync('pm2', args, { env, stdio: 'ignore' });
    if (result.error || result.status !== 0)
      fail(`pm2 ${args.join(' ')} failed.`);
  };
  const checkStatus = (expectedCurrent) => {
    const status = hub(['status', '--dir', root, '--offline']);
    assert(status.health.ok, `The Hub does not answer ${status.health.url}.`);
    assert(
      status.process?.status === 'online',
      'The pm2 process is not online.',
    );
    // What installer.json says is not proof: the process pm2 watches must be running that release's server.
    const entry = path.join(
      'releases',
      expectedCurrent,
      'hub',
      'dist',
      'server',
      'standalone.js',
    );
    const commandLine = processCommandLine(status.process.pid);
    assert(
      commandLine.includes(entry),
      `The pm2 process runs "${commandLine}", not ${entry}.`,
    );
    assert(
      status.node.matches,
      'The release was built for another Node major.',
    );
    assert(!status.pending, 'An operation is still recorded as pending.');
    assert(
      status.current === expectedCurrent,
      `The Hub runs ${status.current}, expected ${expectedCurrent}.`,
    );
    return status;
  };

  const waitUntilHealthy = (timeoutMs = 180_000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const status = hub(['status', '--dir', root, '--offline']);
      if (status.health.ok) return;
      if (Date.now() > deadline)
        fail(`The Hub did not answer ${status.health.url} after restarting.`);
      spawnSync('sleep', ['2']);
    }
  };

  log('== Install');
  const installed = hub([
    'install',
    root,
    '--port',
    String(port),
    '--origin',
    `http://127.0.0.1:${port}`,
  ]);
  assert(installed.started, 'install did not start the Hub.');

  log('== Check the installed Hub');
  checkStatus(installed.version);
  assert(
    !fs.existsSync(
      path.join(root, 'releases', installed.version, 'hub', 'storage'),
    ),
    'The release directory holds a storage/ directory; HUB_STORAGE_DIR was not applied.',
  );
  assert(
    fs.existsSync(path.join(root, 'storage', 'hub', 'database', 'main.sqlite')),
    'The Hub database is not in the shared storage/ directory.',
  );

  log('== Rebuild the installed version for this machine');
  const rebuilt = hub(['upgrade', '--dir', root, '--rebuild', '--yes']);
  assert(
    rebuilt.rebuilt === true && rebuilt.to === installed.version,
    'upgrade --rebuild did not rebuild the installed version.',
  );
  for (const suffix of ['rebuild', 'replaced']) {
    assert(
      !fs.existsSync(
        path.join(root, 'releases', `${installed.version}.${suffix}`),
      ),
      `The rebuild left releases/${installed.version}.${suffix} behind.`,
    );
  }
  checkStatus(installed.version);

  log(`== Restart onto a copy registered as ${OLDER_VERSION}`);
  const { name, upgradeTarget } = registerOlderRelease(root);
  // launcher.mjs resolves `current` on every start, so a plain restart runs the release just switched to.
  pm2(['restart', name]);
  waitUntilHealthy();
  checkStatus(OLDER_VERSION);

  log(`== Upgrade from ${OLDER_VERSION}`);
  const upgraded = hub([
    'upgrade',
    '--dir',
    root,
    '--to',
    upgradeTarget,
    '--yes',
  ]);
  assert(
    upgraded.upgraded && upgraded.reused,
    'upgrade did not reuse the release on disk.',
  );
  assert(
    upgraded.from === OLDER_VERSION,
    `upgrade started from ${upgraded.from}.`,
  );
  assert(
    fs.existsSync(path.join(root, upgraded.backup, 'main.sqlite')),
    'upgrade took no database backup.',
  );
  checkStatus(upgradeTarget);

  log('== Roll back');
  const rolledBack = hub(['rollback', '--dir', root, '--yes']);
  assert(
    rolledBack.to === OLDER_VERSION,
    `rollback returned to ${rolledBack.to}.`,
  );
  checkStatus(OLDER_VERSION);

  log('== Roll back an upgrade that migrated, restoring the database');
  const again = hub(['upgrade', '--dir', root, '--to', upgradeTarget, '--yes']);
  assert(again.upgraded, 'the second upgrade did not run.');
  writeMarker(root, upgradeTarget);
  markLastUpgradeMigrated(root);
  const restored = hub(['rollback', '--dir', root, '--yes']);
  assert(
    restored.databaseRestored === true,
    'rollback did not restore the database after an upgrade that migrated.',
  );
  assert(
    !hasMarker(root, OLDER_VERSION),
    'a table written after the upgrade survived the restore.',
  );
  checkStatus(OLDER_VERSION);

  log(`== Upgrade to ${BROKEN_VERSION}, which fails to start`);
  registerBrokenRelease(root, upgradeTarget);
  const failed = run([
    'upgrade',
    '--dir',
    root,
    '--to',
    BROKEN_VERSION,
    '--yes',
    '--health-timeout',
    '60',
  ]);
  assert(
    failed.exitCode === 3 &&
      failed.envelope.error?.code === 'UPGRADE_ROLLED_BACK',
    `a failed start should roll back with exit 3 and UPGRADE_ROLLED_BACK, got exit ${failed.exitCode} and ${failed.envelope.error?.code ?? 'no error'}.`,
  );
  checkStatus(OLDER_VERSION);

  return { root, version: installed.version };
}

if (import.meta.main) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = runHubSmoke(options);
    console.log(
      `Hub installer smoke test passed with ${result.version} at ${result.root}.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
