import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';

import { Config, type ConfigMap } from '@nocobase/config';

/** Where the value at a path came from: a configuration file, a declared environment variable or another source. */
export type AppConfigValueSource = 'file' | 'environment' | 'unknown';

/** A configuration file the application read, with its text as it was when the configuration was loaded. */
export interface AppConfigInspectedFile {
  readonly path: string;
  /** `null` when the file did not exist. */
  readonly text: string | null;
}

/**
 * What an administrator needs to explain the running configuration, unredacted: the caller decides what may leave
 * the process. A path no source set comes from the code defaults.
 */
export interface AppConfigInspection {
  /** The source of the last layer that set each leaf path, such as `{ 'logging.level': 'environment' }`. */
  readonly sources: Readonly<Record<string, AppConfigValueSource>>;
  /** The values the configuration files supplied, before the environment overrode any of them. */
  readonly fileValues: ConfigMap;
  readonly files: readonly AppConfigInspectedFile[];
  /** When the running configuration was last loaded or reloaded. */
  readonly loadedAt: string;
  /** How many reloads have been applied since the application started. */
  readonly reloads: number;
}

/** Every leaf path of a map: scalars, arrays and empty maps, such as `server.port` or `secrets.keys`. */
export function leafPaths(value: unknown, prefix = ''): string[] {
  if (!isMap(value) || (prefix && Object.keys(value).length === 0))
    return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

/** The value at a dotted path, or `undefined`. */
export function valueAtPath(map: unknown, path: string): unknown {
  let value: unknown = map;
  for (const segment of path.split('.')) {
    if (!isMap(value)) return undefined;
    value = value[segment];
  }
  return value;
}

function isMap(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Collects the inspection while the sources load, so a refused reload can keep the previous one. */
export class ConfigInspection {
  private readonly sources = new Map<string, AppConfigValueSource>();
  private readonly fileValues = new Config();
  private readonly files: AppConfigInspectedFile[] = [];

  /** Attributes every leaf a layer sets to its source. */
  record(layer: Config, kind: AppConfigValueSource): void {
    for (const path of leafPaths(layer.raw())) this.sources.set(path, kind);
  }

  /** Attributes the leaves that changed when a source merged into existing values itself. */
  recordChanges(before: ConfigMap, after: ConfigMap): void {
    for (const path of leafPaths(after)) {
      if (
        !isDeepStrictEqual(valueAtPath(before, path), valueAtPath(after, path))
      )
        this.sources.set(path, 'unknown');
    }
  }

  async recordFile(path: string, layer: Config): Promise<void> {
    this.fileValues.merge(layer);
    this.files.push({ path, text: await readText(path) });
  }

  snapshot(loadedAt: Date, reloads: number): AppConfigInspection {
    return {
      sources: Object.fromEntries(this.sources),
      fileValues: structuredClone(this.fileValues.raw()),
      files: [...this.files],
      loadedAt: loadedAt.toISOString(),
      reloads,
    };
  }
}

async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
