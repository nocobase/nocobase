/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';
import * as tar from 'tar';
import { fetchWithPreservedAuthRedirect } from './http-request.js';
import { resolvePluginStoragePath } from './plugin-storage.js';
import { run } from './run-npm.js';

type PluginPackageMetadata = {
  name?: unknown;
  version?: unknown;
};

type PluginArchiveStream = {
  stream: Readable;
  source: string;
  sourceType: 'file' | 'url' | 'npm';
  cleanup: () => Promise<void>;
};

export type PluginImportResult = {
  action: 'installed' | 'updated';
  packageName: string;
  packageVersion?: string;
  outputDir: string;
  source: string;
  sourceType: 'file' | 'url' | 'npm';
  storagePluginsPath: string;
};

const NPM_PACK_TIMEOUT_MS = 30_000;
const NPM_AUTH_ERROR_PATTERNS = [
  'e401',
  'e403',
  'unauthorized',
  'authorization',
  'forbidden',
  'need auth',
  'requires authentication',
  'unable to authenticate',
  'authentication token',
] as const;
const NPM_NOT_FOUND_ERROR_PATTERNS = [
  'e404',
  'etarget',
  'not found',
  'not in this registry',
  'no matching version found',
  'no match found',
] as const;
const NPM_NETWORK_ERROR_PATTERNS = [
  'enotfound',
  'eai_again',
  'etimedout',
  'esockettimedout',
  'econnreset',
  'econnrefused',
  'enetunreach',
  'ehostunreach',
  'fetch failed',
  'getaddrinfo',
  'timed out',
] as const;

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

function isHttpArchiveSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function responseBodyToNodeReadable(body: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(body as unknown as NodeReadableStream);
}

function looksLikeLocalArchivePath(value: string): boolean {
  return (
    path.isAbsolute(value) ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.endsWith('.tgz') ||
    value.endsWith('.tar.gz')
  );
}

function resolvePluginOutputDir(storagePluginsPath: string, packageName: string): string {
  const outputDir = path.resolve(storagePluginsPath, packageName);
  const relative = path.relative(storagePluginsPath, outputDir);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Imported archive package name "${packageName}" resolves outside plugin storage.`);
  }
  return outputDir;
}

function normalizeNpmRegistry(value?: string): string | undefined {
  const text = trimValue(value);
  return text ? text.replace(/\/+$/, '') : undefined;
}

function formatNpmPackFailureMessage(source: string, registry: string | undefined, details: string): string {
  const normalizedDetails = details.toLowerCase();
  const lines = [
    `Failed to import npm package "${source}" with \`npm pack\`.`,
    details,
  ];

  const loginCommand = registry ? `npm login --registry=${registry}` : 'npm login';

  if (NPM_AUTH_ERROR_PATTERNS.some((pattern) => normalizedDetails.includes(pattern))) {
    lines.push(`Hint: If this is a private registry, run \`${loginCommand}\` first and retry.`);
    return lines.join('\n');
  }

  if (NPM_NOT_FOUND_ERROR_PATTERNS.some((pattern) => normalizedDetails.includes(pattern))) {
    lines.push(
      registry
        ? `Hint: Check that "${source}" exists in ${registry} and that the package name or tag is correct.`
        : `Hint: Check that "${source}" exists and that the package name or tag is correct.`,
    );
    return lines.join('\n');
  }

  if (NPM_NETWORK_ERROR_PATTERNS.some((pattern) => normalizedDetails.includes(pattern))) {
    lines.push(
      registry
        ? `Hint: Check that the npm registry ${registry} is reachable from this machine.`
        : 'Hint: Check that the npm registry is reachable from this machine.',
    );
    return lines.join('\n');
  }

  if (registry) {
    lines.push(`Hint: If this is a private registry, make sure \`${loginCommand}\` has completed successfully.`);
  }

  return lines.join('\n');
}

