/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type TypeScriptModule = typeof import('typescript');
type TypeScriptScriptSnapshot = import('typescript').IScriptSnapshot;

export interface TypeScriptVirtualFileInput {
  content: string;
  contentHash?: string;
  fileName: string;
  immutable?: boolean;
  root: boolean;
}

export interface TypeScriptVirtualFile {
  content: string;
  contentHash?: string;
  fileName: string;
  immutable: boolean;
  root: boolean;
  snapshot: TypeScriptScriptSnapshot;
  version: string;
}

export class TypeScriptImmutableFileConflictError extends Error {
  readonly code = 'TYPE_LIBRARY_FILE_CONFLICT';

  constructor(
    readonly fileName: string,
    readonly existingContentHash: string,
    readonly nextContentHash: string,
  ) {
    super(`Conflicting immutable TypeScript virtual file: ${fileName}`);
    this.name = 'TypeScriptImmutableFileConflictError';
  }
}

type ImmutableCacheEntry = {
  content: string;
  contentHash: string;
  snapshot: TypeScriptScriptSnapshot;
};

const immutableFileCache = new Map<string, ImmutableCacheEntry>();
let immutableSnapshotCreationCount = 0;
const immutableSnapshotCreationCountByNamespace = new Map<string, number>();
let mutableFileVersion = 0;

function normalizeFileName(fileName: string): string {
  const normalized = String(fileName || '')
    .replace(/\\/gu, '/')
    .replace(/\/+/gu, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized.replace(/^\/+/, '')}`;
}

function createContentHash(content: string): string {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

function getImmutableFile(
  ts: TypeScriptModule,
  input: TypeScriptVirtualFileInput,
  cacheNamespace: string,
): Pick<TypeScriptVirtualFile, 'contentHash' | 'snapshot' | 'version'> {
  const fileName = normalizeFileName(input.fileName);
  const cacheKey = `${cacheNamespace}:${fileName}`;
  const contentHash = input.contentHash || createContentHash(input.content);
  const cached = immutableFileCache.get(cacheKey);
  if (cached) {
    if (cached.contentHash !== contentHash || cached.content !== input.content) {
      throw new TypeScriptImmutableFileConflictError(fileName, cached.contentHash, contentHash);
    }
    return {
      contentHash,
      snapshot: cached.snapshot,
      version: contentHash,
    };
  }

  const snapshot = ts.ScriptSnapshot.fromString(input.content);
  immutableFileCache.set(cacheKey, { content: input.content, contentHash, snapshot });
  immutableSnapshotCreationCount += 1;
  immutableSnapshotCreationCountByNamespace.set(
    cacheNamespace,
    (immutableSnapshotCreationCountByNamespace.get(cacheNamespace) || 0) + 1,
  );
  return {
    contentHash,
    snapshot,
    version: contentHash,
  };
}

export class TypeScriptVirtualFileSystem {
  private files = new Map<string, TypeScriptVirtualFile>();

  constructor(
    private readonly ts: TypeScriptModule,
    private readonly cacheNamespace = 'shared',
  ) {}

  synchronize(inputs: readonly TypeScriptVirtualFileInput[]): void {
    const nextFiles = new Map<string, TypeScriptVirtualFile>();
    for (const input of inputs) {
      const fileName = normalizeFileName(input.fileName);
      const previous = this.files.get(fileName);
      if (input.immutable) {
        const immutable = getImmutableFile(this.ts, { ...input, fileName }, this.cacheNamespace);
        nextFiles.set(fileName, {
          content: input.content,
          contentHash: immutable.contentHash,
          fileName,
          immutable: true,
          root: input.root || previous?.root === true,
          snapshot: immutable.snapshot,
          version: immutable.version,
        });
        continue;
      }

      if (previous && !previous.immutable && previous.content === input.content) {
        nextFiles.set(fileName, {
          ...previous,
          root: input.root,
        });
        continue;
      }

      mutableFileVersion += 1;
      nextFiles.set(fileName, {
        content: input.content,
        fileName,
        immutable: false,
        root: input.root,
        snapshot: this.ts.ScriptSnapshot.fromString(input.content),
        version: String(mutableFileVersion),
      });
    }
    this.files = nextFiles;
  }

  get(fileName: string): TypeScriptVirtualFile | undefined {
    return this.files.get(normalizeFileName(fileName));
  }

  getAllFileNames(): string[] {
    return Array.from(this.files.keys());
  }

  getRootFileNames(): string[] {
    return Array.from(this.files.values())
      .filter((file) => file.root)
      .map((file) => file.fileName);
  }

  getVersions(): Record<string, string> {
    return Object.fromEntries(Array.from(this.files.values()).map((file) => [file.fileName, file.version]));
  }
}

export function clearTypeScriptImmutableFileCacheForTests(): void {
  immutableFileCache.clear();
  immutableSnapshotCreationCount = 0;
  immutableSnapshotCreationCountByNamespace.clear();
  mutableFileVersion = 0;
}

export function clearTypeScriptImmutableFileCacheNamespace(cacheNamespace: string): void {
  const prefix = `${cacheNamespace}:`;
  for (const key of immutableFileCache.keys()) {
    if (key.startsWith(prefix)) immutableFileCache.delete(key);
  }
  immutableSnapshotCreationCountByNamespace.delete(cacheNamespace);
}

export function getTypeScriptImmutableFileCacheDebugState(cacheNamespace?: string): {
  characterCount: number;
  fileCount: number;
  snapshotCreationCount: number;
} {
  const entries = cacheNamespace
    ? [...immutableFileCache.entries()]
        .filter(([key]) => key.startsWith(`${cacheNamespace}:`))
        .map(([, value]) => value)
    : [...immutableFileCache.values()];
  return {
    characterCount: entries.reduce((sum, file) => sum + file.content.length, 0),
    fileCount: entries.length,
    snapshotCreationCount: cacheNamespace
      ? immutableSnapshotCreationCountByNamespace.get(cacheNamespace) || 0
      : immutableSnapshotCreationCount,
  };
}
