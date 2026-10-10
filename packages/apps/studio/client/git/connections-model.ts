/**
 * The workspace's git connections as Settings › Git shows them: sources, each an app with its installations (one
 * connection per account it is installed on, sharing the app's credentials and webhook) or a token; the state of each
 * connection, from what it holds and what its webhook last said; and when a person's own authorization expires.
 */
import {
  connectionsByAge,
  GIT_PERSONAL_EXPIRY_WARNING_DAYS,
  type GitConnection,
  type GitPersonalAuthorization,
} from '../../shared/git.js';

export { connectionState, type GitConnectionState } from '../../shared/git.js';

export type GitSource =
  | {
      readonly kind: 'app';
      /** `webUrl` and app id: the installations of one app share it. */
      readonly key: string;
      readonly appId: string | null;
      readonly webUrl: string;
      /** The first installation, which names the app and carries its URLs. */
      readonly lead: GitConnection;
      readonly installations: readonly GitConnection[];
    }
  | {
      readonly kind: 'token';
      readonly key: string;
      readonly webUrl: string;
      readonly connection: GitConnection;
    };

/** The connections as sources, in the order they were added: an app's later installations join its first one. */
export function gitSources(connections: readonly GitConnection[]): GitSource[] {
  const sources: GitSource[] = [];
  for (const connection of connectionsByAge(connections)) {
    if (connection.kind === 'token') {
      sources.push({
        kind: 'token',
        key: connection.id,
        webUrl: connection.webUrl,
        connection,
      });
      continue;
    }
    // An app without an id yet is a source of its own.
    const key = connection.appId
      ? `${connection.webUrl}\n${connection.appId}`
      : connection.id;
    const index = sources.findIndex(
      (source) => source.kind === 'app' && source.key === key,
    );
    const existing = sources[index];
    if (existing?.kind === 'app')
      sources[index] = {
        ...existing,
        installations: [...existing.installations, connection],
      };
    else
      sources.push({
        kind: 'app',
        key,
        appId: connection.appId,
        webUrl: connection.webUrl,
        lead: connection,
        installations: [connection],
      });
  }
  return sources;
}

/** The absolute address of a URL the server gave as a path on Studio's origin. */
export function absoluteUrl(url: string): string {
  return url.startsWith('/') ? `${window.location.origin}${url}` : url;
}

/** The host's address for people, `github.com` for GitHub itself. */
export function hostOf(webUrl: string): string {
  try {
    return new URL(webUrl).host;
  } catch {
    return webUrl;
  }
}

const DAY_MS = 24 * 3600 * 1000;

/** Whether a person's authorization expired, expires within the warning window, later, or never. */
export function expiryOf(
  authorization: GitPersonalAuthorization,
  now: number = Date.now(),
): 'expired' | 'soon' | 'later' | null {
  if (!authorization.expiresAt) return null;
  const left = new Date(authorization.expiresAt).getTime() - now;
  if (left <= 0) return 'expired';
  return left <= GIT_PERSONAL_EXPIRY_WARNING_DAYS * DAY_MS ? 'soon' : 'later';
}
