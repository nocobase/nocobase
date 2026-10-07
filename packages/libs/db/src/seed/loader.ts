import {
  readTaskManifest,
  resolveTaskChecksum,
  type TaskManifest,
} from '../migration/manifest.js';
import {
  assertTaskSourceForm,
  DEFAULT_TASK_EXTENSIONS,
  DEFAULT_TASK_PACKAGE_NAME,
  importTaskDefinition,
  isNonEmptyString,
  isTaskFile,
  isValidTransactionMode,
  readTaskDirectory,
  taskNameFromFileName,
  validateTaskDirectory,
  validateTaskPackageName,
  validateUniqueTaskNames,
} from '../migration/internal/task-loader.js';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { isDefinedSeed } from './internal/marker.js';
import type {
  LoadSeedsOptions,
  LoadedSeed,
  SeedDefinition,
  SeedSource,
} from './types.js';

export const DEFAULT_SEED_EXTENSIONS: readonly string[] =
  DEFAULT_TASK_EXTENSIONS;
export const DEFAULT_SEED_PACKAGE_NAME: string = DEFAULT_TASK_PACKAGE_NAME;

/** Loads, validates, and deterministically orders seed definitions from configured sources. */
export async function loadSeeds(
  options: LoadSeedsOptions,
): Promise<LoadedSeed[]> {
  const sources = normalizeSeedSources(options);
  const seeds = (
    await Promise.all(sources.map((source) => loadSeedSource(source)))
  ).flat();

  validateUniqueTaskNames('Seed', seeds);
  return seeds.sort((a, b) => a.name.localeCompare(b.name));
}

/** Loads seed definitions without executing them. */
export async function validateSeeds(
  options: string | LoadSeedsOptions,
): Promise<LoadedSeed[]> {
  return loadSeeds(
    typeof options === 'string' ? { directory: options } : options,
  );
}

async function loadSeedSource(source: SeedSource): Promise<LoadedSeed[]> {
  const directory = resolve(source.directory);
  const manifest = await readTaskManifest(directory);
  const entries = await readTaskDirectory(directory);
  const extensions = new Set(source.extensions ?? DEFAULT_SEED_EXTENSIONS);
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => isTaskFile(fileName, extensions))
    .sort();

  const seeds: LoadedSeed[] = [];
  for (const fileName of files) {
    seeds.push(
      await loadSeedFile(
        source.packageName,
        join(directory, fileName),
        fileName,
        manifest,
      ),
    );
  }

  return seeds;
}

function normalizeSeedSources(options: LoadSeedsOptions): SeedSource[] {
  assertTaskSourceForm('Seed', options);

  if (options.sources !== undefined) {
    return options.sources.map((source) => ({
      packageName: validateTaskPackageName('Seed', source.packageName),
      directory: validateTaskDirectory('Seed', source.directory),
      extensions: source.extensions ?? options.extensions,
    }));
  }

  return [
    {
      packageName: validateTaskPackageName(
        'Seed',
        options.packageName ?? DEFAULT_SEED_PACKAGE_NAME,
      ),
      directory: validateTaskDirectory('Seed', options.directory),
      extensions: options.extensions,
    },
  ];
}

async function loadSeedFile(
  packageName: string,
  filePath: string,
  fileName: string,
  manifest: TaskManifest | undefined,
): Promise<LoadedSeed> {
  const [source, fileStat] = await Promise.all([
    readFile(filePath, 'utf8'),
    stat(filePath),
  ]);
  const checksums = resolveTaskChecksum(filePath, source, manifest);
  const seed = await importTaskDefinition(filePath, fileStat.mtimeMs);
  validateSeedDefinition(seed, filePath, fileName);

  return {
    packageName,
    name: seed.name,
    filePath,
    fileName,
    ...checksums,
    seed,
  };
}

function validateSeedDefinition(
  value: unknown,
  filePath: string,
  fileName: string,
): asserts value is SeedDefinition {
  if (!isDefinedSeed(value)) {
    throw new Error(
      `Seed file ${filePath} must default export defineSeed({...}).`,
    );
  }

  if (!isNonEmptyString(value.name)) {
    throw new Error(
      `Seed file ${filePath} must define a non-empty string name.`,
    );
  }

  const expectedName = taskNameFromFileName(fileName);
  if (value.name !== expectedName) {
    throw new Error(
      `Seed file ${filePath} has name "${value.name}", but file name requires "${expectedName}".`,
    );
  }

  if (typeof value.run !== 'function') {
    throw new Error(
      `Seed "${value.name}" must define a run(context) function.`,
    );
  }

  if (value.sample !== undefined && typeof value.sample !== 'boolean') {
    throw new Error(`Seed "${value.name}" sample must be true or false.`);
  }

  if (!isValidTransactionMode(value.transaction)) {
    throw new Error(
      `Seed "${value.name}" transaction must be true, false, or "auto".`,
    );
  }
}
