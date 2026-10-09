import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CommandFailedError, runCommand } from './run-command.ts';

/** The public npm registry that carries NocoBase packages and templates. */
export const DEFAULT_REGISTRY = 'https://registry.npmjs.org';

/**
 * What a template needs scaffolding around it, which is not the same for every template.
 *
 * Both apps and hubs own a database and receive config.yml. Hubs also receive deployment settings in .env.
 *
 * The kind belongs to the template rather than to the flag, so `--template hub` and `--template ./packages/templates/app-template-hub` are scaffolded identically.
 */
export type TemplateKind = 'app' | 'hub';

export interface TemplateAlias {
  /** Published package the name resolves to. Carries no tag; the channel is applied separately. */
  packageName: string;
  kind: TemplateKind;
}

/**
 * Templates that can be named instead of spelled out as a package. A short name is what people will reach for, and it
 * keeps the published package name an implementation detail — repointing `default` at a different package then costs
 * nothing on the command line.
 *
 * The entries carry no tag: which channel a name resolves to is chosen separately, so that `--template-tag` can move
 * every alias at once rather than having to be spelled into each one.
 *
 * More templates are expected here. Add an entry rather than asking anyone to type the package specifier.
 */
export const TEMPLATE_ALIASES: Readonly<Record<string, TemplateAlias>> = {
  default: { kind: 'app', packageName: '@nocobase/app-template-default' },
  examples: { kind: 'app', packageName: '@nocobase/app-template-examples' },
  hub: { kind: 'hub', packageName: '@nocobase/app-template-hub' },
};

export const DEFAULT_TEMPLATE = 'default';

/** Channels a template can be fetched from. */
export const TEMPLATE_TAGS: readonly string[] = ['latest', 'beta'];

/**
 * The channel a named template resolves to when `--template-tag` is not given.
 *
 * `latest` rather than `beta`, because `beta` names the oldest template rather than the newest. changesets leaves that
 * tag on a package's first published version and tags every release since as `latest`: it treats a package whose
 * versions are all prereleases as publishing for the first time, and tags `latest` to keep the package installable.
 * That holds on every release until a stable version ships, so defaulting to `beta` would hand everyone a stale
 * template. `latest` is the newest published version today, and the right default once stable versions exist.
 */
export const DEFAULT_TEMPLATE_TAG = 'latest';

export interface ResolveTemplateSourceOptions {
  /** Channel a named template resolves to. Ignored for a package specifier or a local path. */
  tag?: string;
}

/**
 * Resolves what `--template` was given into something `downloadTemplate` can fetch.
 *
 * A known name becomes its package at the requested channel. Anything else passes through untouched, so a package
 * specifier or a local path still works — an alias table that swallowed those would make the flag less capable than it
 * was. That also means `--template-tag` only applies to a name: a caller who spelled out `pkg@1.2.3` already said
 * which version they want, and silently appending a tag would override the more specific request.
 */
export function resolveTemplateSource(
  template: string,
  options: ResolveTemplateSourceOptions = {},
): string {
  const name = template.trim();
  const alias = lookupTemplateAlias(name);

  if (alias === undefined) {
    return name;
  }

  return `${alias.packageName}@${options.tag ?? DEFAULT_TEMPLATE_TAG}`;
}

/** Reads the alias table without inheriting `Object.prototype`, so `constructor` does not read as a template. */
function lookupTemplateAlias(name: string): TemplateAlias | undefined {
  return Object.hasOwn(TEMPLATE_ALIASES, name)
    ? TEMPLATE_ALIASES[name]
    : undefined;
}

/**
 * Decides which flow a template is scaffolded with, from the name given on the command line and the manifest of what
 * was actually downloaded.
 *
 * A name settles it outright. Anything else — a package specifier, a local path — is only known once the template is
 * on disk, so the kind is read from its own manifest: `nocobase.templateKind` when it declares one, and otherwise the
 * package name, which is what lets `--template ./packages/templates/app-template-hub` work against a checkout that
 * predates the field. An unrecognized template is treated as an app, which is what every template was before this
 * distinction existed.
 */
export function resolveTemplateKind(
  template: string,
  manifest: { name?: string; nocobase?: { templateKind?: string } } = {},
): TemplateKind {
  const alias = lookupTemplateAlias(template.trim());

  if (alias) {
    return alias.kind;
  }

  const declared = manifest.nocobase?.templateKind;

  if (declared === 'app' || declared === 'hub') {
    return declared;
  }

  return manifest.name === HUB_TEMPLATE_PACKAGE ? 'hub' : 'app';
}

