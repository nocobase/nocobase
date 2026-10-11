// @vitest-environment node
/**
 * Whether runners may remove the working directories of an issue (`SubjectBinding.workspaces` of the issue kind), over
 * a real database: an issue is over when it is done or cancelled and every linked pull request is merged or closed, a
 * squash-merged one included, since Studio decides from the pull request's state and not from branch history. An issue
 * still in progress, one with an open pull request, a deleted one, one linking a pull request Studio has no record of,
 * and an id Studio does not know keep their directories.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ISSUE_SUBJECT } from '../../server/agents/catalog/triggers.js';
import {
  ensureRepo,
  insertLink,
  upsertPullRequest,
} from '../../server/git/store.js';
import { API } from '../git/helpers.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

const FULL_NAME = 'acme/app';
const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

let h: BridgeHarness;
let projectId: string;
let nextNumber = 1;

const alice = () => h.viewer('alice');

beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  projectId = (
    await h.projects.projects.create(alice(), {
      name: 'Acme',
      visibility: 'members',
    })
  ).id;
});

afterEach(async () => {
  await h.close();
});

async function issueIn(statusKey: string | null): Promise<Issue> {
  const issue = await h.projects.issues.create(alice(), {
    title: `Issue in ${statusKey ?? 'its first status'}`,
    projectId,
  });
  if (!statusKey) return issue;
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
  return issue;
}

/** Links a pull request in `state` to the issue; a merged one as a squash, whose head the base branch never carries. */
async function linkPullRequest(
  issue: Issue,
  state: 'open' | 'merged' | 'closed',
): Promise<void> {
  const conn = h.database.connection();
  const repo = await ensureRepo(conn, API, FULL_NAME);
  const number = nextNumber++;
  const { pr } = await upsertPullRequest(conn, repo.id, {
    repo: FULL_NAME,
    number,
    url: `https://git.example.com/${FULL_NAME}/pull/${number}`,
    title: issue.title,
    body: null,
    state,
    draft: false,
    headRef: `agent/${issue.identifier}`,
    baseRef: 'main',
    headSha: SHA,
    authorLogin: 'agent',
    mergeableState: null,
    mergedAt: state === 'merged' ? new Date().toISOString() : null,
    mergedByLogin: state === 'merged' ? 'alice' : null,
    mergeCommitSha:
      state === 'merged' ? 'f1b2c3d4e5f60718293a4b5c6d7e8f9012345678' : null,
  } as never);
  await insertLink(conn, {
    issueId: issue.id,
    pullRequestId: pr.id,
    linkedByType: 'system',
    linkedById: null,
  });
}

async function settled(ids: readonly string[]): Promise<Set<string>> {
  const workspaces = h.agents.subjects.get(ISSUE_SUBJECT)?.workspaces;
  expect(workspaces).toBeDefined();
  return new Set(await workspaces!.settled(h.database.connection(), ids));
}

describe('issue working directories', () => {
  it('are over for a done or cancelled issue whose pull requests are all merged or closed', async () => {
    const squashed = await issueIn('done');
    await linkPullRequest(squashed, 'merged');
    const abandoned = await issueIn('cancelled');
    await linkPullRequest(abandoned, 'closed');
    const both = await issueIn('done');
    await linkPullRequest(both, 'merged');
    await linkPullRequest(both, 'closed');
    const withoutPullRequest = await issueIn('done');

    expect(
      await settled([
        squashed.id,
        abandoned.id,
        both.id,
        withoutPullRequest.id,
      ]),
    ).toEqual(
      new Set([squashed.id, abandoned.id, both.id, withoutPullRequest.id]),
    );
  });

  it('are kept while the issue goes on, a pull request is still open, or the issue is unknown', async () => {
    const fresh = await issueIn(null);
    const working = await issueIn('in_progress');
    await linkPullRequest(working, 'merged');
    const stillOpen = await issueIn('done');
    await linkPullRequest(stillOpen, 'merged');
    await linkPullRequest(stillOpen, 'open');
    const finished = await issueIn('done');

    expect(
      await settled([
        fresh.id,
        working.id,
        stillOpen.id,
        'no-such-issue',
        finished.id,
      ]),
    ).toEqual(new Set([finished.id]));
    expect(await settled([])).toEqual(new Set());
  });

  it('are kept for a deleted issue, even one that was done', async () => {
    const deleted = await issueIn('done');
    await linkPullRequest(deleted, 'merged');
    expect(await settled([deleted.id])).toEqual(new Set([deleted.id]));

    // Only an administrator deletes issues.
    h.roles.set('alice', 'admin');
    await h.projects.issues.remove(alice(), deleted.id);

    expect(await settled([deleted.id])).toEqual(new Set());
  });

  it('are kept when a linked pull request has no record, as its state cannot be told', async () => {
    const dangling = await issueIn('done');
    await linkPullRequest(dangling, 'merged');
    await insertLink(h.database.connection(), {
      issueId: dangling.id,
      pullRequestId: 'missing-pull-request',
      linkedByType: 'system',
      linkedById: null,
    });

    expect(await settled([dangling.id])).toEqual(new Set());
  });
});
