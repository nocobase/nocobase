import path from 'node:path';

/** The directory inside `releases/<id>/` holding a release's deployment root: `dist/` and `config.example.yml`. */
export const RELEASE_APP_DIR = 'app';

/**
 * Everything the installer manages lives under one root. Releases are replaceable; `config.yml`, `app.env` and
 * `storage/` are shared by every release and never touched by an upgrade.
 */
export interface Layout {
  root: string;
  appEnv: string;
  configFile: string;
  storageDir: string;
  logsDir: string;
  outLog: string;
  errorLog: string;
  releasesDir: string;
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
    appEnv: path.join(root, 'app.env'),
    configFile: path.join(root, 'config.yml'),
    storageDir: path.join(root, 'storage'),
    logsDir: path.join(root, 'logs'),
    outLog: path.join(root, 'logs/app.out.log'),
    errorLog: path.join(root, 'logs/app.err.log'),
    releasesDir: path.join(root, 'releases'),
    backupsDir: path.join(root, 'backups'),
    current: path.join(root, 'current'),
    stateFile: path.join(root, 'installer.json'),
    lockFile: path.join(root, '.installer.lock'),
    ecosystemFile: path.join(root, 'ecosystem.config.cjs'),
    launcherFile: path.join(root, 'launcher.mjs'),
  };
}

/**
 * A release's identity: its version and when it was built, as in `1.2.0_20260927T005500Z`. Two builds of the same
 * version are two releases, so a project that deploys without bumping its version still gets a release of its own
 * each time. Neither `-`, which would make the id read as a semantic-version prerelease, nor `+`, which is awkward in a
 * directory name and a shell command, separates the parts.
 */
export function releaseId(version: string, builtAt: string): string {
  const compact = new Date(builtAt)
    .toISOString()
    .replace(/\.\d+Z$/u, 'Z')
    .replaceAll('-', '')
    .replaceAll(':', '');
  return `${version}_${compact}`;
}

/** A release's deployment root: the directory holding `dist/` and `config.example.yml`. */
export function releaseDir(layout: Layout, id: string): string {
  return path.join(layout.releasesDir, id, RELEASE_APP_DIR);
}

/** The path `current` points at, relative to the root so the whole root can be moved. */
export function releaseLinkTarget(id: string): string {
  return path.join('releases', id, RELEASE_APP_DIR);
}

/** Where an archive is unpacked before its manifest names the release it is. */
export function stagingDir(layout: Layout): string {
  return path.join(layout.releasesDir, `.staging-${process.pid}`);
}
