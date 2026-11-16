import { mkdir, open, type FileHandle } from 'node:fs/promises';
import path from 'node:path';

interface Destination {
  handle: FileHandle;
  chunks: Buffer[];
  bytes: number;
}
/** Bound open descriptors and buffer bytes even when a runner interleaves hundreds of selected sources. */
export class DiagnosticsWriter {
  private readonly directory: string;
  private readonly files = new Map<string, Destination>();
  private buffered = 0;
  constructor(directory: string) {
    this.directory = directory;
  }
  private async flush(file: Destination): Promise<void> {
    if (!file.bytes) return;
    const data = Buffer.concat(file.chunks, file.bytes);
    this.buffered -= file.bytes;
    file.bytes = 0;
    file.chunks = [];
    await file.handle.writeFile(data);
  }
  async write(name: string, text: string): Promise<void> {
    let destination = this.files.get(name);
    if (!destination) {
      if (this.files.size >= 32) {
        const [oldName, old] = this.files.entries().next().value!;
        await this.flush(old);
        await old.handle.close();
        this.files.delete(oldName);
      }
      const file = path.join(this.directory, name);
      await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      destination = {
        handle: await open(file, 'a', 0o600),
        chunks: [],
        bytes: 0,
      };
      this.files.set(name, destination);
    }
    const data = Buffer.from(text);
    if (data.length >= 64 * 1024) {
      await this.flush(destination);
      await destination.handle.writeFile(data);
      return;
    }
    if (this.buffered + data.length > 128 * 1024)
      for (const file of this.files.values()) await this.flush(file);
    destination.chunks.push(data);
    destination.bytes += data.length;
    this.buffered += data.length;
    if (destination.bytes >= 64 * 1024) await this.flush(destination);
    if (this.buffered >= 128 * 1024)
      for (const file of this.files.values()) await this.flush(file);
  }
  async close(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.files.values()].map(async (file) => {
        try {
          await this.flush(file);
        } finally {
          await file.handle.close();
        }
      }),
    );
    this.files.clear();
    for (const result of results)
      if (result.status === 'rejected') throw result.reason;
  }
}
