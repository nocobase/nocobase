/**
 * Extracting a file's text in a worker thread of its own (`worker.ts`), one per file, ended once it answers or after
 * `timeoutMs`. A failure (an unreadable or protected file, a timeout) is the file's `failed` status, never the server's.
 */
import { Worker } from 'node:worker_threads';

import { KNOWLEDGE_PARSED_EXTENSIONS } from '../../shared/knowledge.js';
import {
  WORKER_MARK,
  type ExtractRequest,
  type ExtractResponse,
} from './worker.js';

export type { ExtractRequest, ExtractResponse } from './worker.js';

/** Extracts a file's text; the default runs `worker.ts` in a worker thread. */
export type TextExtractor = (
  request: ExtractRequest,
) => Promise<ExtractResponse>;

const TIMEOUT_MS = 5 * 60 * 1000;

/** Whether a file of this extension has its text extracted. */
export function isParsed(ext: string): boolean {
  return KNOWLEDGE_PARSED_EXTENSIONS.includes(ext.toLowerCase());
}

export function workerExtractor(
  options: { readonly timeoutMs?: number } = {},
): TextExtractor {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  return (request) => {
    // Next to this module: `worker.js` once built, `worker.ts` run from source.
    const source = import.meta.url.endsWith('.ts') ? 'worker.ts' : 'worker.js';
    const worker = new Worker(new URL(`./${source}`, import.meta.url), {
      workerData: { mark: WORKER_MARK },
    });
    return new Promise<ExtractResponse>((resolve) => {
      let settled = false;
      const settle = (response: ExtractResponse) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker.terminate().catch(() => undefined);
        resolve(response);
      };
      const timer = setTimeout(
        () =>
          settle({
            status: 'failed',
            error: `Extracting the text took longer than ${Math.round(timeoutMs / 1000)} seconds.`,
          }),
        timeoutMs,
      );
      worker.once('message', (response: ExtractResponse) => settle(response));
      worker.once('error', (error: Error) =>
        settle({ status: 'failed', error: error.message }),
      );
      worker.once('exit', (code) =>
        settle({
          status: 'failed',
          error: `The parser stopped (exit code ${code}).`,
        }),
      );
      const bytes = request.bytes.slice();
      worker.postMessage({ bytes, ext: request.ext } satisfies ExtractRequest, [
        bytes.buffer,
      ]);
    });
  };
}
