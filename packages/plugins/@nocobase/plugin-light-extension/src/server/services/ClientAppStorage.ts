/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { storagePathJoin, uid } from '@nocobase/utils';
import fs from 'fs/promises';
import { lookup as lookupMimeType } from 'mime-types';
import path from 'path';
import type { Readable } from 'stream';
import { createReadStream } from 'fs';

export interface ClientAppSourceFile {
  relativePath: string;
  filePath: string;
  byteSize: number;
}

export interface ClientAppStoredFile {
  title: string;
  filename: string;
  extname?: string;
  size: number;
  mimetype?: string;
  path: string;
}

export interface ClientAppAssetStorage {
  publish(input: { assetSetId: string; files: readonly ClientAppSourceFile[] }): Promise<ClientAppStoredFile[]>;
  open(file: ClientAppStoredFile): Promise<{ stream: Readable; contentType?: string }>;
  delete(assetSetId: string): Promise<void>;
}

export class LocalClientAppStorage implements ClientAppAssetStorage {
  constructor(private readonly root = storagePathJoin('light-extension-client-app-assets')) {}

  async publish(input: { assetSetId: string; files: readonly ClientAppSourceFile[] }): Promise<ClientAppStoredFile[]> {
    assertAssetSetId(input.assetSetId);
    if (!input.files.length) {
      throw new Error('Client app asset set is empty');
    }

    const sourceRoot = getSourceRoot(input.files[0]);
    for (const file of input.files) {
      if (path.resolve(sourceRoot, ...file.relativePath.split('/')) !== path.resolve(file.filePath)) {
        throw new Error(`Client app asset "${file.relativePath}" is outside its source root`);
      }
    }

    await fs.mkdir(this.root, { recursive: true });
    const destination = path.join(this.root, input.assetSetId);
    const staging = path.join(this.root, `.${input.assetSetId}-${uid()}`);
    try {
      try {
        await fs.rename(sourceRoot, staging);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EXDEV') {
          throw error;
        }
        await fs.cp(sourceRoot, staging, { recursive: true, errorOnExist: true, force: false });
      }
      await fs.rm(path.join(staging, 'entry.json'), { force: true });
      await fs.rename(staging, destination);
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true }).catch(() => undefined);
      throw error;
    }

    return input.files.map((file) => toStoredFile(input.assetSetId, file));
  }

  async open(file: ClientAppStoredFile): Promise<{ stream: Readable; contentType?: string }> {
    const filePath = resolveInside(this.root, file.path, file.filename);
    await fs.access(filePath);
    return {
      stream: createReadStream(filePath),
      ...(file.mimetype ? { contentType: file.mimetype } : {}),
    };
  }

  async delete(assetSetId: string): Promise<void> {
    assertAssetSetId(assetSetId);
    await fs.rm(path.join(this.root, assetSetId), { recursive: true, force: true });
  }
}

function getSourceRoot(file: ClientAppSourceFile): string {
  let root = path.resolve(file.filePath);
  for (const _segment of file.relativePath.split('/')) {
    root = path.dirname(root);
  }
  return root;
}

function toStoredFile(assetSetId: string, file: ClientAppSourceFile): ClientAppStoredFile {
  const extension = path.posix.extname(file.relativePath);
  const directory = path.posix.dirname(file.relativePath);
  const mimeType = lookupMimeType(file.relativePath);
  return {
    title: path.posix.basename(file.relativePath, extension),
    filename: path.posix.basename(file.relativePath),
    ...(extension ? { extname: extension } : {}),
    size: file.byteSize,
    ...(mimeType ? { mimetype: mimeType } : {}),
    path: directory === '.' ? assetSetId : path.posix.join(assetSetId, directory),
  };
}

function resolveInside(root: string, ...segments: string[]): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, resolved);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Client app asset path is invalid');
  }
  return resolved;
}

function assertAssetSetId(value: string): void {
  if (!/^leas_[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error('Client app asset set ID is invalid');
  }
}
