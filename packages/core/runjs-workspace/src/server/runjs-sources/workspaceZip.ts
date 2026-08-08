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

const maxZipCompressionRatio = 20;

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

export async function readRunJSWorkspaceZip(zipBase64: string): Promise<VscFileChange[]> {
  const buffer = decodeBase64Buffer(zipBase64, 'zipBase64');
  if (buffer.length > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP size must not exceed ${maxRepoTextSize} bytes`, {
      details: {
        size: buffer.length,
        maxRepoTextSize,
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
    if (isRunJSZipSymbolicLink(entry)) {
      throw new VscError('PATH_INVALID', `ZIP entry "${getRunJSZipEntryName(entry)}" must not be a symbolic link`);
    }
  }
  const entries = zipEntries.filter((entry) => !entry.dir);
  if (entries.length > maxFilesPerRepo) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP must not contain more than ${maxFilesPerRepo} files`, {
      details: {
        fileCount: entries.length,
        maxFilesPerRepo,
      },
    });
  }
  const budget = { totalBytes: 0, declaredBytes: 0, compressedBytes: buffer.length };

  for (const entry of entries) {
    const path = normalizeAllowedRunJSWorkspacePath(getRunJSZipEntryName(entry), 'zip.entry');
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
  assertRunJSCompileInputLimits(files);

  return files;
}

async function readRunJSZipEntryText(
  entry: JSZipObject,
  path: string,
  budget: { totalBytes: number; declaredBytes: number; compressedBytes: number },
): Promise<string> {
  const declaredSize = getZipEntryDeclaredSize(entry);
  if (declaredSize !== null && declaredSize > maxFileSize) {
    throw new VscError('FILE_TOO_LARGE', `ZIP entry "${path}" exceeds ${maxFileSize} bytes`, {
      details: {
        path,
        size: declaredSize,
        maxFileSize,
      },
    });
  }
  if (declaredSize !== null) {
    budget.declaredBytes += declaredSize;
    assertRunJSZipCompressionRatio(budget.compressedBytes, budget.declaredBytes);
  }
  if (declaredSize !== null && budget.totalBytes + declaredSize > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${maxRepoTextSize} bytes`, {
      details: {
        byteSize: budget.totalBytes + declaredSize,
        maxRepoTextSize,
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
        if (fileBytes > maxFileSize) {
          limitError = new VscError('FILE_TOO_LARGE', `ZIP entry "${path}" exceeds ${maxFileSize} bytes`, {
            details: {
              path,
              size: fileBytes,
              maxFileSize,
            },
          });
          stopAtLimit();
          return;
        }
        if (budget.totalBytes > maxRepoTextSize) {
          limitError = new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${maxRepoTextSize} bytes`, {
            details: {
              byteSize: budget.totalBytes,
              maxRepoTextSize,
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

  assertRunJSZipCompressionRatio(budget.compressedBytes, budget.totalBytes);
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

function assertRunJSZipCompressionRatio(compressedBytes: number, uncompressedBytes: number): void {
  if (compressedBytes > 0 && uncompressedBytes / compressedBytes > maxZipCompressionRatio) {
    throw new VscError('REPO_LIMIT_EXCEEDED', 'ZIP compression ratio is too high', {
      details: { compressedBytes, uncompressedBytes, maxZipCompressionRatio },
    });
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

function decodeBase64Buffer(value: string, field: string): Buffer {
  const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  if (!normalized.trim()) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }

  return Buffer.from(normalized, 'base64');
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
