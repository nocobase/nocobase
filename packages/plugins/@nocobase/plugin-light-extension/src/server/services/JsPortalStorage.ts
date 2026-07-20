/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';
import { createReadStream, type Dirent, type Stats } from 'fs';
import fs from 'fs/promises';
import { lookup as lookupMimeType } from 'mime-types';
import path from 'path';
import type { Readable } from 'stream';
import { TextDecoder } from 'util';

import { storagePathJoin, uid } from '@nocobase/utils';

import { LightExtensionError } from '../../shared/errors';

export const JS_PORTAL_WORKSPACE_ROOT = 'src/client/js-portals';

export interface JsPortalWorkspaceFile {
  path: string;
  content: string;
  encoding?: 'utf8' | 'base64';
  size?: number;
}

export interface JsPortalDescriptor {
  repoId: string;
  key: string;
  title: string;
  entryHtml: 'index.html';
  contentHash: string;
  fileCount: number;
  byteSize: number;
}

export interface JsPortalAsset {
  relativePath: string;
  size: number;
  mimeType?: string;
  stream: Readable;
}

type PortalEntryFile = {
  schemaVersion: 1;
  key: string;
  title?: string;
  entry?: 'index.html';
};

const PORTAL_ENTRY_FIELDS = new Set(['schemaVersion', 'key', 'title', 'entry']);
const PORTAL_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/u;

export class JsPortalStorage {
  constructor(private readonly root = storagePathJoin('light-extension')) {}

  async listWorkspaceFiles(repoId: string): Promise<JsPortalWorkspaceFile[]> {
    const portalsRoot = this.getPortalsRoot(repoId);
    const files = await readFiles(portalsRoot);
    return files.map((file) => ({
      path: `${JS_PORTAL_WORKSPACE_ROOT}/${file.relativePath}`,
      content: file.content,
      encoding: file.encoding,
      size: file.size,
    }));
  }

  validateWorkspaceFiles(snapshot: readonly JsPortalWorkspaceFile[]): void {
    validateNormalizedSnapshot(normalizeWorkspaceSnapshot(snapshot));
  }

  async replaceWorkspaceFiles(repoId: string, snapshot: readonly JsPortalWorkspaceFile[]): Promise<void> {
    const portalsRoot = this.getPortalsRoot(repoId);
    const repoRoot = path.dirname(portalsRoot);
    const staging = path.join(repoRoot, `.portals-${uid()}`);
    const backup = path.join(repoRoot, `.portals-backup-${uid()}`);
    const files = normalizeWorkspaceSnapshot(snapshot);
    validateNormalizedSnapshot(files);
    await fs.mkdir(staging, { recursive: true });
    try {
      for (const file of files) {
        const destination = resolveInside(staging, file.relativePath);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, file.bytes, { flag: 'wx' });
      }
      await scanPortals(repoId, staging);

      let backedUp = false;
      try {
        await fs.rename(portalsRoot, backup);
        backedUp = true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
      try {
        await fs.rename(staging, portalsRoot);
      } catch (error) {
        if (backedUp) {
          try {
            await fs.rename(backup, portalsRoot);
            backedUp = false;
          } catch {
            throw new Error(`Failed to publish or restore JS Portals; previous data remains at ${backup}`);
          }
        }
        throw error;
      }
      if (backedUp) {
        await fs.rm(backup, { recursive: true, force: true }).catch(() => undefined);
      }
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
      throw error;
    }
  }

  async removeRepo(repoId: string): Promise<void> {
    await fs.rm(this.getRepoRoot(repoId), { recursive: true, force: true });
  }

  async listPortals(repoId: string): Promise<JsPortalDescriptor[]> {
    return scanPortals(repoId, this.getPortalsRoot(repoId));
  }

