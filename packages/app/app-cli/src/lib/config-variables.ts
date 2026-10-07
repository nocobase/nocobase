import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  buildVariablesManifest,
  type AppConfigLayers,
  type VariablesManifest,
} from '@nocobase/app-server/config';
import { parse } from 'yaml';

import type { AppCommandRuntime } from '../context.ts';

type ConfigMap = AppConfigLayers['defaults'];

export interface ConfigVariablesOptions {
  /** Loads the application exactly as a start would, without starting it. */
  readonly loadRuntime: () => Promise<AppCommandRuntime>;
  /** Where to write the manifest as JSON, relative to the working directory; nothing is written when left out. */
  readonly out?: string;
}

export interface ConfigVariablesResult {
  readonly manifest: VariablesManifest;
  /** The file written, when `out` was given. */
  readonly file?: string;
}

/**
 * Builds the variables manifest: every environment variable the application reads, with what each sets and whether a
 * deployment must supply it. A variable is required when the code defaults and `config.example.yml` give its path no
 * value, an example placeholder such as `admin123` counting as none, and nothing can generate one. Values from the
 * environment and `config.yml` play no part, so the manifest is the same on every machine.
 */
export async function runConfigVariables(
  options: ConfigVariablesOptions,
): Promise<ConfigVariablesResult> {
  const runtime = await options.loadRuntime();
  let manifest: VariablesManifest;
  try {
    const { paths } = runtime;
    manifest = buildVariablesManifest({
      app: await readAppIdentity(paths.rootDir),
      variables: runtime.config.environmentVariableMappings(),
      defaults: runtime.config.layers().defaults,
      example: await readConfigExample(paths.deploymentRootDir),
    });
  } finally {
    await runtime.scope.destroy();
  }
  if (!options.out) return { manifest };
  const file = path.resolve(options.out);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, file };
}

async function readAppIdentity(
  rootDir: string,
): Promise<{ name: string; version?: string }> {
  try {
    const parsed = JSON.parse(
      await readFile(path.join(rootDir, 'package.json'), 'utf8'),
    ) as { name?: unknown; version?: unknown };
    const name =
      typeof parsed.name === 'string' ? parsed.name : path.basename(rootDir);
    return typeof parsed.version === 'string'
      ? { name, version: parsed.version }
      : { name };
  } catch {
    return { name: path.basename(rootDir) };
  }
}

/** `config.example.yml` beside the deployment root, parsed, or nothing when the application ships none. */
export async function readConfigExample(
  deploymentRootDir: string,
): Promise<ConfigMap | undefined> {
  let content: string;
  try {
    content = await readFile(
      path.join(deploymentRootDir, 'config.example.yml'),
      'utf8',
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  const parsed: unknown = parse(content);
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? (parsed as ConfigMap)
    : undefined;
}
