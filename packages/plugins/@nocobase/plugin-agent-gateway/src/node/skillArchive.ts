/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'crypto';
import { createWriteStream, promises as fs } from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { Transform, Writable } from 'stream';
import { pipeline } from 'stream/promises';

import yauzl, { Entry, ZipFile } from 'yauzl';

export const SKILL_ARCHIVE_LIMITS = Object.freeze({
  maxDownloadBytes: 50 * 1024 * 1024,
  maxEntryCount: 1000,
  maxEntryUncompressedBytes: 25 * 1024 * 1024,
  maxTotalUncompressedBytes: 100 * 1024 * 1024,
  maxTotalCompressedBytes: 50 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxPathBytes: 1024,
  maxDirectoryDepth: 20,
  maxFileNameBytes: 255,
  maxRedirects: 5,
});

export const SKILL_ARCHIVE_ERROR_CODES = Object.freeze({
  aborted: 'AG_SKILL_ARCHIVE_ABORTED',
  invalidZip: 'AG_SKILL_ARCHIVE_INVALID_ZIP',
  empty: 'AG_SKILL_ARCHIVE_EMPTY',
  entryCount: 'AG_SKILL_ARCHIVE_ENTRY_COUNT_LIMIT',
  entrySize: 'AG_SKILL_ARCHIVE_ENTRY_SIZE_LIMIT',
  totalUncompressedSize: 'AG_SKILL_ARCHIVE_TOTAL_UNCOMPRESSED_LIMIT',
  totalCompressedSize: 'AG_SKILL_ARCHIVE_TOTAL_COMPRESSED_LIMIT',
  compressionRatio: 'AG_SKILL_ARCHIVE_COMPRESSION_RATIO_LIMIT',
  pathLength: 'AG_SKILL_ARCHIVE_PATH_LENGTH_LIMIT',
  pathDepth: 'AG_SKILL_ARCHIVE_PATH_DEPTH_LIMIT',
  fileNameLength: 'AG_SKILL_ARCHIVE_FILE_NAME_LENGTH_LIMIT',
  unsafePath: 'AG_SKILL_ARCHIVE_UNSAFE_PATH',
  duplicatePath: 'AG_SKILL_ARCHIVE_DUPLICATE_PATH',
  hardlink: 'AG_SKILL_ARCHIVE_HARDLINK',
  unsupportedEntryType: 'AG_SKILL_ARCHIVE_UNSUPPORTED_ENTRY_TYPE',
  encrypted: 'AG_SKILL_ARCHIVE_ENCRYPTED_ENTRY',
  unsupportedCompression: 'AG_SKILL_ARCHIVE_UNSUPPORTED_COMPRESSION',
  missingSkillMd: 'AG_SKILL_ARCHIVE_MISSING_SKILL_MD',
  downloadProtocol: 'AG_SKILL_ARCHIVE_DOWNLOAD_PROTOCOL',
  downloadRedirects: 'AG_SKILL_ARCHIVE_DOWNLOAD_REDIRECT_LIMIT',
  downloadHttp: 'AG_SKILL_ARCHIVE_DOWNLOAD_HTTP',
  downloadTimeout: 'AG_SKILL_ARCHIVE_DOWNLOAD_TIMEOUT',
  downloadInterrupted: 'AG_SKILL_ARCHIVE_DOWNLOAD_INTERRUPTED',
  downloadSize: 'AG_SKILL_ARCHIVE_DOWNLOAD_SIZE_LIMIT',
  downloadTrustedServer: 'AG_SKILL_ARCHIVE_DOWNLOAD_TRUSTED_SERVER_REQUIRED',
  downloadTrustedEndpoint: 'AG_SKILL_ARCHIVE_DOWNLOAD_TRUSTED_ENDPOINT_REQUIRED',
} as const);

export type SkillArchiveErrorCode = (typeof SKILL_ARCHIVE_ERROR_CODES)[keyof typeof SKILL_ARCHIVE_ERROR_CODES];

export class SkillArchiveError extends Error {
  constructor(public readonly code: SkillArchiveErrorCode) {
    super(code);
    this.name = 'SkillArchiveError';
  }
}

export interface PersistedSkillZipSource {
  type: 'zip';
  archivePath: string;
  sha256: string;
  sizeBytes: number;
  uploadedAt: string;
}