  async resolvePortal(repoId: string, portalKey: string): Promise<JsPortalDescriptor | null> {
    assertPortalKey(portalKey);
    const portalRoot = path.join(this.getPortalsRoot(repoId), portalKey);
    try {
      if (!(await fs.lstat(portalRoot)).isDirectory()) {
        return null;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
    return scanPortal(repoId, portalKey, portalRoot);
  }

  async openAsset(repoId: string, portalKey: string, relativePath: string): Promise<JsPortalAsset | null> {
    assertPortalKey(portalKey);
    const normalizedPath = normalizeRelativePath(relativePath);
    const portalRoot = path.join(this.getPortalsRoot(repoId), portalKey);
    const portalStat = await fs.lstat(portalRoot).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    });
    if (!portalStat?.isDirectory()) {
      return null;
    }
    const filePath = resolveInside(portalRoot, normalizedPath);
    let stat: Stats;
    try {
      stat = await fs.stat(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
    if (!stat.isFile()) {
      return null;
    }
    const realPortalRoot = await fs.realpath(portalRoot);
    const realFilePath = await fs.realpath(filePath);
    assertInside(realPortalRoot, realFilePath);
    const mimeType = lookupMimeType(normalizedPath);
    return {
      relativePath: normalizedPath,
      size: stat.size,
      ...(mimeType ? { mimeType } : {}),
      stream: createReadStream(realFilePath),
    };
  }

  private getRepoRoot(repoId: string): string {
    assertRepoId(repoId);
    return path.join(this.root, repoId);
  }

  private getPortalsRoot(repoId: string): string {
    return path.join(this.getRepoRoot(repoId), 'portals');
  }
}

async function scanPortals(repoId: string, portalsRoot: string): Promise<JsPortalDescriptor[]> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(portalsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  const descriptors: JsPortalDescriptor[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      throw new Error(`JS Portal storage contains an unexpected entry "${entry.name}"`);
    }
    assertPortalKey(entry.name);
    descriptors.push(await scanPortal(repoId, entry.name, path.join(portalsRoot, entry.name)));
  }
  return descriptors;
}

async function scanPortal(repoId: string, portalKey: string, portalRoot: string): Promise<JsPortalDescriptor> {
  const files = await readFiles(portalRoot);
  const entryFile = files.find((file) => file.relativePath === 'entry.json');
  const indexFile = files.find((file) => file.relativePath === 'index.html');
  if (!entryFile || !indexFile) {
    throw portalValidationError(`JS Portal "${portalKey}" must contain entry.json and index.html`);
  }
  if (entryFile.encoding !== 'utf8') {
    throw portalValidationError(`JS Portal "${portalKey}" entry.json must be UTF-8 text`);
  }
  if (indexFile.encoding !== 'utf8') {
    throw portalValidationError(`JS Portal "${portalKey}" index.html must be UTF-8 text`);
  }
  const entry = parsePortalEntry(entryFile.content, portalKey);
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update('\0');
    hash.update(file.bytes);
    hash.update('\n');
  }
  return {
    repoId,
    key: portalKey,
    title: entry.title || portalKey,
    entryHtml: 'index.html',
    contentHash: hash.digest('hex'),
    fileCount: files.length,
    byteSize: files.reduce((total, file) => total + file.size, 0),
  };
}

function parsePortalEntry(content: string, portalKey: string): PortalEntryFile {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch {
    throw portalValidationError(`JS Portal "${portalKey}" entry.json is invalid JSON`);
  }
  if (!isRecord(value)) {
    throw portalValidationError(`JS Portal "${portalKey}" entry.json must contain an object`);
  }
  const unsupportedField = Object.keys(value).find((field) => !PORTAL_ENTRY_FIELDS.has(field));
  if (unsupportedField) {
    throw portalValidationError(`JS Portal "${portalKey}" entry.json field "${unsupportedField}" is not supported`);
  }
  if (value.schemaVersion !== 1 || value.key !== portalKey) {
    throw portalValidationError(`JS Portal "${portalKey}" entry.json must use schemaVersion 1 and the directory key`);
  }
  if (value.entry !== undefined && value.entry !== 'index.html') {
    throw portalValidationError(`JS Portal "${portalKey}" entry must be index.html`);
  }
  if (value.title !== undefined && (typeof value.title !== 'string' || value.title.length > 120)) {
    throw portalValidationError(`JS Portal "${portalKey}" title must not exceed 120 characters`);
  }
  return value as PortalEntryFile;
}

async function readFiles(root: string): Promise<StoredWorkspaceFile[]> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  const files: StoredWorkspaceFile[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(root, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`JS Portal storage must not contain symbolic links: ${entry.name}`);
    }
    if (entry.isDirectory()) {
      for (const file of await readFiles(entryPath)) {
        files.push({ ...file, relativePath: path.posix.join(entry.name, file.relativePath) });
      }
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`JS Portal storage contains an unsupported entry: ${entry.name}`);
    }
    const bytes = await fs.readFile(entryPath);
    const decoded = decodeText(bytes);
    files.push({
      relativePath: entry.name,
      bytes,
      content: decoded === null ? bytes.toString('base64') : decoded,
      encoding: decoded === null ? 'base64' : 'utf8',
      size: bytes.length,
    });
  }
  return files;
}

type StoredWorkspaceFile = {
  relativePath: string;
  bytes: Buffer;
  content: string;
  encoding: 'utf8' | 'base64';
  size: number;
};

