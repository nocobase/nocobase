import path from 'node:path';

/** The directory inside `releases/<id>/` holding a release's deployment root: `dist/` and `config.example.yml`. */
export const RELEASE_APP_DIR = 'app';

/**
 * A published template the installer can build on the server. Only the Hub is offered: any other template built this
 * way would be an unmodified sample application.
 */
export interface TemplateDefinition {
  /** What `--template` takes. */
  name: string;
  /** How messages name what the template builds. */
  title: string;
  package: string;
  /**
   * The project name the template is generated under. It becomes the application's `package.json` name, which owns
   * its migration history, so it must stay the same across releases or a later version would not recognise the
   * migrations an earlier one applied.
   */
  projectName: string;
  /**
   * Where the template's application is mounted unless `--base-path` says otherwise. Earlier versions also compiled it
   * into their client, and a build too old to record `nocobase.basePath` is assumed to have used it.
   */
  basePath: string;
}

export const HUB_TEMPLATE: TemplateDefinition = {
  name: 'hub',
  title: 'Hub',
  package: '@nocobase/app-template-hub',
  projectName: 'hub',
  basePath: '/hub',
};

export const TEMPLATES: readonly TemplateDefinition[] = [HUB_TEMPLATE];

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
    appEnv: path.join(root, 'app.env'),
    configFile: path.join(root, 'config.yml'),
    storageDir: path.join(root, 'storage'),
    logsDir: path.join(root, 'logs'),
    outLog: path.join(root, 'logs/app.out.log'),
    errorLog: path.join(root, 'logs/app.err.log'),
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

/** Where a template build runs, one directory per version. */
export function buildRoot(layout: Layout, version: string): string {
  return path.join(layout.buildDir, version);
}

/** Where an archive is unpacked before its manifest names the release it is. */
export function stagingDir(layout: Layout): string {
  return path.join(layout.releasesDir, `.staging-${process.pid}`);
}
