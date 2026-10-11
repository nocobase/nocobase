/**
 * How `github.ts` calls GitHub's API: `@octokit/core`, one client per API base URL (GitHub Enterprise Server's
 * `/api/v3` included, and its GraphQL endpoint beside it), with every request passed through one hook that:
 *
 * - sends GitHub's media type and API version, and gives up on a request after 15 seconds;
 * - serves GitHub's OAuth pages too (`/login/...` on the web origin, `@octokit/oauth-methods`);
 * - answers 304 (a conditional read whose validator still matches) as an answer rather than an error;
 * - turns a failure into `GitApiError`: status 0 when GitHub could not be reached, and `retryAt` when the failure is
 *   GitHub's rate limit (`rateLimitOf`), whose message never carries the token;
 * - tries a read (GET) once more after a short wait (`retryDelayOf`); a write is never repeated.
 *
 * The credential travels per request (`Caller.authorization`), so one client serves every connection on a host. Tests
 * pass a `fetch` that answers as GitHub would (`tests/git/fake-github.ts`).
 */
import { Octokit } from '@octokit/core';
import { GraphqlResponseError } from '@octokit/graphql';
import { RequestError } from '@octokit/request-error';

import { GitApiError, type Conditional } from './platform.js';

export const GITHUB_API_VERSION = '2022-11-28';
const TIMEOUT_MS = 15_000;
/** How long a read waits, at most, before it is tried again once: longer waits are the caller's to schedule. */
export const RETRY_WAIT_MAX_MS = 3_000;
/** How long to wait after an answer that names no time: a secondary rate limit asks for at least a minute. */
const RATE_LIMIT_DEFAULT_MS = 60_000;
const UNAVAILABLE_RETRY_MS = 1_000;

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Who calls: the API, and the Authorization header (null for an anonymous read of a public repository). */
export interface Caller {
  readonly apiBaseUrl: string;
  readonly authorization: string | null;
}

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH';

/** A REST answer: conditional, with the `Link` header (paging) and a personal token's expiry header. */
export type GitHubAnswer<T> = Conditional<T> & {
  readonly link?: string | null;
  readonly expiration?: string | null;
};

/**
 * When GitHub's rate limit lifts, as an RFC 3339 time, or null when the answer is not a rate limit. GitHub answers 403
 * or 429: with `retry-after` (seconds) for a secondary limit, with `x-ratelimit-remaining: 0` and `x-ratelimit-reset`
 * (epoch seconds) for the primary one, and otherwise only says so in its message.
 */
export function rateLimitOf(
  status: number,
  headers: (name: string) => string | null | undefined,
  message: string,
  now: number,
): string | null {
  if (status !== 403 && status !== 429) return null;
  const after = headers('retry-after');
  if (after && Number.isFinite(Number(after)) && Number(after) >= 0)
    return new Date(now + Number(after) * 1000).toISOString();
  if (headers('x-ratelimit-remaining') === '0') {
    const reset = Number(headers('x-ratelimit-reset'));
    return new Date(
      Number.isFinite(reset) && reset > 0
        ? Math.max(now, reset * 1000)
        : now + RATE_LIMIT_DEFAULT_MS,
    ).toISOString();
  }
  if (status === 429 || /rate limit|abuse detection/iu.test(message))
    return new Date(now + RATE_LIMIT_DEFAULT_MS).toISOString();
  return null;
}

/** The error for a failed answer: a rate limit with when it lifts, or the status alone. */
export function apiErrorOf(
  status: number,
  headers: (name: string) => string | null | undefined,
  message: string,
  now: number,
): GitApiError {
  const retryAt = rateLimitOf(status, headers, message, now);
  return retryAt
    ? new GitApiError(
        status,
        `GitHub's rate limit was reached; retry after ${retryAt}.`,
        { retryAt },
      )
    : new GitApiError(status, `GitHub answered ${status}.`);
}

/**
 * How long to wait before trying a request once more, or null when it is not tried again: only a read (GET), only
 * once, and only when GitHub could not be reached, was briefly unavailable (502, 503, 504), or limited it for at most
 * `RETRY_WAIT_MAX_MS`. A write is never repeated: the first may have taken effect.
 */
export function retryDelayOf(
  method: string,
  attempt: number,
  error: unknown,
  now: number,
): number | null {
  if (method.toUpperCase() !== 'GET' || attempt > 0) return null;
  if (!(error instanceof GitApiError)) return null;
  if (error.retryAt) {
    const wait = Math.max(0, new Date(error.retryAt).getTime() - now);
    return wait <= RETRY_WAIT_MAX_MS ? wait : null;
  }
  return [0, 502, 503, 504].includes(error.status)
    ? UNAVAILABLE_RETRY_MS
    : null;
}

/** The media type Octokit sends unless a request names one. */
const OCTOKIT_ACCEPT = 'application/vnd.github.v3+json';

/** A 304 the hook answers instead of Octokit's error. */
const NOT_MODIFIED = 304;

export interface GitHubClient {
  /** A REST request to `path` (with its query) on the caller's API. */
  request<T>(
    caller: Caller,
    path: string,
    init?: {
      readonly method?: Method;
      readonly body?: unknown;
      readonly etag?: string | null;
    },
  ): Promise<GitHubAnswer<T>>;
  /** Where a request is redirected (`Location` of a 3xx), without following it; null when it is not. */
  redirectOf(caller: Caller, path: string): Promise<string | null>;
  /** The client's own request function for an API, for `@octokit/auth-app` to mint tokens through the same hook. */
  requestOf(apiBaseUrl: string): Octokit['request'];
  /** A GraphQL query or mutation; GitHub refusing it in the answer's `errors` is a 422 (a rate limit, a 429). */
  graphql<T>(
    caller: Caller,
    query: string,
    variables: Readonly<Record<string, unknown>>,
  ): Promise<T>;
}

