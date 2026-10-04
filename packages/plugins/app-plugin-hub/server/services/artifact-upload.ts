import { createHash } from 'node:crypto';
import { open, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { HubError } from './hub.js';

export const MAX_ARTIFACT_SIZE: number = 256 * 1024 * 1024;

/** Spool with backpressure; neither HTTP uploads nor storage writes buffer the archive. */
export async function receiveArtifact(
  source: AsyncIterable<Uint8Array>,
  expectedChecksum?: string,
): Promise<{
  path: string;
  size: number;
  checksum: string;
  dispose: () => Promise<void>;
}> {
  if (
    expectedChecksum !== undefined &&
    !/^[a-f0-9]{64}$/i.test(expectedChecksum)
  )
    throw new HubError(
      'Checksum must be a SHA-256 hex digest.',
      'INVALID_CHECKSUM',
      'INVALID_ARGUMENT',
    );
  const directory = await mkdtemp(path.join(os.tmpdir(), 'hub-upload-'));
  const archive = path.join(directory, 'artifact.tar.gz');
  const dispose = () => rm(directory, { recursive: true, force: true });
  try {
    const file = await open(archive, 'wx', 0o600);
    const hash = createHash('sha256');
    let size = 0;
    try {
      for await (const chunk of source) {
        size += chunk.byteLength;
        if (size > MAX_ARTIFACT_SIZE)
          throw new HubError(
            'Artifact exceeds the upload limit.',
            'ARTIFACT_TOO_LARGE',
            'INVALID_ARGUMENT',
            { httpStatus: 413 },
          );
        hash.update(chunk);
        let offset = 0;
        while (offset < chunk.byteLength) {
          const { bytesWritten } = await file.write(
            chunk,
            offset,
            chunk.byteLength - offset,
          );
          offset += bytesWritten;
        }
      }
    } finally {
      await file.close();
    }
    if (!size)
      throw new HubError(
        'Artifact is empty.',
        'INVALID_ARTIFACT_SIZE',
        'INVALID_ARGUMENT',
      );
    const checksum = hash.digest('hex');
    if (expectedChecksum && checksum !== expectedChecksum.toLowerCase())
      throw new HubError(
        'Artifact checksum does not match.',
        'CHECKSUM_MISMATCH',
        'INVALID_ARGUMENT',
      );
    return { path: archive, size, checksum, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}

export function validateIdempotencyKey(key: string | undefined): void {
  if (key !== undefined && !/^[A-Za-z0-9._:-]{1,128}$/.test(key))
    throw new HubError(
      'Invalid idempotency key.',
      'INVALID_IDEMPOTENCY_KEY',
      'INVALID_ARGUMENT',
    );
}
