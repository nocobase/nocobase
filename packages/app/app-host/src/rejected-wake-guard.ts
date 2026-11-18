import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/** Avoid waking an idle App for background traffic that it already rejected. This is not an authentication cache:
 * the stopped App answers 503, and navigation, changed credentials, explicit start or a new revision can revalidate it.
 * Only bounded hashes are retained; request credentials and response bodies are never stored.
 */
export class RejectedWakeGuard {
  private readonly rejected = new Map<string, true>();

  blocks(revision: string, req: IncomingMessage): boolean {
    if (!req.headers.authorization && !req.headers['x-api-key']) return false;
    const mode = req.headers['sec-fetch-mode'];
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      (mode === 'navigate' ||
        (!mode && req.headers.accept?.includes('text/html')))
    )
      return false;
    return this.rejected.has(this.key(revision, req));
  }

  record(revision: string, req: IncomingMessage, status: number): void {
    // Cookie-only form submissions may change their body (for example a corrected password). They never enter
    // this background-client guard, whose identity deliberately does not include a request body.
    if (!req.headers.authorization && !req.headers['x-api-key']) return;
    if (status !== 401 && status !== 403 && this.rejected.size === 0) return;
    const key = this.key(revision, req);
    this.rejected.delete(key);
    if (status !== 401 && status !== 403) return;
    this.rejected.set(key, true);
    if (this.rejected.size > 1024)
      this.rejected.delete(this.rejected.keys().next().value!);
  }

  private key(revision: string, req: IncomingMessage): string {
    return createHash('sha256')
      .update(
        JSON.stringify([
          revision,
          req.method,
          req.url,
          req.headers.authorization,
          req.headers.cookie,
          req.headers['x-api-key'],
          req.headers.upgrade,
        ]),
      )
      .digest('hex');
  }
}

export function rejectedWakeResponse(): Response {
  return Response.json(
    {
      error: 'The application is idle. Open it to resume background requests.',
    },
    {
      status: 503,
      headers: { 'retry-after': '2', 'cache-control': 'no-store' },
    },
  );
}
