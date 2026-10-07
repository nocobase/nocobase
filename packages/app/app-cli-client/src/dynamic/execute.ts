// Sending a command's request and reading its answer: `send` answers the parsed JSON body or throws the standard
// error body as an `AppApiError`; `download` saves a file the request answers where `--out` says, never overwriting a
// file unless that is the path given.
import { createWriteStream } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { pipeline } from 'node:stream/promises';

import { readErrorBody, type DownloadResult } from '@nocobase/agent-protocol';

import { AppApiError } from '../lib/http.ts';

/** A saved download: where it went, and a line saying so. */
export interface Saved {
  readonly data: DownloadResult;
  readonly message: string;
}

export async function send(
  url: URL,
  init: RequestInit,
  options: { readonly fetch?: typeof fetch; readonly timeoutMs?: number },
): Promise<unknown> {
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(url, {
      ...init,
      signal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
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
  if (!response.ok) {
    const error = readErrorBody(parsed);
    if (error)
      throw new AppApiError(
        response.status,
        error.reason,
        error.message,
        error.metadata,
        error.status,
      );
    throw new AppApiError(
      response.status,
      `HTTP_${response.status}`,
      `${init.method ?? 'GET'} ${url.pathname} answered ${response.status}`,
    );
  }
  return parsed;
}

/** The file name a `content-disposition` gives, reduced to a plain name; `file` when it gives none. */
export function filenameOf(disposition: string | null): string {
  const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/u.exec(
    disposition ?? '',
  );
  const plain = /filename\s*=\s*"?([^";]+)"?/u.exec(disposition ?? '');
  const name = ((): string => {
    try {
      return extended?.[1]
        ? decodeURIComponent(extended[1])
        : (plain?.[1] ?? '');
    } catch {
      return plain?.[1] ?? '';
    }
  })();
  // Never a path: only the last segment, without controls, and never `.` or `..`.
  const base = (name.split(/[\\/]/u).pop() ?? '')
    // eslint-disable-next-line no-control-regex -- Strip controls from a name the server sent.
    .replace(/[\u0000-\u001f\u007f]/gu, '')
    .trim();
  return base && base !== '.' && base !== '..' ? base : 'file';
}

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  );

/**
 * Where a download goes: `out` when it names a file, inside it when it is a directory, the working directory
 * otherwise. Only a file named outright is replaced; a name taken in a directory gets ` (2)`, ` (3)`… before its
 * extension.
 */
export async function downloadTarget(
  filename: string,
  out: string | undefined,
  cwd: string = process.cwd(),
): Promise<string> {
  const info = out ? await stat(out).catch(() => undefined) : undefined;
  if (out && !info?.isDirectory()) return out;
  const dir = out ?? cwd;
  const ext = path.extname(filename);
  const stem = filename.slice(0, filename.length - ext.length);
  let candidate = path.join(dir, filename);
  for (let n = 2; await exists(candidate); n += 1)
    candidate = path.join(dir, `${stem} (${n})${ext}`);
  return candidate;
}

/** Saves the file a `download` command answered where `out` says; a refusal is the error body as for any command. */
export async function download(
  url: URL,
  init: RequestInit,
  out: string | undefined,
  options: { readonly fetch?: typeof fetch; readonly timeoutMs?: number },
): Promise<Saved> {
  let response: Response;
  try {
    response = await (options.fetch ?? fetch)(url, {
      ...init,
      signal: AbortSignal.timeout(options.timeoutMs ?? 30 * 60_000),
    });
  } catch (error) {
    throw new AppApiError(
      0,
      'NETWORK',
      `Could not reach ${url.origin}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    let parsed: unknown;
    try {
      parsed = text === '' ? undefined : JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    const error = readErrorBody(parsed);
    if (error)
      throw new AppApiError(
        response.status,
        error.reason,
        error.message,
        error.metadata,
        error.status,
      );
    throw new AppApiError(
      response.status,
      `HTTP_${response.status}`,
      `${init.method ?? 'GET'} ${url.pathname} answered ${response.status}`,
    );
  }
  const filename = filenameOf(response.headers.get('content-disposition'));
  const target = await downloadTarget(filename, out);
  // Written beside the target and moved into place, so a broken download never leaves half a file under its name.
  const partial = `${target}.part-${process.pid}`;
  try {
    await pipeline(
      Readable.fromWeb(response.body as NodeReadableStream<Uint8Array>),
      createWriteStream(partial, { flags: 'wx' }),
    );
    await rename(partial, target);
  } catch (error) {
    await rm(partial, { force: true });
    throw new AppApiError(
      0,
      'DOWNLOAD_FAILED',
      `Could not save ${filename} to ${target}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const size = (await stat(target)).size;
  const data: DownloadResult = {
    path: target,
    filename,
    mimeType:
      response.headers.get('content-type')?.split(';')[0]?.trim() ??
      'application/octet-stream',
    size,
  };
  return { data, message: `Saved ${filename} (${size} bytes) to ${target}.` };
}
