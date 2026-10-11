/**
 * What a pull request names, and where a repository's API is.
 * Pure functions.
 *
 * A pull request on a branch a repository's branch rules name (`issueKeyOfBranch`, `shared/git.ts`) belongs to that
 * issue. Issue keys (`PM-12`) in its title or body (`mentionedIssueKeys`, at most 5) only make it a suggestion on those
 * issues, for a person to confirm. An identifier is a project key and a number; which ones exist is for the caller to
 * check.
 */
export const MAX_MENTIONED_ISSUES = 5;

const KEY = '([A-Za-z][A-Za-z0-9]{0,9})-(\\d{1,9})';

/** The issue keys a pull request's title and body name, in order, at most `MAX_MENTIONED_ISSUES`. */
export function mentionedIssueKeys(input: {
  readonly title: string;
  readonly body: string | null;
}): string[] {
  const pattern = new RegExp(`\\b${KEY}\\b`, 'gu');
  const found: string[] = [];
  for (const text of [input.title, input.body ?? '']) {
    for (const match of text.matchAll(pattern)) {
      // Keys are written in capitals; a lower-case word with a number (`utf-8`) is not one.
      if (!match[1] || !match[2] || match[1] !== match[1].toUpperCase())
        continue;
      const identifier = `${match[1]}-${Number(match[2])}`;
      if (!found.includes(identifier)) found.push(identifier);
      if (found.length >= MAX_MENTIONED_ISSUES) return found;
    }
  }
  return found;
}

export interface PullRequestRef {
  /** `owner/name`. */
  readonly repo: string;
  readonly number: number;
  /** `scheme://host` of the web pages. */
  readonly origin: string;
  /** Normalized `<origin>/<owner>/<name>/pull/<number>`. */
  readonly url: string;
}

const PR_URL =
  /^(https?):\/\/([A-Za-z0-9.-]+(?::\d+)?)\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/(\d+)(?:[/?#].*)?$/u;

/** A GitHub (or GitHub Enterprise) pull request URL, or null. */
export function parsePullRequestUrl(value: unknown): PullRequestRef | null {
  if (typeof value !== 'string') return null;
  const match = PR_URL.exec(value.trim());
  if (!match) return null;
  const [, scheme, host, owner, name, number] = match as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const parsed = Number(number);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  const origin = `${scheme}://${host}`;
  return {
    repo: `${owner}/${name}`,
    number: parsed,
    origin,
    url: `${origin}/${owner}/${name}/pull/${parsed}`,
  };
}

export interface RepoRef {
  readonly repo: string;
  /** `scheme://host` of the web pages. */
  readonly origin: string;
}

/**
 * The GitHub repository of a git remote: `https://github.com/owner/name(.git)`, `git@github.com:owner/name.git` or
 * `ssh://git@host/owner/name.git`. Null for anything else (a local path, a nested group).
 */
export function repoOfRemote(remote: string | null): RepoRef | null {
  if (!remote) return null;
  const value = remote.trim();
  const http =
    /^(https?):\/\/(?:[^@/]+@)?([A-Za-z0-9.-]+(?::\d+)?)\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/u.exec(
      value,
    );
  if (http?.[1] && http[2] && http[3] && http[4])
    return { repo: `${http[3]}/${http[4]}`, origin: `${http[1]}://${http[2]}` };
  const ssh =
    /^(?:ssh:\/\/)?[A-Za-z0-9_.-]+@([A-Za-z0-9.-]+)(?::\d+)?[:/]([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/u.exec(
      value,
    );
  if (ssh?.[1] && ssh[2] && ssh[3])
    return { repo: `${ssh[2]}/${ssh[3]}`, origin: `https://${ssh[1]}` };
  return null;
}

/**
 * The REST API of a GitHub host: `api.github.com` for github.com, `<origin>/api/v3` for GitHub Enterprise Server;
 * `overrides` (configuration `studio.git.apiBaseUrls`, by host) win.
 */
export function apiBaseUrlOf(
  origin: string,
  overrides: Readonly<Record<string, string>> = {},
): string {
  const host = new URL(origin).host;
  const override = overrides[host];
  if (override) return override.replace(/\/+$/u, '');
  if (host === 'github.com' || host === 'www.github.com')
    return 'https://api.github.com';
  return `${origin}/api/v3`;
}
