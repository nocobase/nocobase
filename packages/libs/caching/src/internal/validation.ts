export function assertNamespace(namespace: string): void {
  if (typeof namespace !== 'string' || !namespace.trim()) {
    throw new Error('Cache namespace must not be empty.');
  }
}

export function assertMaxSize(maxSize: number): void {
  if (!Number.isSafeInteger(maxSize) || maxSize < 1) {
    throw new Error('Cache maxSize must be a positive integer.');
  }
}

export function assertTtl(ttl: number | undefined): void {
  if (
    ttl !== undefined &&
    (!Number.isFinite(ttl) || ttl <= 0 || !Number.isSafeInteger(Math.ceil(ttl)))
  ) {
    throw new Error('Cache TTL must be a positive number of milliseconds.');
  }
}
