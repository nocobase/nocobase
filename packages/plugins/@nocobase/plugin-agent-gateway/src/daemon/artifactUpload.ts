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
import { promises as fs } from 'fs';

import { JsonRecord } from './types';
import { COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS } from '../shared/conversationLimits';

const MAX_INLINE_ARTIFACT_UPLOAD_BYTES = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS;
const MAX_INLINE_ARTIFACT_UPLOAD_WIRE_BYTES = COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS - 128 * 1024;
const MAX_DECLARED_ARTIFACT_SCAN_ENTRIES = 50_000;
const DEFAULT_MAX_DECLARED_ARTIFACT_UPLOADS = 1000;

export interface DeclaredArtifactUpload extends JsonRecord {
  artifactKey: string;
  artifactType: string;
  mimeType: string;
  sizeBytes: number;
  contentText: string;
  metadata: JsonRecord;
}

export interface DeclaredArtifactCollectionResult {
  uploads: DeclaredArtifactUpload[];
  manifest: JsonRecord;
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
  workspaceRoot: string;
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
      if (stat?.isFile()) {
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
        if (stat?.isFile()) {
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
          if (options.modifiedSinceMs && (!stat?.isFile() || stat.mtimeMs + 1000 < options.modifiedSinceMs)) {
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
          if (options.modifiedSinceMs && (!stat?.isFile() || stat.mtimeMs + 1000 < options.modifiedSinceMs)) {
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

async function hashFile(filePath: string) {
  const content = await fs.readFile(filePath);
  return getSha256(content);
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

async function getReferencedScreenshotPaths(matches: MatchedArtifactDeclaration[]) {
  const referencedPaths: string[] = [];
  for (const match of matches.filter(isBrowserVerificationArtifact)) {
    try {
      const parsed = JSON.parse(await fs.readFile(match.filePath, 'utf8')) as unknown;
      referencedPaths.push(...extractReferencedArtifactPaths(parsed, path.posix.dirname(match.relativePath)));
    } catch {
      // The manifest reports the collected file; invalid JSON is handled by the UI preview.
    }
  }
  return uniqueStrings(referencedPaths);
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

async function buildManifest(options: {
  matches: MatchedArtifactDeclaration[];
  ignoredArtifacts?: IgnoredArtifact[];
  selectedMatches: MatchedArtifactDeclaration[];
  uploads: DeclaredArtifactUpload[];
  maxArtifacts: number;
  referencedScreenshots: string[];
}) {
  const selectedPaths = new Set(options.selectedMatches.map((match) => match.relativePath));
  const matchedPaths = new Set(options.matches.map((match) => match.relativePath));
  const skipped = options.matches
    .filter((match) => !selectedPaths.has(match.relativePath))
    .map((match) => ({
      relativePath: match.relativePath,
      reason: 'max-artifact-uploads',
    }));
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
      uploaded: options.uploads.length,
      skipped: skipped.length,
      referencedScreenshots: options.referencedScreenshots.length,
      missingReferencedScreenshots: missingReferencedScreenshots.length,
    },
    referencedScreenshots: options.referencedScreenshots,
    missingReferencedScreenshots,
    artifacts: options.uploads.map((upload) => ({
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
    })),
    skipped,
    ignored: options.ignoredArtifacts || [],
  };
}

function buildManifestUpload(manifest: JsonRecord): DeclaredArtifactUpload {
  const contentText = JSON.stringify(manifest, null, 2);
  return {
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
      truncated: false,
      storageMode: 'inline',
      sha256: getSha256(Buffer.from(contentText)),
      generated: true,
    },
  };
}

function getJsonStringWireBytes(value: string) {
  return Buffer.byteLength(JSON.stringify(value));
}

function fitsInlineTextUploadBudget(value: string) {
  return (
    Buffer.byteLength(value) <= MAX_INLINE_ARTIFACT_UPLOAD_BYTES &&
    getJsonStringWireBytes(value) <= MAX_INLINE_ARTIFACT_UPLOAD_WIRE_BYTES
  );
}

function fitInlineTextUploadBudget(value: string) {
  if (fitsInlineTextUploadBudget(value)) {
    return value;
  }

  let low = 0;
  let high = value.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fitsInlineTextUploadBudget(value.slice(0, mid))) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return value.slice(0, low);
}

export async function buildTextArtifactUpload(artifactPath: string, sizeBytes: number) {
  const bytesToRead = Math.min(Math.max(sizeBytes, 0), MAX_INLINE_ARTIFACT_UPLOAD_BYTES);
  let contentText = '';
  if (bytesToRead > 0) {
    const file = await fs.open(artifactPath, 'r');
    try {
      const buffer = Buffer.alloc(bytesToRead);
      const result = await file.read(buffer, 0, bytesToRead, 0);
      contentText = buffer.subarray(0, result.bytesRead).toString('utf8');
    } finally {
      await file.close();
    }
  }
  contentText = fitInlineTextUploadBudget(contentText);
  const uploadedBytes = Buffer.byteLength(contentText);

  const metadata: JsonRecord = {
    originalSizeBytes: sizeBytes,
    uploadedBytes,
    truncated: uploadedBytes < sizeBytes,
    sha256: await hashFile(artifactPath),
  };

  return {
    contentText,
    metadata,
  };
}

async function buildImageArtifactUpload(artifactPath: string, sizeBytes: number, mimeType: string) {
  const sha256 = await hashFile(artifactPath);
  if (sizeBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES) {
    return {
      contentText: '',
      metadata: {
        originalSizeBytes: sizeBytes,
        uploadedBytes: 0,
        truncated: true,
        inlineEncoding: 'none',
        inlineSkippedReason: 'image-too-large',
        sha256,
      },
    };
  }
  const content = await fs.readFile(artifactPath);
  const contentText = `data:${mimeType};base64,${content.toString('base64')}`;
  if (Buffer.byteLength(contentText) > MAX_INLINE_ARTIFACT_UPLOAD_BYTES) {
    return {
      contentText: '',
      metadata: {
        originalSizeBytes: sizeBytes,
        uploadedBytes: 0,
        truncated: true,
        inlineEncoding: 'none',
        inlineSkippedReason: 'image-data-url-too-large',
        sha256,
      },
    };
  }
  return {
    contentText,
    metadata: {
      originalSizeBytes: sizeBytes,
      uploadedBytes: Buffer.byteLength(contentText),
      truncated: false,
      inlineEncoding: 'data-url',
      sha256,
    },
  };
}

async function buildDeclaredArtifactUpload(match: MatchedArtifactDeclaration): Promise<DeclaredArtifactUpload | null> {
  const stat = await fs.stat(match.filePath).catch(() => null);
  if (!stat?.isFile()) {
    return null;
  }
  const mimeType = getMimeType(match.filePath, match.mimeType);
  const artifactKey = getArtifactKey(match);
  const artifactType = getArtifactType(match.filePath, match.artifactType);
  const upload = mimeType.startsWith('image/')
    ? await buildImageArtifactUpload(match.filePath, stat.size, mimeType)
    : await buildTextArtifactUpload(match.filePath, stat.size);
  return {
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
}

export async function collectDeclaredArtifactUploads(options: {
  payload: JsonRecord;
  cwd: string;
  workspaceRoot: string;
  trustedArtifactRoots?: string[];
  modifiedSinceMs?: number;
}): Promise<DeclaredArtifactUpload[]> {
  const result = await collectDeclaredArtifactCollection(options);
  return result.uploads;
}

export async function collectDeclaredArtifactCollection(options: {
  payload: JsonRecord;
  cwd: string;
  workspaceRoot: string;
  trustedArtifactRoots?: string[];
  modifiedSinceMs?: number;
}): Promise<DeclaredArtifactCollectionResult> {
  const maxArtifacts = getPositiveInteger(options.payload.maxArtifactUploads, DEFAULT_MAX_DECLARED_ARTIFACT_UPLOADS);
  const rawMatches = dedupeMatches(
    await findDeclaredArtifacts({
      payload: options.payload,
      cwd: options.cwd,
      workspaceRoot: options.workspaceRoot,
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
  const referencedScreenshots = await getReferencedScreenshotPaths(matches);
  const referencedScreenshotSet = new Set(referencedScreenshots);
  const selectedMatches = [...matches]
    .sort((first, second) => {
      const priorityDelta =
        getArtifactPriority(first, referencedScreenshotSet) - getArtifactPriority(second, referencedScreenshotSet);
      return priorityDelta || first.relativePath.localeCompare(second.relativePath);
    })
    .slice(0, maxArtifacts);
  const uploads: DeclaredArtifactUpload[] = [];
  const artifactKeys = new Set<string>();
  for (const match of selectedMatches) {
    const upload = await buildDeclaredArtifactUpload(match);
    if (upload && !artifactKeys.has(upload.artifactKey)) {
      uploads.push(upload);
      artifactKeys.add(upload.artifactKey);
    }
  }
  const manifest = await buildManifest({
    matches,
    ignoredArtifacts,
    selectedMatches,
    uploads,
    maxArtifacts,
    referencedScreenshots,
  });
  return {
    uploads: [...uploads, buildManifestUpload(manifest)],
    manifest,
  };
}