async function resolvePackedPluginTarball(packRoot: string, sourceLabel: string): Promise<string> {
  const entries = await fsp.readdir(packRoot, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'))
    .map((entry) => path.join(packRoot, entry.name))
    .sort();

  if (tarballs.length === 1) {
    return tarballs[0];
  }

  if (tarballs.length === 0) {
    throw new Error(`npm pack did not produce a local tarball for ${sourceLabel}.`);
  }

  throw new Error(`npm pack produced multiple tarballs for ${sourceLabel}.`);
}

async function packNpmPluginSource(
  source: string,
  npmRegistry?: string,
  runFn: typeof run = run,
): Promise<PluginArchiveStream> {
  const packRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-pack-'));
  const args = ['pack', '--silent'];
  const registry = normalizeNpmRegistry(npmRegistry);
  if (registry) {
    args.push(`--registry=${registry}`);
  }
  args.push(source);
  let stdout = '';
  let stderr = '';

  try {
    await runFn('npm', args, {
      cwd: packRoot,
      stdio: 'pipe',
      errorName: 'npm pack',
      timeoutMs: NPM_PACK_TIMEOUT_MS,
      onStdout: (chunk) => {
        stdout += chunk;
      },
      onStderr: (chunk) => {
        stderr += chunk;
      },
    });
    const tarballPath = await resolvePackedPluginTarball(packRoot, source);

    return {
      stream: fs.createReadStream(tarballPath),
      source,
      sourceType: 'npm',
      cleanup: async () => {
        await fsp.rm(packRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fsp.rm(packRoot, { recursive: true, force: true });
    const originalMessage = error instanceof Error ? error.message : String(error);
    const details = trimValue(stderr) || trimValue(stdout) || trimValue(originalMessage) || 'npm pack failed.';
    throw new Error(formatNpmPackFailureMessage(source, registry, details));
  }
}

async function openPluginSource(
  source: string,
  npmRegistry?: string,
  runFn: typeof run = run,
): Promise<PluginArchiveStream> {
  if (isHttpArchiveSource(source)) {
    const response = await fetchWithPreservedAuthRedirect(source);
    if (!response.ok) {
      const statusText = trimValue(response.statusText);
      throw new Error(
        `Failed to download plugin archive from ${source}: ${response.status}${statusText ? ` ${statusText}` : ''}.`,
      );
    }
    if (!response.body) {
      throw new Error(`Downloaded plugin archive from ${source} does not include a response body.`);
    }
    return {
      stream: responseBodyToNodeReadable(response.body),
      source,
      sourceType: 'url',
      cleanup: async () => undefined,
    };
  }

  const resolvedPath = path.resolve(process.cwd(), source);
  if (await pathExists(resolvedPath)) {
    return {
      stream: fs.createReadStream(resolvedPath),
      source: resolvedPath,
      sourceType: 'file',
      cleanup: async () => undefined,
    };
  }

  if (looksLikeLocalArchivePath(source)) {
    throw new Error(`Plugin archive file does not exist: ${resolvedPath}`);
  }

  return await packNpmPluginSource(source, npmRegistry, runFn);
}

async function readPluginMetadata(extractRoot: string, sourceLabel: string): Promise<Required<Pick<PluginImportResult, 'packageName'>> & Pick<PluginImportResult, 'packageVersion'>> {
  const packageJsonPath = path.join(extractRoot, 'package.json');
  let content: string;
  try {
    content = await fsp.readFile(packageJsonPath, 'utf8');
  } catch {
    throw new Error(`Imported archive from ${sourceLabel} does not contain a package.json at the package root.`);
  }

  let metadata: PluginPackageMetadata;
  try {
    metadata = JSON.parse(content) as PluginPackageMetadata;
  } catch {
    throw new Error(`Imported archive from ${sourceLabel} contains an invalid package.json.`);
  }

  const packageName = trimValue(metadata.name);
  if (!packageName) {
    throw new Error(`Imported archive from ${sourceLabel} is missing "package.json.name".`);
  }

  return {
    packageName,
    packageVersion: trimValue(metadata.version),
  };
}

export async function importPluginSource(
  source: string,
  options: {
    storagePath?: string;
    npmRegistry?: string;
    runFn?: typeof run;
  } = {},
): Promise<PluginImportResult> {
  const normalizedSource = trimValue(source);
  if (!normalizedSource) {
    throw new Error('Pass a plugin archive path, URL, or npm package spec.');
  }

  const storagePluginsPath = resolvePluginStoragePath(options.storagePath);
  await fsp.mkdir(storagePluginsPath, { recursive: true });

  const archive = await openPluginSource(normalizedSource, options.npmRegistry, options.runFn);
  const stageDir = await fsp.mkdtemp(path.join(storagePluginsPath, '.nb-plugin-import-'));
  let stageMoved = false;

  try {
    try {
      await pipeline(archive.stream, createGunzip(), tar.extract({ cwd: stageDir, strip: 1 }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract plugin archive from ${archive.source}: ${message}`);
    }

    const { packageName, packageVersion } = await readPluginMetadata(stageDir, archive.source);
    const outputDir = resolvePluginOutputDir(storagePluginsPath, packageName);
    const action = (await pathExists(outputDir)) ? 'updated' : 'installed';

    await fsp.mkdir(path.dirname(outputDir), { recursive: true });
    await fsp.rm(outputDir, { recursive: true, force: true });
    await fsp.rename(stageDir, outputDir);
    stageMoved = true;

    return {
      action,
      packageName,
      packageVersion,
      outputDir,
      source: archive.source,
      sourceType: archive.sourceType,
      storagePluginsPath,
    };
  } finally {
    if (!stageMoved) {
      await fsp.rm(stageDir, { recursive: true, force: true });
    }
    await archive.cleanup();
  }
}

export async function importPluginArchive(source: string, storagePath?: string): Promise<PluginImportResult> {
  return await importPluginSource(source, { storagePath });
}
