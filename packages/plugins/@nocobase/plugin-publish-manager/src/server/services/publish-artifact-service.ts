/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { createHash, randomUUID } from 'crypto';

export type PublishArtifactType = 'backup' | 'migration' | 'database';
export type PublishArtifactState = 'generated' | 'staged' | 'checking' | 'ready' | 'executing' | 'executed' | 'failed';

export interface PublishArtifactMeta {
  artifactId: string;
  type: PublishArtifactType;
  fileName: string;
  state: PublishArtifactState;
  sourceEnv?: string;
  checksum?: string;
  size?: number;
  createdById?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
}

export class PublishArtifactService {
  private readonly rootDir: string;

  constructor(private readonly app: Application) {
    this.rootDir = path.resolve(process.cwd(), 'storage', 'publish', this.app.name);
  }

  getRootDir() {
    return this.rootDir;
  }

  createArtifactId() {
    return `artifact_${randomUUID()}`;
  }

  private assertType(type: string): asserts type is PublishArtifactType {
    if (!['backup', 'migration', 'database'].includes(type)) {
      throw new Error(`Unsupported publish artifact type: ${type}`);
    }
  }

  private assertArtifactId(artifactId: string) {
    if (!/^artifact_[0-9a-f-]+$/i.test(artifactId)) {
      throw new Error('Invalid artifactId');
    }
  }

  private assertFileName(fileName: string) {
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      throw new Error('Invalid fileName');
    }
    if (!fileName.endsWith('.nbdata')) {
      throw new Error('Only .nbdata publish files are supported');
    }
  }

  verifyChecksum(expected: string | undefined, actual: string | undefined) {
    if (!expected) {
      return;
    }
    if (expected !== actual) {
      throw new Error(`Publish file checksum mismatch. Expected ${expected}, got ${actual || 'empty'}`);
    }
  }

  assertExecutableArtifact(meta: PublishArtifactMeta) {
    if (meta.state === 'executed') {
      throw new Error(`Publish artifact ${meta.artifactId} has already been executed`);
    }

    if (meta.type === 'migration' && meta.state !== 'ready') {
      throw new Error(`Migration publish artifact ${meta.artifactId} is not ready to execute`);
    }

    if (meta.type === 'backup' && !['generated', 'staged', 'ready'].includes(meta.state)) {
      throw new Error(`Backup publish artifact ${meta.artifactId} is not ready to execute`);
    }
  }

  private artifactDir(type: PublishArtifactType, artifactId: string) {
    this.assertType(type);
    this.assertArtifactId(artifactId);
    return path.resolve(this.rootDir, type, artifactId);
  }

  private metaPath(type: PublishArtifactType, artifactId: string) {
    return path.join(this.artifactDir(type, artifactId), 'meta.json');
  }

  artifactFilePath(type: PublishArtifactType, artifactId: string, fileName: string) {
    this.assertFileName(fileName);
    const filePath = path.resolve(this.artifactDir(type, artifactId), fileName);
    if (!filePath.startsWith(this.artifactDir(type, artifactId))) {
      throw new Error('Invalid artifact file path');
    }
    return filePath;
  }

  async checksum(filePath: string) {
    const hash = createHash('sha256');
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('error', reject);
      stream.on('end', resolve);
    });
    return `sha256:${hash.digest('hex')}`;
  }

  async createFromFile(options: {
    type: PublishArtifactType;
    filePath: string;
    fileName?: string;
    sourceEnv?: string;
    state?: PublishArtifactState;
    createdById?: number;
    metadata?: Record<string, any>;
  }) {
    this.assertType(options.type);
    const fileName = options.fileName || path.basename(options.filePath);
    this.assertFileName(fileName);
    const artifactId = this.createArtifactId();
    const dir = this.artifactDir(options.type, artifactId);
    await fsPromises.mkdir(dir, { recursive: true });
    const targetPath = this.artifactFilePath(options.type, artifactId, fileName);
    await fsPromises.copyFile(options.filePath, targetPath);
    const stats = await fsPromises.stat(targetPath);
    const now = new Date().toISOString();
    const meta: PublishArtifactMeta = {
      artifactId,
      type: options.type,
      fileName,
      state: options.state || 'generated',
      sourceEnv: options.sourceEnv,
      checksum: await this.checksum(targetPath),
      size: stats.size,
      createdById: options.createdById,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: options.metadata || {},
    };
    await this.writeMeta(meta);
    return { meta, filePath: targetPath };
  }

  async readMeta(type: PublishArtifactType, artifactId: string) {
    this.assertType(type);
    const content = await fsPromises.readFile(this.metaPath(type, artifactId), 'utf8');
    return JSON.parse(content) as PublishArtifactMeta;
  }

  async writeMeta(meta: PublishArtifactMeta) {
    this.assertType(meta.type);
    this.assertArtifactId(meta.artifactId);
    meta.updatedAt = new Date().toISOString();
    await fsPromises.mkdir(this.artifactDir(meta.type, meta.artifactId), { recursive: true });
    await fsPromises.writeFile(this.metaPath(meta.type, meta.artifactId), JSON.stringify(meta, null, 2));
  }

  async updateMeta(
    type: PublishArtifactType,
    artifactId: string,
    patch: Partial<Omit<PublishArtifactMeta, 'type' | 'artifactId' | 'createdAt'>>,
  ) {
    const meta = await this.readMeta(type, artifactId);
    Object.assign(meta, patch);
    await this.writeMeta(meta);
    return meta;
  }

  async findByFileName(type: PublishArtifactType, fileName: string) {
    this.assertType(type);
    this.assertFileName(fileName);
    const metas = await this.list(type);
    return metas.find((meta) => meta.fileName === fileName);
  }

  async getFilePath(meta: Pick<PublishArtifactMeta, 'type' | 'artifactId' | 'fileName'>) {
    const filePath = this.artifactFilePath(meta.type, meta.artifactId, meta.fileName);
    await fsPromises.access(filePath);
    return filePath;
  }

  async list(type?: PublishArtifactType) {
    const types = type ? [type] : (['backup', 'migration', 'database'] as PublishArtifactType[]);
    const metas: PublishArtifactMeta[] = [];
    for (const item of types) {
      const typeDir = path.resolve(this.rootDir, item);
      const artifactIds = await fsPromises.readdir(typeDir).catch((error) => {
        if (error.code === 'ENOENT') {
          return [];
        }
        throw error;
      });
      for (const artifactId of artifactIds) {
        try {
          metas.push(await this.readMeta(item, artifactId));
        } catch (error) {
          this.app.logger.warn('failed to read publish artifact meta', error);
        }
      }
    }
    return metas.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async destroy(type: PublishArtifactType, artifactId: string) {
    await fsPromises.rm(this.artifactDir(type, artifactId), { recursive: true, force: true });
  }
}
