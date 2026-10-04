// @vitest-environment node
import { Readable } from 'node:stream';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  receiveArtifact,
  MAX_ARTIFACT_SIZE,
} from '../server/services/artifact-upload.js';

describe('streamed artifact intake', () => {
  let temporaryRoot: string;
  beforeEach(async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'intake-test-'));
    vi.spyOn(os, 'tmpdir').mockReturnValue(temporaryRoot);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(temporaryRoot, { recursive: true, force: true });
  });
  it('spools chunks, hashes them and removes the temporary file', async () => {
    const upload = await receiveArtifact(
      Readable.from([Buffer.from('a'), Buffer.from('bc')]),
    );
    expect(await readFile(upload.path, 'utf8')).toBe('abc');
    expect(upload.size).toBe(3);
    expect(upload.checksum).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    await upload.dispose();
    await expect(readFile(upload.path)).rejects.toThrow();
  });
  it('stops an oversized stream and cleans failed, interrupted and mismatched uploads', async () => {
    let consumed = 0;
    async function* large() {
      for (let n = 0; n < 258; n++) {
        consumed++;
        yield Buffer.alloc(1024 * 1024);
      }
    }
    await expect(receiveArtifact(large())).rejects.toMatchObject({
      code: 413,
      reason: 'ARTIFACT_TOO_LARGE',
    });
    expect(consumed).toBe(MAX_ARTIFACT_SIZE / 1024 / 1024 + 1);
    async function* interrupted() {
      yield Buffer.from('partial');
      throw new Error('disconnected');
    }
    await expect(receiveArtifact(interrupted())).rejects.toThrow(
      'disconnected',
    );
    await expect(
      receiveArtifact(Readable.from([Buffer.from('abc')]), '0'.repeat(64)),
    ).rejects.toMatchObject({ reason: 'CHECKSUM_MISMATCH' });
    expect(await readdir(temporaryRoot)).toEqual([]);
  });
});