interface ArchiveEntryInfo {
  entry: Entry;
  normalizedPath: string;
  isDirectory: boolean;
}

interface ArchiveInspection {
  entryCount: number;
  totalCompressedBytes: number;
  totalUncompressedBytes: number;
  hasSkillMd: boolean;
}

interface DownloadSkillArchiveOptions {
  archiveUrl: string;
  destination: string;
  timeoutMs: number;
  signal?: AbortSignal;
  maxBytes?: number;
  getHeaders?: (url: URL) => Record<string, string>;
}

const UNIX_FILE_TYPE_MASK = 0o170000;
const UNIX_REGULAR_FILE = 0o100000;
const UNIX_DIRECTORY = 0o040000;

function getAbortError(signal?: AbortSignal) {
  if (signal?.reason instanceof Error) {
    return signal.reason;
  }
  const error = new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.aborted);
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw getAbortError(signal);
  }
}

function asStableArchiveError(error: unknown): Error {
  if (
    error instanceof SkillArchiveError ||
    (error instanceof Error && error.name === 'AbortError') ||
    (error instanceof Error && /^AG_SKILL_ARCHIVE_[A-Z_]+$/.test(String((error as Error & { code?: unknown }).code)))
  ) {
    return error;
  }
  if (error instanceof Error && /invalid relative path|absolute path/i.test(error.message)) {
    return new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
  }
  return new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.invalidZip);
}

export function getSkillArchiveErrorCode(error: unknown): SkillArchiveErrorCode {
  if (error instanceof SkillArchiveError) {
    return error.code;
  }
  const errorCode = error instanceof Error ? String((error as Error & { code?: unknown }).code) : '';
  return /^AG_SKILL_ARCHIVE_[A-Z_]+$/.test(errorCode)
    ? (errorCode as SkillArchiveErrorCode)
    : SKILL_ARCHIVE_ERROR_CODES.invalidZip;
}

function sha256Buffer(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function assertSafeSegment(segment: string) {
  if (!segment || segment.includes('/') || segment.includes('\\') || segment === '.' || segment === '..') {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
  }
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getEntryType(entry: Entry) {
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  const unixType = unixMode & UNIX_FILE_TYPE_MASK;
  const dosAttributes = entry.externalFileAttributes & 0xff;
  if (dosAttributes & 0x40) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType);
  }
  const nameIsDirectory = entry.fileName.endsWith('/');
  const dosDirectory = Boolean(dosAttributes & 0x10);
  if (unixType && unixType !== UNIX_REGULAR_FILE && unixType !== UNIX_DIRECTORY) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType);
  }
  if ((unixType === UNIX_DIRECTORY || dosDirectory) && !nameIsDirectory) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType);
  }
  if (unixType === UNIX_REGULAR_FILE && nameIsDirectory) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsupportedEntryType);
  }
  return nameIsDirectory || unixType === UNIX_DIRECTORY || dosDirectory;
}

function normalizeEntryPath(entry: Entry, isDirectory: boolean) {
  const fileName = entry.fileName;
  if (
    !fileName ||
    fileName.includes('\0') ||
    fileName.includes('\\') ||
    fileName.startsWith('/') ||
    /^[A-Za-z]:/.test(fileName)
  ) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
  }
  const withoutTrailingSlash = fileName.endsWith('/') ? fileName.slice(0, -1) : fileName;
  const segments = withoutTrailingSlash.split('/');
  if (!withoutTrailingSlash || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
  }
  if (Buffer.byteLength(withoutTrailingSlash, 'utf8') > SKILL_ARCHIVE_LIMITS.maxPathBytes) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.pathLength);
  }
  const directoryDepth = segments.length - (isDirectory ? 0 : 1);
  if (directoryDepth > SKILL_ARCHIVE_LIMITS.maxDirectoryDepth) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.pathDepth);
  }
  if (segments.some((segment) => Buffer.byteLength(segment, 'utf8') > SKILL_ARCHIVE_LIMITS.maxFileNameBytes)) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.fileNameLength);
  }
  return withoutTrailingSlash;
}

function hasStandardSkillMd(normalizedPath: string) {
  const segments = normalizedPath.split('/');
  return segments[segments.length - 1] === 'SKILL.md' && segments.length <= 2;
}

