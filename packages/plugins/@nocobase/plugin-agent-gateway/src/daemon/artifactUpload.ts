/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { createHash } from 'crypto';
import { createReadStream, promises as fs, type Stats } from 'fs';
import { StringDecoder } from 'string_decoder';

import { JsonRecord } from './types';
import { COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS } from '../shared/conversationLimits';

const MAX_INLINE_ARTIFACT_UPLOAD_BYTES = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS;
const MAX_INLINE_ARTIFACT_UPLOAD_WIRE_BYTES = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS - 128 * 1024;
const MAX_DECLARED_ARTIFACT_SCAN_ENTRIES = 50_000;
export const MAX_DECLARED_ARTIFACT_UPLOADS = 1000;
export const MAX_DECLARED_ARTIFACT_TOTAL_READ_BYTES = 256 * 1024 * 1024;
export const MAX_DECLARED_ARTIFACT_TOTAL_UPLOAD_BYTES = 64 * 1024 * 1024;
export const MAX_DECLARED_ARTIFACT_MANIFEST_BYTES = 1024 * 1024;

export interface DeclaredArtifactUpload extends JsonRecord {
  artifactKey: string;
  artifactType: string;
  mimeType: string;
  sizeBytes: number;
  contentText: string;
  metadata: JsonRecord;
}

export interface DeclaredArtifactCollectionResult {
  manifest: JsonRecord;
}

export interface DeclaredArtifactLimits {
  maxArtifacts: number;
  maxReadBytes: number;
  maxUploadBytes: number;
}

interface ArtifactDeclaration {
  path?: string;
  glob?: string;
  groupKey?: string;
  groupLabel?: string;
  artifactKey?: string;
  artifactType?: string;
  mimeType?: string;
}

interface MatchedArtifactDeclaration extends ArtifactDeclaration {
  filePath: string;
  relativePath: string;
}

interface IgnoredArtifact {
  relativePath: string;
  reason: string;
}

interface ArtifactManifestEntry extends JsonRecord {
  artifactKey: string;
  artifactType: string;
  mimeType: string;
  sizeBytes: number;
}

interface BuiltDeclaredArtifactUpload {
  upload: DeclaredArtifactUpload;
  readBytes: number;
  uploadBytes: number;
}

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getPositiveInteger(value: unknown, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback;
}

function getBoundedPositiveInteger(value: unknown, fallback: number, maximum: number) {
  return Math.min(getPositiveInteger(value, fallback), maximum);
}

export function getDeclaredArtifactLimits(payload: JsonRecord): DeclaredArtifactLimits {
  return {
    maxArtifacts: getBoundedPositiveInteger(
      payload.maxArtifactUploads,
      MAX_DECLARED_ARTIFACT_UPLOADS,
      MAX_DECLARED_ARTIFACT_UPLOADS,
    ),
    maxReadBytes: MAX_DECLARED_ARTIFACT_TOTAL_READ_BYTES,
    maxUploadBytes: MAX_DECLARED_ARTIFACT_TOTAL_UPLOAD_BYTES,
  };
}

function isWithin(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getArtifactRoot(cwd: string, payload: JsonRecord) {
  const artifactRoot = getString(payload.artifactRoot);
  return path.resolve(cwd, artifactRoot || '.');
}

function normalizeRelativeArtifactPath(value: string) {
  const normalized = value.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    return '';
  }
  return normalized;
}

function normalizeArtifactPath(value: string) {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '');
}

function normalizeNativeArtifactPath(value: string) {
  return value.trim().replace(/\\/g, '/');
}

function normalizeAbsoluteArtifactPath(value: string) {
  return normalizeArtifactPath(value).replace(/^([A-Za-z]:)?\/+/, '$1');
}

function isAbsoluteArtifactPath(value: string) {
  return path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value);
}

function getFileExtension(filePath: string) {
  return path.extname(filePath).toLowerCase();
}

function getMimeType(filePath: string, declaredMimeType?: string) {
  if (declaredMimeType) {
    return declaredMimeType;
  }
  const extension = getFileExtension(filePath);
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.htm': 'text/html',
    '.json': 'application/json',
    '.jsonl': 'application/x-ndjson',
    '.ndjson': 'application/x-ndjson',
    '.log': 'text/plain',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  return mimeTypes[extension] || 'text/plain';
}

