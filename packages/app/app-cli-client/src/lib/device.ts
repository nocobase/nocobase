// Signing in through the browser (`AppCliConfig.auth`), RFC 8628 as Better Auth's `deviceAuthorization()` serves it:
// the CLI asks for a device code and a short user code, shows the code and opens the page where the signed-in person
// approves it, and polls until the server answers a session token, the person declines, or the code expires. The
// endpoints answer RFC 8628's bodies (`{ device_code, ... }`, `{ error, error_description }`), not the application's
// standard ones, so they are read here rather than through `ApiClient`.
import { spawn } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { z } from 'zod';

import { authRouteOf, cliClientIdOf, type AppCliAuth } from '../config.ts';
import { serverPath, urlFor } from '../dynamic/session.ts';
import { AppApiError } from './http.ts';

const StartedSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.string().min(1),
  verification_uri_complete: z.string().min(1).optional(),
  expires_in: z.number().positive(),
  interval: z.number().positive().optional(),
});

/** What the server answers a new authorization: the codes, where to approve, and how often to ask. */
export interface DeviceAuthorization {
  readonly deviceCode: string;
  readonly userCode: string;
  readonly verificationUri: string;
  readonly verificationUriComplete: string;
  /** Seconds. */
  readonly expiresIn: number;
  /** Seconds between polls. */
  readonly interval: number;
}

const IssuedSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
});

/** What the server answers once the person approved: the session token, and seconds until it expires. */
export interface IssuedSession {
  readonly token: string;
  readonly expiresIn?: number | undefined;
}

const ErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

/** What a CLI's requests say of it, which the server keeps with the session: the CLI, its version, the machine. */
export function cliUserAgent(
  client: { readonly bin: string; readonly version?: string | undefined },
  host: string = os.hostname(),
): string {
  return `${client.bin}/${client.version ?? '0'} (${host}; ${process.platform} ${process.arch}) node/${process.versions.node}`;
}

export interface DeviceRequestOptions {
  readonly fetch?: typeof fetch;
  readonly userAgent?: string;
}

/**
 * POSTs to a device endpoint. A failure is an `AppApiError` whose `reason` is the RFC 8628 `error` in capitals,
 * such as `AUTHORIZATION_PENDING` or `ACCESS_DENIED`.
 */
async function postDevice(
  server: string,
  route: string,
  body: Record<string, string>,
  options: DeviceRequestOptions,
): Promise<unknown> {
  const url = urlFor(server, route);
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(options.userAgent ? { 'user-agent': options.userAgent } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new AppApiError(
      0,
      'NETWORK',
      `Could not reach ${url.origin}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const text = await response.text().catch(() => '');
  let parsed: unknown;
  try {
    parsed = text === '' ? undefined : JSON.parse(text);
  } catch {
    parsed = undefined;
  }
  if (response.ok) return parsed;
  const failure = ErrorSchema.safeParse(parsed);
  if (failure.success)
    throw new AppApiError(
      response.status,
      failure.data.error.toUpperCase(),
      failure.data.error_description ?? failure.data.error,
    );
  throw new AppApiError(
    response.status,
    `HTTP_${response.status}`,
    `POST ${url.pathname} answered ${response.status}`,
  );
}

export async function startDeviceAuthorization(
  server: string,
  auth: AppCliAuth,
  options: DeviceRequestOptions = {},
): Promise<DeviceAuthorization> {
  const started = StartedSchema.parse(
    await postDevice(
      server,
      serverPath(server, authRouteOf(auth, '/device/code')),
      { client_id: cliClientIdOf(auth) },
      options,
    ),
  );
  // The server may answer the page below its origin, not knowing the address it is reached at.
  const origin = new URL(server).origin;
  const verificationUri = new URL(started.verification_uri, origin).href;
  return {
    deviceCode: started.device_code,
    userCode: started.user_code,
    verificationUri,
    verificationUriComplete: started.verification_uri_complete
      ? new URL(started.verification_uri_complete, origin).href
      : verificationUri,
    expiresIn: started.expires_in,
    interval: started.interval ?? 5,
  };
}

/** Reasons the token endpoint answers while the person has not approved yet. */
const PENDING = 'AUTHORIZATION_PENDING';
const SLOW_DOWN = 'SLOW_DOWN';

export interface PollOptions extends DeviceRequestOptions {
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
}

/**
 * Polls until the server answers the session token; an `AppApiError` when the person declined (`ACCESS_DENIED`), the
 * code expired (`EXPIRED_TOKEN`), or the server refused it (`INVALID_GRANT`). `SLOW_DOWN` adds five seconds to the
 * interval, as RFC 8628 asks.
 */
export async function pollDeviceAuthorization(
  server: string,
  auth: AppCliAuth,
  started: DeviceAuthorization,
  options: PollOptions = {},
): Promise<IssuedSession> {
  const sleep =
    options.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = options.now ?? Date.now;
  const deadline = now() + started.expiresIn * 1000;
  let interval = started.interval * 1000;
  const route = serverPath(server, authRouteOf(auth, '/device/token'));
  for (;;) {
    await sleep(interval);
    try {
      const issued = IssuedSchema.parse(
        await postDevice(
          server,
          route,
          {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: started.deviceCode,
            client_id: cliClientIdOf(auth),
          },
          options,
        ),
      );
      return { token: issued.access_token, expiresIn: issued.expires_in };
    } catch (error) {
      if (!(error instanceof AppApiError)) throw error;
      if (error.reason === SLOW_DOWN) interval += 5000;
      else if (error.reason !== PENDING && !error.transient) throw error;
      if (now() >= deadline)
        throw new AppApiError(
          400,
          'EXPIRED_TOKEN',
          'The code expired before it was approved. Sign in again.',
        );
    }
  }
}

/** Linux and BSD openers, tried in order as GitHub CLI does: the desktop's own, Debian's alternatives, then WSL's. */
const UNIX_OPENERS: readonly string[] = [
  'xdg-open',
  'x-www-browser',
  'www-browser',
  'wslview',
];

function onPath(name: string, env: NodeJS.ProcessEnv): string | undefined {
  for (const dir of (env.PATH ?? '').split(path.delimiter)) {
    if (!dir) continue;
    const file = path.join(dir, name);
    try {
      accessSync(file, constants.X_OK);
      return file;
    } catch {
      // Not here.
    }
  }
  return undefined;
}

/**
 * The command that opens a page in this machine's browser, or undefined where there is none to see it: a session over
 * SSH, or a Linux machine with no display. The sign-in page is then opened on another device.
 */
export function browserOpener(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): { file: string; args: (url: string) => string[] } | undefined {
  if (platform === 'darwin')
    return env.SSH_CONNECTION || env.SSH_TTY
      ? undefined
      : { file: 'open', args: (url) => [url] };
  if (platform === 'win32')
    return {
      file: 'cmd',
      args: (url) => ['/c', 'start', '""', url.replaceAll('&', '^&')],
    };
  const wsl = Boolean(env.WSL_DISTRO_NAME);
  if (!wsl && !env.DISPLAY && !env.WAYLAND_DISPLAY) return undefined;
  for (const name of UNIX_OPENERS) {
    const file = onPath(name, env);
    if (file) return { file, args: (url) => [url] };
  }
  return undefined;
}

/** Opens `url` in the default browser; false when this machine has none to open it in. */
export function openBrowser(
  url: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const opener = browserOpener(platform, env);
  if (!opener) return false;
  try {
    const child = spawn(opener.file, opener.args(url), {
      stdio: 'ignore',
      detached: true,
    });
    child.on('error', () => undefined);
    child.unref();
    return true;
  } catch {
    return false;
  }
}
