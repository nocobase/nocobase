interface CacheEntry {
  readonly text: string;
  readonly bytes: number;
  readonly expiresAt: number;
}

/** Completed local results only; neither permissions nor in-flight executions are shared. */
export class ExtractedDocumentCache {
  private readonly entries = new Map<string, CacheEntry>();
  private bytes = 0;
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly maxBytes: number;
  private readonly now: () => number;

  constructor(
    options: {
      ttlMs?: number;
      maxEntries?: number;
      maxBytes?: number;
      now?: () => number;
    } = {},
  ) {
    this.ttlMs = options.ttlMs ?? 30 * 60_000;
    this.maxEntries = options.maxEntries ?? 128;
    this.maxBytes = options.maxBytes ?? 32 * 1024 * 1024;
    this.now = options.now ?? Date.now;
    for (const value of [this.ttlMs, this.maxEntries, this.maxBytes])
      if (!Number.isSafeInteger(value) || value < 0)
        throw new RangeError(
          'Cache limits must be non-negative safe integers.',
        );
  }

  get(key: string): string | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.remove(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.text;
  }

  set(key: string, text: string): void {
    this.remove(key);
    const bytes = Buffer.byteLength(text);
    if (!this.ttlMs || !this.maxEntries || bytes > this.maxBytes) return;
    const now = this.now();
    for (const [id, entry] of this.entries)
      if (entry.expiresAt <= now) this.remove(id);
    while (
      this.entries.size >= this.maxEntries ||
      this.bytes + bytes > this.maxBytes
    )
      this.remove(this.entries.keys().next().value!);
    this.entries.set(key, { text, bytes, expiresAt: now + this.ttlMs });
    this.bytes += bytes;
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) this.bytes -= entry.bytes;
    this.entries.delete(key);
  }
}
