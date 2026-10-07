/**
 * A runner's local policy, as the runner reports it (protocol 7): what its owner lets it take, written in a file on
 * the runner's machine that the application cannot change. The runner reports the part the server must know to choose
 * its work (`RunnerPolicy`) with its registration and every heartbeat, and refuses a claim outside it anyway
 * (`policyRefused`), so a server that ignores the report still cannot make it run something its owner excluded.
 *
 * Which kinds of work it takes is said by its features instead: a runner that may not build leaves out `jobs.build`.
 *
 * Every list is a set of patterns; absent means anything, empty means nothing. A pattern matches a whole value, `*`
 * standing for any run of characters (including none).
 */
import { z } from 'zod';

export interface RunnerPolicy {
  /** The agents whose runs it takes, by id or name. Empty: no agent runs at all. */
  readonly agents?: readonly string[];
  /**
   * The subjects it works on, by the key a run names (`RunPayload.subject.key`), such as `NP-*` for the issues of the
   * project whose key is `NP` in an application.
   */
  readonly subjects?: readonly string[];
  /**
   * The repositories it checks out, for runs and jobs alike, compared by host and path: `github.com/acme/*` matches
   * `https://github.com/acme/app.git` and `git@github.com:acme/app.git`.
   */
  readonly repos?: readonly string[];
}

const patterns = z.array(z.string().min(1).max(500)).max(200);

export const RunnerPolicySchema: z.ZodType<RunnerPolicy> = z.object({
  agents: patterns.optional(),
  subjects: patterns.optional(),
  repos: patterns.optional(),
});

/** Whether `value` matches `pattern`, `*` standing for any run of characters. Case-sensitive. */
export function matchesPattern(pattern: string, value: string): boolean {
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/gu, '\\$&'))
    .join('.*');
  return new RegExp(`^${source}$`, 'u').test(value);
}

/** Whether `value` matches one of `list`; an absent list allows everything. */
function allowed(
  list: readonly string[] | undefined,
  values: readonly string[],
): boolean {
  if (list === undefined) return true;
  return list.some((pattern) =>
    values.some((value) => matchesPattern(pattern, value)),
  );
}

/**
 * A repository address as `host/path`, lower-case host, without scheme, credentials, port or a trailing `.git`:
 * `https://user:token@GitHub.com:443/acme/app.git` and `git@github.com:acme/app.git` are both `github.com/acme/app`.
 * A local path stays as it is, without a trailing slash.
 */
export function repoKey(url: string): string {
  const trimmed = url.trim().replace(/\/+$/u, '');
  const scp = /^(?:[^@/\s]+@)?([^:/\s]+):(?!\/)(.+)$/u.exec(trimmed);
  let host: string;
  let rest: string;
  if (/^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed)) {
    const withoutScheme = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//iu, '');
    const slash = withoutScheme.indexOf('/');
    const authority =
      slash === -1 ? withoutScheme : withoutScheme.slice(0, slash);
    rest = slash === -1 ? '' : withoutScheme.slice(slash + 1);
    host = authority.replace(/^.*@/u, '').replace(/:\d+$/u, '');
    if (host === '') return trimmed.replace(/\.git$/u, '');
  } else if (
    scp &&
    !trimmed.startsWith('/') &&
    !/^[A-Za-z]:\\/u.test(trimmed)
  ) {
    host = scp[1];
    rest = scp[2];
  } else {
    return trimmed.replace(/\.git$/u, '');
  }
  return `${host.toLowerCase()}/${rest.replace(/^\/+/u, '')}`.replace(
    /\.git$/u,
    '',
  );
}

/** Whether the policy lets the runner take a run of the agent with this id and name. */
export function policyAllowsAgent(
  policy: RunnerPolicy | null | undefined,
  agent: { readonly id: string; readonly name: string },
): boolean {
  return allowed(policy?.agents, [agent.id, agent.name]);
}

/** Whether the policy lets the runner work on the subject with this key. */
export function policyAllowsSubject(
  policy: RunnerPolicy | null | undefined,
  subjectKey: string,
): boolean {
  return allowed(policy?.subjects, [subjectKey]);
}

/** Whether the policy lets the runner check out the repository at `url`. */
export function policyAllowsRepo(
  policy: RunnerPolicy | null | undefined,
  url: string,
): boolean {
  if (policy?.repos === undefined) return true;
  const key = repoKey(url);
  return policy.repos.some((pattern) => matchesPattern(repoKey(pattern), key));
}
