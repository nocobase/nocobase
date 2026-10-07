export type StreamCoalescerOptions<Key, Value> = {
  interval: number;
  maxSize: number;
  getSize: (value: Value) => number;
  merge: (current: Value, incoming: Value) => Value;
  onFlush: (key: Key, value: Value) => void;
};

type PendingValue<Value> = {
  value: Value;
  timer: ReturnType<typeof setTimeout>;
};

export class StreamCoalescer<Key, Value> {
  private readonly pending = new Map<Key, PendingValue<Value>>();

  constructor(private readonly options: StreamCoalescerOptions<Key, Value>) {}

  push(key: Key, value: Value) {
    const existing = this.pending.get(key);
    if (existing) {
      existing.value = this.options.merge(existing.value, value);
      if (this.options.getSize(existing.value) >= this.options.maxSize) {
        this.flush(key);
      }
      return;
    }

    const timer = setTimeout(() => this.flush(key), this.options.interval);
    this.pending.set(key, { value, timer });
    if (this.options.getSize(value) >= this.options.maxSize) {
      this.flush(key);
    }
  }

  has(key: Key) {
    return this.pending.has(key);
  }

  flush(key: Key) {
    const pending = this.pending.get(key);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(key);
    this.options.onFlush(key, pending.value);
  }

  flushAll() {
    for (const key of [...this.pending.keys()]) {
      this.flush(key);
    }
  }

  clear() {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
    }
    this.pending.clear();
  }
}
