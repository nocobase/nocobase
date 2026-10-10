import { describe, expect, it } from 'vitest';

import { groupByPullRequest } from '../../client/issues/detail/code-groups.js';
import type { IssuePullRequest } from '../../shared/git.js';
import type { DeployMark, PreviewView } from '../../shared/previews.js';

const pr = (
  number: number,
  state: IssuePullRequest['state'],
  shas: { head: string; merge?: string },
): IssuePullRequest =>
  ({
    id: `pr${number}`,
    repo: 'Acme/Shop',
    number,
    state,
    headSha: shas.head,
    mergeCommitSha: shas.merge ?? null,
  }) as IssuePullRequest;

const preview = (repo: string, number: number): PreviewView =>
  ({
    id: `${repo}#${number}`,
    pullRequest: { repo, number },
  }) as PreviewView;

const mark = (
  environmentId: string,
  sha: string,
  role: DeployMark['role'] = 'staging',
): DeployMark =>
  ({ appId: `${environmentId}-app`, environmentId, sha, role }) as DeployMark;

describe('groupByPullRequest', () => {
  it('matches previews by repository and number, and marks by merge commit or head', () => {
    const { groups, unmatched } = groupByPullRequest(
      [
        pr(1, 'open', { head: 'aaaaaaa1' }),
        pr(2, 'merged', { head: 'bbbbbbb2', merge: 'ccccccc3' }),
      ],
      [preview('acme/shop', 1), preview('acme/shop', 9)],
      [
        mark('staging', 'aaaaaaa'),
        mark('production', 'ccccccc3dddd', 'production'),
      ],
    );
    expect(groups.map((group) => group.previews.map((p) => p.id))).toEqual([
      ['acme/shop#1'],
      [],
    ]);
    expect(
      groups.map((group) => group.marks.map((m) => m.environmentId)),
    ).toEqual([['staging'], ['production']]);
    expect(unmatched?.previews.map((p) => p.id)).toEqual(['acme/shop#9']);
    expect(unmatched?.marks).toEqual([]);
  });

  it('gives an unknown commit to the only merged pull request, and keeps it apart when that is ambiguous', () => {
    const one = groupByPullRequest(
      [pr(1, 'open', { head: 'a1' }), pr(2, 'merged', { head: 'b2' })],
      [],
      [mark('staging', 'eeeeeee')],
    );
    expect(one.groups[1]?.marks).toHaveLength(1);
    expect(one.unmatched).toBeNull();

    const two = groupByPullRequest(
      [pr(1, 'merged', { head: 'a1' }), pr(2, 'merged', { head: 'b2' })],
      [],
      [mark('staging', 'eeeeeee'), mark('staging', 'fffffff')],
    );
    expect(two.groups.every((group) => group.marks.length === 0)).toBe(true);
    // One per environment.
    expect(two.unmatched?.marks).toHaveLength(1);
  });
});
