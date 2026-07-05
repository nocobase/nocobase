/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { promises as fs } from 'fs';

import { JsonRecord } from './types';

const MAX_INLINE_ARTIFACT_UPLOAD_BYTES = 512 * 1024;
const MAX_DECLARED_ARTIFACT_SCAN_ENTRIES = 5000;
const DEFAULT_MAX_DECLARED_ARTIFACT_UPLOADS = 50;

export interface DeclaredArtifactUpload extends JsonRecord {
  artifactKey: string;
  artifactType: string;
  mimeType: string;
  sizeBytes: number;
  contentText: string;
  metadata: JsonRecord;
}

interface ArtifactDeclaration {
  path?: string;
  glob?: string;
  artifactKey?: string;
  artifactType?: string;
  mimeType?: string;
}

interface MatchedArtifactDeclaration extends ArtifactDeclaration {
  filePath: string;
  relativePath: string;
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
  maxArtifacts: number;
  modifiedSinceMs?: number;
}) {
  const declarations = getArtifactDeclarations(options.payload);
  if (!declarations.length) {
    return [];
  }

  const root = getArtifactRoot(options.cwd, options.payload);
  const realWorkspaceRoot = await fs.realpath(options.workspaceRoot);
  const realRoots = await collectArtifactSearchRoots({
    root,
    workspaceRoot: realWorkspaceRoot,
    trustedArtifactRoots: options.trustedArtifactRoots,
  });
  if (!realRoots.length) {
    return [];
  }

  const matches: MatchedArtifactDeclaration[] = [];
  const cachedFilesByRoot = new Map<string, string[]>();
  const maxScanEntries = getPositiveInteger(options.payload.maxArtifactScanEntries, MAX_DECLARED_ARTIFACT_SCAN_ENTRIES);
  for (const declaration of declarations) {
    if (matches.length >= options.maxArtifacts) {
      break;
    }
    const relativePath = normalizeRelativeArtifactPath(declaration.path || '');
    if (relativePath) {
      for (const realRoot of realRoots) {
        if (matches.length >= options.maxArtifacts) {
          break;
        }
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

    const glob = normalizeRelativeArtifactPath(declaration.glob || '');
    if (!glob) {
      continue;
    }
    const matcher = globToRegex(glob);
    const scanDirectory = normalizeRelativeArtifactPath(getGlobStaticDirectory(glob));
    for (const realRoot of realRoots) {
      if (matches.length >= options.maxArtifacts) {
        break;
      }
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
        if (matches.length >= options.maxArtifacts) {
          break;
        }
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

async function collectArtifactSearchRoots(options: {
  root: string;
  workspaceRoot: string;
  trustedArtifactRoots?: string[];
}) {
  const roots: string[] = [];
  const appendRoot = async (root: string, validate: (realRoot: string) => boolean) => {
    const realRoot = await fs.realpath(root).catch(() => '');
    if (!realRoot || !validate(realRoot) || roots.includes(realRoot)) {
      return;
    }
    roots.push(realRoot);
  };

  await appendRoot(options.root, (realRoot) => isWithin(options.workspaceRoot, realRoot));
  for (const trustedRoot of options.trustedArtifactRoots || []) {
    await appendRoot(trustedRoot, () => true);
  }

  return roots;
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

  const metadata: JsonRecord = {
    originalSizeBytes: sizeBytes,
    uploadedBytes: Buffer.byteLength(contentText),
    truncated: sizeBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES,
  };

  return {
    contentText,
    metadata,
  };
}

async function buildImageArtifactUpload(artifactPath: string, sizeBytes: number, mimeType: string) {
  if (sizeBytes > MAX_INLINE_ARTIFACT_UPLOAD_BYTES) {
    return {
      contentText: '',
      metadata: {
        originalSizeBytes: sizeBytes,
        uploadedBytes: 0,
        truncated: true,
        inlineEncoding: 'none',
        inlineSkippedReason: 'image-too-large',
      },
    };
  }
  const content = await fs.readFile(artifactPath);
  const contentText = `data:${mimeType};base64,${content.toString('base64')}`;
  return {
    contentText,
    metadata: {
      originalSizeBytes: sizeBytes,
      uploadedBytes: Buffer.byteLength(contentText),
      truncated: false,
      inlineEncoding: 'data-url',
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
    },
  };
}

export async function collectDeclaredArtifactUploads(options: {
  payload: JsonRecord;
  cwd: string;
  workspaceRoot: string;
  trustedArtifactRoots?: string[];
  modifiedSinceMs?: number;
}) {
  const maxArtifacts = getPositiveInteger(options.payload.maxArtifactUploads, DEFAULT_MAX_DECLARED_ARTIFACT_UPLOADS);
  const matches = await findDeclaredArtifacts({
    payload: options.payload,
    cwd: options.cwd,
    workspaceRoot: options.workspaceRoot,
    trustedArtifactRoots: options.trustedArtifactRoots,
    maxArtifacts,
    modifiedSinceMs: options.modifiedSinceMs,
  });
  const uploads: DeclaredArtifactUpload[] = [];
  const artifactKeys = new Set<string>();
  for (const match of matches) {
    const upload = await buildDeclaredArtifactUpload(match);
    if (upload && !artifactKeys.has(upload.artifactKey)) {
      uploads.push(upload);
      artifactKeys.add(upload.artifactKey);
    }
  }
  return uploads;
}