function getArtifactType(filePath: string, declaredType?: string) {
  if (declaredType) {
    return declaredType;
  }
  const mimeType = getMimeType(filePath);
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType === 'text/html') {
    return 'html-report';
  }
  if (mimeType.includes('json')) {
    return 'json-report';
  }
  if (mimeType === 'text/markdown') {
    return 'markdown-report';
  }
  return 'file';
}

function getStorageMode(contentText: string, metadata: JsonRecord) {
  if (getString(metadata.inlineEncoding) === 'data-url') {
    return 'inline';
  }
  if (contentText) {
    return getBoolean(metadata.truncated) ? 'preview' : 'inline';
  }
  return 'local-path';
}

function getBoolean(value: unknown) {
  return value === true;
}

function getSha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex');
}

function sanitizeArtifactKey(value: string) {
  return value
    .replace(/[^A-Za-z0-9_.:/-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 240);
}

function getArtifactKey(match: MatchedArtifactDeclaration) {
  if (match.artifactKey && !match.glob) {
    return sanitizeArtifactKey(match.artifactKey);
  }
  const keyPrefix = match.artifactKey ? sanitizeArtifactKey(match.artifactKey) : 'declared';
  return sanitizeArtifactKey(`${keyPrefix}:${match.relativePath}`);
}

function escapeRegex(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern: string) {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char !== '*') {
      source += escapeRegex(char);
      continue;
    }
    if (pattern[index + 1] === '*') {
      index += 1;
      if (pattern[index + 1] === '/') {
        index += 1;
        source += '(?:.*\\/)?';
      } else {
        source += '.*';
      }
      continue;
    }
    source += '[^/]*';
  }
  source += '$';
  return new RegExp(source);
}

function getArtifactDeclarations(payload: JsonRecord) {
  const declarations: ArtifactDeclaration[] = [];
  for (const artifactPath of getStringArray(payload.artifactPaths)) {
    declarations.push({ path: artifactPath });
  }
  for (const artifactGlob of getStringArray(payload.artifactGlobs)) {
    declarations.push({ glob: artifactGlob });
  }
  const artifacts = Array.isArray(payload.artifacts) ? payload.artifacts : [];
  for (const value of artifacts) {
    const artifact = getArtifactDeclaration(value);
    if (artifact) {
      declarations.push(artifact);
    }
  }
  return declarations;
}

function getArtifactDeclaration(value: unknown): ArtifactDeclaration | null {
  if (typeof value === 'string') {
    return { path: value };
  }
  const record = isRecord(value) ? value : {};
  const artifactPath = getString(record.path || record.filePath);
  const glob = getString(record.glob || record.pattern);
  if (!artifactPath && !glob) {
    return null;
  }
  return {
    ...(artifactPath ? { path: artifactPath } : {}),
    ...(glob ? { glob } : {}),
    groupKey: getString(record.groupKey) || undefined,
    groupLabel: getString(record.groupLabel || record.group) || undefined,
    artifactKey: getString(record.artifactKey || record.key) || undefined,
    artifactType: getString(record.artifactType || record.type) || undefined,
    mimeType: getString(record.mimeType) || undefined,
  };
}