export function createGitHubClient(options: {
  readonly fetch?: FetchLike;
  readonly now: () => number;
  readonly sleep: (ms: number) => Promise<void>;
}): GitHubClient {
  const { now, sleep } = options;
  const clients = new Map<string, Octokit>();

  /** What a failure stands for: 304, a `GitApiError`, or null for an error that is not GitHub's (a defect). */
  function failureOf(error: unknown): GitApiError | typeof NOT_MODIFIED | null {
    if (error instanceof GitApiError) return error;
    if (error instanceof RequestError) {
      if (error.status === NOT_MODIFIED) return NOT_MODIFIED;
      if (!error.response)
        return new GitApiError(0, 'GitHub could not be reached.');
      const headers = error.response.headers as Record<
        string,
        string | number | undefined
      >;
      return apiErrorOf(
        error.status,
        (name) => {
          const value = headers[name];
          return value === undefined ? null : String(value);
        },
        error.message,
        now(),
      );
    }
    // The timeout aborts the request.
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    )
      return new GitApiError(0, 'GitHub could not be reached.');
    return null;
  }

  function clientOf(apiBaseUrl: string): Octokit {
    const baseUrl = apiBaseUrl.replace(/\/+$/u, '');
    const found = clients.get(baseUrl);
    if (found) return found;
    const client = new Octokit({
      baseUrl,
      userAgent: 'nocobase-studio',
      request: options.fetch ? { fetch: options.fetch } : {},
    });
    client.hook.wrap('request', async (send, endpoint) => {
      for (let attempt = 0; ; attempt += 1)
        try {
          return await send({
            ...endpoint,
            headers: {
              ...endpoint.headers,
              // GitHub's media type in place of Octokit's default; a request that asks for another (the OAuth pages'
              // JSON) keeps it.
              accept:
                endpoint.headers.accept === OCTOKIT_ACCEPT
                  ? 'application/vnd.github+json'
                  : endpoint.headers.accept,
              'x-github-api-version': GITHUB_API_VERSION,
            },
            request: {
              ...endpoint.request,
              signal: AbortSignal.timeout(TIMEOUT_MS),
            },
          });
        } catch (error) {
          const failure = failureOf(error);
          if (failure === null) throw error;
          if (failure === NOT_MODIFIED)
            return {
              status: NOT_MODIFIED,
              url: endpoint.url,
              headers: {},
              data: undefined,
            };
          const wait = retryDelayOf(endpoint.method, attempt, failure, now());
          if (wait === null) throw failure;
          await sleep(wait);
        }
    });
    clients.set(baseUrl, client);
    return client;
  }

  const authorizationOf = (caller: Caller) =>
    caller.authorization ? { authorization: caller.authorization } : {};

  return {
    requestOf: (apiBaseUrl) => clientOf(apiBaseUrl).request,

    async redirectOf(caller, path) {
      const response = await clientOf(caller.apiBaseUrl).request(
        `GET ${path}`,
        { headers: authorizationOf(caller), request: { redirect: 'manual' } },
      );
      const headers = response.headers as Record<string, string | undefined>;
      return response.status >= 300 && response.status < 400
        ? (headers.location ?? null)
        : null;
    },

    async request<T>(
      caller: Caller,
      path: string,
      init: {
        readonly method?: Method;
        readonly body?: unknown;
        readonly etag?: string | null;
      } = {},
    ): Promise<GitHubAnswer<T>> {
      const response = await clientOf(caller.apiBaseUrl).request(
        `${init.method ?? 'GET'} ${path}`,
        {
          headers: {
            ...authorizationOf(caller),
            ...(init.etag ? { 'if-none-match': init.etag } : {}),
          },
          ...(init.body !== undefined ? { data: init.body } : {}),
        },
      );
      if (response.status === NOT_MODIFIED) return { notModified: true };
      const headers = response.headers as Record<string, string | undefined>;
      return {
        notModified: false,
        body: (response.data === '' ? undefined : response.data) as T,
        etag: headers.etag ?? null,
        link: headers.link ?? null,
        expiration: headers['github-authentication-token-expiration'] ?? null,
      };
    },

    async graphql<T>(
      caller: Caller,
      query: string,
      variables: Readonly<Record<string, unknown>>,
    ): Promise<T> {
      try {
        return await clientOf(caller.apiBaseUrl).graphql<T>(query, {
          ...variables,
          headers: authorizationOf(caller),
        });
      } catch (error) {
        if (!(error instanceof GraphqlResponseError)) throw error;
        // GraphQL answers its rate limit with 200 and an error of type `RATE_LIMITED`.
        const limited = (error.errors ?? []).some(
          (item) => (item as { type?: unknown }).type === 'RATE_LIMITED',
        );
        if (limited) {
          const headers = error.headers as Record<string, string | undefined>;
          throw apiErrorOf(
            429,
            (name) => headers[name] ?? null,
            'rate limit',
            now(),
          );
        }
        throw new GitApiError(422, 'GitHub refused the change.');
      }
    },
  };
}
