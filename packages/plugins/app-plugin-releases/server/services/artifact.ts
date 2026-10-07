/**
 * Release artifacts: spooling an upload to a temporary file with its checksum, size limit and empty check, and reading
 * the metadata a release records (version, config template, manifest) from the archive. Adapted from the Hub plugin's
 * `artifact-upload.ts` and `inspectArtifact`.
 */
import { createHash } from 'node:crypto';
import { lstat, mkdtemp, open, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { normalizeBasePath } from '@nocobase/app-server/support';
import { x as extractTar } from 'tar';

import type { ReleaseVariablesManifest } from '../../shared/releases.js';
import { ReleasesError } from '../errors.js';
import { isRecord } from './codec.js';
import { validateYamlConfig } from './config-file.js';
import { parseVariablesManifest } from './variables.js';

export const DEFAULT_MAX_ARTIFACT_BYTES: number = 256 * 1024 * 1024;

export const RELEASE_VERSION_PATTERN: RegExp =
  /^[0-9A-Za-z][0-9A-Za-z._+-]{0,254}$/;
const CONFIG_TEMPLATE_PATHS = [
  'config.example.yml',
  'config.example.yaml',
] as const;
const ARTIFACT_MANIFEST_PATHS = ['dist/package.json', 'package.json'] as const;
const EMBEDDED_ENTRY_PATH = 'dist/server/embedded.js';
/** The variables manifest `pnpm build` writes (`dist/variables.json`). */
const VARIABLES_MANIFEST_PATHS = [
  'dist/variables.json',
  'variables.json',
] as const;
const MAX_VARIABLES_MANIFEST_BYTES = 1024 * 1024;

export interface StagedArtifact {
  readonly path: string;
  readonly size: number;
  readonly checksum: string;
  dispose(): Promise<void>;
}

/** Spools with backpressure; neither the HTTP upload nor the storage write buffers the archive. */
export async function receiveArtifact(
  source: AsyncIterable<Uint8Array>,
  options: {
    readonly expectedChecksum?: string;
    readonly maxBytes?: number;
  } = {},
): Promise<StagedArtifact> {
  const { expectedChecksum } = options;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_ARTIFACT_BYTES;
  if (
    expectedChecksum !== undefined &&
    !/^[a-f0-9]{64}$/i.test(expectedChecksum)
  )
    throw new ReleasesError(
      'Checksum must be a SHA-256 hex digest.',
      'INVALID_CHECKSUM',
      'INVALID_ARGUMENT',
    );
  const directory = await mkdtemp(path.join(os.tmpdir(), 'releases-upload-'));
  const archive = path.join(directory, 'artifact.tar.gz');
  const dispose = () => rm(directory, { recursive: true, force: true });
  try {
    const file = await open(archive, 'wx', 0o600);
    const hash = createHash('sha256');
    let size = 0;
    try {
      for await (const chunk of source) {
        size += chunk.byteLength;
        if (size > maxBytes)
          throw new ReleasesError(
            'Artifact exceeds the upload limit.',
            'ARTIFACT_TOO_LARGE',
            'INVALID_ARGUMENT',
            { httpStatus: 413 },
          );
        hash.update(chunk);
        let offset = 0;
        while (offset < chunk.byteLength) {
          const { bytesWritten } = await file.write(
            chunk,
            offset,
            chunk.byteLength - offset,
          );
          offset += bytesWritten;
        }
      }
    } finally {
      await file.close();
    }
    if (!size)
      throw new ReleasesError(
        'Artifact is empty.',
        'INVALID_ARTIFACT_SIZE',
        'INVALID_ARGUMENT',
      );
    const checksum = hash.digest('hex');
    if (expectedChecksum && checksum !== expectedChecksum.toLowerCase())
      throw new ReleasesError(
        'Artifact checksum does not match.',
        'CHECKSUM_MISMATCH',
        'INVALID_ARGUMENT',
      );
    return { path: archive, size, checksum, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

export function validateIdempotencyKey(key: string | undefined): void {
  if (key !== undefined && !/^[A-Za-z0-9._:-]{1,128}$/.test(key))
    throw new ReleasesError(
      'Invalid idempotency key.',
      'INVALID_IDEMPOTENCY_KEY',
      'INVALID_ARGUMENT',
    );
}

export interface ArtifactMetadata {
  readonly version: string;
  readonly configTemplate: string | null;
  readonly manifest: Record<string, unknown>;
  /** The build's variables manifest; null for a build without one. */
  readonly variables: ReleaseVariablesManifest | null;
}

/** Reads the package manifest and config template and checks the server entry is a regular file. */
export async function inspectArtifact(
  archivePath: string,
): Promise<ArtifactMetadata> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'releases-artifact-'));
  try {
    // tar invokes filter from stream callbacks, outside the extraction promise: skip rejected entries and throw only
    // after extraction has settled, so the temporary directory can be cleaned safely.
    let validationError: ReleasesError | undefined;
    await extractTar({
      cwd: directory,
      file: archivePath,
      gzip: true,
      preservePaths: false,
      strict: true,
      filter: (entryPath, entry): boolean => {
        if (validationError) return false;
        const normalized = path.posix.normalize(
          entryPath.replaceAll('\\', '/'),
        );
        if (
          path.posix.isAbsolute(normalized) ||
          normalized === '..' ||
          normalized.startsWith('../')
        ) {
          validationError = new ReleasesError(
            `Artifact contains unsafe path "${entryPath}".`,
            'UNSAFE_ARTIFACT',
            'INVALID_ARGUMENT',
          );
          return false;
        }
        const selected =
          (ARTIFACT_MANIFEST_PATHS as readonly string[]).includes(normalized) ||
          (CONFIG_TEMPLATE_PATHS as readonly string[]).includes(normalized) ||
          (VARIABLES_MANIFEST_PATHS as readonly string[]).includes(
            normalized,
          ) ||
          normalized === EMBEDDED_ENTRY_PATH;
        if (
          selected &&
          (!('type' in entry ? entry.type === 'File' : entry.isFile()) ||
            entry.size > 16 * 1024 * 1024)
        ) {
          validationError = new ReleasesError(
            'Artifact metadata and entry point must be regular files no larger than 16 MiB.',
            'INVALID_ARTIFACT',
            'INVALID_ARGUMENT',
          );
          return false;
        }
        return selected;
      },
    });
    if (validationError) throw validationError;
    const manifestPath = await findArtifactManifest(directory);
    await assertRegularArtifactFile(directory, EMBEDDED_ENTRY_PATH);
    const packageMetadata = JSON.parse(
      await readFile(path.join(directory, manifestPath), 'utf8'),
    ) as Record<string, unknown>;
    const appMetadata = isRecord(packageMetadata.app)
      ? packageMetadata.app
      : undefined;
    const rawVersion = appMetadata?.version ?? packageMetadata.version;
    if (
      typeof rawVersion !== 'string' ||
      !RELEASE_VERSION_PATTERN.test(rawVersion)
    )
      throw new ReleasesError(
        'Artifact package.json must contain a valid version.',
        'INVALID_ARTIFACT_VERSION',
        'INVALID_ARGUMENT',
      );
    const template = await readConfigTemplate(directory);
    if (template) validateYamlConfig(template);
    return {
      version: rawVersion,
      configTemplate: template,
      manifest: packageMetadata,
      variables: await readVariablesManifest(directory),
    };
  } catch (error) {
    if (error instanceof ReleasesError) throw error;
    throw new ReleasesError(
      `Invalid release artifact: ${error instanceof Error ? error.message : String(error)}`,
      'INVALID_ARTIFACT',
      'INVALID_ARGUMENT',
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * A build from before relocatable builds records the mount path its client was compiled for and only works there. A
 * current build records `relocatable` and runs at any path; a build too old to record either is let through.
 */
export function assertMountableAt(
  manifest: Record<string, unknown>,
  basePath: string,
): void {
  const nocobase = isRecord(manifest.nocobase) ? manifest.nocobase : undefined;
  if (!nocobase || nocobase.relocatable === true) return;
  const builtFor = nocobase.basePath;
  if (typeof builtFor !== 'string') return;
  if (normalizeBasePath(builtFor) === normalizeBasePath(basePath)) return;
  throw new ReleasesError(
    `The artifact was built for the base path ${normalizeBasePath(builtFor) || '/'}, but this application is mounted at ${basePath}. Build it again with a current @nocobase/app-cli, which runs at any path.`,
    'BASE_PATH_MISMATCH',
    'INVALID_ARGUMENT',
  );
}

async function findArtifactManifest(directory: string): Promise<string> {
  for (const manifestPath of ARTIFACT_MANIFEST_PATHS) {
    try {
      const stats = await lstat(path.join(directory, manifestPath));
      if (!stats.isFile())
        throw new ReleasesError(
          `Artifact entry "${manifestPath}" must be a regular file.`,
          'INVALID_ARTIFACT',
          'INVALID_ARGUMENT',
        );
      return manifestPath;
    } catch (error) {
      if (
        error instanceof ReleasesError ||
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      )
        throw error;
    }
  }
  throw new ReleasesError(
    'Artifact must contain dist/package.json or package.json.',
    'INVALID_ARTIFACT',
    'INVALID_ARGUMENT',
  );
}

async function assertRegularArtifactFile(
  directory: string,
  relativePath: string,
): Promise<void> {
  let isFile = false;
  try {
    isFile = (await lstat(path.join(directory, relativePath))).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (!isFile)
    throw new ReleasesError(
      `Artifact entry "${relativePath}" must be a regular file.`,
      'INVALID_ARTIFACT',
      'INVALID_ARGUMENT',
    );
}

/** The archive's `dist/variables.json`, checked; null when the build wrote none. */
async function readVariablesManifest(
  directory: string,
): Promise<ReleaseVariablesManifest | null> {
  for (const relativePath of VARIABLES_MANIFEST_PATHS) {
    const filePath = path.join(directory, relativePath);
    let stats;
    try {
      stats = await lstat(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    if (!stats.isFile() || stats.size > MAX_VARIABLES_MANIFEST_BYTES)
      throw new ReleasesError(
        `Artifact entry "${relativePath}" must be a regular file of at most 1 MiB.`,
        'INVALID_VARIABLES_MANIFEST',
        'INVALID_ARGUMENT',
      );
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
    } catch {
      throw new ReleasesError(
        `Artifact entry "${relativePath}" is not valid JSON.`,
        'INVALID_VARIABLES_MANIFEST',
        'INVALID_ARGUMENT',
      );
    }
    return parseVariablesManifest(parsed);
  }
  return null;
}

async function readConfigTemplate(directory: string): Promise<string | null> {
  const matches: { path: string; content: string }[] = [];
  for (const relativePath of CONFIG_TEMPLATE_PATHS) {
    const filePath = path.join(directory, relativePath);
    try {
      const stats = await lstat(filePath);
      if (!stats.isFile())
        throw new ReleasesError(
          `Artifact entry "${relativePath}" must be a regular file.`,
          'INVALID_ARTIFACT',
          'INVALID_ARGUMENT',
        );
      matches.push({
        path: relativePath,
        content: await readFile(filePath, 'utf8'),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  if (matches.length > 1)
    throw new ReleasesError(
      `Release artifact must contain at most one config example; found ${matches.map((match) => match.path).join(', ')}.`,
      'INVALID_ARTIFACT',
      'INVALID_ARGUMENT',
    );
  return matches[0]?.content ?? null;
}
