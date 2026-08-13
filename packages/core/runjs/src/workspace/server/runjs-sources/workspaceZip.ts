/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip, { type JSZipObject } from 'jszip';
import type { Readable } from 'stream';
import { TextDecoder } from 'util';

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { VscError, isVscError } from '../../shared/errors';
import { normalizePath } from '../../shared/path';
import {
  defaultRunJSEntryPath,
  resolveRunJSWorkspaceEntryPath,
  runJSManifestPath,
  validateRunJSWorkspacePathValue,
} from '../../shared/runjs-workspace-path';
import type { RunJSLegacySource } from '../../shared/runjs-source-types';
import { normalizeText } from '../../shared/text';
import type { VscFileChange } from '../../shared/types';
import type { PulledFile } from '../services/VscFileService';
import { assertRunJSCompileInputLimits } from './compileMaterialization';
import { compactObject, normalizeAllowedRunJSWorkspacePath, toStringValue } from './resourceInput';

export interface RunJSWorkspaceZipLimits {
  maxCompressedBytes: number;
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
  maxCompressionRatio: number;
}

export type RunJSWorkspaceZipMetadataPolicy = boolean | ((path: string) => boolean);

export interface ReadRunJSWorkspaceZipOptions {
  limits?: Partial<RunJSWorkspaceZipLimits>;
  pathMode?: 'workspace' | 'archive';
  stripSingleTopLevelDirectory?: boolean;
  ignoreMetadata?: RunJSWorkspaceZipMetadataPolicy;
}

export const defaultRunJSWorkspaceZipLimits: Readonly<RunJSWorkspaceZipLimits> = Object.freeze({
  maxCompressedBytes: maxRepoTextSize,
  maxFiles: maxFilesPerRepo,
  maxFileBytes: maxFileSize,
  maxTotalBytes: maxRepoTextSize,
  maxCompressionRatio: 20,
});

interface RunJSWorkspaceZipBudget {
  totalBytes: number;
  limits: RunJSWorkspaceZipLimits;
}

export async function createRunJSWorkspaceZip(files: PulledFile[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    zip.file(file.path, file.content || '');
  }

  return zip.generateAsync({
    compression: 'DEFLATE',
    type: 'nodebuffer',
  });
}

export async function readRunJSWorkspaceZip(
  zipBase64: string,
  options: ReadRunJSWorkspaceZipOptions = {},
): Promise<VscFileChange[]> {
  const limits = normalizeRunJSWorkspaceZipLimits(options.limits);
  const buffer = decodeBase64Buffer(zipBase64, 'zipBase64');
  if (buffer.length > limits.maxCompressedBytes) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP size must not exceed ${limits.maxCompressedBytes} bytes`, {
      details: {
        size: buffer.length,
        maxCompressedBytes: limits.maxCompressedBytes,
      },
    });
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new VscError('PATH_INVALID', 'RunJS workspace ZIP is invalid', {
      details: {
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }
  const filesByPath = new Map<string, VscFileChange>();
  const zipEntries = Object.values(zip.files);
  for (const entry of zipEntries) {
    normalizeRunJSZipStructuralPath(getRunJSZipEntryName(entry), entry.dir);
    if (isRunJSZipSymbolicLink(entry)) {
      throw new VscError('PATH_INVALID', `ZIP entry "${getRunJSZipEntryName(entry)}" must not be a symbolic link`);
    }
  }
  const entries = zipEntries.filter(
    (entry) => !entry.dir && !shouldIgnoreRunJSZipMetadata(getRunJSZipEntryName(entry), options.ignoreMetadata),
  );
  if (entries.length > limits.maxFiles) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP must not contain more than ${limits.maxFiles} files`, {
      details: {
        fileCount: entries.length,
        maxFiles: limits.maxFiles,
      },
    });
  }
  const rawPaths = entries.map((entry) => normalizeRunJSZipEntryPath(getRunJSZipEntryName(entry)));
  const topLevelDirectory = options.stripSingleTopLevelDirectory ? findRunJSZipSingleTopLevelDirectory(rawPaths) : null;
  const paths = rawPaths.map((path) => stripRunJSZipTopLevelDirectory(path, topLevelDirectory));
  assertUniqueRunJSZipPaths(paths);
  const budget: RunJSWorkspaceZipBudget = {
    totalBytes: 0,
    limits,
  };

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const path = normalizeRunJSZipOutputPath(paths[index], options.pathMode);
    const pathKey = path.toLocaleLowerCase('en-US');
    if (filesByPath.has(pathKey)) {
      throw new VscError('PATH_INVALID', `Duplicate file path "${path}" in ZIP`);
    }
    filesByPath.set(pathKey, {
      path,
      operation: 'upsert',
      content: await readRunJSZipEntryText(entry, path, budget),
    });
  }

  const files = Array.from(filesByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  if (usesDefaultRunJSWorkspaceContentLimits(limits)) {
    assertRunJSCompileInputLimits(files);
  }

  return files;
}

