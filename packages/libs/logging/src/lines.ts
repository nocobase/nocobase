import { StringDecoder } from 'node:string_decoder';

/** Bounded byte framing. An oversized line is discarded in full, including its suffix. */
export class LogLineFramer {
  private chunks: Buffer[] = [];
  private size = 0;
  private dropping = false;
  private readonly line: (text: string) => void;
  private readonly oversized: () => void;
  private readonly maxBytes: number;
  constructor(
    line: (text: string) => void,
    oversized: () => void,
    maxBytes: number = 32 * 1024,
  ) {
    this.line = line;
    this.oversized = oversized;
    this.maxBytes = maxBytes;
  }
  write(data: Buffer | string): void {
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    let start = 0;
    for (let end = 0; end <= chunk.length; end++) {
      if (end < chunk.length && chunk[end] !== 10) continue;
      const part = chunk.subarray(start, end);
      if (!this.dropping && this.size + part.length > this.maxBytes) {
        this.chunks = [];
        this.size = 0;
        this.dropping = true;
        this.oversized();
      }
      if (!this.dropping && part.length) {
        this.chunks.push(part);
        this.size += part.length;
      }
      if (end < chunk.length) {
        this.flush();
        this.dropping = false;
      }
      start = end + 1;
    }
  }
  flush(): void {
    if (!this.dropping && this.size) {
      const decoder = new StringDecoder('utf8');
      this.line(
        decoder.write(Buffer.concat(this.chunks, this.size)) + decoder.end(),
      );
    }
    this.chunks = [];
    this.size = 0;
  }
}

/** Streams at most one bounded line at a time, preserving incomplete final records. */
export async function* boundedLogLines(
  input: AsyncIterable<Uint8Array>,
  maxBytes: number = 64 * 1024,
  includePartial: boolean = true,
): AsyncGenerator<string | null> {
  const ready: (string | null)[] = [];
  const framer = new LogLineFramer(
    (line) => ready.push(line),
    () => ready.push(null),
    maxBytes,
  );
  for await (const chunk of input) {
    for (let offset = 0; offset < chunk.length; offset += 32 * 1024) {
      framer.write(
        Buffer.from(
          chunk.buffer,
          chunk.byteOffset + offset,
          Math.min(32 * 1024, chunk.length - offset),
        ),
      );
      while (ready.length) yield ready.shift()!;
    }
  }
  if (includePartial) framer.flush();
  while (ready.length) yield ready.shift()!;
}

/** Raw crash output can split a private-key block across several records. Keep its body out of later records. */
export function createLogLineSanitizer(): (line: string) => string {
  let privateKey = false;
  return (line) => {
    const begins = /-----BEGIN [^-]*PRIVATE KEY-----/.test(line);
    const ends = /-----END [^-]*PRIVATE KEY-----/.test(line);
    const hidden = privateKey || begins;
    if (begins) privateKey = true;
    if (ends) privateKey = false;
    return hidden ? '[REDACTED]' : line;
  };
}
