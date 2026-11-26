import type { FileHandle } from 'node:fs/promises';

/** Byte offsets survive UTF-8 framing and oversized-line discards, so a second pass can stream an exact suffix. */
export async function* diagnosticLines(
  handle: FileHandle,
  start: number,
  end: number,
): AsyncGenerator<{ offset: number; text: string | null }> {
  let offset = start;
  let lineStart = start;
  let skip = false;
  if (start) {
    const previous = Buffer.alloc(1);
    await handle.read(previous, 0, 1, start - 1);
    skip = previous[0] !== 10;
  }
  let dropping = false;
  let chunks: Buffer[] = [];
  let length = 0;
  while (offset < end) {
    const buffer = Buffer.alloc(Math.min(32 * 1024, end - offset));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
    if (!bytesRead) break;
    let begin = 0;
    for (let index = 0; index <= bytesRead; index++) {
      if (index < bytesRead && buffer[index] !== 10) continue;
      const part = buffer.subarray(begin, index);
      if (!skip && !dropping) {
        if (length + part.length > 32 * 1024) {
          chunks = [];
          dropping = true;
        } else {
          chunks.push(part);
          length += part.length;
        }
      }
      if (index < bytesRead) {
        if (!skip)
          yield {
            offset: lineStart,
            text: dropping
              ? null
              : Buffer.concat(chunks, length).toString('utf8'),
          };
        lineStart = offset + index + 1;
        skip = false;
        dropping = false;
        chunks = [];
        length = 0;
      }
      begin = index + 1;
    }
    offset += bytesRead;
  }
  if (!skip && (length || dropping))
    yield {
      offset: lineStart,
      text: dropping ? null : Buffer.concat(chunks, length).toString('utf8'),
    };
}
