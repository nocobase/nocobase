// The runner's git hooks: the push guard, a `pre-push` hook that lets a worktree push only its run's branch, to the
// repository it was checked out from; and `prepare-commit-msg`, which adds the run's commit trailers (such as a
// `Co-authored-by` naming the agent, `workspace.git.trailers`) to every commit the agent makes.
//
// Every checkout records its allowed remote URL and branch in the runner's protected `push-allow/` directory, keyed
// by SHA-256 of the real Git directory. The hook resolves that directory with `git rev-parse --absolute-git-dir`;
// it never trusts a permission file inside the agent-writable checkout. One registry serves clones and worktrees,
// and refuses:
//
// - any push from a repository without that file (a clone the agent made itself);
// - a push to another URL (another remote, or `origin` pointed elsewhere);
// - any ref but `refs/heads/<branch>`, including tags and deletions; a force push of the run's own branch is allowed.
//
// The hook is installed in each cache's `hooks/` and in the runner's `~/.nocobase-runner/hooks/`, which the agent's
// environment names as `core.hooksPath` (env.ts), so a repository that sets its own hooks path cannot switch the guard
// off for the agent. The runner's policy refuses `--no-verify`, `core.hooksPath` and `GIT_CONFIG_*` on the command
// line. An agent that can run arbitrary code can still reach the remote another way (its own git binary, a network
// call with the host's credentials); only a separate OS user or a container closes that, and short-lived per-branch
// credentials (roadmap) make the server refuse it too.
import { createHash } from 'node:crypto';
import { chmod, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ALLOW_FILE = 'nocobase-runner-push';

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

/** The registry key agrees with the hook, including when a checkout is reached through a symbolic link. */
export async function pushAllowPath(
  allowDir: string,
  gitDir: string,
): Promise<string> {
  return path.join(
    allowDir,
    createHash('sha256')
      .update(await realpath(gitDir))
      .digest('hex'),
  );
}

/** Uses the runner's Node executable, so hashing needs no platform-specific sha256 utility. */
export function prePushHook(allowDir: string): string {
  const hash =
    'const fs=require("node:fs"),crypto=require("node:crypto");process.stdout.write(crypto.createHash("sha256").update(fs.realpathSync(process.argv[1])).digest("hex"));';
  return `#!/bin/sh
# Installed by nocobase-runner: a run's worktree may push only its own branch, to the repository it came from.
remote_url="$2"
git_dir="$(git rev-parse --absolute-git-dir 2>/dev/null)" || exit 1
key="$(${shellQuote(process.execPath)} -e ${shellQuote(hash)} "$git_dir")" || exit 1
allow=${shellQuote(path.resolve(allowDir))}/"$key"
if [ ! -f "$allow" ]; then
  echo "nocobase-runner: pushes are allowed only from the run's own checkouts." >&2
  exit 1
fi
allowed_url="$(sed -n 's/^url=//p' "$allow")"
allowed_branch="$(sed -n 's/^branch=//p' "$allow")"
create_only="$(sed -n 's/^createOnly=//p' "$allow")"
if [ "$remote_url" != "$allowed_url" ]; then
  echo "nocobase-runner: this checkout may push only to $allowed_url, not $remote_url." >&2
  exit 1
fi
while read -r local_ref local_sha remote_ref remote_sha; do
  if [ "$remote_ref" != "refs/heads/$allowed_branch" ]; then
    echo "nocobase-runner: this checkout may push only the branch $allowed_branch, not $remote_ref." >&2
    exit 1
  fi
  if [ "$create_only" = "true" ]; then
    case "$remote_sha" in
      *[!0]*) echo "nocobase-runner: initial push may only create $remote_ref; it already exists. Refresh the repository and retry the task." >&2; exit 1 ;;
    esac
  fi
  case "$local_sha" in
    *[!0]*) ;;
    *) echo "nocobase-runner: deleting $remote_ref is not allowed." >&2; exit 1 ;;
  esac
done
exit 0
`;
}

/** The environment variable that carries the run's commit trailers to the hook, one per line. */
export const TRAILERS_ENV = 'NOCOBASE_RUNNER_COMMIT_TRAILERS';

export const PREPARE_COMMIT_MSG_HOOK: string = `#!/bin/sh
# Installed by nocobase-runner: adds the run's commit trailers (${TRAILERS_ENV}, one per line) to the message.
[ -n "$${TRAILERS_ENV}" ] || exit 0
printf '%s\\n' "$${TRAILERS_ENV}" | while IFS= read -r trailer; do
  [ -n "$trailer" ] || continue
  git interpret-trailers --in-place --if-exists addIfDifferent --trailer "$trailer" "$1" || exit 1
done
`;

/** Writes the hooks into `hooksDir`; answers the push guard's path. */
export async function installGitHooks(
  hooksDir: string,
  allowDir: string = path.join(hooksDir, 'push-allow'),
): Promise<string> {
  await mkdir(hooksDir, { recursive: true, mode: 0o700 });
  const file = path.join(hooksDir, 'pre-push');
  await writeFile(file, prePushHook(allowDir), { mode: 0o755 });
  await chmod(file, 0o755);
  const message = path.join(hooksDir, 'prepare-commit-msg');
  await writeFile(message, PREPARE_COMMIT_MSG_HOOK, { mode: 0o755 });
  await chmod(message, 0o755);
  return file;
}

/** Records permissions outside the checkout and removes obsolete agent-writable permission files. */
export async function allowPush(
  gitDir: string,
  url: string,
  branch: string,
  allowDir: string,
  options: { readonly createOnly?: boolean } = {},
): Promise<void> {
  await mkdir(allowDir, { recursive: true, mode: 0o700 });
  await writeFile(
    await pushAllowPath(allowDir, gitDir),
    `url=${url}\nbranch=${branch}\n${options.createOnly ? 'createOnly=true\n' : ''}`,
    { mode: 0o600 },
  );
  await rm(path.join(gitDir, ALLOW_FILE), { force: true });
}
