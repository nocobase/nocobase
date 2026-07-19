/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Transform, type Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { open, type Entry, type ZipFile } from 'yauzl';

import { isLightExtensionError, LightExtensionError } from '../../shared/errors';

export const CLIENT_APP_ARCHIVE_LIMITS = Object.freeze({
  compressedBytes: 50 * 1024 * 1024,
  files: 2_000,
  fileBytes: 25 * 1024 * 1024,
  extractedBytes: 200 * 1024 * 1024,
  compressionRatio: 100,
  entryDescriptorBytes: 128 * 1024,
  pathBytes: 255,
});

export interface ClientAppArchiveAsset {
  relativePath: string;
  filePath: string;
  contentHash: string;
  byteSize: number;
}

export interface PreparedClientAppArchive {
  descriptor: ClientAppDescriptorFile;
  entryHtml: string;
  contentHash: string;
  fileCount: number;
  byteSize: number;
  assets: ClientAppArchiveAsset[];
  dispose(): Promise<void>;
}

export interface ClientAppDescriptorFile {
  schemaVersion: 1;
  key: string;
  title?: string;
  entry: string;
}

interface InspectedArchiveEntry {
  originalPath: string;
  path: string;
  directory: boolean;
  compressedSize: number;
  uncompressedSize: number;
}

interface ExtractedArchiveEntry extends InspectedArchiveEntry {
  filePath: string;
  contentHash: string;
  byteSize: number;
}

