// Finds the CLI packages an application depends on: direct dependencies whose own `package.json` names a CLI entry in
// `nocobase.cli.entry`, and which therefore contribute commands by being installed rather than by an entry in
// `cli/plugins.ts`.
//
// Finding them reads JSON and imports nothing. A run imports a package's entry only when it needs that package's
// commands — a command under its topic, `--help`, or `commands` — so a package that is missing or broken never stops an
// unrelated command, and the built-in commands dispatched on their own never get this far.
//
// Only the application's own `dependencies`, `devDependencies` and `optionalDependencies` in the `@nocobase/` scope
// count, the rule `skills sync` follows, and each one is looked up in the application's `node_modules` rather than
// resolved from this package. A transitive dependency contributes nothing, and removing the dependency removes its
// commands. A built `dist/` lists only `dependencies`, so a package the application declares in `devDependencies`
// contributes nothing there.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { pluginTopicFor } from '../plugins/define.ts';
import type { AppCliPlugin } from '../plugins/types.ts';
import type { AppLocation } from './location.ts';

const PACKAGE_SCOPE = '@nocobase/';

/** The conditions Node's `import` matches in a package's `exports`, among those a CLI entry may be published under. */
const IMPORT_CONDITIONS: ReadonlySet<string> = new Set([
  'node',
  'import',
  'default',
]);

/** An installed direct dependency whose `package.json` names a CLI entry. */
export interface CliPackage {
  readonly packageName: string;
  /** The topic its commands mount under, from its name alone. */
  readonly topic: string;
  /** Where the package is installed in the application's `node_modules`. */
  readonly directory: string;
  /** `nocobase.cli.entry` as the package wrote it; checked when the entry is loaded, not when it is found. */
  readonly entry: unknown;
  /** The package's `exports`, which the entry is resolved through. */
  readonly exports: unknown;
}

/** A direct dependency the application requires but whose `package.json` its `node_modules` does not hold. */
export interface UnavailableCliPackage {
  readonly packageName: string;
  /** The topic it would own if it contributes commands, known from its name alone. */
  readonly topic: string;
}

export interface CliPackages {
  readonly installed: readonly CliPackage[];
  readonly unavailable: readonly UnavailableCliPackage[];
}

/** Which CLI packages a run imports, and which only claim their topics. */
export interface CliPackageSelection {
  readonly load: readonly CliPackage[];
  /** Topic to owning package, for the packages this run does not import. */
  readonly claimed: Readonly<Record<string, string>>;
}

interface PackageManifest {
  readonly dependencies?: unknown;
  readonly devDependencies?: unknown;
  readonly optionalDependencies?: unknown;
  readonly exports?: unknown;
  readonly nocobase?: { readonly cli?: { readonly entry?: unknown } };
}

/** The CLI packages among the application's direct dependencies. Reads JSON only and never throws. */
export function findCliPackages(location: AppLocation): CliPackages {
  if (location.kind === 'none') return { installed: [], unavailable: [] };
  const manifest = readManifest(path.join(location.root, 'package.json'));
  const required = new Set([
    ...dependencyNames(manifest?.dependencies),
    ...dependencyNames(manifest?.devDependencies),
  ]);
  const names = [
    ...new Set([
      ...required,
      ...dependencyNames(manifest?.optionalDependencies),
    ]),
  ]
    .filter((name) => name.startsWith(PACKAGE_SCOPE))
    .sort();

  const installed: CliPackage[] = [];
  const unavailable: UnavailableCliPackage[] = [];
  for (const packageName of names) {
    const directory = path.join(location.root, 'node_modules', packageName);
    const packageManifest = readManifest(path.join(directory, 'package.json'));
    const topic = pluginTopicFor(packageName);
    if (packageManifest === undefined) {
      // An optional dependency is allowed to be absent; a required one is a dependency nobody installed yet.
      if (required.has(packageName)) unavailable.push({ packageName, topic });
      continue;
    }
    const entry = packageManifest.nocobase?.cli?.entry;
    if (entry === undefined) continue;
    installed.push({
      packageName,
      topic,
      directory,
      entry,
      exports: packageManifest.exports,
    });
  }
  return { installed, unavailable };
}

/**
 * The CLI packages a run with these arguments imports. A command under a package's topic imports that package; help
 * for the whole tree and the commands that read it (`commands`) import every one. Every other run imports none and
 * lets them claim their topics, so a collision is reported whichever command was run. A package the application also
 * registers in `cli/plugins.ts` is left to that registration.
 */