async function collectFiles(root: string, options: { maxEntries: number }) {
  const files: string[] = [];
  let visited = 0;
  async function visit(currentPath: string) {
    if (visited >= options.maxEntries) {
      return;
    }
    visited += 1;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (visited >= options.maxEntries) {
        return;
      }
      visited += 1;
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  await visit(root);
  return files;
}

function isArtifactModifiedSince(stat: Stats, modifiedSinceMs?: number) {
  return !modifiedSinceMs || stat.mtimeMs + 1000 >= modifiedSinceMs;
}

function getGlobStaticDirectory(glob: string) {
  const wildcardIndex = glob.indexOf('*');
  if (wildcardIndex < 0) {
    return path.posix.dirname(glob);
  }
  const prefix = glob.slice(0, wildcardIndex);
  const lastSlashIndex = prefix.lastIndexOf('/');
  if (lastSlashIndex < 0) {
    return '';
  }
  return prefix.slice(0, lastSlashIndex);
}

async function findDeclaredArtifacts(options: {
  payload: JsonRecord;
  cwd: string;
  trustedArtifactRoots?: string[];
  modifiedSinceMs?: number;
}) {
  const declarations = getArtifactDeclarations(options.payload);
  if (!declarations.length) {
    return [];
  }

  const root = getArtifactRoot(options.cwd, options.payload);
  const realRoots = await collectArtifactSearchRoots({
    root,
    trustedArtifactRoots: options.trustedArtifactRoots,
  });
  if (!realRoots.length) {
    return [];
  }

  const matches: MatchedArtifactDeclaration[] = [];
  const cachedFilesByRoot = new Map<string, string[]>();
  const maxScanEntries = getPositiveInteger(options.payload.maxArtifactScanEntries, MAX_DECLARED_ARTIFACT_SCAN_ENTRIES);
  for (const declaration of declarations) {
    const artifactPath = getString(declaration.path);
    if (artifactPath && isAbsoluteArtifactPath(artifactPath)) {
      const filePath = path.resolve(artifactPath);
      const stat = await fs.stat(filePath).catch(() => null);
      if (stat?.isFile() && isArtifactModifiedSince(stat, options.modifiedSinceMs)) {
        matches.push({
          ...declaration,
          filePath,
          relativePath: normalizeAbsoluteArtifactPath(filePath),
        });
      }
      continue;
    }

    const relativePath = normalizeRelativeArtifactPath(artifactPath);
    if (relativePath) {
      for (const realRoot of realRoots) {
        const filePath = path.resolve(realRoot, relativePath);
        if (!isWithin(realRoot, filePath)) {
          continue;
        }
        const stat = await fs.stat(filePath).catch(() => null);
        if (stat?.isFile() && isArtifactModifiedSince(stat, options.modifiedSinceMs)) {
          matches.push({
            ...declaration,
            filePath,
            relativePath: path.relative(realRoot, filePath).replace(/\\/g, '/'),
          });
        }
      }
      continue;
    }

    const rawGlob = getString(declaration.glob);
    if (rawGlob && isAbsoluteArtifactPath(rawGlob)) {
      const normalizedGlob = normalizeAbsoluteArtifactPath(rawGlob);
      const matcher = globToRegex(normalizedGlob);
      const scanDirectory = getGlobStaticDirectory(normalizeNativeArtifactPath(rawGlob));
      const realScanRoot = await fs.realpath(scanDirectory).catch(() => '');
      if (!realScanRoot) {
        continue;
      }
      const cacheKey = `absolute:${realScanRoot}`;
      let cachedFiles = cachedFilesByRoot.get(cacheKey);
      if (!cachedFiles) {
        cachedFiles = await collectFiles(realScanRoot, { maxEntries: maxScanEntries });
        cachedFilesByRoot.set(cacheKey, cachedFiles);
      }
      for (const filePath of cachedFiles) {
        const absoluteArtifactPath = normalizeAbsoluteArtifactPath(filePath);
        if (matcher.test(absoluteArtifactPath)) {
          const stat = await fs.stat(filePath).catch(() => null);
          if (!stat?.isFile() || !isArtifactModifiedSince(stat, options.modifiedSinceMs)) {
            continue;
          }
          matches.push({
            ...declaration,
            filePath,
            relativePath: absoluteArtifactPath,
          });
        }
      }
      continue;
    }

    const glob = normalizeRelativeArtifactPath(rawGlob);
    if (!glob) {
      continue;
    }
    const matcher = globToRegex(glob);
    const scanDirectory = normalizeRelativeArtifactPath(getGlobStaticDirectory(glob));
    for (const realRoot of realRoots) {
      const scanRoot = scanDirectory ? path.resolve(realRoot, scanDirectory) : realRoot;
      if (!isWithin(realRoot, scanRoot)) {
        continue;
      }
      const realScanRoot = await fs.realpath(scanRoot).catch(() => '');
      if (!realScanRoot || !isWithin(realRoot, realScanRoot)) {
        continue;
      }
      const cacheKey = `${realRoot}:${realScanRoot}`;
      let cachedFiles = cachedFilesByRoot.get(cacheKey);
      if (!cachedFiles) {
        cachedFiles = await collectFiles(realScanRoot, { maxEntries: maxScanEntries });
        cachedFilesByRoot.set(cacheKey, cachedFiles);
      }
      for (const filePath of cachedFiles) {
        const relativeFilePath = path.relative(realRoot, filePath).replace(/\\/g, '/');
        if (matcher.test(relativeFilePath)) {
          const stat = await fs.stat(filePath).catch(() => null);
          if (!stat?.isFile() || !isArtifactModifiedSince(stat, options.modifiedSinceMs)) {
            continue;
          }
          matches.push({
            ...declaration,
            filePath,
            relativePath: relativeFilePath,
          });
        }
      }
    }
  }

  return matches;
}

async function collectArtifactSearchRoots(options: { root: string; trustedArtifactRoots?: string[] }) {
  const roots: string[] = [];
  const appendRoot = async (root: string, validate: (realRoot: string) => boolean) => {
    const realRoot = await fs.realpath(root).catch(() => '');
    if (!realRoot || !validate(realRoot) || roots.includes(realRoot)) {
      return;
    }
    roots.push(realRoot);
  };

  await appendRoot(options.root, () => true);
  for (const trustedRoot of options.trustedArtifactRoots || []) {
    await appendRoot(trustedRoot, () => true);
  }

  return roots;
}

function isBrowserVerificationArtifact(match: MatchedArtifactDeclaration) {
  return /(?:^|\/)browser-verification\.json$/.test(match.relativePath);
}

function isScreenshotPath(value: string) {
  return /(?:^|\/)browser-screenshots\/.+\.(?:png|jpe?g|webp|gif)$/i.test(value);
}

function resolveReferencedArtifactPath(referencePath: string, baseRelativeDir: string) {
  const normalized = normalizeRelativeArtifactPath(referencePath);
  if (!isScreenshotPath(normalized)) {
    return '';
  }
  if (!normalized.startsWith('browser-screenshots/')) {
    return normalized;
  }
  if (!baseRelativeDir || baseRelativeDir === '.') {
    return normalized;
  }
  return normalizeRelativeArtifactPath(path.posix.join(baseRelativeDir, normalized));
}

function extractReferencedArtifactPaths(value: unknown, baseRelativeDir: string): string[] {
  const paths: string[] = [];
  const visit = (current: unknown) => {
    if (typeof current === 'string') {
      const artifactPath = resolveReferencedArtifactPath(current, baseRelativeDir);
      if (artifactPath) {
        paths.push(artifactPath);
      }
      return;
    }
    if (Array.isArray(current)) {
      for (const item of current) {
        visit(item);
      }
      return;
    }
    if (!current || typeof current !== 'object') {
      return;
    }
    for (const item of Object.values(current)) {
      visit(item);
    }
  };
  visit(value);
  return uniqueStrings(paths);
}

async function getReferencedScreenshotPaths(matches: MatchedArtifactDeclaration[], maxReadBytes: number) {
  const referencedPaths: string[] = [];
  let readBytes = 0;
  for (const match of matches.filter(isBrowserVerificationArtifact)) {
    const remainingBytes = maxReadBytes - readBytes;
    if (remainingBytes <= 0) {
      break;
    }
    try {
      const stat = await fs.stat(match.filePath);
      if (!stat.isFile() || stat.size > remainingBytes || stat.size > MAX_DECLARED_ARTIFACT_MANIFEST_BYTES) {
        continue;
      }
      const file = await readArtifactFile({
        artifactPath: match.filePath,
        expectedStat: stat,
        captureBytes: stat.size,
      });
      const content = Buffer.concat(file.capturedChunks);
      readBytes += file.readBytes;
      const parsed = JSON.parse(content.toString('utf8')) as unknown;
      referencedPaths.push(...extractReferencedArtifactPaths(parsed, path.posix.dirname(match.relativePath)));
    } catch {
      // The manifest reports the collected file; invalid JSON is handled by the UI preview.
    }
  }
  return {
    paths: uniqueStrings(referencedPaths),
    readBytes,
  };
}

function getArtifactPriority(match: MatchedArtifactDeclaration, referencedScreenshots: Set<string>) {
  const relativePath = match.relativePath;
  if (referencedScreenshots.has(relativePath)) {
    return 0;
  }
  if (/(?:^|\/)report\.html$/.test(relativePath)) {
    return 1;
  }
  if (isBrowserVerificationArtifact(match)) {
    return 2;
  }
  if (/(?:^|\/)browser-verification-(?:request|prompt)\.(?:json|md)$/.test(relativePath)) {
    return 3;
  }
  if (/(?:^|\/)report\.json$/.test(relativePath)) {
    return 4;
  }
  if (isScreenshotPath(relativePath)) {
    return 5;
  }
  if (/(?:^|\/)(?:logs|tasks)\//.test(relativePath)) {
    return 6;
  }
  return 10;
}

function getIgnoredArtifactReason(relativePath: string) {
  if (/(?:^|\/)\.tmp\/(?:node-compile-cache|v8-compile-cache-)[^/]*\//.test(relativePath)) {
    return 'runtime-cache';
  }
  if (/(?:^|\/)\.nb-wrapper-bin\/nb$/.test(relativePath)) {
    return 'runner-wrapper-bin';
  }
  return '';
}

function dedupeMatches(matches: MatchedArtifactDeclaration[]) {
  const seen = new Set<string>();
  const result: MatchedArtifactDeclaration[] = [];
  for (const match of matches) {
    const key = `${getArtifactKey(match)}:${match.relativePath}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(match);
  }
  return result;
}

function buildManifest(options: {
  matches: MatchedArtifactDeclaration[];
  ignoredArtifacts?: IgnoredArtifact[];
  selectedMatches: MatchedArtifactDeclaration[];
  artifacts: ArtifactManifestEntry[];
  skippedArtifacts?: IgnoredArtifact[];
  maxArtifacts: number;
  referencedScreenshots: string[];
  limits: DeclaredArtifactLimits;
  readBytes: number;
  uploadBytes: number;
}) {
  const matchedPaths = new Set(options.matches.map((match) => match.relativePath));
  const skipped = [
    ...options.matches.slice(options.selectedMatches.length).map((match) => ({
      relativePath: match.relativePath,
      reason: 'max-artifact-uploads',
    })),
    ...(options.skippedArtifacts || []),
  ];
  const missingReferencedScreenshots = options.referencedScreenshots.filter(
    (relativePath) => !matchedPaths.has(relativePath),
  );
  return {
    schema: 'agent-gateway-artifact-manifest/v1',
    generatedAt: new Date().toISOString(),
    maxArtifactUploads: options.maxArtifacts,
    counts: {
      matched: options.matches.length + (options.ignoredArtifacts?.length || 0),
      collectible: options.matches.length,
      ignored: options.ignoredArtifacts?.length || 0,
      selected: options.selectedMatches.length,
      uploaded: options.artifacts.length,
      skipped: skipped.length,
      referencedScreenshots: options.referencedScreenshots.length,
      missingReferencedScreenshots: missingReferencedScreenshots.length,
    },
    limits: {
      maxArtifactUploads: options.limits.maxArtifacts,
      maxTotalReadBytes: options.limits.maxReadBytes,
      maxTotalUploadBytes: options.limits.maxUploadBytes,
    },
    bytes: {
      read: options.readBytes,
      upload: options.uploadBytes,
    },
    referencedScreenshots: options.referencedScreenshots,
    missingReferencedScreenshots,
    artifacts: options.artifacts,
    skipped,
    ignored: options.ignoredArtifacts || [],
  };
}

function compactManifestToBudget(manifest: JsonRecord) {
  let compacted = manifest;
  let contentText = JSON.stringify(compacted, null, 2);
  if (Buffer.byteLength(contentText) <= MAX_DECLARED_ARTIFACT_MANIFEST_BYTES) {
    return {
      manifest: compacted,
      contentText,
    };
  }

  const arrayKeys = [
    'artifacts',
    'skipped',
    'ignored',
    'referencedScreenshots',
    'missingReferencedScreenshots',
    'uploadFailures',
  ];
  const originalCounts = Object.fromEntries(
    arrayKeys.map((key) => {
      const value = compacted[key];
      return [key, Array.isArray(value) ? value.length : 0];
    }),
  );
  let sampleLimit = Math.max(...Object.values(originalCounts), 0);
  while (Buffer.byteLength(contentText) > MAX_DECLARED_ARTIFACT_MANIFEST_BYTES && sampleLimit > 0) {
    sampleLimit = Math.floor(sampleLimit / 2);
    compacted = {
      ...compacted,
      manifestTruncated: true,
      manifestArrayCounts: originalCounts,
      ...Object.fromEntries(
        arrayKeys.map((key) => {
          const value = manifest[key];
          return [key, Array.isArray(value) ? value.slice(0, sampleLimit) : value];
        }),
      ),
    };
    contentText = JSON.stringify(compacted, null, 2);
  }

  if (Buffer.byteLength(contentText) > MAX_DECLARED_ARTIFACT_MANIFEST_BYTES) {
    compacted = {
      schema: manifest.schema,
      generatedAt: manifest.generatedAt,
      maxArtifactUploads: manifest.maxArtifactUploads,
      counts: manifest.counts,
      limits: manifest.limits,
      bytes: manifest.bytes,
      manifestTruncated: true,
      manifestArrayCounts: originalCounts,
    };
    contentText = JSON.stringify(compacted, null, 2);
  }

  return {
    manifest: compacted,
    contentText,
  };
}

export function buildDeclaredArtifactManifestUpload(manifest: JsonRecord): {
  manifest: JsonRecord;
  upload: DeclaredArtifactUpload;
} {
  const compacted = compactManifestToBudget(manifest);
  const contentText = compacted.contentText;
  return {
    manifest: compacted.manifest,
    upload: {
      artifactKey: 'declared:artifact-manifest.json',
      artifactType: 'artifact-manifest',
      mimeType: 'application/json',
      sizeBytes: Buffer.byteLength(contentText),
      contentText,
      metadata: {
        declaredArtifact: true,
        relativePath: 'artifact-manifest.json',
        fileName: 'artifact-manifest.json',
        originalSizeBytes: Buffer.byteLength(contentText),
        uploadedBytes: Buffer.byteLength(contentText),
        truncated: compacted.manifest.manifestTruncated === true,
        storageMode: 'inline',
        sha256: getSha256(Buffer.from(contentText)),
        generated: true,
      },
    },
  };
}

function getJsonStringWireBytes(value: string) {
  return Buffer.byteLength(JSON.stringify(value));
}

function fitsInlineTextUploadBudget(value: string, maxUploadBytes = MAX_INLINE_ARTIFACT_UPLOAD_BYTES) {
  return (
    Buffer.byteLength(value) <= Math.min(maxUploadBytes, MAX_INLINE_ARTIFACT_UPLOAD_BYTES) &&
    getJsonStringWireBytes(value) <= MAX_INLINE_ARTIFACT_UPLOAD_WIRE_BYTES
  );
}

function fitInlineTextUploadBudget(value: string, maxUploadBytes = MAX_INLINE_ARTIFACT_UPLOAD_BYTES) {
  if (fitsInlineTextUploadBudget(value, maxUploadBytes)) {
    return value;
  }

  let low = 0;
  let high = value.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fitsInlineTextUploadBudget(value.slice(0, mid), maxUploadBytes)) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return value.slice(0, low);
}

async function readArtifactFile(options: {
  artifactPath: string;
  expectedStat: Pick<Stats, 'size' | 'mtimeMs' | 'ino'>;
  captureBytes: number;
}) {
  const hash = createHash('sha256');
  const capturedChunks: Buffer[] = [];
  let capturedBytes = 0;
  let readBytes = 0;
  if (options.expectedStat.size > 0) {
    const reader = createReadStream(options.artifactPath, {
      start: 0,
      end: options.expectedStat.size - 1,
    });
    for await (const rawChunk of reader) {
      const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(String(rawChunk));
      hash.update(chunk);
      readBytes += chunk.byteLength;
      const remainingCaptureBytes = options.captureBytes - capturedBytes;
      if (remainingCaptureBytes > 0) {
        const capturedChunk = chunk.subarray(0, remainingCaptureBytes);
        capturedChunks.push(Buffer.from(capturedChunk));
        capturedBytes += capturedChunk.byteLength;
      }
    }
  }
  const finalStat = await fs.stat(options.artifactPath).catch(() => null);
  const changedDuringRead =
    readBytes !== options.expectedStat.size ||
    !finalStat ||
    finalStat.size !== options.expectedStat.size ||
    finalStat.mtimeMs !== options.expectedStat.mtimeMs ||
    finalStat.ino !== options.expectedStat.ino;
  return {
    capturedChunks,
    changedDuringRead,
    readBytes,
    sha256: hash.digest('hex'),
  };
}

function decodeUtf8Chunks(chunks: Buffer[]) {
  const decoder = new StringDecoder('utf8');
  return `${chunks.map((chunk) => decoder.write(chunk)).join('')}${decoder.end()}`;
}

async function buildTextArtifactUploadWithBudget(
  artifactPath: string,
  expectedStat: Pick<Stats, 'size' | 'mtimeMs' | 'ino'>,
  maxUploadBytes: number,
) {
  const sizeBytes = expectedStat.size;
  const bytesToCapture = Math.min(
    Math.max(sizeBytes, 0),
    MAX_INLINE_ARTIFACT_UPLOAD_BYTES,
    Math.max(maxUploadBytes, 0),
  );
  const file = await readArtifactFile({
    artifactPath,
    expectedStat,
    captureBytes: bytesToCapture,
  });
  const contentText = fitInlineTextUploadBudget(decodeUtf8Chunks(file.capturedChunks), maxUploadBytes);
  const uploadedBytes = Buffer.byteLength(contentText);

  const metadata: JsonRecord = {
    originalSizeBytes: sizeBytes,
    uploadedBytes,
    truncated: file.changedDuringRead || uploadedBytes < sizeBytes,
    sha256: file.sha256,
    ...(file.changedDuringRead ? { fileChangedDuringRead: true } : {}),
  };

  return {
    contentText,
    metadata,
    readBytes: file.readBytes,
  };
}

export async function buildTextArtifactUpload(artifactPath: string, sizeBytes: number) {
  const stat = await fs.stat(artifactPath);
  return await buildTextArtifactUploadWithBudget(
    artifactPath,
    {
      size: sizeBytes,
      mtimeMs: stat.mtimeMs,
      ino: stat.ino,
    },
    MAX_INLINE_ARTIFACT_UPLOAD_BYTES,
  );
}

function getBase64DataUrlBytes(sizeBytes: number, mimeType: string) {
  return Buffer.byteLength(`data:${mimeType};base64,`) + Math.ceil(sizeBytes / 3) * 4;
}

export async function buildImageArtifactUpload(
  artifactPath: string,
  expectedStat: Pick<Stats, 'size' | 'mtimeMs' | 'ino'>,
  mimeType: string,
  maxUploadBytes: number,
) {
  const sizeBytes = expectedStat.size;
  const dataUrlBytes = getBase64DataUrlBytes(sizeBytes, mimeType);
  const canInline =
    sizeBytes <= MAX_INLINE_ARTIFACT_UPLOAD_BYTES &&
    dataUrlBytes <= MAX_INLINE_ARTIFACT_UPLOAD_BYTES &&
    dataUrlBytes <= maxUploadBytes;
  const file = await readArtifactFile({
    artifactPath,
    expectedStat,
    captureBytes: canInline ? sizeBytes : 0,
  });
  if (file.changedDuringRead) {
    return {
      contentText: '',
      metadata: {
        originalSizeBytes: sizeBytes,
        uploadedBytes: 0,
        truncated: true,
        inlineEncoding: 'none',
        inlineSkippedReason: 'file-changed-during-read',
        fileChangedDuringRead: true,
        sha256: file.sha256,
      },
      readBytes: file.readBytes,
    };
  }
  if (!canInline) {
    const inlineSkippedReason =
      sizeBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES
        ? 'image-too-large'
        : dataUrlBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES
          ? 'image-data-url-too-large'
          : 'total-upload-budget-exhausted';
    return {
      contentText: '',
      metadata: {
        originalSizeBytes: sizeBytes,
        uploadedBytes: 0,
        truncated: true,
        inlineEncoding: 'none',
        inlineSkippedReason,
        sha256: file.sha256,
      },
      readBytes: file.readBytes,
    };
  }
  const content = Buffer.concat(file.capturedChunks);
  const contentText = `data:${mimeType};base64,${content.toString('base64')}`;
  return {
    contentText,
    metadata: {
      originalSizeBytes: sizeBytes,
      uploadedBytes: Buffer.byteLength(contentText),
      truncated: false,
      inlineEncoding: 'data-url',
      sha256: file.sha256,
    },
    readBytes: file.readBytes,
  };
}

async function buildDeclaredArtifactUpload(
  match: MatchedArtifactDeclaration,
  stat: Stats,
  maxUploadBytes: number,
): Promise<BuiltDeclaredArtifactUpload> {
  const mimeType = getMimeType(match.filePath, match.mimeType);
  const artifactKey = getArtifactKey(match);
  const artifactType = getArtifactType(match.filePath, match.artifactType);
  const upload = mimeType.startsWith('image/')
    ? await buildImageArtifactUpload(match.filePath, stat, mimeType, maxUploadBytes)
    : await buildTextArtifactUploadWithBudget(match.filePath, stat, maxUploadBytes);
  const declaredUpload: DeclaredArtifactUpload = {
    artifactKey,
    artifactType,
    mimeType,
    sizeBytes: stat.size,
    contentText: upload.contentText,
    metadata: {
      ...upload.metadata,
      declaredArtifact: true,
      relativePath: match.relativePath,
      fileName: path.basename(match.filePath),
      ...(match.groupKey ? { artifactGroupKey: match.groupKey } : {}),
      ...(match.groupLabel ? { artifactGroupLabel: match.groupLabel } : {}),
      storageMode: getStorageMode(upload.contentText, upload.metadata),
    },
  };
  return {
    upload: declaredUpload,
    readBytes: upload.readBytes,
    uploadBytes: Buffer.byteLength(upload.contentText),
  };
}

function buildArtifactManifestEntry(upload: DeclaredArtifactUpload): ArtifactManifestEntry {
  return {
    artifactKey: upload.artifactKey,
    artifactType: upload.artifactType,
    mimeType: upload.mimeType,
    sizeBytes: upload.sizeBytes,
    relativePath: getString(upload.metadata.relativePath),
    artifactGroupKey: getString(upload.metadata.artifactGroupKey),
    artifactGroupLabel: getString(upload.metadata.artifactGroupLabel),
    storageMode: getString(upload.metadata.storageMode),
    sha256: getString(upload.metadata.sha256),
    truncated: upload.metadata.truncated === true,
  };
}

export async function processDeclaredArtifactUploads(options: {
  payload: JsonRecord;
  cwd: string;
  trustedArtifactRoots?: string[];
  modifiedSinceMs?: number;
  onUpload(upload: DeclaredArtifactUpload): Promise<void>;
}): Promise<DeclaredArtifactCollectionResult> {
  const limits = getDeclaredArtifactLimits(options.payload);
  const rawMatches = dedupeMatches(
    await findDeclaredArtifacts({
      payload: options.payload,
      cwd: options.cwd,
      trustedArtifactRoots: options.trustedArtifactRoots,
      modifiedSinceMs: options.modifiedSinceMs,
    }),
  );
  const ignoredArtifacts: IgnoredArtifact[] = [];
  const matches = rawMatches.filter((match) => {
    const reason = getIgnoredArtifactReason(match.relativePath);
    if (reason) {
      ignoredArtifacts.push({
        relativePath: match.relativePath,
        reason,
      });
      return false;
    }
    return true;
  });
  const referencedScreenshotResult = await getReferencedScreenshotPaths(matches, limits.maxReadBytes);
  const referencedScreenshotSet = new Set(referencedScreenshotResult.paths);
  const orderedMatches = [...matches].sort((first, second) => {
    const priorityDelta =
      getArtifactPriority(first, referencedScreenshotSet) - getArtifactPriority(second, referencedScreenshotSet);
    return priorityDelta || first.relativePath.localeCompare(second.relativePath);
  });
  const selectedMatches = orderedMatches.slice(0, limits.maxArtifacts);
  const artifacts: ArtifactManifestEntry[] = [];
  const skippedArtifacts: IgnoredArtifact[] = [];
  const artifactKeys = new Set<string>();
  let readBytes = referencedScreenshotResult.readBytes;
  let uploadBytes = 0;
  const maxArtifactContentUploadBytes = Math.max(0, limits.maxUploadBytes - MAX_DECLARED_ARTIFACT_MANIFEST_BYTES);
  for (const match of selectedMatches) {
    const artifactKey = getArtifactKey(match);
    if (artifactKeys.has(artifactKey)) {
      skippedArtifacts.push({
        relativePath: match.relativePath,
        reason: 'duplicate-artifact-key',
      });
      continue;
    }
    const stat = await fs.stat(match.filePath).catch(() => null);
    if (!stat?.isFile()) {
      skippedArtifacts.push({
        relativePath: match.relativePath,
        reason: 'file-unavailable',
      });
      continue;
    }
    if (stat.size > limits.maxReadBytes - readBytes) {
      skippedArtifacts.push({
        relativePath: match.relativePath,
        reason: 'max-total-read-bytes',
      });
      continue;
    }
    const built = await buildDeclaredArtifactUpload(
      match,
      stat,
      Math.max(0, maxArtifactContentUploadBytes - uploadBytes),
    );
    readBytes += built.readBytes;
    uploadBytes += built.uploadBytes;
    artifactKeys.add(built.upload.artifactKey);
    artifacts.push(buildArtifactManifestEntry(built.upload));
    await options.onUpload(built.upload);
  }
  const manifest = buildManifest({
    matches: orderedMatches,
    ignoredArtifacts,
    selectedMatches,
    artifacts,
    skippedArtifacts,
    maxArtifacts: limits.maxArtifacts,
    referencedScreenshots: referencedScreenshotResult.paths,
    limits,
    readBytes,
    uploadBytes,
  });
  return {
    manifest,
  };
}
