import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { Transform, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type { NocoBaseDriveDisk } from '@nocobase/drive';
import type { Logger } from '@nocobase/logging';

import {
  deploymentCheckpoint,
  deploymentSignal,
} from './deployment-control.js';
import { deploymentLog } from './deployment-log.js';
import { ArtifactReadTimeoutError } from './errors.js';

export interface ArtifactReadOptions {
  /** Maximum time without a data chunk, including waiting for getStream (60000 ms). */
  idleTimeoutMs?: number;
  /** Maximum duration of each attempt (600000 ms). A timeout is retried once. */
  timeoutMs?: number;
}

export function resolveArtifactReadOptions(
  options: ArtifactReadOptions = {},
): Required<ArtifactReadOptions> {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new Error('Invalid artifactRead: expected timeout settings');
  const resolved = {
    idleTimeoutMs:
      options.idleTimeoutMs === undefined ? 60_000 : options.idleTimeoutMs,
    timeoutMs: options.timeoutMs === undefined ? 600_000 : options.timeoutMs,
  };
  for (const [key, value] of Object.entries(resolved)) {
    // Node clamps larger timer delays to 1 ms.
    if (!Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647)
      throw new Error(
        `Invalid artifactRead.${key}: expected an integer from 1 to 2147483647`,
      );
  }
  return resolved;
}

export async function downloadArtifact(
  disk: NocoBaseDriveDisk,
  key: string,
  destination: string,
  options: Required<ArtifactReadOptions>,
  logger?: Logger,
): Promise<void> {
  const cancellation = deploymentSignal();
  for (let attempt = 1; attempt <= 2; attempt++) {
    deploymentCheckpoint();
    cancellation?.throwIfAborted();
    const startedAt = Date.now();
    let bytes = 0;
    const deadline = new AbortController();
    const signal = cancellation
      ? AbortSignal.any([cancellation, deadline.signal])
      : deadline.signal;
    const idleTimer = setTimeout(
      () =>
        deadline.abort(
          new ArtifactReadTimeoutError('idle', options.idleTimeoutMs),
        ),
      options.idleTimeoutMs,
    );
    const totalTimer = setTimeout(
      () =>
        deadline.abort(
          new ArtifactReadTimeoutError('total', options.timeoutMs),
        ),
      options.timeoutMs,
    );
    const fields = (reason: string) => ({
      artifactKey: key,
      attempt,
      bytes,
      reason,
      readDurationMs: Date.now() - startedAt,
      ...options,
    });
    try {
      const source = await openArtifactStream(disk, key, signal);
      await pipeline(
        source,
        new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            bytes += chunk.length;
            idleTimer.refresh();
            callback(null, chunk);
          },
        }),
        createWriteStream(destination, { flags: 'wx', mode: 0o600 }),
        { signal },
      );
      cancellation?.throwIfAborted();
      signal.throwIfAborted();
      const details = fields('complete');
      deploymentLog('resolving', 'Read release artifact', details);
      logger?.info(details, 'Read release artifact');
      return;
    } catch (error) {
      // Cancellation wins even if a timer or a stream error fired in the same turn.
      const failure: unknown = cancellation?.aborted
        ? cancellation.reason
        : signal.aborted
          ? signal.reason
          : error;
      const timeout = failure instanceof ArtifactReadTimeoutError;
      const details = fields(
        cancellation?.aborted ? 'cancelled' : timeout ? failure.kind : 'error',
      );
      deploymentLog('resolving', 'Release artifact read failed', details);
      logger?.warn(details, 'Release artifact read failed');
      await rm(destination, { force: true });
      cancellation?.throwIfAborted();
      deploymentCheckpoint();
      if (!timeout || attempt === 2) throw failure;
      deploymentLog(
        'resolving',
        'Retrying release artifact read after timeout',
        details,
      );
    } finally {
      clearTimeout(idleTimer);
      clearTimeout(totalTimer);
    }
  }
}

/** Drive has no abort parameter. Stop waiting immediately and dispose of any late result. */
async function openArtifactStream(
  disk: NocoBaseDriveDisk,
  key: string,
  signal: AbortSignal,
): Promise<Readable> {
  signal.throwIfAborted();
  let onAbort: () => void;
  try {
    return await new Promise<Readable>((resolve, reject) => {
      onAbort = () => reject(signal.reason as Error);
      signal.addEventListener('abort', onAbort, { once: true });
      void Promise.resolve()
        .then(() => {
          signal.throwIfAborted();
          return disk.getStream(key);
        })
        .then((stream) => {
          if (signal.aborted) {
            stream.destroy();
            reject(signal.reason as Error);
          } else {
            resolve(stream);
          }
        }, reject);
    });
  } finally {
    signal.removeEventListener('abort', onAbort!);
  }
}