async function readRunJSZipEntryText(
  entry: JSZipObject,
  path: string,
  budget: RunJSWorkspaceZipBudget,
): Promise<string> {
  const declaredSize = getZipEntryDeclaredSize(entry);
  if (declaredSize !== null && declaredSize > budget.limits.maxFileBytes) {
    throw new VscError('FILE_TOO_LARGE', `ZIP entry "${path}" exceeds ${budget.limits.maxFileBytes} bytes`, {
      details: {
        path,
        size: declaredSize,
        maxFileBytes: budget.limits.maxFileBytes,
      },
    });
  }
  if (declaredSize !== null) {
    assertRunJSZipCompressionRatio(getZipEntryCompressedSize(entry), declaredSize, budget.limits);
  }
  if (declaredSize !== null && budget.totalBytes + declaredSize > budget.limits.maxTotalBytes) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${budget.limits.maxTotalBytes} bytes`, {
      details: {
        byteSize: budget.totalBytes + declaredSize,
        maxTotalBytes: budget.limits.maxTotalBytes,
      },
    });
  }

  const chunks: Buffer[] = [];
  let fileBytes = 0;
  let limitError: VscError | null = null;

  try {
    const stream = entry.nodeStream('nodebuffer') as Readable;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onError);
      };
      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const stopAtLimit = () => {
        stream.pause();
        finish();
        stream.destroy();
      };
      const onData = (chunk: Buffer | Uint8Array | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        fileBytes += buffer.length;
        budget.totalBytes += buffer.length;
        if (fileBytes > budget.limits.maxFileBytes) {
          limitError = new VscError(
            'FILE_TOO_LARGE',
            `ZIP entry "${path}" exceeds ${budget.limits.maxFileBytes} bytes`,
            {
              details: {
                path,
                size: fileBytes,
                maxFileBytes: budget.limits.maxFileBytes,
              },
            },
          );
          stopAtLimit();
          return;
        }
        if (budget.totalBytes > budget.limits.maxTotalBytes) {
          limitError = new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${budget.limits.maxTotalBytes} bytes`, {
            details: {
              byteSize: budget.totalBytes,
              maxTotalBytes: budget.limits.maxTotalBytes,
            },
          });
          stopAtLimit();
          return;
        }
        chunks.push(buffer);
      };
      const onEnd = () => finish();
      const onError = (error: Error) => finish(error);

      stream.on('data', onData);
      stream.once('end', onEnd);
      stream.once('error', onError);
    });
  } catch (error) {
    if (isVscError(error)) {
      throw error;
    }
    throw new VscError('PATH_INVALID', `ZIP entry "${path}" could not be read`, {
      details: {
        path,
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }

  if (limitError) {
    throw limitError;
  }

  assertRunJSZipCompressionRatio(getZipEntryCompressedSize(entry), fileBytes, budget.limits);
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, fileBytes));
  } catch {
    throw new VscError('TEXT_ENCODING_INVALID', `ZIP entry "${path}" must be valid UTF-8 text`, {
      details: { path },
    });
  }
  return normalizeText(content);
}

