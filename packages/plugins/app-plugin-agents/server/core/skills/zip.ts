/**
 * Reading and writing the zip archives skills are imported from and exported as: stored or deflated entries, no
 * encryption, no ZIP64 (a skill is at most 20 MB). The executable bit travels in an entry's Unix mode, as `zip` and
 * Info-ZIP write it.
 */
import { crc32, deflateRawSync, inflateRawSync } from 'node:zlib';

export interface ZipEntry {
  /** The path inside the archive, `/`-separated; directories end with `/`. */
  readonly name: string;
  readonly bytes: Uint8Array;
  readonly executable: boolean;
}

export class ZipError extends Error {}

const LOCAL = 0x04034b50;
const CENTRAL = 0x02014b50;
const END = 0x06054b50;

/** The entries of `archive`, directories left out; `maxBytes` bounds what it unpacks to. */
export function readZip(archive: Uint8Array, maxBytes: number): ZipEntry[] {
  const view = Buffer.from(archive.buffer, archive.byteOffset, archive.length);
  let end = -1;
  for (let at = view.length - 22; at >= Math.max(0, view.length - 65_557); at--)
    if (view.readUInt32LE(at) === END) {
      end = at;
      break;
    }
  if (end === -1) throw new ZipError('The file is not a zip archive.');
  const count = view.readUInt16LE(end + 10);
  let at = view.readUInt32LE(end + 16);
  const entries: ZipEntry[] = [];
  let total = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > view.length || view.readUInt32LE(at) !== CENTRAL)
      throw new ZipError('The zip archive is damaged.');
    const flags = view.readUInt16LE(at + 8);
    const method = view.readUInt16LE(at + 10);
    const compressed = view.readUInt32LE(at + 20);
    const size = view.readUInt32LE(at + 24);
    const nameLength = view.readUInt16LE(at + 28);
    const extraLength = view.readUInt16LE(at + 30);
    const commentLength = view.readUInt16LE(at + 32);
    const madeBy = view.readUInt16LE(at + 4) >> 8;
    const external = view.readUInt32LE(at + 38);
    const offset = view.readUInt32LE(at + 42);
    const name = view.toString('utf8', at + 46, at + 46 + nameLength);
    at += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith('/')) continue;
    if (flags & 0x1) throw new ZipError(`${name} is encrypted.`);
    if (compressed === 0xffffffff || size === 0xffffffff)
      throw new ZipError('ZIP64 archives are not supported.');
    total += size;
    if (total > maxBytes)
      throw new ZipError(`The archive unpacks to more than ${maxBytes} bytes.`);
    if (offset + 30 > view.length || view.readUInt32LE(offset) !== LOCAL)
      throw new ZipError('The zip archive is damaged.');
    const start =
      offset +
      30 +
      view.readUInt16LE(offset + 26) +
      view.readUInt16LE(offset + 28);
    const raw = view.subarray(start, start + compressed);
    let bytes: Uint8Array;
    if (method === 0) bytes = Uint8Array.from(raw);
    else if (method === 8)
      bytes = new Uint8Array(inflateRawSync(raw, { maxOutputLength: size }));
    else throw new ZipError(`${name} uses an unsupported compression.`);
    if (bytes.length !== size)
      throw new ZipError('The zip archive is damaged.');
    // Unix mode in the high half of the external attributes, when a Unix tool made it.
    const mode = madeBy === 3 ? external >>> 16 : 0;
    entries.push({ name, bytes, executable: (mode & 0o111) !== 0 });
  }
  return entries;
}

/** A zip of `entries`, deflated, with each one's Unix mode. */
export function writeZip(entries: readonly ZipEntry[]): Uint8Array {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  // 1980-01-01 00:00, the earliest DOS time: archives of the same files are the same bytes.
  const time = 0;
  const date = (0 << 9) | (1 << 5) | 1;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const deflated = deflateRawSync(entry.bytes);
    const stored = deflated.length >= entry.bytes.length;
    const data = stored ? Buffer.from(entry.bytes) : deflated;
    const crc = crc32(entry.bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(LOCAL, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(stored ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(entry.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(CENTRAL, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(stored ? 0 : 8, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(entry.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    const mode = 0o100000 | (entry.executable ? 0o755 : 0o644);
    central.writeUInt32LE((mode << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, data);
    centrals.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(END, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...locals, directory, end]));
}
