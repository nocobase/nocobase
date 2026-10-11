/**
 * How the issue page's Code and deployments section (`code-section.tsx`) groups what follows from a pull request
 * under it: its previews, by repository and number, and the deployment marks of the commits it carried, by its head or
 * its merge commit (a squash merge's single commit is what a deployment contains). A mark of a commit no linked pull
 * request names, such as one an agent pushed, goes to the only pull request, else to the only merged one; whatever is
 * still left forms one group without a pull request.
 */
import type { IssuePullRequest } from '../../../shared/git.js';
import type { DeployMark, PreviewView } from '../../../shared/previews.js';
import { marksByEnvironment } from '../../deploys/use-marks.js';

export interface CodeGroup {
  /** Null for what no linked pull request carried. */
  readonly pullRequest: IssuePullRequest | null;
  readonly previews: readonly PreviewView[];
  /** One per environment, release targets first. */
  readonly marks: readonly DeployMark[];
}

export interface CodeGroups {
  readonly groups: readonly CodeGroup[];
  readonly unmatched: CodeGroup | null;
}

interface Slot {
  readonly previews: PreviewView[];
  readonly marks: DeployMark[];
}

const sameCommit = (a: string | null, b: string): boolean => {
  if (!a || !b) return false;
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left.startsWith(right) || right.startsWith(left);
};

export function groupByPullRequest(
  pullRequests: readonly IssuePullRequest[],
  previews: readonly PreviewView[],
  marks: readonly DeployMark[],
): CodeGroups {
  const slots = new Map<string, Slot>();
  const left: Slot = { previews: [], marks: [] };
  const slotOf = (pr: IssuePullRequest | undefined): Slot => {
    if (!pr) return left;
    let slot = slots.get(pr.id);
    if (!slot) {
      slot = { previews: [], marks: [] };
      slots.set(pr.id, slot);
    }
    return slot;
  };

  for (const preview of previews) {
    const named = preview.pullRequest;
    slotOf(
      named
        ? pullRequests.find(
            (pr) =>
              pr.number === named.number &&
              pr.repo.toLowerCase() === named.repo.toLowerCase(),
          )
        : undefined,
    ).previews.push(preview);
  }

  const merged = pullRequests.filter((pr) => pr.state === 'merged');
  const fallback =
    pullRequests.length === 1
      ? pullRequests[0]
      : merged.length === 1
        ? merged[0]
        : undefined;
  for (const mark of marks)
    slotOf(
      pullRequests.find(
        (pr) =>
          sameCommit(pr.mergeCommitSha, mark.sha) ||
          sameCommit(pr.headSha, mark.sha),
      ) ?? fallback,
    ).marks.push(mark);

  return {
    groups: pullRequests.map((pr) => {
      const slot = slotOf(pr);
      return {
        pullRequest: pr,
        previews: slot.previews,
        marks: marksByEnvironment(slot.marks),
      };
    }),
    unmatched:
      left.previews.length > 0 || left.marks.length > 0
        ? {
            pullRequest: null,
            previews: left.previews,
            marks: marksByEnvironment(left.marks),
          }
        : null,
  };
}
