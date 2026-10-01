// A Hub in the shape of its HTTP API, for the tests: each route answers from a handler, and every request is recorded.
import { vi } from 'vitest';

export interface RecordedRequest {
  readonly method: string;
  /** The path under `/api/hub/apps/<App ID>/`, empty for the App itself. */
  readonly route: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  /** The body as text: JSON for the JSON requests, a chunk of the archive for an upload. */
  readonly body: string;
  readonly bytes: Buffer;
}

export type Handler = (
  request: RecordedRequest,
) => Response | Promise<Response>;

export const HUB = 'https://hub.example/main';
export const APP_ID = 'crm';
export const REMOTE_URL = `${HUB}/apps/${APP_ID}`;

export const HOST_TARGET = {
  platform: 'linux',
  arch: 'x64',
  libc: 'glibc',
  nodeAbi: 137,
  nodeMajor: 24,
} as const;

export function data(value: object, status = 200): Response {
  return new Response(JSON.stringify({ data: value }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function failure(
  code: string,
  status: number,
  details: Record<string, unknown> = {},
): Response {
  return new Response(
    JSON.stringify({
      error: { ...details, code, message: 'secret-bearing text' },
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

/** What the fake Hub's upload session has received. */
export interface UploadState {
  size: number;
  received: Buffer;
  /** How many bytes the fake Hub takes per chunk: small, so a test archive spans several. */
  chunkSize: number;
}

/**
 * The routes a Hub answers by default: an App on linux-x64 Node 24, a resumable upload that keeps what it receives and
 * completes as a fresh Release, and a deployment that succeeds.
 */
export function defaultRoutes(state: UploadState): Record<string, Handler> {
  const session = (): object => ({
    uploadId: 'u1',
    offset: state.received.length,
    size: state.size,
    chunkSize: state.chunkSize,
    expiresAt: '2026-09-30T00:00:00.000Z',
  });
  return {
    'GET ': () => data({ id: APP_ID, buildTarget: HOST_TARGET }),
    'POST releases/uploads': (request) => {
      state.size = (JSON.parse(request.body) as { size: number }).size;
      return data({ upload: session() }, 201);
    },
    'PUT releases/uploads/u1': (request) => {
      // Like the Hub, the mismatch reports the offset to go on from.
      if (Number(request.headers['upload-offset']) !== state.received.length)
        return failure('UPLOAD_OFFSET_MISMATCH', 409, {
          offset: state.received.length,
        });
      state.received = Buffer.concat([state.received, request.bytes]);
      return data(session());
    },
    'GET releases/uploads/u1': () => data(session()),
    'POST releases/uploads/u1/complete': () =>
      data({ releaseId: 'r1', version: '1.0.0', reused: false }),
    'POST deploy': () =>
      data({ operationId: 'op-1', status: 'queued', reused: false }),
    'GET deployments/op-1/status': () => data({ status: 'succeeded' }),
    // The App's latest deployment is the one `POST deploy` answers with.
    'GET deployments?page=1&pageSize=1': () =>
      data({
        items: [{ ...DEPLOYMENT, id: 'op-1', releaseId: 'r1' }],
        total: 1,
      }),
  };
}

export function fakeHub(overrides: Record<string, Handler | undefined> = {}): {
  requests: RecordedRequest[];
  fetch: ReturnType<typeof vi.fn>;
  /** The bytes the upload session received, as text. */
  uploaded: () => string;
  state: UploadState;
} {
  const state: UploadState = {
    size: 0,
    received: Buffer.alloc(0),
    chunkSize: 4,
  };
  const routes = { ...defaultRoutes(state), ...overrides };
  const requests: RecordedRequest[] = [];
  const base = `${HUB}/api/hub/apps/${APP_ID}`;
  const fetch = vi.fn(async (input: URL | string, init: RequestInit = {}) => {
    const url = String(input);
    // The App itself is the base without a trailing slash, which the Hub's strict routing would not match.
    if (url !== base && !url.startsWith(`${base}/`))
      throw new Error(`Unexpected URL ${url}`);
    const route = url === base ? '' : url.slice(base.length + 1);
    let bytes = Buffer.alloc(0);
    if (typeof init.body === 'string') bytes = Buffer.from(init.body);
    else if (init.body instanceof Uint8Array) bytes = Buffer.from(init.body);
    const request: RecordedRequest = {
      method: init.method ?? 'GET',
      route,
      url,
      headers: { ...(init.headers as Record<string, string>) },
      body: bytes.toString(),
      bytes,
    };
    requests.push(request);
    const handler = routes[`${request.method} ${route}`];
    if (handler === undefined) return failure('NOT_FOUND', 404);
    return await handler(request);
  });
  vi.stubGlobal('fetch', fetch);
  return {
    requests,
    fetch,
    uploaded: () => state.received.toString(),
    state,
  };
}

export const RELEASES = [
  {
    id: 'r2',
    version: '2.0.0',
    checksum: 'b'.repeat(64),
    size: 20,
    createdAt: '2026-09-29T10:00:00.000Z',
    hasConfigTemplate: false,
    buildTarget: HOST_TARGET,
    running: true,
    everDeployed: true,
  },
  {
    id: 'r1',
    version: '1.0.0',
    checksum: 'a'.repeat(64),
    size: 10,
    createdAt: '2026-09-28T10:00:00.000Z',
    hasConfigTemplate: false,
    buildTarget: null,
    running: false,
    everDeployed: true,
  },
];

export const DEPLOYMENT = {
  id: 'op-2',
  releaseId: 'r2',
  kind: 'deploy',
  status: 'succeeded',
  phase: 'completed',
  cacheHit: false,
  error: null,
  createdAt: '2026-09-29T10:01:00.000Z',
  finishedAt: '2026-09-29T10:02:00.000Z',
  config: { mode: 'reuse' },
  release: { version: '2.0.0', checksum: 'b'.repeat(64) },
};
