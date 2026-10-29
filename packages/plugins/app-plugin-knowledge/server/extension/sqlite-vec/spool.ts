import { randomUUID } from 'node:crypto';
import { closeSync, openSync, readSync } from 'node:fs';
import { mkdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { z } from 'zod';
import { invalid } from '../../errors.js';
import type {
  IndexingDocument,
  IndexingItem,
  IndexingTarget,
} from '../../indexing/types.js';
import { sha256, validateVectors } from '../../indexing/vector.js';
import { indexingSpoolDirectory as directory } from '../../indexing/spool.js';

const rowSchema: z.ZodType<PreparedRow> = z
  .object({
    chunkId: z.string().max(64),
    docId: z.string().max(64),
    spaceId: z.string().max(64),
    version: z.number().int().nonnegative(),
    ordinal: z.number().int().nonnegative(),
    contentHash: z.string().max(64),
    gate: z.string().max(132),
    embedding: z.string().max(4 * 1024 * 1024),
  })
  .strict();
interface PreparedRow {
  readonly chunkId: string;
  readonly docId: string;
  readonly spaceId: string;
  readonly version: number;
  readonly ordinal: number;
  readonly contentHash: string;
  readonly gate: string;
  readonly embedding: string;
}
export interface SqliteVectorSpool {
  readonly count: number;
  rows(): Generator<
    Omit<PreparedRow, 'embedding'> & { readonly embedding: Buffer }
  >;
  close(): Promise<void>;
}
const snapshotError = () =>
  invalid(
    'INDEXING_SNAPSHOT_CONFLICT',
    'Knowledge index snapshot does not match.',
  );
function* lines(file: string, signal: AbortSignal): Generator<string> {
  const fd = openSync(file, 'r');
  const buffer = Buffer.alloc(65536);
  const decoder = new StringDecoder('utf8');
  let pending = '';
  try {
    for (;;) {
      signal.throwIfAborted();
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (!count) break;
      pending += decoder.write(buffer.subarray(0, count));
      let end: number;
      while ((end = pending.indexOf('\n')) !== -1) {
        yield pending.slice(0, end);
        pending = pending.slice(end + 1);
      }
      if (pending.length > 4 * 1024 * 1024) throw snapshotError();
    }
    pending += decoder.end();
    if (pending.length) throw snapshotError();
  } finally {
    closeSync(fd);
  }
}
/** Pre-consume outside the synchronous transaction, without retaining a document's vectors or text in memory. */
export async function prepareSqliteVectorSpool(
  storagePath: string,
  target: IndexingTarget,
  document: IndexingDocument,
  input: AsyncIterable<IndexingItem>,
  signal: AbortSignal,
): Promise<SqliteVectorSpool> {
  await mkdir(directory(storagePath), { recursive: true, mode: 0o700 });
  const file = path.join(
    directory(storagePath),
    'kb-' +
      sha256(target.namespace).slice(0, 24) +
      '-' +
      randomUUID() +
      '.jsonl',
  );
  let count = 0;
  try {
    const handle = await open(file, 'wx', 0o600);
    try {
      for await (const item of input) {
        signal.throwIfAborted();
        if (
          document.deleted ||
          item.docId !== document.docId ||
          item.spaceId !== document.spaceId ||
          !item.vector
        )
          throw snapshotError();
        validateVectors([item.vector], 1, target.dimension);
        const encoded = new Float32Array(item.vector);
        validateVectors([Array.from(encoded)], 1, target.dimension);
        const row = rowSchema.parse({
          chunkId: item.chunkId,
          docId: item.docId,
          spaceId: item.spaceId,
          version: item.version,
          ordinal: item.ordinal,
          contentHash: item.contentHash,
          gate: item.gate,
          embedding: Buffer.from(encoded.buffer).toString('base64'),
        });
        await handle.writeFile(JSON.stringify(row) + '\n');
        count++;
      }
      signal.throwIfAborted();
    } finally {
      await handle.close();
    }
    return {
      count,
      *rows() {
        for (const line of lines(file, signal)) {
          const row = rowSchema.parse(JSON.parse(line));
          const embedding = Buffer.from(row.embedding, 'base64');
          if (
            target.dimension === null ||
            embedding.byteLength !== target.dimension * 4
          )
            throw snapshotError();
          validateVectors(
            [
              Array.from({ length: target.dimension }, (_, i) =>
                embedding.readFloatLE(i * 4),
              ),
            ],
            1,
            target.dimension,
          );
          yield { ...row, embedding };
        }
      },
      async close() {
        await unlink(file);
      },
    };
  } catch (error) {
    await unlink(file).catch(() => {});
    throw error;
  }
}
