import { ApiClientError } from './errors.js';
import { createRemoteRepository, type RemoteRepository } from './repository.js';
import type {
  ApiClientHeaders,
  ApiQuery,
  ApiRequestMethod,
  ApiRequestOptions,
  CreateApiClientOptions,
} from './types.js';

export interface ApiClient {
  request<TResponse = unknown, TJson = unknown>(
    options: ApiRequestOptions<TJson>,
  ): Promise<TResponse>;

  stream<TJson = unknown>(
    options: ApiRequestOptions<TJson>,
  ): Promise<ReadableStream<Uint8Array>>;

  repository<
    TRecord extends object = Record<string, unknown>,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    name: string,
  ): RemoteRepository<TRecord, TCreate, TUpdate>;
}

interface ExecutedRequest {
  readonly response: Response;
  readonly method: ApiRequestMethod;
  readonly url: string;
}

export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const fetchRequest = options.fetch ?? globalThis.fetch;
  const baseURL = options.baseURL.replace(/\/+$/u, '');

  const execute = async <TJson>(
    requestOptions: ApiRequestOptions<TJson>,
    accept: string,
  ): Promise<ExecutedRequest> => {
    const method = requestOptions.method ?? 'GET';
    const url = buildUrl(baseURL, requestOptions.path, requestOptions.query);
    const hasJson =
      'json' in requestOptions && requestOptions.json !== undefined;
    const headers = await createHeaders(
      options.headers,
      requestOptions.headers,
      accept,
      hasJson,
    );
    const response = await fetchRequest(url, {
      method,
      headers,
      credentials:
        requestOptions.credentials ?? options.credentials ?? 'include',
      body: hasJson ? JSON.stringify(requestOptions.json) : requestOptions.body,
      signal: requestOptions.signal,
    });
    return { response, method, url };
  };

  const request = async <TResponse = unknown, TJson = unknown>(
    requestOptions: ApiRequestOptions<TJson>,
  ): Promise<TResponse> => {
    const executed = await execute(requestOptions, 'application/json');
    const payload = await readPayload(executed.response);
    throwIfResponseFailed(executed, payload);
    return payload as TResponse;
  };

  const stream = async <TJson = unknown>(
    requestOptions: ApiRequestOptions<TJson>,
  ): Promise<ReadableStream<Uint8Array>> => {
    const executed = await execute(requestOptions, 'text/event-stream');
    if (!executed.response.ok) {
      const payload = await readPayload(executed.response);
      throwResponseError(executed, payload);
    }
    if (!executed.response.body) {
      throw new ApiClientError('API streaming response has no body.', {
        status: executed.response.status,
        method: executed.method,
        url: executed.url,
        requestId: executed.response.headers.get('x-request-id') ?? undefined,
      });
    }
    return executed.response.body;
  };

  return {
    request,
    stream,
    repository: <
      TRecord extends object = Record<string, unknown>,
      TCreate extends object = Partial<TRecord>,
      TUpdate extends object = Partial<TRecord>,
    >(
      name: string,
    ): RemoteRepository<TRecord, TCreate, TUpdate> =>
      createRemoteRepository<TRecord, TCreate, TUpdate>({
        name,
        request,
        stream,
      }),
  };
}

function buildUrl(baseURL: string, path: string, query?: ApiQuery): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const joined = baseURL ? `${baseURL}/${normalizedPath}` : normalizedPath;
  const fragmentIndex = joined.indexOf('#');
  const url = fragmentIndex === -1 ? joined : joined.slice(0, fragmentIndex);
  const fragment = fragmentIndex === -1 ? '' : joined.slice(fragmentIndex);
  const parameters = new URLSearchParams();
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      parameters.append(name, item === null ? '' : String(item));
    }
  }
  const search = parameters.toString();
  return search
    ? `${url}${url.includes('?') ? '&' : '?'}${search}${fragment}`
    : joined;
}

async function createHeaders(
  configured: ApiClientHeaders | undefined,
  requestHeaders: HeadersInit | undefined,
  accept: string,
  hasJson: boolean,
): Promise<Headers> {
  const resolved =
    typeof configured === 'function' ? await configured() : configured;
  const headers = new Headers(resolved);
  new Headers(requestHeaders).forEach((value, name): void => {
    headers.set(name, value);
  });
  if (!headers.has('Accept')) headers.set('Accept', accept);
  if (hasJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function throwIfResponseFailed(
  executed: ExecutedRequest,
  payload: unknown,
): void {
  if (!executed.response.ok) throwResponseError(executed, payload);
}

function throwResponseError(
  executed: ExecutedRequest,
  payload: unknown,
): never {
  throw new ApiClientError(
    readErrorMessage(payload, executed.response.status),
    {
      status: executed.response.status,
      payload,
      requestId:
        executed.response.headers.get('x-request-id') ??
        readErrorField(payload, 'requestId'),
      reason: readErrorField(payload, 'reason'),
      domain: readErrorField(payload, 'domain'),
      method: executed.method,
      url: executed.url,
    },
  );
}

function readErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'string' && payload) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as {
      readonly message?: unknown;
      readonly error?: { readonly message?: unknown };
    };
    if (typeof record.error?.message === 'string') {
      return record.error.message;
    }
    if (typeof record.message === 'string') return record.message;
  }
  return `API request failed (${status})`;
}

function readErrorField(
  payload: unknown,
  field: 'reason' | 'domain' | 'requestId',
): string | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) return undefined;
  const value = payload.error[field];
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