function assertRunJSZipCompressionRatio(
  compressedBytes: number,
  uncompressedBytes: number,
  limits: RunJSWorkspaceZipLimits,
): void {
  if (uncompressedBytes > 0 && compressedBytes === 0) {
    throw new VscError('REPO_LIMIT_EXCEEDED', 'ZIP compression ratio is too high', {
      details: { compressedBytes, uncompressedBytes, maxCompressionRatio: limits.maxCompressionRatio },
    });
  }
  if (compressedBytes > 0 && uncompressedBytes / compressedBytes > limits.maxCompressionRatio) {
    throw new VscError('REPO_LIMIT_EXCEEDED', 'ZIP compression ratio is too high', {
      details: { compressedBytes, uncompressedBytes, maxCompressionRatio: limits.maxCompressionRatio },
    });
  }
}

function normalizeRunJSWorkspaceZipLimits(overrides?: Partial<RunJSWorkspaceZipLimits>): RunJSWorkspaceZipLimits {
  const limits = { ...defaultRunJSWorkspaceZipLimits, ...overrides };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new VscError(
        'RUNJS_SOURCE_LOCATOR_INVALID',
        `RunJS workspace ZIP limit "${name}" must be a positive integer`,
      );
    }
  }
  return limits;
}

function usesDefaultRunJSWorkspaceContentLimits(limits: RunJSWorkspaceZipLimits): boolean {
  return (
    limits.maxFiles === maxFilesPerRepo &&
    limits.maxFileBytes === maxFileSize &&
    limits.maxTotalBytes === maxRepoTextSize
  );
}

function shouldIgnoreRunJSZipMetadata(
  path: string,
  ignoreMetadata: ReadRunJSWorkspaceZipOptions['ignoreMetadata'],
): boolean {
  if (!ignoreMetadata) {
    return false;
  }
  if (typeof ignoreMetadata === 'function') {
    return ignoreMetadata(path);
  }

  const segments = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const fileName = segments[segments.length - 1];
  return segments.includes('__MACOSX') || fileName === '.DS_Store' || fileName?.startsWith('._') === true;
}

function findRunJSZipSingleTopLevelDirectory(paths: string[]): string | null {
  if (!paths.length || paths.some(isRunJSWorkspaceRootPath)) {
    return null;
  }

  const firstSegments = paths.map((path) => path.split('/')[0]);
  const topLevelDirectory = firstSegments[0];
  if (!topLevelDirectory || paths.some((path) => !path.includes('/'))) {
    return null;
  }
  return firstSegments.every((segment) => segment === topLevelDirectory) ? topLevelDirectory : null;
}

function isRunJSWorkspaceRootPath(path: string): boolean {
  return path === 'README.md' || path === runJSManifestPath || path.startsWith('src/');
}

function stripRunJSZipTopLevelDirectory(path: string, topLevelDirectory: string | null): string {
  return topLevelDirectory ? path.slice(topLevelDirectory.length + 1) : path;
}

function normalizeRunJSZipEntryPath(path: string): string {
  assertRunJSZipUsesPosixPath(path);
  return normalizePath(path);
}

function normalizeRunJSZipOutputPath(path: string, pathMode: ReadRunJSWorkspaceZipOptions['pathMode']): string {
  return pathMode === 'archive' ? normalizePath(path) : normalizeAllowedRunJSWorkspacePath(path, 'zip.entry');
}

function assertUniqueRunJSZipPaths(paths: string[]): void {
  const seen = new Set<string>();
  for (const path of paths) {
    const key = path.toLocaleLowerCase('en-US');
    if (seen.has(key)) {
      throw new VscError('PATH_INVALID', `Duplicate file path "${path}" in ZIP`);
    }
    seen.add(key);
  }
}

function normalizeRunJSZipStructuralPath(path: string, directory: boolean): string {
  const candidate = directory && path.endsWith('/') ? path.slice(0, -1) : path;
  assertRunJSZipUsesPosixPath(candidate);
  return normalizePath(candidate);
}

function assertRunJSZipUsesPosixPath(path: string): void {
  if (path.includes('\\')) {
    throw new VscError('PATH_INVALID', 'ZIP entry paths must use POSIX separators');
  }
}