class ArchiveEntryValidator {
  private entryCount = 0;
  private totalCompressedBytes = 0;
  private totalUncompressedBytes = 0;
  private hasSkillMd = false;
  private readonly pathTypes = new Map<string, 'file' | 'directory'>();
  private readonly implicitDirectories = new Set<string>();
  private readonly localHeaderOffsets = new Set<number>();

  validate(entry: Entry): ArchiveEntryInfo {
    this.entryCount += 1;
    if (this.entryCount > SKILL_ARCHIVE_LIMITS.maxEntryCount) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.entryCount);
    }
    if (entry.generalPurposeBitFlag & 0x1) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.encrypted);
    }
    if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsupportedCompression);
    }
    if (!Number.isSafeInteger(entry.compressedSize) || !Number.isSafeInteger(entry.uncompressedSize)) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.entrySize);
    }

    const isDirectory = getEntryType(entry);
    const normalizedPath = normalizeEntryPath(entry, isDirectory);
    const pathKey = normalizedPath.normalize('NFC').toLocaleLowerCase('en-US');
    const entryType = isDirectory ? 'directory' : 'file';
    if (this.pathTypes.has(pathKey)) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.duplicatePath);
    }
    if (!isDirectory && this.implicitDirectories.has(pathKey)) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.duplicatePath);
    }
    const segments = pathKey.split('/');
    for (let index = 1; index < segments.length; index += 1) {
      const parentKey = segments.slice(0, index).join('/');
      if (this.pathTypes.get(parentKey) === 'file') {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.duplicatePath);
      }
      this.implicitDirectories.add(parentKey);
    }
    this.pathTypes.set(pathKey, entryType);

    if (!isDirectory) {
      if (this.localHeaderOffsets.has(entry.relativeOffsetOfLocalHeader)) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.hardlink);
      }
      this.localHeaderOffsets.add(entry.relativeOffsetOfLocalHeader);
      if (entry.uncompressedSize > SKILL_ARCHIVE_LIMITS.maxEntryUncompressedBytes) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.entrySize);
      }
      this.totalCompressedBytes += entry.compressedSize;
      this.totalUncompressedBytes += entry.uncompressedSize;
      if (this.totalCompressedBytes > SKILL_ARCHIVE_LIMITS.maxTotalCompressedBytes) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.totalCompressedSize);
      }
      if (this.totalUncompressedBytes > SKILL_ARCHIVE_LIMITS.maxTotalUncompressedBytes) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.totalUncompressedSize);
      }
      const entryRatio = entry.uncompressedSize / Math.max(entry.compressedSize, 1);
      const totalRatio = this.totalUncompressedBytes / Math.max(this.totalCompressedBytes, 1);
      if (
        entryRatio > SKILL_ARCHIVE_LIMITS.maxCompressionRatio ||
        totalRatio > SKILL_ARCHIVE_LIMITS.maxCompressionRatio
      ) {
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.compressionRatio);
      }
      this.hasSkillMd ||= hasStandardSkillMd(normalizedPath);
    }

    return { entry, normalizedPath, isDirectory };
  }

  finish(): ArchiveInspection {
    if (!this.entryCount) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.empty);
    }
    if (!this.hasSkillMd) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.missingSkillMd);
    }
    return {
      entryCount: this.entryCount,
      totalCompressedBytes: this.totalCompressedBytes,
      totalUncompressedBytes: this.totalUncompressedBytes,
      hasSkillMd: this.hasSkillMd,
    };
  }
}

async function openZip(archivePath: string) {
  return await new Promise<ZipFile>((resolve, reject) => {
    yauzl.open(
      archivePath,
      {
        autoClose: false,
        decodeStrings: true,
        lazyEntries: true,
        strictFileNames: true,
        validateEntrySizes: true,
      },
      (error, zipFile) => {
        if (error || !zipFile) {
          reject(error || new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.invalidZip));
          return;
        }
        resolve(zipFile);
      },
    );
  });
}

