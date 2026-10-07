import {
  cp,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

/**
 * pnpm version a generated app pins.
 *
 * The exact version matters: `packageManager` only accepts one, and a range like `pnpm@11` is silently ignored rather
 * than rejected, leaving the project on whatever pnpm the machine already had. It must stay on pnpm 11 or newer,
 * because `allowBuilds` — which lets the database driver compile its native addon — did not exist before then.
 */
export const REQUIRED_PACKAGE_MANAGER = 'pnpm@11.7.0';

async function isEmptyDirectory(directory: string): Promise<boolean> {
  try {
    const entries = await readdir(directory);
    return entries.length === 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return true;
    }

    throw error;
  }
}

export async function assertTargetIsUsable(directory: string): Promise<void> {
  if (!(await isEmptyDirectory(directory))) {
    throw new Error(
      `The directory "${directory}" already exists and is not empty. Choose another name, or remove it first.`,
    );
  }
}

/**
 * The minimum a generated project must ignore. `config.yml` carries the `secrets.keys` that `config init` generates
 * and `.env` carries a hub's settings, so committing either would publish local configuration; the rest are build
 * output and local state.
 */
const FALLBACK_GITIGNORE = [
  'node_modules/',
  'dist/',
  'coverage/',
  '',
  '# Local configuration, including the generated secrets key.',
  '/config.yml',
  '/config.toml',
  '/.env',
  '/.env.local',
  '',
  '# Local application state.',
  '/storage/',
  '/database.sqlite',
  '/database.sqlite-journal',
  '/database.sqlite-wal',
  '/database.sqlite-shm',
  // Written by `pnpm nocobase collections generate`: a cache of what this machine's database resolves every Collection
  // to, for every connection, regenerated rather than committed. Hand-written metadata lives in
  // `database/<connection>/metadata/` instead, so the whole collections directory can be ignored.
  '/database/*/collections/',
  '/.agents/',
  '/.claude/skills/',
  '/.agent-annotations/',
  '*.log',
  '',
].join('\n');

/**
 * Entries added even to a `.gitignore` the template shipped itself.
 *
 * Each names something this command writes rather than something the template owns, which is why a template has no
 * particular reason to have thought of it.
 */
const REQUIRED_GITIGNORE_ENTRIES = [
  '/.env',
  '/.agents/',
  '/.claude/skills/',
  '/.agent-annotations/',
] as const;

/**
 * Ensures the generated project has a `.gitignore`.
 *
 * npm refuses to publish a file by that name, so templates ship it as `.npmignore` or `gitignore` and it has to be
 * renamed on the way out. A template may ship neither — the published `@nocobase/app-template-default` currently does
 * not — and in that case a fallback is written rather than leaving the project with no ignore rules at all, which
 * would put `node_modules` and the secret-bearing `config.yml` on the first commit.
 */
async function restoreGitignore(directory: string): Promise<void> {
  const target = path.join(directory, '.gitignore');
  let restored = false;

  for (const candidate of ['gitignore', '.npmignore']) {
    try {
      await rename(path.join(directory, candidate), target);
      restored = true;
      break;
    } catch {
      // Try the next candidate.
    }
  }

  if (!restored) {
    // `wx` leaves an existing file alone, so a template that ships a real `.gitignore` keeps it.
    try {
      await writeFile(target, FALLBACK_GITIGNORE, {
        encoding: 'utf8',
        flag: 'wx',
      });
    } catch {
      // The file already exists, which is the outcome this function is for.
    }
  }

  const contents = await readFile(target, 'utf8');
  const missing = REQUIRED_GITIGNORE_ENTRIES.filter(
    (entry) => !contents.split(/\r?\n/u).includes(entry),
  );
  if (missing.length > 0) {
    const separator = contents === '' || contents.endsWith('\n') ? '' : '\n';
    await writeFile(
      target,
      `${contents}${separator}\n# Written when this project was generated.\n${missing.join('\n')}\n`,
      'utf8',
    );
  }
}

/**
 * Source files carrying the template's own package name, which has to become the application's.
 *
 * The name is not decoration in any of these: `client/runtime.ts` declares the `packageName` that becomes the
 * application's i18n namespace on the browser side, while the server derives the same namespace from `package.json`.
 * Left unrewritten the two disagree, so `APP_NS` resolves to a different namespace in each half of the application.
 *
 * `server/providers/app-example.ts` names a service token, and a token's identity is its name.
 *
 * Documentation is deliberately absent. Where it names a template package, as the Examples `README.MD` names
 * `@nocobase/app-template-default`, it refers to the upstream template, which stays correct and would be made wrong
 * by rewriting it.
 */