/** The published hub template, named here so a package specifier for it is recognized as well as the `hub` name is. */
export const HUB_TEMPLATE_PACKAGE = '@nocobase/app-template-hub';

export function isTemplateAlias(template: string): boolean {
  return lookupTemplateAlias(template.trim()) !== undefined;
}

const PACK_TIMEOUT_MS = 5 * 60 * 1000;

export interface ResolvedTemplate {
  /** Directory holding the extracted template. The caller owns it and is responsible for cleanup. */
  directory: string;
  name: string;
  version: string;
  /** `nocobase.templateKind` as the template declared it, if it declared one. */
  kind?: string;
}

export interface DownloadTemplateOptions {
  /** A published package (`pkg`, `pkg@1.2.3`) or a path to a local package directory. */
  source: string;
  registry?: string;
}

/**
 * A source is treated as a local directory when it looks like a path. Package names never start with `.` or a
 * separator, and only a path can be absolute, so the two cases stay unambiguous without touching the filesystem.
 */
export function isLocalTemplateSource(source: string): boolean {
  return (
    source.startsWith('.') ||
    source.startsWith('/') ||
    source.startsWith('~') ||
    /^[A-Za-z]:[\\/]/u.test(source)
  );
}

/**
 * `npm pack` rewrites nothing, while `pnpm pack` resolves pnpm's own `workspace:` and `catalog:` protocols into real
 * version ranges. A template packed from a workspace checkout therefore has to go through pnpm, or the generated
 * project would carry protocols that npm cannot install.
 */
function packerFor(source: string): {
  command: string;
  args: (destination: string) => string[];
} {
  if (isLocalTemplateSource(source)) {
    return {
      command: 'pnpm',
      args: (destination) => ['pack', '--out', destination],
    };
  }

  return {
    command: 'npm',
    args: () => ['pack', '--silent', source],
  };
}

async function findTarball(directory: string): Promise<string> {
  const entries = await readdir(directory);
  const tarball = entries.find((entry) => entry.endsWith('.tgz'));

  if (!tarball) {
    throw new Error(
      `Packing the template produced no tarball in ${directory}.`,
    );
  }

  return path.join(directory, tarball);
}

async function readTemplateManifest(
  directory: string,
): Promise<{ name: string; version: string; kind?: string }> {
  const manifestPath = path.join(directory, 'package.json');
  let raw: string;

  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch {
    throw new Error(
      'The template has no package.json, so it is not a valid app template.',
    );
  }

  const manifest = JSON.parse(raw) as {
    name?: string;
    version?: string;
    nocobase?: { templateKind?: string };
  };

  return {
    name: manifest.name ?? 'unknown',
    version: manifest.version ?? '0.0.0',
    kind: manifest.nocobase?.templateKind,
  };
}

/**
 * Downloads a template and extracts it into a temporary directory.
 *
 * Both a published package and a local directory are fetched by packing them into a tarball, which keeps the template
 * to exactly the files its `files` field publishes — a `git clone` would drag in the whole repository and leave the
 * workspace protocols unresolved.
 */
export async function downloadTemplate(
  options: DownloadTemplateOptions,
): Promise<ResolvedTemplate> {
  const { source } = options;
  const packDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-template-pack-'),
  );
  const extractDirectory = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-template-'),
  );
  const packer = packerFor(source);

  try {
    const tarballPath = path.join(packDirectory, 'template.tgz');
    const args = packer.args(tarballPath);

    if (options.registry && !isLocalTemplateSource(source)) {
      args.push(`--registry=${options.registry}`);
    }

    await runCommand(packer.command, args, {
      cwd: isLocalTemplateSource(source) ? path.resolve(source) : packDirectory,
      timeoutMs: PACK_TIMEOUT_MS,
    });

    const tarball = isLocalTemplateSource(source)
      ? tarballPath
      : await findTarball(packDirectory);

    // Every npm tarball wraps its contents in a single `package/` directory, which `--strip-components=1` removes.
    await runCommand(
      'tar',
      ['-xzf', tarball, '-C', extractDirectory, '--strip-components=1'],
      { timeoutMs: PACK_TIMEOUT_MS },
    );

    const manifest = await readTemplateManifest(extractDirectory);

    return { directory: extractDirectory, ...manifest };
  } catch (error) {
    await rm(extractDirectory, { force: true, recursive: true });

    if (error instanceof CommandFailedError) {
      throw new Error(
        `Could not download the template "${source}".\n${error.stderr || error.message}`,
        { cause: error },
      );
    }

    throw error;
  } finally {
    await rm(packDirectory, { force: true, recursive: true });
  }
}