async function forEachZipEntry(
  archivePath: string,
  signal: AbortSignal | undefined,
  handler: (entry: Entry, zipFile: ZipFile) => Promise<void> | void,
) {
  throwIfAborted(signal);
  const zipFile = await openZip(archivePath);
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        signal?.removeEventListener('abort', abort);
        zipFile.removeListener('entry', onEntry);
        zipFile.removeListener('end', onEnd);
        zipFile.removeListener('error', onError);
      };
      const finish = (error?: unknown) => {
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
      const abort = () => {
        zipFile.close();
        finish(getAbortError(signal));
      };
      const onError = (error: Error) => finish(error);
      const onEnd = () => finish();
      const onEntry = (entry: Entry) => {
        Promise.resolve()
          .then(() => handler(entry, zipFile))
          .then(() => {
            if (!settled) {
              zipFile.readEntry();
            }
          })
          .catch((error) => {
            zipFile.close();
            finish(error);
          });
      };
      zipFile.on('entry', onEntry);
      zipFile.once('end', onEnd);
      zipFile.once('error', onError);
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) {
        abort();
        return;
      }
      zipFile.readEntry();
    });
  } finally {
    zipFile.close();
  }
}

async function inspectArchive(archivePath: string, signal?: AbortSignal) {
  const archiveStat = await fs.stat(archivePath);
  if (archiveStat.size > SKILL_ARCHIVE_LIMITS.maxDownloadBytes) {
    throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.totalCompressedSize);
  }
  const validator = new ArchiveEntryValidator();
  await forEachZipEntry(archivePath, signal, (entry) => {
    throwIfAborted(signal);
    validator.validate(entry);
  });
  return validator.finish();
}

async function openEntryStream(zipFile: ZipFile, entry: Entry) {
  return await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error || new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.invalidZip));
        return;
      }
      resolve(stream);
    });
  });
}

function createEntryByteCounter(entry: Entry, totals: { uncompressedBytes: number }) {
  let entryBytes = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      entryBytes += chunk.byteLength;
      totals.uncompressedBytes += chunk.byteLength;
      if (entryBytes > SKILL_ARCHIVE_LIMITS.maxEntryUncompressedBytes || entryBytes > entry.uncompressedSize) {
        callback(new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.entrySize));
        return;
      }
      if (totals.uncompressedBytes > SKILL_ARCHIVE_LIMITS.maxTotalUncompressedBytes) {
        callback(new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.totalUncompressedSize));
        return;
      }
      callback(null, chunk);
    },
  });
}

async function consumeArchive(archivePath: string, destination: string | undefined, signal?: AbortSignal) {
  const validator = new ArchiveEntryValidator();
  const totals = { uncompressedBytes: 0 };
  const resolvedDestination = destination ? path.resolve(destination) : null;
  await forEachZipEntry(archivePath, signal, async (entry, zipFile) => {
    throwIfAborted(signal);
    const entryInfo = validator.validate(entry);
    if (entryInfo.isDirectory) {
      if (resolvedDestination) {
        const directoryPath = path.resolve(resolvedDestination, entryInfo.normalizedPath);
        if (!isWithin(resolvedDestination, directoryPath)) {
          throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
        }
        await fs.mkdir(directoryPath, { recursive: true });
      }
      return;
    }

    const input = await openEntryStream(zipFile, entry);
    const counter = createEntryByteCounter(entry, totals);
    if (!resolvedDestination) {
      const sink = new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      });
      await pipeline(input, counter, sink, { signal });
      return;
    }

    const outputPath = path.resolve(resolvedDestination, entryInfo.normalizedPath);
    if (!isWithin(resolvedDestination, outputPath)) {
      throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.unsafePath);
    }
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const output = createWriteStream(outputPath, { flags: 'wx', mode: 0o600 });
    await pipeline(input, counter, output, { signal });
  });
  validator.finish();
}

export async function validateSkillZipArchive(archivePath: string, signal?: AbortSignal) {
  try {
    await inspectArchive(archivePath, signal);
    await consumeArchive(archivePath, undefined, signal);
  } catch (error) {
    if (signal?.aborted) {
      throw getAbortError(signal);
    }
    throw asStableArchiveError(error);
  }
}

export async function extractSkillZipArchive(archivePath: string, destination: string, signal?: AbortSignal) {
  try {
    await inspectArchive(archivePath, signal);
    await fs.mkdir(destination, { recursive: true });
    await consumeArchive(archivePath, destination, signal);
  } catch (error) {
    if (signal?.aborted) {
      throw getAbortError(signal);
    }
    throw asStableArchiveError(error);
  }
}

