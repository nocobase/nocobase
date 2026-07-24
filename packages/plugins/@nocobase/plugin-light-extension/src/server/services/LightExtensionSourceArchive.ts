/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip, { type JSZipObject } from 'jszip';
import { posix as pathPosix } from 'path';
import { TextDecoder } from 'util';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionDiagnostic, LightExtensionTreeEntryInput } from '../../shared/types';
import { LightExtensionValidator, hasErrorDiagnostic } from './LightExtensionValidator';

type ZipEntrySizeData = {
  compressedSize?: unknown;
  uncompressedSize?: unknown;
};

const PROJECT_ROOT_FILE_NAMES = new Set(['README.md', 'light-extension.json', 'tsconfig.json']);
const SOURCE_ROOT = 'src/';
const ZIP_FILE_MODE = '100644';

export async function parseLightExtensionSourceArchive(
  zipBase64: string,
  validator: LightExtensionValidator,
): Promise<LightExtensionTreeEntryInput[]> {
  const archive = decodeArchiveBase64(zipBase64, validator);
  const zip = await loadArchive(archive);
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    validateArchiveEntry(entry);
  }
  const sourceEntries = entries.filter((entry) => !entry.dir && !isIgnoredMetadataPath(getOriginalEntryName(entry)));

  if (!sourceEntries.length) {
    throwArchiveValidation('zip_empty', 'ZIP archive does not contain source files');
  }

  const rawPaths = sourceEntries.map((entry) => normalizeArchiveEntryPath(getOriginalEntryName(entry)));
  const topLevelDirectory = findSharedTopLevelDirectory(rawPaths);
  const paths = rawPaths.map((path) => stripTopLevelDirectory(path, topLevelDirectory));
  assertUniquePaths(paths);
  const declaredUncompressedBytes = validateArchiveEntriesBeforeExtraction(
    sourceEntries,
    paths,
    archive.byteLength,
    validator,
  );
  assertZipBudget(archive.byteLength, declaredUncompressedBytes, validator);

  const files: LightExtensionTreeEntryInput[] = [];
  let extractedBytes = 0;
  for (let index = 0; index < sourceEntries.length; index += 1) {
    const entry = sourceEntries[index];
    const declaredSize = getZipEntrySize(entry, 'uncompressedSize');
    const contentBuffer = await extractEntry(entry);
    if (contentBuffer.byteLength !== declaredSize) {
      throwArchiveValidation('zip_size_mismatch', 'ZIP entry size does not match its declared size', paths[index]);
    }

    extractedBytes += contentBuffer.byteLength;
    try {
      files.push({
        path: paths[index],
        content: decodeUtf8(contentBuffer),
        size: contentBuffer.byteLength,
        language: languageFromPath(paths[index]),
        mode: ZIP_FILE_MODE,
      });
    } catch {
      throwArchiveValidation('zip_file_not_utf8', 'ZIP source files must be UTF-8 text', paths[index]);
    }
  }

  assertZipBudget(archive.byteLength, extractedBytes, validator);
  const diagnostics = validator.validateInitialFiles({ files });
  if (hasErrorDiagnostic(diagnostics)) {
    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension ZIP source is invalid', {
      status: 422,
      details: { diagnostics },
    });
  }

  return files;
}

function decodeUtf8(content: Buffer): string {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(content);
  if (decoded.includes('\0')) {
    throw new TypeError('NUL is not valid source text');
  }
  return decoded;
}

export function isStrictUtf8Text(content: string): boolean {
  return (
    !content.includes('\0') &&
    new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(content, 'utf8')) === content
  );
}

function decodeArchiveBase64(zipBase64: string, validator: LightExtensionValidator): Buffer {
  const value = zipBase64.trim();
  if (!value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throwArchiveValidation('zip_base64_invalid', 'ZIP archive must be valid base64 data');
  }

  const paddingLength = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const estimatedBytes = (value.length / 4) * 3 - paddingLength;
  assertZipBudget(estimatedBytes, 0, validator);

  const archive = Buffer.from(value, 'base64');
  if (!archive.length || archive.toString('base64') !== value) {
    throwArchiveValidation('zip_base64_invalid', 'ZIP archive must be valid base64 data');
  }

  assertZipBudget(archive.byteLength, 0, validator);
  return archive;
}

async function loadArchive(archive: Buffer): Promise<JSZip> {
  try {
    return await JSZip.loadAsync(archive, {
      createFolders: false,
    });
  } catch {
    throwArchiveValidation('zip_invalid', 'Unable to read ZIP archive');
  }
}

function validateArchiveEntry(entry: JSZipObject): void {
  const originalName = getOriginalEntryName(entry);
  const path = entry.dir && originalName.endsWith('/') ? originalName.slice(0, -1) : originalName;
  normalizeArchiveEntryPath(path);
  if (isSymbolicLink(entry)) {
    throwArchiveValidation('zip_symlink_not_allowed', 'ZIP archive cannot contain symbolic links', path);
  }
}