export async function prepareClientAppArchive(zipPath: string): Promise<PreparedClientAppArchive> {
  const stat = await fs.stat(zipPath);
  if (!stat.isFile() || stat.size > CLIENT_APP_ARCHIVE_LIMITS.compressedBytes) {
    throw invalidArchive(`ZIP must not exceed ${CLIENT_APP_ARCHIVE_LIMITS.compressedBytes} bytes`);
  }

  const inspected = await inspectArchive(zipPath);
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-client-app-'));
  try {
    const extracted = await extractArchive(zipPath, temporaryRoot, inspected);
    const descriptorEntry = extracted.find((entry) => entry.path === 'entry.json');
    if (!descriptorEntry || descriptorEntry.directory) {
      throw invalidArchive('ZIP must contain a regular root entry.json file');
    }
    if (descriptorEntry.byteSize > CLIENT_APP_ARCHIVE_LIMITS.entryDescriptorBytes) {
      throw invalidArchive(`entry.json must not exceed ${CLIENT_APP_ARCHIVE_LIMITS.entryDescriptorBytes} bytes`);
    }

    let descriptor: ClientAppDescriptorFile;
    try {
      descriptor = parseClientAppDescriptor(await fs.readFile(descriptorEntry.filePath, 'utf8'));
    } catch (error) {
      throw invalidArchive(error instanceof Error ? error.message : 'entry.json is invalid');
    }
    const staticRoot = getStaticRoot(descriptor.entry);
    const entryAssetPath = staticRoot ? descriptor.entry.slice(staticRoot.length + 1) : descriptor.entry;
    const assets = extracted
      .filter((entry): entry is ExtractedArchiveEntry => !entry.directory && entry.path !== 'entry.json')
      .filter((entry) => isInsideStaticRoot(entry.path, staticRoot))
      .map((entry) => ({
        relativePath: staticRoot ? entry.path.slice(staticRoot.length + 1) : entry.path,
        filePath: entry.filePath,
        contentHash: entry.contentHash,
        byteSize: entry.byteSize,
      }))
      .sort((left, right) => left.relativePath.localeCompare(right.relativePath));

    if (!assets.some((asset) => asset.relativePath === entryAssetPath)) {
      throw invalidArchive(`Client app entry file "${descriptor.entry}" was not found`);
    }
    const byteSize = assets.reduce((total, asset) => total + asset.byteSize, 0);
    const contentHash = hashAssetSet(assets);
    let disposed = false;
    return {
      descriptor,
      entryHtml: descriptor.entry,
      contentHash,
      fileCount: assets.length,
      byteSize,
      assets,
      async dispose() {
        if (disposed) {
          return;
        }
        disposed = true;
        await fs.rm(temporaryRoot, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}

async function inspectArchive(zipPath: string): Promise<InspectedArchiveEntry[]> {
  const rawEntries = await readZipEntries(zipPath);
  const shellPrefix = getSingleShellPrefix(rawEntries.map((entry) => entry.fileName));
  const entries: InspectedArchiveEntry[] = [];
  const exactPaths = new Set<string>();
  const lowerPaths = new Set<string>();
  let fileCount = 0;
  let totalBytes = 0;

  for (const entry of rawEntries) {
    const originalPath = validateZipPath(entry.fileName);
    const normalizedPath = shellPrefix ? originalPath.slice(shellPrefix.length) : originalPath;
    if (!normalizedPath) {
      continue;
    }
    const directory = isDirectoryEntry(entry);
    assertRegularZipEntry(entry, directory);
    const collisionPath = directory ? normalizedPath.replace(/\/$/u, '') : normalizedPath;
    if (!collisionPath) {
      continue;
    }
    if (Buffer.byteLength(collisionPath, 'utf8') > CLIENT_APP_ARCHIVE_LIMITS.pathBytes) {
      throw invalidArchive(`ZIP path "${collisionPath}" exceeds the path length limit`);
    }
    if (exactPaths.has(collisionPath)) {
      throw invalidArchive(`ZIP contains duplicate path "${collisionPath}"`);
    }
    const lowerPath = collisionPath.normalize('NFC').toLocaleLowerCase('en-US');
    if (lowerPaths.has(lowerPath)) {
      throw invalidArchive(`ZIP contains a case-insensitive path collision at "${collisionPath}"`);
    }
    exactPaths.add(collisionPath);
    lowerPaths.add(lowerPath);

    if (!directory) {
      fileCount += 1;
      totalBytes += entry.uncompressedSize;
      if (fileCount > CLIENT_APP_ARCHIVE_LIMITS.files) {
        throw invalidArchive(`ZIP must not contain more than ${CLIENT_APP_ARCHIVE_LIMITS.files} files`);
      }
      if (entry.uncompressedSize > CLIENT_APP_ARCHIVE_LIMITS.fileBytes) {
        throw invalidArchive(`ZIP file "${collisionPath}" exceeds the per-file size limit`);
      }
      if (totalBytes > CLIENT_APP_ARCHIVE_LIMITS.extractedBytes) {
        throw invalidArchive('ZIP exceeds the total extracted size limit');
      }
      if (
        entry.uncompressedSize > 0 &&
        (entry.compressedSize === 0 ||
          entry.uncompressedSize / entry.compressedSize > CLIENT_APP_ARCHIVE_LIMITS.compressionRatio)
      ) {
        throw invalidArchive(`ZIP file "${collisionPath}" exceeds the compression-ratio limit`);
      }
    }

    entries.push({
      originalPath,
      path: collisionPath,
      directory,
      compressedSize: entry.compressedSize,
      uncompressedSize: entry.uncompressedSize,
    });
  }

  if (!entries.some((entry) => entry.path === 'entry.json' && !entry.directory)) {
    throw invalidArchive('ZIP must contain a regular root entry.json file');
  }
  return entries;
}

async function extractArchive(
  zipPath: string,
  temporaryRoot: string,
  inspected: InspectedArchiveEntry[],
): Promise<ExtractedArchiveEntry[]> {
  const byOriginalPath = new Map(inspected.map((entry) => [entry.originalPath, entry]));
  const extracted: ExtractedArchiveEntry[] = [];
  await visitZipEntries(zipPath, async (zip, zipEntry) => {
    const inspectedEntry = byOriginalPath.get(zipEntry.fileName);
    if (!inspectedEntry || inspectedEntry.directory) {
      return;
    }
    const filePath = path.resolve(temporaryRoot, ...inspectedEntry.path.split('/'));
    if (!isPathInside(temporaryRoot, filePath)) {
      throw invalidArchive(`ZIP path "${inspectedEntry.path}" escapes the staging directory`);
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const stream = await openEntryStream(zip, zipEntry);
    const { contentHash, byteSize } = await writeEntryStream(stream, filePath, inspectedEntry.uncompressedSize);
    extracted.push({
      ...inspectedEntry,
      filePath,
      contentHash,
      byteSize,
    });
  });
  return extracted;
}

async function readZipEntries(zipPath: string): Promise<Entry[]> {
  const entries: Entry[] = [];
  await visitZipEntries(zipPath, async (_zip, entry) => {
    if (entries.length >= CLIENT_APP_ARCHIVE_LIMITS.files * 2) {
      throw invalidArchive('ZIP contains too many central-directory entries');
    }
    entries.push(entry);
  });
  return entries;
}

async function visitZipEntries(zipPath: string, visitor: (zip: ZipFile, entry: Entry) => Promise<void>): Promise<void> {
  const zip = await openZip(zipPath);
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      zip.close();
      reject(
        isLightExtensionError(error)
          ? error
          : invalidArchive(error instanceof Error ? error.message : 'ZIP cannot be read'),
      );
    };
    zip.on('error', fail);
    zip.on('end', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
    zip.on('entry', (entry) => {
      visitor(zip, entry)
        .then(() => zip.readEntry())
        .catch((error) => fail(error));
    });
    zip.readEntry();
  });
}

function openZip(zipPath: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    open(
      zipPath,
      {
        autoClose: true,
        lazyEntries: true,
        strictFileNames: true,
        validateEntrySizes: true,
      },
      (error, zip) => {
        if (error || !zip) {
          reject(invalidArchive(error?.message || 'ZIP cannot be opened'));
          return;
        }
        resolve(zip);
      },
    );
  });
}

function openEntryStream(zip: ZipFile, entry: Entry): Promise<Readable> {
  return new Promise((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(invalidArchive(error?.message || `ZIP file "${entry.fileName}" cannot be read`));
        return;
      }
      resolve(stream);
    });
  });
}