const PACKAGE_NAME_SOURCES = [
  'client/runtime.ts',
  'client/service-provider.ts',
  'server/providers/app-example.ts',
] as const;

/**
 * Replaces the template's package name with the application's in the few sources that embed it.
 *
 * A missing file is skipped rather than treated as an error: the list covers all three templates, and none is
 * required to keep a file another has.
 */
async function rewritePackageName(
  directory: string,
  templateName: string,
  appName: string,
): Promise<void> {
  if (templateName === '' || templateName === appName) {
    return;
  }

  await Promise.all(
    PACKAGE_NAME_SOURCES.map(async (relative) => {
      const target = path.join(directory, relative);
      let contents: string;

      try {
        contents = await readFile(target, 'utf8');
      } catch {
        return;
      }

      const rewritten = contents.split(templateName).join(appName);

      if (rewritten !== contents) {
        await writeFile(target, rewritten, 'utf8');
      }
    }),
  );
}

export interface ScaffoldOptions {
  templateDirectory: string;
  targetDirectory: string;
  name: string;
  /** Extra files to write once the template is in place, keyed by path relative to the target. */
  extraFiles?: Record<string, string>;
}

/**
 * Copies an extracted template into its final location and rewrites what identifies it as the template.
 *
 * The manifest name and display name become the app's, the publish metadata is dropped so a generated app is not
 * pointed at the template's own release, and the few sources that embed the template's package name are rewritten —
 * see `PACKAGE_NAME_SOURCES` for why each one matters. Everything else is kept as packed, including the version,
 * which leaves a record of the template version the app came from, and the dependency ranges pnpm already resolved
 * from `workspace:` and `catalog:` when it built the tarball.
 */
export async function scaffoldFromTemplate(
  options: ScaffoldOptions,
): Promise<void> {
  const { extraFiles, name, targetDirectory, templateDirectory } = options;

  await mkdir(targetDirectory, { recursive: true });
  await cp(templateDirectory, targetDirectory, { recursive: true });
  await restoreGitignore(targetDirectory);

  const manifestPath = path.join(targetDirectory, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
    string,
    unknown
  >;

  const templateName = typeof manifest.name === 'string' ? manifest.name : '';

  manifest.name = name;

  // Records which template this application was generated from, because nothing else left in the manifest can say.
  // `name` has just become the application's own, and `nocobase.templateKind` is `app` for both Default and Examples,
  // so an upgrade that has to diff two releases of the originating template would have nothing to resolve. Written
  // under `nocobase` beside `defaultTemplateVersion`, which records how far that source has been merged.
  if (templateName !== '') {
    const nocobase =
      typeof manifest.nocobase === 'object' && manifest.nocobase !== null
        ? (manifest.nocobase as Record<string, unknown>)
        : {};

    nocobase.templatePackage = templateName;
    manifest.nocobase = nocobase;
  }

  // `displayName` is what the client shell renders in its sidebar footer: the server publishes it from the
  // application's package.json as `app.displayName`. Deleting it left nothing to publish, so a generated app fell
  // back to the literal "Default Template" in the shell — the template's label, on every app built from it.
  manifest.displayName = name;

  // The remaining publish metadata describes the template rather than what is built from it, and would point a
  // generated app at the template's own release.
  delete manifest.description;
  delete manifest.publishConfig;
  delete manifest.repository;

  // `pnpm pack` strips `packageManager` from the tarball, so the template cannot carry it through to the app on its
  // own — it has to be written here. Without it the project uses whatever pnpm the machine defaults to, and pnpm 10
  // does not read `allowBuilds` at all: the native driver installs without compiling and only fails much later.
  manifest.packageManager ??= REQUIRED_PACKAGE_MANAGER;

  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  await rewritePackageName(targetDirectory, templateName, name);

  for (const [relative, contents] of Object.entries(extraFiles ?? {})) {
    const target = path.join(targetDirectory, relative);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
  }
}

export async function removeDirectory(directory: string): Promise<void> {
  await rm(directory, { force: true, recursive: true });
}

/**
 * Validates an app name against what npm accepts for an unscoped package, since the name is written straight into the
 * generated `package.json`. Directory separators are rejected too: the name is also used as the default directory.
 */
export function assertValidAppName(name: string): void {
  if (name.trim() === '') {
    throw new Error('The app name cannot be empty.');
  }

  if (name.includes('/') || name.includes('\\')) {
    throw new Error(
      `"${name}" cannot be used as an app name because it contains a path separator.`,
    );
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/u.test(name)) {
    throw new Error(
      `"${name}" is not a valid app name. Use lowercase letters, digits, dashes, dots, and underscores, starting with a letter or digit.`,
    );
  }
}
