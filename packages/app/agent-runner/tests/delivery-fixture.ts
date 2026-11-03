// Legacy fixtures need published commits before testing recovery and cleanup. Publishing is explicit fixture setup;
// the worker never invokes this helper. Current workspace reports are covered by fixed-workspace.test.ts.
import { reportRepos, withRepoAuth } from '../src/core/checkout.ts';
import { taskGit } from '../src/core/task-git.ts';

export async function deliverFixtureRepos(
  ...[repos, options]: Parameters<typeof reportRepos>
): ReturnType<typeof reportRepos> {
  if (options.push && options.active?.() !== false) {
    for (const repo of repos) {
      try {
        if (
          (await taskGit(repo, ['rev-parse', 'HEAD'])) === repo.startSha &&
          (!repo.deliveryBaseSha || repo.deliveryBaseSha === repo.startSha)
        )
          continue;
        if (
          repo.continuation &&
          repo.localBranch &&
          (await taskGit(repo, ['symbolic-ref', '--short', 'HEAD'])) !==
            repo.localBranch
        )
          continue;
        await withRepoAuth(options.auth, repo.url, (auth) =>
          taskGit(
            repo,
            ['push', '--quiet', repo.url, `HEAD:refs/heads/${repo.branch}`],
            {},
            { ...(auth ? { auth } : {}) },
          ),
        );
      } catch {
        // Reporting below retains the actual failure or unknown remote state.
      }
    }
  }
  const reports = await reportRepos(repos, { ...options, push: false });
  return reports.map((report, index) =>
    repos[index]?.localBranch
      ? {
          ...report,
          branch: repos[index]!.branch,
          localBranch: repos[index]!.localBranch,
          targetBranch: repos[index]!.branch,
        }
      : report,
  );
}