async function writeEntryStream(
  stream: Readable,
  filePath: string,
  expectedBytes: number,
): Promise<{ contentHash: string; byteSize: number }> {
  const hash = createHash('sha256');
  let byteSize = 0;
  const meter = new Transform({
    transform(chunk: Buffer | string, _encoding, callback) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      byteSize += buffer.length;
      if (byteSize > expectedBytes || byteSize > CLIENT_APP_ARCHIVE_LIMITS.fileBytes) {
        callback(invalidArchive(`ZIP file "${path.basename(filePath)}" expanded beyond its declared size`));
        return;
      }
      hash.update(buffer);
      callback(null, buffer);
    },
  });
  await pipeline(stream, meter, createWriteStream(filePath, { flags: 'wx' }));
  if (byteSize !== expectedBytes) {
    throw invalidArchive(`ZIP file "${path.basename(filePath)}" has an invalid extracted size`);
  }
  return { contentHash: hash.digest('hex'), byteSize };
}

function validateZipPath(value: string): string {
  if (!value || value.includes('\0') || value.includes('\\')) {
    throw invalidArchive('ZIP paths must be non-empty POSIX paths without null bytes or backslashes');
  }
  if (value.startsWith('/') || /^[A-Za-z]:/u.test(value) || value.startsWith('//')) {
    throw invalidArchive(`ZIP path "${value}" must be relative`);
  }
  const directory = value.endsWith('/');
  const pathValue = directory ? value.slice(0, -1) : value;
  const segments = pathValue.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes(':'))) {
    throw invalidArchive(`ZIP path "${value}" contains an invalid segment`);
  }
  return directory ? `${segments.join('/')}/` : segments.join('/');
}

function isDirectoryEntry(entry: Entry): boolean {
  return entry.fileName.endsWith('/') || (entry.externalFileAttributes & 0x10) === 0x10;
}