function normalizeWorkspaceSnapshot(snapshot: readonly JsPortalWorkspaceFile[]): StoredWorkspaceFile[] {
  const files: StoredWorkspaceFile[] = [];
  const exactPaths = new Set<string>();
  const lowerPaths = new Set<string>();
  for (const file of snapshot) {
    if (
      typeof file.path !== 'string' ||
      typeof file.content !== 'string' ||
      (file.encoding !== undefined && file.encoding !== 'utf8' && file.encoding !== 'base64') ||
      (file.size !== undefined && (!Number.isSafeInteger(file.size) || file.size < 0))
    ) {
      throw portalValidationError('JS Portal file metadata is invalid');
    }
    const relativePath = normalizeWorkspacePath(file.path);
    const lowerPath = relativePath.toLocaleLowerCase('en-US');
    if (exactPaths.has(relativePath) || lowerPaths.has(lowerPath)) {
      throw portalValidationError(`Duplicate JS Portal path "${file.path}"`);
    }
    exactPaths.add(relativePath);
    lowerPaths.add(lowerPath);
    const bytes = decodeWorkspaceContent(file.content, file.encoding);
    if (file.size !== undefined && file.size !== bytes.length) {
      throw portalValidationError(`JS Portal file "${file.path}" has an invalid size`);
    }
    files.push({
      relativePath,
      bytes,
      content: file.content,
      encoding: file.encoding || 'utf8',
      size: bytes.length,
    });
  }
  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function validateNormalizedSnapshot(files: readonly StoredWorkspaceFile[]): void {
  const byPortal = new Map<string, StoredWorkspaceFile[]>();
  for (const file of files) {
    const [portalKey] = file.relativePath.split('/');
    const portalFiles = byPortal.get(portalKey) || [];
    portalFiles.push(file);
    byPortal.set(portalKey, portalFiles);
  }
  for (const [portalKey, portalFiles] of byPortal) {
    const entryFile = portalFiles.find((file) => file.relativePath === `${portalKey}/entry.json`);
    const indexFile = portalFiles.find((file) => file.relativePath === `${portalKey}/index.html`);
    if (!entryFile || !indexFile) {
      throw portalValidationError(`JS Portal "${portalKey}" must contain entry.json and index.html`);
    }
    const entryContent = decodeText(entryFile.bytes);
    if (entryContent === null) {
      throw portalValidationError(`JS Portal "${portalKey}" entry.json must be UTF-8 text`);
    }
    parsePortalEntry(entryContent, portalKey);
    if (decodeText(indexFile.bytes) === null) {
      throw portalValidationError(`JS Portal "${portalKey}" index.html must be UTF-8 text`);
    }
  }
}

function normalizeWorkspacePath(value: string): string {
  const normalized = normalizeRelativePath(value);
  const prefix = `${JS_PORTAL_WORKSPACE_ROOT}/`;
  if (!normalized.startsWith(prefix)) {
    throw portalValidationError(`JS Portal path must be inside ${JS_PORTAL_WORKSPACE_ROOT}`);
  }
  const relativePath = normalized.slice(prefix.length);
  const [portalKey, ...segments] = relativePath.split('/');
  assertPortalKey(portalKey);
  if (!segments.length) {
    throw portalValidationError('JS Portal path must identify a file');
  }
  return relativePath;
}

function normalizeRelativePath(value: string): string {
  if (!value || value.includes('\0') || value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/u.test(value)) {
    throw portalValidationError('JS Portal path is invalid');
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw portalValidationError('JS Portal path is invalid');
  }
  return normalized;
}

function decodeWorkspaceContent(content: string, encoding: JsPortalWorkspaceFile['encoding']): Buffer {
  if (encoding !== 'base64') {
    return Buffer.from(content, 'utf8');
  }
  if (!content || content.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(content)) {
    throw portalValidationError('JS Portal binary content must be valid base64');
  }
  const bytes = Buffer.from(content, 'base64');
  if (bytes.toString('base64') !== content) {
    throw portalValidationError('JS Portal binary content must be canonical base64');
  }
  return bytes;
}

function decodeText(bytes: Buffer): string | null {
  try {
    const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return content.includes('\0') ? null : content;
  } catch {
    return null;
  }
}

function resolveInside(root: string, relativePath: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...relativePath.split('/'));
  assertInside(resolvedRoot, resolved);
  return resolved;
}

function assertInside(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw portalValidationError('JS Portal path escapes its storage root');
  }
}

function assertRepoId(value: string): void {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw portalValidationError('Light extension repository ID is invalid');
  }
}

function assertPortalKey(value: string): void {
  if (!PORTAL_KEY_PATTERN.test(value)) {
    throw portalValidationError(`JS Portal key "${value}" is invalid`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function portalValidationError(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', message, { status: 422 });
}
