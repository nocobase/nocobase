// The runner's git hook: `prepare-commit-msg`, which adds the run's commit trailers (such as a `Co-authored-by` naming
// the agent, `workspace.git.trailers`) to every commit the agent makes. It is installed in each cache's `hooks/` and in
// the runner's `~/.nocobase-runner/hooks/`, which the agent's environment names as `core.hooksPath` (env.ts).
//
// Nothing limits where an agent pushes: the runner is not a security boundary, so protect default branches on the
// code host. A `pre-push` guard an earlier runner installed is removed.
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

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

/** Writes the hooks into `hooksDir`, removing the push guard of earlier runners; answers the commit hook's path. */
export async function installGitHooks(hooksDir: string): Promise<string> {
  await mkdir(hooksDir, { recursive: true, mode: 0o700 });
  await rm(path.join(hooksDir, 'pre-push'), { force: true });
  const message = path.join(hooksDir, 'prepare-commit-msg');
  await writeFile(message, PREPARE_COMMIT_MSG_HOOK, { mode: 0o755 });
  await chmod(message, 0o755);
  return message;
}
