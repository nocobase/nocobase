#!/usr/bin/env node
// Installs, checks, upgrades and rolls back an application with app-installer from a deployment archive built by
// `pnpm build --tar`. CI runs it with the installer from the checkout;
// `pnpm unreleased:installer-smoke` runs it against the unreleased snapshot. Keeping one script keeps the two from
// drifting apart.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const usage = `Usage: node scripts/smoke-app-installer.mjs --root DIR --archive FILE
  [--port 13000] [-- INSTALLER...]

Runs install, status, upgrade and rollback against a new installation at DIR from the
deployment archive FILE, built by \`pnpm build --tar\` for this machine. INSTALLER is the
command that runs app-installer, "node packages/tools/app-installer/bin/run.js" by default. pm2 must be
on PATH; set PM2_HOME to keep the test away from your own pm2 processes.`;

export function parseArgs(argv) {
  const separator = argv.indexOf('--');
  const own = separator === -1 ? argv : argv.slice(0, separator);
  const installer =
    separator === -1
      ? ['node', 'packages/tools/app-installer/bin/run.js']
      : argv.slice(separator + 1);
  const options = { port: 13000, installer };
  for (let i = 0; i < own.length; i++) {
    const key = own[i];
    const value = own[i + 1];
    if (
      !['--root', '--port', '--archive'].includes(key) ||
      !value ||
      value.startsWith('--')
    )
      throw new Error(`Invalid option: ${key}\n\n${usage}`);
    options[key.slice(2)] = value;
    i++;
  }
  if (!options.root) throw new Error(`--root is required.\n\n${usage}`);
  if (!options.archive) throw new Error(`--archive is required.\n\n${usage}`);
  options.root = path.resolve(options.root);
  options.archive = path.resolve(options.archive);
  options.port = Number(options.port);
  if (
    !Number.isInteger(options.port) ||
    options.port < 1 ||
    options.port > 65535
  )
    throw new Error('Invalid --port.');
  if (installer.length === 0)
    throw new Error('The installer command is empty.');
  return options;
}

/** A release id as app-installer forms it: the version and the UTC build time. */
export function releaseIdOf(version, builtAt) {
  const compact = new Date(builtAt)
    .toISOString()
    .replace(/\.\d+Z$/u, 'Z')
    .replaceAll('-', '')
    .replaceAll(':', '');
  return `${version}_${compact}`;
}

const releasePath = (root, id) => path.join(root, 'releases', id, 'app');

function readState(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'installer.json'), 'utf8'));
}

