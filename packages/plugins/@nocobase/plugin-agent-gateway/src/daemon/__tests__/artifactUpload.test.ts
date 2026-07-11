/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import {
  buildImageArtifactUpload,
  buildDeclaredArtifactManifestUpload,
  getDeclaredArtifactLimits,
  MAX_DECLARED_ARTIFACT_MANIFEST_BYTES,
  MAX_DECLARED_ARTIFACT_TOTAL_READ_BYTES,
  MAX_DECLARED_ARTIFACT_TOTAL_UPLOAD_BYTES,
  MAX_DECLARED_ARTIFACT_UPLOADS,
  processDeclaredArtifactUploads,
} from '../artifactUpload';

describe('agent gateway declared artifact uploads', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ag-artifact-upload-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('clamps task-provided artifact counts and applies hard total byte budgets', () => {
    expect(
      getDeclaredArtifactLimits({
        maxArtifactUploads: Number.MAX_SAFE_INTEGER,
      }),
    ).toEqual({
      maxArtifacts: MAX_DECLARED_ARTIFACT_UPLOADS,
      maxReadBytes: MAX_DECLARED_ARTIFACT_TOTAL_READ_BYTES,
      maxUploadBytes: MAX_DECLARED_ARTIFACT_TOTAL_UPLOAD_BYTES,
    });
  });

  it('builds and uploads each declared artifact before reading the next file', async () => {
    const firstPath = path.join(tempDir, 'first.txt');
    const secondPath = path.join(tempDir, 'second.txt');
    await fs.writeFile(firstPath, 'first');
    await fs.writeFile(secondPath, 'second-before');
    const uploads: Array<{ artifactKey: string; contentText: string }> = [];

    const result = await processDeclaredArtifactUploads({
      payload: {
        artifactPaths: ['first.txt', 'second.txt'],
      },
      cwd: tempDir,
      onUpload: async (upload) => {
        uploads.push({
          artifactKey: upload.artifactKey,
          contentText: upload.contentText,
        });
        if (upload.artifactKey === 'declared:first.txt') {
          await fs.writeFile(secondPath, 'second-after');
        }
      },
    });

    expect(uploads).toEqual([
      {
        artifactKey: 'declared:first.txt',
        contentText: 'first',
      },
      {
        artifactKey: 'declared:second.txt',
        contentText: 'second-after',
      },
    ]);
    expect(result.manifest).toMatchObject({
      counts: {
        selected: 2,
        uploaded: 2,
      },
    });
  });

  it('applies modifiedSinceMs to explicit relative and absolute artifact paths', async () => {
    const relativeStalePath = path.join(tempDir, 'relative-stale.txt');
    const absoluteStalePath = path.join(tempDir, 'absolute-stale.txt');
    const freshPath = path.join(tempDir, 'fresh.txt');
    await fs.writeFile(relativeStalePath, 'relative stale');
    await fs.writeFile(absoluteStalePath, 'absolute stale');
    await fs.writeFile(freshPath, 'fresh');
    const staleDate = new Date('2020-01-01T00:00:00.000Z');
    await fs.utimes(relativeStalePath, staleDate, staleDate);
    await fs.utimes(absoluteStalePath, staleDate, staleDate);
    const uploadedKeys: string[] = [];

    await processDeclaredArtifactUploads({
      payload: {
        artifactPaths: ['relative-stale.txt', absoluteStalePath, 'fresh.txt'],
      },
      cwd: tempDir,
      modifiedSinceMs: Date.now() - 1000,
      onUpload: async (upload) => {
        uploadedKeys.push(upload.artifactKey);
      },
    });

    expect(uploadedKeys).toEqual(['declared:fresh.txt']);
  });

  it('keeps the generated manifest within its reserved upload budget', () => {
    const manifest = buildDeclaredArtifactManifestUpload({
      schema: 'agent-gateway-artifact-manifest/v1',
      generatedAt: new Date().toISOString(),
      counts: {
        matched: 2000,
      },
      artifacts: Array.from({ length: 2000 }, (_value, index) => ({
        artifactKey: `declared:${index}`,
        relativePath: `${index}-${'x'.repeat(1000)}`,
      })),
    });

    expect(Buffer.byteLength(manifest.upload.contentText)).toBeLessThanOrEqual(MAX_DECLARED_ARTIFACT_MANIFEST_BYTES);
    expect(manifest.manifest.manifestTruncated).toBe(true);
    expect(() => JSON.parse(manifest.upload.contentText)).not.toThrow();
  });

  it('does not pad or inline an image that changed after it was inspected', async () => {
    const imagePath = path.join(tempDir, 'changing.png');
    await fs.writeFile(imagePath, Buffer.from([1, 2, 3, 4]));
    const initialStat = await fs.stat(imagePath);
    await fs.writeFile(imagePath, Buffer.from([1, 2]));

    const upload = await buildImageArtifactUpload(imagePath, initialStat, 'image/png', 1024);

    expect(upload.contentText).toBe('');
    expect(upload.metadata).toMatchObject({
      truncated: true,
      inlineEncoding: 'none',
      inlineSkippedReason: 'file-changed-during-read',
      fileChangedDuringRead: true,
    });
    expect(upload.readBytes).toBe(2);
  });
});