function assertRegularZipEntry(entry: Entry, directory: boolean): void {
  if ((entry.generalPurposeBitFlag & 0x1) !== 0) {
    throw invalidArchive(`Encrypted ZIP entry "${entry.fileName}" is not supported`);
  }
  const hostSystem = entry.versionMadeBy >>> 8;
  if (hostSystem !== 3) {
    return;
  }
  const mode = (entry.externalFileAttributes >>> 16) & 0xffff;
  const fileType = mode & 0xf000;
  if (fileType === 0) {
    return;
  }
  const expected = directory ? 0x4000 : 0x8000;
  if (fileType !== expected) {
    throw invalidArchive(`ZIP entry "${entry.fileName}" must be a regular file or directory`);
  }
}

function getSingleShellPrefix(paths: string[]): string {
  if (paths.includes('entry.json')) {
    return '';
  }
  const normalizedPaths = paths.map((entryPath) => validateZipPath(entryPath));
  const first = normalizedPaths[0]?.replace(/\/$/u, '').split('/')[0];
  const prefix = first ? `${first}/` : '';
  return prefix && normalizedPaths.every((entryPath) => entryPath.startsWith(prefix)) ? prefix : '';
}

function isInsideStaticRoot(filePath: string, staticRoot: string): boolean {
  return !staticRoot || filePath.startsWith(`${staticRoot}/`);
}

function isPathInside(base: string, target: string): boolean {
  const relative = path.relative(base, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function hashAssetSet(assets: ClientAppArchiveAsset[]): string {
  const hash = createHash('sha256');
  for (const asset of assets) {
    hash.update(asset.relativePath);
    hash.update('\0');
    hash.update(asset.contentHash);
    hash.update('\0');
    hash.update(String(asset.byteSize));
    hash.update('\n');
  }
  return hash.digest('hex');
}

const CLIENT_APP_DESCRIPTOR_FIELDS = new Set(['schemaVersion', 'key', 'title', 'entry']);

function parseClientAppDescriptor(content: string): ClientAppDescriptorFile {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new TypeError(error instanceof Error ? error.message : 'entry.json is invalid JSON');
  }
  if (!isRecord(value)) {
    throw new TypeError('entry.json must contain a JSON object');
  }
  const unsupportedField = Object.keys(value).find((field) => !CLIENT_APP_DESCRIPTOR_FIELDS.has(field));
  if (unsupportedField) {
    throw new TypeError(`entry.json field "${unsupportedField}" is not supported`);
  }
  if (value.schemaVersion !== 1) {
    throw new TypeError('entry.json schemaVersion must be 1');
  }
  const key = requireSlug(value.key, 'key');
  const descriptor: ClientAppDescriptorFile = {
    schemaVersion: 1,
    key,
    entry: normalizeEntryPath(value.entry),
  };
  assignOptionalString(descriptor, value, 'title', 120);
  return descriptor;
}

function assignOptionalString(
  descriptor: ClientAppDescriptorFile,
  value: Record<string, unknown>,
  field: 'title',
  maxLength: number,
): void {
  const fieldValue = value[field];
  if (fieldValue === undefined) {
    return;
  }
  if (typeof fieldValue !== 'string' || fieldValue.length > maxLength) {
    throw new TypeError(`entry.json ${field} must be a string no longer than ${maxLength} characters`);
  }
  descriptor[field] = fieldValue;
}

function requireSlug(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,62}$/u.test(value)) {
    throw new TypeError(`entry.json ${field} must be a lowercase slug`);
  }
  return value;
}

function normalizeEntryPath(value: unknown): string {
  const entry = value === undefined ? 'index.html' : value;
  if (typeof entry !== 'string' || !entry || entry.includes('\0') || entry.includes('\\') || entry.startsWith('/')) {
    throw new TypeError('entry.json entry must be a safe relative HTML path');
  }
  const segments = entry.split('/');
  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..') ||
    entry.includes('?') ||
    entry.includes('#') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(entry) ||
    !/\.html?$/iu.test(segments[segments.length - 1])
  ) {
    throw new TypeError('entry.json entry must be a safe relative HTML path');
  }
  return entry;
}

function getStaticRoot(entry: string): string {
  const separator = entry.lastIndexOf('/');
  return separator < 0 ? '' : entry.slice(0, separator);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidArchive(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', message, {
    status: 422,
    details: { category: 'client-app-archive' },
  });
}
