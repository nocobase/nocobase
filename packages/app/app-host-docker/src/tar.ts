/**
 * The tar handling the backend needs, without extracting anything to disk: single-file archives for the Engine API's
 * archive endpoint (an App's configuration file), and reading a file out of an archive.
 */

const BLOCK = 512;

export interface TarFileOptions {
  readonly mode?: number;
  readonly uid?: number;
  readonly gid?: number;
  readonly mtime?: Date;
}

/** One ustar header and its data, padded to whole blocks. Names must fit the 100-byte name field. */
export function tarFile(
  name: string,
  content: string | Buffer,
  options: TarFileOptions = {},
): Buffer {
  const data = typeof content === 'string' ? Buffer.from(content) : content;
  return Buffer.concat([
    tarHeader(name, data.length, options),
    data,
    Buffer.alloc(padding(data.length)),
  ]);
}

/** A complete archive of the given files. */
export function tarArchive(
  files: readonly {
    readonly name: string;
    readonly content: string | Buffer;
    readonly options?: TarFileOptions;
  }[],
): Buffer {
  return Buffer.concat([
    ...files.map((file) => tarFile(file.name, file.content, file.options)),
    Buffer.alloc(BLOCK * 2),
  ]);
}

function tarHeader(
  name: string,
  size: number,
  options: TarFileOptions,
): Buffer {
  const nameBytes = Buffer.from(name);
  if (nameBytes.length > 100 || !name || name.startsWith('/'))
    throw new Error(`Invalid tar entry name "${name}".`);
  const header = Buffer.alloc(BLOCK);
  nameBytes.copy(header, 0);
  writeOctal(header, 100, 8, options.mode ?? 0o644);
  writeOctal(header, 108, 8, options.uid ?? 0);
  writeOctal(header, 116, 8, options.gid ?? 0);
  writeOctal(header, 124, 12, size);
  writeOctal(
    header,
    136,
    12,
    Math.floor((options.mtime ?? new Date()).getTime() / 1000),
  );
  header.write('        ', 148, 'ascii');
  header.write('0', 156, 'ascii');
  header.write('ustar\u000000', 257, 'ascii');
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(`${sum.toString(8).padStart(6, '0')}\u0000 `, 148, 'ascii');
  return header;
}

function writeOctal(
  header: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  header.write(
    `${value.toString(8).padStart(length - 1, '0')}\u0000`,
    offset,
    length,
    'ascii',
  );
}

function padding(size: number): number {
  return (BLOCK - (size % BLOCK)) % BLOCK;
}

/** Reads an entry's size field: octal text, or GNU base-256 when the high bit is set. */
export function entrySize(header: Buffer): number {
  const field = header.subarray(124, 136);
  if (field[0] & 0x80) {
    let value = 0;
    for (let index = 1; index < field.length; index += 1)
      value = value * 256 + field[index];
    return value;
  }
  const text = field
    .toString('ascii')
    .replace(/[\0 ]+$/g, '')
    .trim();
  return text ? Number.parseInt(text, 8) : 0;
}

function isZeroBlock(block: Buffer): boolean {
  for (const byte of block) if (byte !== 0) return false;
  return true;
}

/**
 * Passes an uncompressed tar stream through block by block and stops at its end-of-archive marker, so more entries
 * can follow. Every header (pax and GNU long-name headers included) states the size of the data after it, which is all
 * the walk needs.
 */
export async function* tarEntries(
  source: AsyncIterable<Buffer>,
): AsyncGenerator<Buffer> {
  let buffered: Buffer = Buffer.alloc(0);
  let remainingData = 0;
  for await (const chunk of source) {
    buffered = buffered.length ? Buffer.concat([buffered, chunk]) : chunk;
    let offset = 0;
    while (true) {
      if (remainingData > 0) {
        const take = Math.min(remainingData, buffered.length - offset);
        if (take <= 0) break;
        yield buffered.subarray(offset, offset + take);
        offset += take;
        remainingData -= take;
        continue;
      }
      if (buffered.length - offset < BLOCK) break;
      const header = buffered.subarray(offset, offset + BLOCK);
      if (isZeroBlock(header)) return;
      const size = entrySize(header);
      yield header;
      offset += BLOCK;
      remainingData = size + padding(size);
    }
    buffered = buffered.subarray(offset);
  }
  if (remainingData > 0 || buffered.length > 0)
    throw new Error('The release archive ends in the middle of an entry.');
}

export async function readTarFile(
  source: AsyncIterable<Buffer>,
  name: string,
  maxBytes: number = 1024 * 1024,
): Promise<Buffer | null> {
  let buffered: Buffer = Buffer.alloc(0);
  for await (const chunk of source) {
    buffered = Buffer.concat([buffered, chunk]);
    if (buffered.length > maxBytes + 64 * BLOCK) break;
  }
  let offset = 0;
  while (offset + BLOCK <= buffered.length) {
    const header = buffered.subarray(offset, offset + BLOCK);
    if (isZeroBlock(header)) break;
    const size = entrySize(header);
    const entryName = header
      .subarray(0, 100)
      .toString('utf8')
      .replace(/\0.*$/s, '');
    const type = String.fromCharCode(header[156] || 48);
    offset += BLOCK;
    if (
      (type === '0' || type === '\0') &&
      entryName.replace(/^\.\//, '').endsWith(name)
    )
      return buffered.subarray(offset, offset + size);
    offset += size + padding(size);
  }
  return null;
}
