/**
 * A scripted stand-in for `opencode serve` (the 2.x `/api/...` surface).
 *
 * It serves real HTTP on 127.0.0.1 with basic auth, records every request,
 * and replays a script of bus events over `GET /api/event` once the first
 * prompt arrives:
 * - a `session.inbox.enqueued` event waits for the prompt it acknowledges
 *   (the n-th enqueue waits for the n-th prompt), and that prompt's response
 *   carries the event's inbox id;
 * - a `permission.asked` event waits for the adapter's reply;
 * - `{ pause: true }` holds the script until the server is closed;
 * - `{ crash: true }` ends the event stream and "exits" the server.
 */
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

import type {
  LaunchFn,
  ServerHandle,
} from '../../src/agent/adapters/opencode/server.ts';

export interface BusEvent {
  type: string;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export type ScriptItem = BusEvent | { pause: true } | { crash: true };

export interface RecordedRequest {
  method: string;
  path: string;
  body: unknown;
}

export interface FakeOptions {
  script: ScriptItem[];
  sessionId?: string;
  /** Status for PUT instructions (default 204). */
  instructionStatus?: number;
  models?: unknown[];
  /** Sessions GET /api/session/:id knows (resume). */
  knownSessions?: string[];
}

const PASSWORD = 'test-password';

export function ev(type: string, data: Record<string, unknown>): BusEvent {
  return { type, data };
}

export class FakeOpencode {
  readonly requests: RecordedRequest[] = [];
  readonly launches: Parameters<LaunchFn>[0][] = [];
  closed = false;
  private readonly options: FakeOptions;
  private server?: Server;
  private baseUrl = '';
  private readonly streams = new Set<ServerResponse>();
  private prompts = 0;
  private readonly inboxIds: string[];
  private readonly replies = new Map<string, () => void>();
  private readonly replied = new Set<string>();
  private promptWaiters: (() => void)[] = [];
  private started = false;
  private exitResolve?: (v: {
    code: number | null;
    signal: string | null;
  }) => void;
  private closeResolve?: () => void;
  private readonly closedPromise = new Promise<void>(
    (resolve) => (this.closeResolve = resolve),
  );

  constructor(options: FakeOptions) {
    this.options = options;
    this.inboxIds = options.script
      .filter(
        (item): item is BusEvent =>
          'type' in item && item.type === 'session.inbox.enqueued',
      )
      .map((item) => String(item.data.inboxID));
  }

  get sessionId(): string {
    return this.options.sessionId ?? 'ses_test';
  }

  requestsTo(method: string, pattern: RegExp): RecordedRequest[] {
    return this.requests.filter(
      (r) => r.method === method && pattern.test(r.path),
    );
  }

  readonly launch: LaunchFn = async (options) => {
    this.launches.push(options);
    await this.listen();
    const exited = new Promise<{ code: number | null; signal: string | null }>(
      (resolve) => (this.exitResolve = resolve),
    );
    const handle: ServerHandle = {
      baseUrl: this.baseUrl,
      username: 'opencode',
      password: PASSWORD,
      exited,
      stderr: () => ['fake stderr line'],
      close: async () => {
        await this.shutdown();
        this.exitResolve?.({ code: 0, signal: 'SIGTERM' });
      },
    };
    return handle;
  };

  private listen(): Promise<void> {
    this.server = createServer((req, res) => void this.handle(req, res));
    return new Promise((resolve) => {
      this.server!.listen(0, '127.0.0.1', () => {
        const address = this.server!.address();
        if (address && typeof address === 'object')
          this.baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  }

  async shutdown(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.closeResolve?.();
    for (const res of this.streams) res.end();
    this.streams.clear();
    await new Promise<void>((resolve) => {
      if (!this.server) return resolve();
      this.server.closeAllConnections();
      this.server.close(() => resolve());
    });
  }

  private send(event: BusEvent): void {
    const line = `data: ${JSON.stringify({ id: 'evt_x', ...event })}\n\n`;
    for (const res of this.streams) res.write(line);
  }

  private async play(): Promise<void> {
    let enqueued = 0;
    for (const item of this.options.script) {
      if (this.closed) return;
      await new Promise((resolve) => setImmediate(resolve));
      if ('pause' in item) {
        await this.closedPromise;
        return;
      }
      if ('crash' in item) {
        for (const res of this.streams) res.end();
        this.streams.clear();
        this.exitResolve?.({ code: 1, signal: null });
        return;
      }
      if (item.type === 'session.inbox.enqueued') {
        enqueued += 1;
        while (this.prompts < enqueued && !this.closed)
          await new Promise<void>((resolve) =>
            this.promptWaiters.push(resolve),
          );
      }
      this.send(item);
      if (item.type === 'permission.asked') {
        const id = String(item.data.id);
        if (!this.replied.has(id))
          await Promise.race([
            new Promise<void>((resolve) => this.replies.set(id, resolve)),
            this.closedPromise,
          ]);
      }
    }
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const expected = `Basic ${Buffer.from(`opencode:${PASSWORD}`).toString('base64')}`;
    if (req.headers.authorization !== expected) {
      res.writeHead(401).end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const text = Buffer.concat(chunks).toString('utf8');
    const body = text ? (JSON.parse(text) as unknown) : undefined;
    const url = new URL(req.url ?? '/', 'http://x');
    const method = req.method ?? 'GET';
    const p = url.pathname;
    this.requests.push({ method, path: p, body });
    const json = (status: number, payload?: unknown) => {
      if (payload === undefined) res.writeHead(status).end();
      else
        res
          .writeHead(status, { 'content-type': 'application/json' })
          .end(JSON.stringify(payload));
    };

    if (method === 'GET' && p === '/api/event') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(': heartbeat\n\n');
      res.write(
        `data: ${JSON.stringify({ id: 'evt_0', type: 'server.connected', data: {} })}\n\n`,
      );
      this.streams.add(res);
      return;
    }
    if (method === 'POST' && p === '/api/session')
      return json(200, { data: { id: this.sessionId } });
    if (method === 'GET' && p === '/api/model')
      return json(200, { data: this.options.models ?? [] });
    let m = /^\/api\/session\/([^/]+)$/.exec(p);
    if (m) {
      if (method === 'GET') {
        const known = this.options.knownSessions ?? [this.sessionId];
        return known.includes(m[1])
          ? json(200, { data: { id: m[1] } })
          : json(404, { _tag: 'SessionNotFoundError', message: 'not found' });
      }
      return json(200, { data: { id: m[1] } });
    }
    if (/^\/api\/experimental\/session\/[^/]+\/instructions\/entries\//.test(p))
      return json(this.options.instructionStatus ?? 204);
    if (/^\/api\/session\/[^/]+\/model$/.test(p)) return json(204);
    if (/^\/api\/session\/[^/]+\/prompt$/.test(p)) {
      const id = this.inboxIds[this.prompts] ?? `msg_extra_${this.prompts}`;
      this.prompts += 1;
      for (const waiter of this.promptWaiters.splice(0)) waiter();
      if (!this.started) {
        this.started = true;
        void this.play();
      }
      return json(200, { data: { id, type: 'user' } });
    }
    m = /^\/api\/session\/[^/]+\/permission\/([^/]+)\/reply$/.exec(p);
    if (m) {
      this.replied.add(m[1]);
      this.replies.get(m[1])?.();
      return json(204);
    }
    if (/^\/api\/session\/[^/]+\/interrupt$/.test(p))
      return json(200, { interrupted: true });
    if (method === 'DELETE' && /\/form\//.test(p)) return json(204);
    json(404, { _tag: 'NotFound', message: p });
  }
}