export async function persistSkillZipUpload(options: {
  content: Buffer;
  uploadDir: string;
  fileName?: string;
  now?: Date;
  validateArchive?: boolean;
}): Promise<PersistedSkillZipSource> {
  await fs.mkdir(options.uploadDir, { recursive: true });
  const sha256 = sha256Buffer(options.content);
  const fileName = options.fileName || `${sha256}.zip`;
  assertSafeSegment(fileName);
  const archivePath = path.join(options.uploadDir, fileName);
  await fs.writeFile(archivePath, options.content, { mode: 0o600 });
  try {
    if (options.validateArchive) {
      await validateSkillZipArchive(archivePath);
    }
  } catch (error) {
    await fs.rm(archivePath, { force: true });
    throw error;
  }
  return {
    type: 'zip',
    archivePath,
    sha256,
    sizeBytes: options.content.byteLength,
    uploadedAt: (options.now || new Date()).toISOString(),
  };
}

function getDownloadTransport(url: URL) {
  if (url.protocol === 'https:') {
    return https;
  }
  if (url.protocol === 'http:') {
    return http;
  }
  throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadProtocol);
}

async function requestArchive(url: URL, timeoutMs: number, headers: Record<string, string>, signal?: AbortSignal) {
  throwIfAborted(signal);
  const transport = getDownloadTransport(url);
  return await new Promise<http.IncomingMessage>((resolve, reject) => {
    let settled = false;
    const cleanup = () => signal?.removeEventListener('abort', abort);
    const finish = (error?: Error, response?: http.IncomingMessage) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      if (error) {
        reject(error);
        return;
      }
      resolve(response as http.IncomingMessage);
    };
    const request = transport.get(url, { headers }, (response) => finish(undefined, response));
    const abort = () => request.destroy(getAbortError(signal));
    request.setTimeout(timeoutMs, () => {
      request.destroy(new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadTimeout));
    });
    request.once('error', (error) => finish(error));
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
  });
}

export async function downloadSkillArchive(options: DownloadSkillArchiveOptions) {
  const maxBytes = options.maxBytes || SKILL_ARCHIVE_LIMITS.maxDownloadBytes;
  const partialPath = `${options.destination}.${randomUUID()}.partial`;
  await fs.mkdir(path.dirname(options.destination), { recursive: true });
  try {
    let url = new URL(options.archiveUrl);
    for (let redirectCount = 0; ; redirectCount += 1) {
      throwIfAborted(options.signal);
      getDownloadTransport(url);
      const headers = options.getHeaders?.(url) || {};
      const response = await requestArchive(url, options.timeoutMs, headers, options.signal);
      const statusCode = response.statusCode || 0;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location) {
        response.destroy();
        if (redirectCount >= SKILL_ARCHIVE_LIMITS.maxRedirects) {
          throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadRedirects);
        }
        url = new URL(location, url);
        continue;
      }
      if (statusCode < 200 || statusCode >= 300) {
        response.destroy();
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadHttp);
      }

      const contentLengthHeader = response.headers['content-length'];
      const contentLength = typeof contentLengthHeader === 'string' ? Number(contentLengthHeader) : NaN;
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        response.destroy();
        throw new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadSize);
      }

      let downloadedBytes = 0;
      const counter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          downloadedBytes += chunk.byteLength;
          if (downloadedBytes > maxBytes) {
            callback(new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadSize));
            return;
          }
          callback(null, chunk);
        },
      });
      const output = createWriteStream(partialPath, { flags: 'wx', mode: 0o600 });
      response.once('aborted', () => {
        counter.destroy(new SkillArchiveError(SKILL_ARCHIVE_ERROR_CODES.downloadInterrupted));
      });
      await pipeline(response, counter, output, { signal: options.signal });
      await fs.rm(options.destination, { force: true });
      await fs.rename(partialPath, options.destination);
      return options.destination;
    }
  } catch (error) {
    if (options.signal?.aborted) {
      throw getAbortError(options.signal);
    }
    throw asStableArchiveError(error);
  } finally {
    await fs.rm(partialPath, { force: true });
  }
}
