import type { ImapFlow } from 'imapflow';

type Execute = (
  command: string,
  attributes?: unknown,
  ...options: unknown[]
) => unknown;
type Observer = (
  command: string,
  fetchKind: string | undefined,
  durationMs: number,
) => void;
const observers = new WeakMap<
  ImapFlow,
  { listeners: Set<Observer>; execute: Execute }
>();
const commands = new Set([
  'LIST',
  'LSUB',
  'SELECT',
  'EXAMINE',
  'SEARCH',
  'STATUS',
  'FETCH',
  'NOOP',
  'STORE',
  'COPY',
  'MOVE',
  'EXPUNGE',
  'APPEND',
  'IDLE',
  'CLOSE',
  'UNSELECT',
]);

/** Observe protocol dispatch, including SDK retries, without retaining arguments or responses. */
export function observeImapCommands(
  client: ImapFlow,
  observer: Observer,
): (() => void) | undefined {
  const protocol = client as ImapFlow & { exec?: Execute };
  if (typeof protocol.exec !== 'function') return undefined;
  let observation = observers.get(client);
  if (!observation) {
    const execute = protocol.exec;
    const registered = new Set<Observer>();
    observation = { listeners: registered, execute };
    observers.set(client, observation);
    protocol.exec = function (command, attributes, ...options) {
      const active = [...registered];
      if (!active.length)
        return execute.call(this, command, attributes, ...options);
      const normalized = command.toUpperCase().replace(/^UID /, '');
      const name = commands.has(normalized) ? normalized : 'OTHER';
      const kind = name === 'FETCH' ? fetchKind(attributes) : undefined;
      const started = Date.now();
      const finish = () => {
        const elapsed = Math.max(0, Date.now() - started);
        for (const listener of active) listener(name, kind, elapsed);
      };
      try {
        return Promise.resolve(
          execute.call(this, command, attributes, ...options),
        ).finally(finish);
      } catch (error) {
        finish();
        throw error;
      }
    };
  }
  const current = observation;
  current.listeners.add(observer);
  return () => {
    current.listeners.delete(observer);
    if (!current.listeners.size && observers.get(client) === current) {
      protocol.exec = current.execute;
      observers.delete(client);
    }
  };
}

function fetchKind(attributes: unknown): string {
  const atoms = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object' || Buffer.isBuffer(value)) return;
    const item = value as Record<string, unknown>;
    if (item.type === 'ATOM' && typeof item.value === 'string')
      atoms.add(item.value.toUpperCase());
    if (Array.isArray(item.section)) visit(item.section);
  };
  visit(attributes);
  if (atoms.has('BODYSTRUCTURE')) return 'metadata';
  if (atoms.has('HEADER.FIELDS')) return 'lightweight';
  if (atoms.has('BODY.PEEK') || atoms.has('BINARY.PEEK')) return 'bodyOrSource';
  return 'flags';
}

interface Count {
  count: number;
  durationMs: number;
  maxDurationMs: number;
}

export class ImapCommandMetrics {
  private readonly byCommand: Record<string, Count> = {};
  private readonly byFetchKind: Record<string, Count> = {};
  public instrumented = false;
  public readonly record: Observer = (command, fetchKind, durationMs) => {
    this.add(this.byCommand, command, durationMs);
    if (fetchKind) this.add(this.byFetchKind, fetchKind, durationMs);
  };

  public snapshot(): {
    instrumented: boolean;
    total: number;
    byCommand: Record<string, Count>;
    byFetchKind: Record<string, Count>;
  } {
    const clone = (counts: Record<string, Count>) =>
      Object.fromEntries(
        Object.entries(counts).map(([name, value]) => [name, { ...value }]),
      );
    return {
      instrumented: this.instrumented,
      total: Object.values(this.byCommand).reduce(
        (total, value) => total + value.count,
        0,
      ),
      byCommand: clone(this.byCommand),
      byFetchKind: clone(this.byFetchKind),
    };
  }

  private add(
    counts: Record<string, Count>,
    name: string,
    durationMs: number,
  ): void {
    const entry = (counts[name] ??= {
      count: 0,
      durationMs: 0,
      maxDurationMs: 0,
    });
    entry.count += 1;
    entry.durationMs += durationMs;
    entry.maxDurationMs = Math.max(entry.maxDurationMs, durationMs);
  }
}
