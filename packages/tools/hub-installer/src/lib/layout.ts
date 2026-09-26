import path from 'node:path';

/**
 * The application name every release is generated under. It is the application's `package.json` name, which owns its
 * migration history, so it must stay the same across releases or a later version would not recognise the migrations
 * an earlier one applied.
 */
export const APP_NAME = 'hub';

/** Fixed in the Hub template and compiled into its client; the installer never changes it. */
export const HUB_BASE_PATH = '/hub';

export const TEMPLATE_PACKAGE = '@nocobase/app-template-hub';

/**
 * Everything the installer manages lives under one root. Releases are replaceable; `config.yml`, `hub.env` and
 * `storage/` are shared by every release and never touched by an upgrade.
 */
export interface Layout {
  root: string;
  hubEnv: string;
  configFile: string;
  storageDir: string;
  logsDir: string;
  releasesDir: string;
  buildDir: string;
  backupsDir: string;
  current: string;
  stateFile: string;
  lockFile: string;
  ecosystemFile: string;
  launcherFile: string;
}

export function layoutOf(root: string): Layout {
  return {
    root,
    hubEnv: path.join(root, 'hub.env'),
    configFile: path.join(root, 'config.yml'),
    storageDir: path.join(root, 'storage'),
    logsDir: path.join(root, 'logs'),
    releasesDir: path.join(root, 'releases'),
    buildDir: path.join(root, '.build'),
    backupsDir: path.join(root, 'backups'),
    current: path.join(root, 'current'),
    stateFile: path.join(root, 'installer.json'),
    lockFile: path.join(root, '.installer.lock'),
    ecosystemFile: path.join(root, 'ecosystem.config.cjs'),
    launcherFile: path.join(root, 'launcher.mjs'),
  };
}

/** A release's deployment root: the directory holding `dist/` and `config.example.yml`. */
export function releaseDir(layout: Layout, version: string): string {
  return path.join(layout.releasesDir, version, APP_NAME);
}

/** The path `current` points at, relative to the root so the whole root can be moved. */
export function releaseLinkTarget(version: string): string {
  return path.join('releases', version, APP_NAME);
}

/**
 * Where a rebuild of the running version is unpacked, beside the release it will replace. The running Hub keeps
 * serving from `releases/<version>/hub` until the downtime, when the two are swapped.
 */
export function stagedReleaseDir(layout: Layout, version: string): string {
  return path.join(layout.releasesDir, `${version}.rebuild`, APP_NAME);
}

/** Where the release a rebuild replaces waits until the rebuilt one is healthy, so a failed start can put it back. */
export function replacedReleaseDir(layout: Layout, version: string): string {
  return path.join(layout.releasesDir, `${version}.replaced`, APP_NAME);
}

export function buildRoot(layout: Layout, version: string): string {
  return path.join(layout.buildDir, version);
}