function writeState(root, state) {
  fs.writeFileSync(
    path.join(root, 'installer.json'),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

function breakServerEntry(deploymentRoot) {
  const entry = path.join(deploymentRoot, 'dist', 'server', 'standalone.js');
  fs.writeFileSync(
    entry,
    `throw new Error('smoke test: this release fails to start');\n${fs.readFileSync(entry, 'utf8')}`,
  );
}

/**
 * Writes a copy of a deployment archive as a later build: its manifest gets `builtAt`, and with `broken` its server
 * entry throws on start. The system `tar` unpacks and packs it, which keeps symbolic links and modes as they were.
 */
export function repackArchive(source, target, { builtAt, broken = false }) {
  const tree = fs.mkdtempSync(path.join(os.tmpdir(), 'app-installer-smoke-'));
  try {
    const untar = spawnSync('tar', ['-xzf', source, '-C', tree], {
      stdio: 'inherit',
    });
    if (untar.status !== 0) fail(`Could not unpack ${source}.`);
    const manifestFile = path.join(tree, 'dist', 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    manifest.nocobase = { ...manifest.nocobase, builtAt };
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    if (broken) breakServerEntry(tree);
    const pack = spawnSync(
      'tar',
      ['-czf', target, '-C', tree, 'config.example.yml', 'dist'],
      { stdio: 'inherit' },
    );
    if (pack.status !== 0) fail(`Could not pack ${target}.`);
    return releaseIdOf(manifest.version, builtAt);
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
  }
}

/**
 * Records the last upgrade as having migrated, so the rollback after it restores the database. Upgrading to a copy of
 * the same release applies nothing, and without this the restore path would never run.
 */
export function markLastUpgradeMigrated(root) {
  const state = readState(root);
  const last = state.history.findLast((entry) => entry.action === 'upgrade');
  if (!last) throw new Error('installer.json records no upgrade.');
  last.migrations = 1;
  writeState(root, state);
}

/** The application's SQLite database: the one file a fresh application has. */
export function databaseFile(root) {
  const found = fs
    .readdirSync(path.join(root, 'storage'), {
      recursive: true,
      withFileTypes: true,
    })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sqlite'));
  if (found.length !== 1)
    fail(
      `Expected one SQLite database under ${path.join(root, 'storage')}, found ${found.length}.`,
    );
  return path.join(found[0].parentPath, found[0].name);
}

/** Opens the application's SQLite database with the better-sqlite3 a release ships. */
function openDatabase(root, releaseId, options = {}) {
  const require = createRequire(
    path.join(releasePath(root, releaseId), 'dist', 'package.json'),
  );
  const Database = require('better-sqlite3');
  const database = new Database(databaseFile(root), options);
  database.pragma('busy_timeout = 5000');
  return database;
}

const MARKER_TABLE = 'app_installer_smoke_marker';

export function writeMarker(root, releaseId) {
  const database = openDatabase(root, releaseId);
  try {
    database.exec(`CREATE TABLE IF NOT EXISTS ${MARKER_TABLE} (id INTEGER)`);
  } finally {
    database.close();
  }
}

export function hasMarker(root, releaseId) {
  const database = openDatabase(root, releaseId, { readonly: true });
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

/** Runs the installer, reads its envelope, and checks what is running. */
function createHarness({ root, installer, env }) {
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
      fail(`app-installer ${args[0]} did not run: ${result.error.message}`);
    let envelope;
    try {
      envelope = JSON.parse(result.stdout);
    } catch {
      fail(
        `app-installer ${args[0]} printed no JSON result (exit ${result.status}).`,
      );
    }
    return { exitCode: result.status, envelope };
  };
  const installerOk = (args) => {
    const { envelope } = run(args);
    if (!envelope.ok)
      fail(
        `app-installer ${args[0]} failed with ${envelope.error.code}: ${envelope.error.message}`,
      );
    return envelope.result;
  };
  const pm2 = (args) => {
    const result = spawnSync('pm2', args, { env, stdio: 'ignore' });
    if (result.error || result.status !== 0)
      fail(`pm2 ${args.join(' ')} failed.`);
  };
  const checkStatus = (expectedCurrent) => {
    const status = installerOk(['status', '--dir', root]);
    assert(
      status.health.ok,
      `The application does not answer ${status.health.url}.`,
    );
    assert(
      status.process?.status === 'online',
      'The pm2 process is not online.',
    );
    // What installer.json says is not proof: the process pm2 watches must be running that release's server.
    const entry = path.join(
      'releases',
      expectedCurrent,
      'app',
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
      `The installation runs ${status.current}, expected ${expectedCurrent}.`,
    );
    return status;
  };
  const waitUntilHealthy = (timeoutMs = 180_000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const status = installerOk(['status', '--dir', root]);
      if (status.health.ok) return;
      if (Date.now() > deadline)
        fail(
          `The application did not answer ${status.health.url} after restarting.`,
        );
      spawnSync('sleep', ['2']);
    }
  };
  const checkStorage = (releaseId) => {
    assert(
      !fs.existsSync(path.join(releasePath(root, releaseId), 'storage')),
      'The release directory holds a storage/ directory; APP_STORAGE_DIR was not applied.',
    );
    databaseFile(root);
  };
  const expectRolledBack = (failed) =>
    assert(
      failed.exitCode === 3 &&
        failed.envelope.error?.code === 'UPGRADE_ROLLED_BACK',
      `a failed start should roll back with exit 3 and UPGRADE_ROLLED_BACK, got exit ${failed.exitCode} and ${failed.envelope.error?.code ?? 'no error'}.`,
    );
  return {
    run,
    installer: installerOk,
    pm2,
    checkStatus,
    waitUntilHealthy,
    checkStorage,
    expectRolledBack,
  };
}

/**
 * Runs the whole check for a deployment archive. `archive` must be built for this machine; later builds are made from
 * it by rewriting its build time, so every upgrade here is a new build of the same version. Throws on the first failed
 * expectation, leaving the installation in place for inspection.
 */
export function runArchiveSmoke({
  root,
  port,
  archive,
  installer,
  env = process.env,
  log = console.error,
}) {
  const smoke = createHarness({ root, installer, env });
  const archives = fs.mkdtempSync(
    path.join(os.tmpdir(), 'app-installer-archives-'),
  );

  try {
    log('== Install from the archive');
    const installed = smoke.installer([
      'install',
      root,
      '--archive',
      archive,
      '--port',
      String(port),
      '--origin',
      `http://127.0.0.1:${port}`,
    ]);
    assert(installed.started, 'install did not start the application.');
    const first = installed.releaseId;

    log('== Check the installed application');
    const status = smoke.checkStatus(first);
    assert(
      status.source?.kind === 'archive',
      'status does not report an archive installation.',
    );
    smoke.checkStorage(first);

    // Later than the installed build, and than now, so the ids sort after it whatever the archive's own time was.
    const base = Math.max(Date.now(), Date.parse(installed.builtAt));
    const buildAt = (minutes) =>
      new Date(base + minutes * 60_000).toISOString();
    const nextArchive = path.join(archives, 'next.tar.gz');
    const next = repackArchive(archive, nextArchive, { builtAt: buildAt(1) });

    log('== Upgrade to a later build of the same version');
    const upgraded = smoke.installer([
      'upgrade',
      '--dir',
      root,
      '--archive',
      nextArchive,
      '--yes',
    ]);
    assert(
      upgraded.upgraded && !upgraded.reused && upgraded.to === next,
      `upgrade did not switch to ${next}.`,
    );
    assert(upgraded.from === first, `upgrade started from ${upgraded.from}.`);
    assert(
      fs.existsSync(path.join(root, upgraded.backup, 'backup.json')),
      'upgrade took no database backup.',
    );
    smoke.checkStatus(next);
    smoke.checkStorage(next);

    log('== Roll back');
    const rolledBack = smoke.installer(['rollback', '--dir', root, '--yes']);
    assert(rolledBack.to === first, `rollback returned to ${rolledBack.to}.`);
    smoke.checkStatus(first);

    log('== Roll back an upgrade that migrated, restoring the database');
    const again = smoke.installer([
      'upgrade',
      '--dir',
      root,
      '--archive',
      nextArchive,
      '--yes',
    ]);
    assert(
      again.upgraded && again.reused,
      'the second upgrade did not reuse the release on disk.',
    );
    writeMarker(root, next);
    markLastUpgradeMigrated(root);
    const restored = smoke.installer(['rollback', '--dir', root, '--yes']);
    assert(
      restored.databaseRestored === true,
      'rollback did not restore the database after an upgrade that migrated.',
    );
    assert(
      !hasMarker(root, first),
      'a table written after the upgrade survived the restore.',
    );
    smoke.checkStatus(first);

    log('== Upgrade to a build that fails to start');
    const brokenArchive = path.join(archives, 'broken.tar.gz');
    repackArchive(archive, brokenArchive, {
      builtAt: buildAt(2),
      broken: true,
    });
    smoke.expectRolledBack(
      smoke.run([
        'upgrade',
        '--dir',
        root,
        '--archive',
        brokenArchive,
        '--yes',
        '--health-timeout',
        '60',
      ]),
    );
    smoke.checkStatus(first);

    return { root, version: installed.version };
  } finally {
    fs.rmSync(archives, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = runArchiveSmoke(options);
    console.log(
      `app-installer smoke test passed with ${result.version} at ${result.root}.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