function validateArchiveEntriesBeforeExtraction(
  entries: JSZipObject[],
  paths: string[],
  compressedBytes: number,
  validator: LightExtensionValidator,
): number {
  const limits = validator.getCapabilities().limits;
  if (entries.length > limits.maxRepoFiles) {
    throwArchiveValidation('repo_file_count_exceeded', 'ZIP archive contains too many source files');
  }

  let uncompressedBytes = 0;
  let sourceBytes = 0;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const path = paths[index];
    const compressedSize = getZipEntrySize(entry, 'compressedSize');
    const uncompressedSize = getZipEntrySize(entry, 'uncompressedSize');
    if (compressedSize > compressedBytes || uncompressedSize > limits.maxFileBytes) {
      throwArchiveValidation('file_size_limit_exceeded', 'ZIP source file is too large', path);
    }
    uncompressedBytes += uncompressedSize;
    sourceBytes += uncompressedSize;
    if (sourceBytes > limits.maxRepoBytes) {
      throwArchiveValidation('repo_budget_limit_exceeded', 'ZIP source budget is exceeded');
    }
  }

  return uncompressedBytes;
}

function getZipEntrySize(entry: JSZipObject, key: keyof ZipEntrySizeData): number {
  const data = (entry as unknown as { _data?: ZipEntrySizeData })._data;
  const value = data?.[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throwArchiveValidation('zip_invalid', 'ZIP archive contains invalid entry metadata', getOriginalEntryName(entry));
  }

  return value;
}

async function extractEntry(entry: JSZipObject): Promise<Buffer> {
  try {
    return await entry.async('nodebuffer');
  } catch {
    throwArchiveValidation('zip_invalid', 'Unable to extract ZIP source file', getOriginalEntryName(entry));
  }
}

function getOriginalEntryName(entry: JSZipObject): string {
  return entry.unsafeOriginalName || entry.name;
}

function normalizeArchiveEntryPath(value: string): string {
  if (!value || value.includes('\\') || value.includes('\0') || value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    throwArchiveValidation('zip_path_invalid', 'ZIP archive contains an invalid source path', value);
  }

  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throwArchiveValidation('zip_path_invalid', 'ZIP archive contains an invalid source path', value);
  }

  const normalized = pathPosix.normalize(value);
  if (normalized !== value || normalized.startsWith('../')) {
    throwArchiveValidation('zip_path_invalid', 'ZIP archive contains an invalid source path', value);
  }

  return normalized;
}

function isIgnoredMetadataPath(value: string): boolean {
  const normalized = value.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments.includes('__MACOSX') || segments[segments.length - 1] === '.DS_Store';
}

function findSharedTopLevelDirectory(paths: string[]): string | null {
  if (paths.some(isProjectRootPath)) {
    return null;
  }

  const firstSegments = paths.map((path) => path.split('/')[0]);
  const topLevelDirectory = firstSegments[0];
  if (
    !topLevelDirectory ||
    paths.some((path) => !path.includes('/')) ||
    firstSegments.some((item) => item !== topLevelDirectory)
  ) {
    return null;
  }

  return topLevelDirectory;
}

function isProjectRootPath(path: string): boolean {
  return PROJECT_ROOT_FILE_NAMES.has(path) || path.startsWith(SOURCE_ROOT);
}

function stripTopLevelDirectory(path: string, topLevelDirectory: string | null): string {
  return topLevelDirectory ? path.slice(topLevelDirectory.length + 1) : path;
}

function assertUniquePaths(paths: string[]): void {
  const exactPaths = new Set<string>();
  const caseInsensitivePaths = new Set<string>();
  for (const path of paths) {
    const lowerPath = path.toLocaleLowerCase('en-US');
    if (exactPaths.has(path) || caseInsensitivePaths.has(lowerPath)) {
      throwArchiveValidation('zip_duplicate_path', 'ZIP archive contains duplicate source paths', path);
    }
    exactPaths.add(path);
    caseInsensitivePaths.add(lowerPath);
  }
}

function isSymbolicLink(entry: JSZipObject): boolean {
  const rawPermissions = entry.unixPermissions;
  const permissions = typeof rawPermissions === 'string' ? Number.parseInt(rawPermissions, 8) : rawPermissions;
  return typeof permissions === 'number' && (permissions & 0o170000) === 0o120000;
}

function assertZipBudget(compressedBytes: number, uncompressedBytes: number, validator: LightExtensionValidator): void {
  const diagnostics = validator.validateZipBudget({ compressedBytes, uncompressedBytes });
  if (hasErrorDiagnostic(diagnostics)) {
    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension ZIP source is invalid', {
      status: 422,
      details: { diagnostics },
    });
  }
}

function throwArchiveValidation(code: string, message: string, path?: string): never {
  const diagnostic: LightExtensionDiagnostic = {
    code,
    severity: 'error',
    message,
    ...(path ? { path } : {}),
  };
  throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', message, {
    status: 422,
    details: { diagnostics: [diagnostic] },
  });
}

function languageFromPath(path: string): string {
  const extension = pathPosix.extname(path).toLowerCase();
  if (extension === '.ts' || extension === '.tsx') {
    return 'typescript';
  }
  if (extension === '.js' || extension === '.jsx') {
    return 'javascript';
  }
  if (extension === '.json') {
    return 'json';
  }
  if (extension === '.md') {
    return 'markdown';
  }
  if (extension === '.html' || extension === '.htm') {
    return 'html';
  }
  if (extension === '.css') {
    return 'css';
  }
  return 'text';
}