export function selectCliPackages(
  found: CliPackages,
  options: {
    /**
     * The first word of the command line, before a space or a colon, or `undefined` for a bare `nocobase` or one that
     * starts with a flag.
     */
    readonly head: string | undefined;
    /** Whether the run reads the whole command tree. */
    readonly wholeTree: boolean;
    /** Packages `cli/plugins.ts` registers. */
    readonly registered: ReadonlySet<string>;
  },
): CliPackageSelection {
  const candidates = found.installed.filter(
    (cliPackage) => !options.registered.has(cliPackage.packageName),
  );
  const load =
    options.head === undefined || options.wholeTree
      ? candidates
      : candidates.filter((cliPackage) => cliPackage.topic === options.head);
  const claimed: Record<string, string> = {};
  for (const cliPackage of candidates) {
    if (!load.includes(cliPackage)) {
      claimed[cliPackage.topic] = cliPackage.packageName;
    }
  }
  return { load, claimed };
}

/** Imports each package's entry and checks it is the CLI plugin that package defines. */
export async function loadCliPackages(
  packages: readonly CliPackage[],
): Promise<AppCliPlugin[]> {
  // The entries are independent, so their imports overlap; the first failure in package order is the one reported,
  // whichever settled first.
  const settled = await Promise.allSettled(packages.map(loadCliPackage));
  const loaded: AppCliPlugin[] = [];
  for (const outcome of settled) {
    if (outcome.status === 'rejected') throw outcome.reason;
    loaded.push(outcome.value);
  }
  return loaded;
}

async function loadCliPackage(cliPackage: CliPackage): Promise<AppCliPlugin> {
  const file = resolveEntry(cliPackage);
  let module: { default?: unknown };
  try {
    module = (await import(pathToFileURL(file).href)) as {
      default?: unknown;
    };
  } catch (cause) {
    throw new Error(
      `Could not load the CLI entry of ${cliPackage.packageName}, ${file}.`,
      { cause },
    );
  }
  return checkEntry(cliPackage, module.default);
}

function resolveEntry(cliPackage: CliPackage): string {
  const { packageName, directory, entry } = cliPackage;
  if (typeof entry !== 'string' || !entry.startsWith('./')) {
    throw new Error(
      `${packageName} sets nocobase.cli.entry to something other than a subpath of its exports, such as "./cli".`,
    );
  }
  const target = exportTarget(cliPackage.exports, entry);
  if (target === undefined) {
    throw new Error(
      `${packageName} names "${entry}" as its CLI entry, but its package.json exports no importable "${entry}".`,
    );
  }
  const file = path.resolve(directory, target);
  const relative = path.relative(directory, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `${packageName} exports "${entry}" from outside its own directory.`,
    );
  }
  return file;
}

/** The file Node's `import` would resolve `subpath` of these `exports` to, relative to the package. */
function exportTarget(exports: unknown, subpath: string): string | undefined {
  if (!isRecord(exports)) return undefined;
  return conditionalTarget(exports[subpath]);
}

/** A string target, or the first of the import conditions, in the order the package lists them, that yields one. */
function conditionalTarget(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.startsWith('./') ? value : undefined;
  }
  if (!isRecord(value)) return undefined;
  for (const [condition, nested] of Object.entries(value)) {
    if (!IMPORT_CONDITIONS.has(condition)) continue;
    const target = conditionalTarget(nested);
    if (target !== undefined) return target;
  }
  return undefined;
}

function checkEntry(cliPackage: CliPackage, value: unknown): AppCliPlugin {
  const { packageName } = cliPackage;
  if (
    !isRecord(value) ||
    typeof value.packageName !== 'string' ||
    typeof value.topic !== 'string' ||
    !isRecord(value.commands) ||
    !isRecord(value.devCommands)
  ) {
    throw new Error(
      `The CLI entry of ${packageName} must default-export the result of defineCliPlugin({...}).`,
    );
  }
  if (value.packageName !== packageName) {
    throw new Error(
      `The CLI entry of ${packageName} defines the commands of ${value.packageName}; its packageName must be "${packageName}".`,
    );
  }
  // The run imported this package for the topic its name gives, so that is the only topic it may mount under.
  if (value.topic !== cliPackage.topic) {
    throw new Error(
      `The CLI entry of ${packageName} mounts its commands under "${value.topic}"; its topic must be "${cliPackage.topic}", the one its package name gives.`,
    );
  }
  // `pnpm build` and `pnpm dev` read hooks from `cli/plugins.ts` without assembling the command tree, which is where a
  // package found here is loaded. Accepting hooks from one would register them and never run them.
  if (
    [value.buildHooks, value.devHooks].some(
      (hooks) => isRecord(hooks) && Object.keys(hooks).length > 0,
    )
  ) {
    throw new Error(
      `${packageName} declares build or dev hooks. A package found through package.json contributes commands only; ` +
        'register it in cli/plugins.ts for its hooks to run.',
    );
  }
  return value as unknown as AppCliPlugin;
}

function readManifest(file: string): PackageManifest | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function dependencyNames(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
