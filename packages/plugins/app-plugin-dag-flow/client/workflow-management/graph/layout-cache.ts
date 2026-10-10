export interface LayoutCacheParts {
  workflowId: string;
  hash: string | null;
  direction: 'RIGHT' | 'DOWN';
  dimensions: string;
  schemaVersion?: number;
}
export function createLayoutCacheKey(parts: LayoutCacheParts): string {
  return [
    parts.workflowId,
    parts.hash ?? 'unpublished',
    parts.direction,
    parts.dimensions,
    parts.schemaVersion ?? 1,
  ].join(':');
}
export class WorkflowLayoutCache<T> {
  private readonly values = new Map<string, Promise<T>>();
  get(key: string, load: () => Promise<T>): Promise<T> {
    const existing = this.values.get(key);
    if (existing) return existing;
    const value = load();
    this.values.set(key, value);
    void value.catch(() => this.values.delete(key));
    return value;
  }
  clear(): void {
    this.values.clear();
  }
}