function getRunJSZipEntryName(entry: JSZipObject): string {
  return entry.unsafeOriginalName || entry.name;
}

function isRunJSZipSymbolicLink(entry: JSZipObject): boolean {
  const rawPermissions = entry.unixPermissions;
  const permissions = typeof rawPermissions === 'string' ? Number.parseInt(rawPermissions, 8) : rawPermissions;
  return typeof permissions === 'number' && (permissions & 0o170000) === 0o120000;
}

function getZipEntryDeclaredSize(entry: JSZipObject): number | null {
  const size = (entry as JSZipObject & { _data?: { uncompressedSize?: unknown } })._data?.uncompressedSize;
  return typeof size === 'number' && Number.isSafeInteger(size) && size >= 0 ? size : null;
}

function getZipEntryCompressedSize(entry: JSZipObject): number {
  const size = (entry as JSZipObject & { _data?: { compressedSize?: unknown } })._data?.compressedSize;
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0) {
    throw new VscError('PATH_INVALID', `ZIP entry "${getRunJSZipEntryName(entry)}" has invalid size metadata`);
  }
  return size;
}

function decodeBase64Buffer(value: string, field: string): Buffer {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('data:') ? decodeRunJSZipDataUri(trimmed, field) : trimmed;
  if (!normalized || normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(normalized)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }
  const buffer = Buffer.from(normalized, 'base64');
  if (!buffer.length || buffer.toString('base64') !== normalized) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }
  return buffer;
}

function decodeRunJSZipDataUri(value: string, field: string): string {
  const match =
    /^data:(?:application\/(?:zip|x-zip-compressed)|application\/octet-stream);base64,([A-Za-z0-9+/]*={0,2})$/u.exec(
      value,
    );
  if (!match) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }
  return match[1];
}

export function readRunJSWorkspaceManifest(files: VscFileChange[]): { entryPath?: string; version?: string } {
  const manifest = files.find((file) => normalizePath(file.path) === runJSManifestPath);
  if (!manifest || typeof manifest.content !== 'string' || !manifest.content.trim()) {
    return {};
  }

  try {
    const value = JSON.parse(manifest.content) as Record<string, unknown>;
    const entry = toStringValue(value.entry);
    const runtimeVersion = toStringValue(value.runtimeVersion);

    return compactObject({
      entryPath: entry ? normalizeAllowedRunJSWorkspacePath(entry, 'manifest.entry') : undefined,
      version: runtimeVersion,
    }) as { entryPath?: string; version?: string };
  } catch (error) {
    if (isVscError(error)) {
      throw error;
    }
    throw new VscError('PATH_INVALID', 'RunJS manifest in ZIP is invalid', {
      details: {
        path: runJSManifestPath,
      },
    });
  }
}

export function buildRunJSZipFileName(legacy: RunJSLegacySource): string {
  const baseName = (legacy.label || 'runjs-workspace').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${baseName || 'runjs-workspace'}.zip`;
}

export function selectEntryPath(files: VscFileChange[], preferredEntryPath?: string): string {
  const activeFiles = files.filter((file) => file.operation !== 'delete');
  return resolveRunJSWorkspaceEntryPath(
    activeFiles.map((file) => file.path),
    {
      fallback: defaultRunJSEntryPath,
      preferredEntries: [preferredEntryPath, readRunJSWorkspaceManifestEntry(activeFiles)],
    },
  );
}

export function readRunJSWorkspaceManifestEntry(files: VscFileChange[]): string | undefined {
  const manifest = files.find((file) => normalizePath(file.path) === runJSManifestPath);
  if (!manifest || typeof manifest.content !== 'string' || !manifest.content.trim()) {
    return undefined;
  }

  try {
    const value = JSON.parse(manifest.content) as Record<string, unknown>;
    const entry = toStringValue(value.entry);
    if (!entry) {
      return undefined;
    }
    const validation = validateRunJSWorkspacePathValue(entry);
    return validation.valid ? validation.path : undefined;
  } catch (_) {
    return undefined;
  }
}
