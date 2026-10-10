/**
 * An in-memory `codex app-server` for adapter tests: scripted by the test,
 * or replaying a recorded session (see codex.smoke.test.ts).
 */
import type { RpcMessage } from '../../src/agent/adapters/codex/protocol.ts';
import type {
  CodexExit,
  CodexProcess,
  SpawnCodex,
  SpawnOptions,
} from '../../src/agent/adapters/codex/rpc.ts';

export interface TrafficLine {
  from: 'client' | 'server';
  message: RpcMessage;
}

export class FakeCodex implements CodexProcess {
  readonly options: SpawnOptions;
  /** Every message the adapter sent, in order. */
  readonly received: RpcMessage[] = [];
  readonly signals: string[] = [];
  ended = false;
  /** Exit when stdin closes (the real app-server does). */
  exitOnEnd = true;
  /** Exit on SIGTERM; false simulates a process that ignores it. */
  exitOnTerm = true;
  private unread: RpcMessage[] = [];
  private waiters: {
    match: (m: RpcMessage) => boolean;
    resolve: (m: RpcMessage) => void;
  }[] = [];
  private lineListeners: ((line: string) => void)[] = [];
  private stderrListeners: ((line: string) => void)[] = [];
  private exitListeners: ((exit: CodexExit) => void)[] = [];
  private exitInfo?: CodexExit;

  constructor(options: SpawnOptions) {
    this.options = options;
  }

  // -- CodexProcess ---------------------------------------------------------

  send(line: string): void {
    const message = JSON.parse(line) as RpcMessage;
    this.received.push(message);
    const index = this.waiters.findIndex((w) => w.match(message));
    if (index >= 0) {
      const [waiter] = this.waiters.splice(index, 1);
      waiter!.resolve(message);
    } else this.unread.push(message);
  }

  onLine(listener: (line: string) => void): void {
    this.lineListeners.push(listener);
  }

  onStderr(listener: (line: string) => void): void {
    this.stderrListeners.push(listener);
  }

  onExit(listener: (exit: CodexExit) => void): void {
    if (this.exitInfo) listener(this.exitInfo);
    else this.exitListeners.push(listener);
  }

  end(): void {
    this.ended = true;
    if (this.exitOnEnd) this.exit(0);
  }

  kill(signal: 'SIGTERM' | 'SIGKILL'): void {
    this.signals.push(signal);
    if (signal === 'SIGKILL' || this.exitOnTerm) this.exit(null, signal);
  }

  // -- test side ------------------------------------------------------------

  get exited(): boolean {
    return this.exitInfo !== undefined;
  }

  /** Waits for the next unread client message that matches. */
  next(match: (m: RpcMessage) => boolean): Promise<RpcMessage> {
    const index = this.unread.findIndex(match);
    if (index >= 0) return Promise.resolve(this.unread.splice(index, 1)[0]!);
    return new Promise((resolve) => this.waiters.push({ match, resolve }));
  }

  nextRequest(method: string): Promise<RpcMessage> {
    return this.next((m) => m.method === method && m.id !== undefined);
  }

  /** The client's answer to a server request. */
  nextAnswer(id: string | number): Promise<RpcMessage> {
    return this.next((m) => m.method === undefined && m.id === id);
  }

  emit(message: RpcMessage): void {
    const line = JSON.stringify(message);
    for (const listener of this.lineListeners) listener(line);
  }

  respond(request: RpcMessage, result: unknown): void {
    this.emit({ id: request.id, result });
  }

  notify(method: string, params: unknown): void {
    this.emit({ method, params });
  }

  stderr(line: string): void {
    for (const listener of this.stderrListeners) listener(line);
  }

  exit(code: number | null, signal: string | null = null): void {
    if (this.exitInfo) return;
    this.exitInfo = { code, signal };
    for (const listener of this.exitListeners.splice(0))
      listener(this.exitInfo);
  }

  failToStart(error: Error): void {
    if (this.exitInfo) return;
    this.exitInfo = { code: null, signal: null, error };
    for (const listener of this.exitListeners.splice(0))
      listener(this.exitInfo);
  }
}

/** A spawn function whose processes the test drives. */
export function fakeSpawn(
  script: (fake: FakeCodex) => void | Promise<void>,
): SpawnCodex & { processes: FakeCodex[] } {
  const processes: FakeCodex[] = [];
  const spawn = (options: SpawnOptions) => {
    const fake = new FakeCodex(options);
    processes.push(fake);
    // Let the adapter attach its listeners first.
    queueMicrotask(() => void script(fake));
    return fake;
  };
  return Object.assign(spawn, { processes });
}

function rewrite(value: unknown, strings: Map<string, string>): unknown {
  if (typeof value === 'string') return strings.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => rewrite(v, strings));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, rewrite(v, strings)]),
    );
  return value;
}

/**
 * Replays a recorded session: server lines are sent once the client lines
 * recorded before them have arrived (matched by method; ids and client
 * message ids are mapped onto the live ones). Returns the client's answers
 * to server requests, by recorded request id.
 */
export async function replay(
  fake: FakeCodex,
  traffic: readonly TrafficLine[],
): Promise<Map<string | number, RpcMessage>> {
  const ids = new Map<string | number, string | number>();
  const strings = new Map<string, string>();
  const answers = new Map<string | number, RpcMessage>();
  for (const { from, message } of traffic) {
    if (from === 'client') {
      if (message.method !== undefined && message.id !== undefined) {
        const live = await fake.nextRequest(message.method);
        ids.set(message.id, live.id!);
        const recorded = (message.params ?? {}) as Record<string, unknown>;
        const actual = (live.params ?? {}) as Record<string, unknown>;
        if (
          typeof recorded.clientUserMessageId === 'string' &&
          typeof actual.clientUserMessageId === 'string'
        )
          strings.set(recorded.clientUserMessageId, actual.clientUserMessageId);
      } else if (message.method !== undefined) {
        await fake.next((m) => m.method === message.method);
      } else if (message.id !== undefined) {
        answers.set(message.id, await fake.nextAnswer(message.id));
      }
      continue;
    }
    const out = rewrite(message, strings) as RpcMessage;
    if (out.method === undefined && out.id !== undefined)
      out.id = ids.get(out.id) ?? out.id;
    fake.emit(out);
  }
  return answers;
}
