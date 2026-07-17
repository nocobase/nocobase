/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeRunJSVirtualPath } from '@nocobase/runjs/compiler/portable';

import type { BrowserPreviewFile, BrowserPreviewFileChange } from './protocol';

export class BrowserPreviewVirtualFileSystem {
  private files = new Map<string, BrowserPreviewFile>();
  private workspaceVersion = 0;

  get version(): number {
    return this.workspaceVersion;
  }

  replace(workspaceVersion: number, files: BrowserPreviewFile[]): void {
    this.assertNextVersion(workspaceVersion);
    this.files = new Map(files.map((file) => [normalizeRunJSVirtualPath(file.path), normalizeFile(file)]));
    this.workspaceVersion = workspaceVersion;
  }

  applyDelta(workspaceVersion: number, changes: BrowserPreviewFileChange[]): void {
    this.assertNextVersion(workspaceVersion);
    for (const change of changes) {
      if (change.operation === 'upsert') {
        const file = normalizeFile(change.file);
        this.files.set(file.path, file);
        continue;
      }
      if (change.operation === 'delete') {
        this.files.delete(normalizeRunJSVirtualPath(change.path));
        continue;
      }

      const previousPath = normalizeRunJSVirtualPath(change.path);
      const nextPath = normalizeRunJSVirtualPath(change.nextPath);
      const previousFile = this.files.get(previousPath);
      this.files.delete(previousPath);
      if (change.file) {
        this.files.set(nextPath, normalizeFile({ ...change.file, path: nextPath }));
      } else if (previousFile) {
        this.files.set(nextPath, { ...previousFile, path: nextPath });
      }
    }
    this.workspaceVersion = workspaceVersion;
  }

  snapshot(): BrowserPreviewFile[] {
    return [...this.files.values()]
      .map((file) => ({ ...file }))
      .sort((left, right) => left.path.localeCompare(right.path));
  }

  get(path: string): BrowserPreviewFile | undefined {
    const file = this.files.get(normalizeRunJSVirtualPath(path));
    return file ? { ...file } : undefined;
  }

  has(path: string): boolean {
    return this.files.has(normalizeRunJSVirtualPath(path));
  }

  paths(): ReadonlySet<string> {
    return new Set(this.files.keys());
  }

  stats(): { fileCount: number; inputBytes: number; estimatedMemoryBytes: number } {
    let inputBytes = 0;
    for (const file of this.files.values()) {
      inputBytes += utf8ByteLength(file.path) + utf8ByteLength(file.content);
    }
    return {
      fileCount: this.files.size,
      inputBytes,
      estimatedMemoryBytes: inputBytes * 2,
    };
  }

  clear(): void {
    this.files.clear();
    this.workspaceVersion = 0;
  }

  private assertNextVersion(workspaceVersion: number): void {
    if (!Number.isInteger(workspaceVersion) || workspaceVersion <= this.workspaceVersion) {
      throw new Error(
        `Workspace version must increase monotonically: current=${this.workspaceVersion}, next=${workspaceVersion}`,
      );
    }
  }
}

function normalizeFile(file: BrowserPreviewFile): BrowserPreviewFile {
  return {
    path: normalizeRunJSVirtualPath(file.path),
    content: String(file.content || ''),
    language: file.language,
  };
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
