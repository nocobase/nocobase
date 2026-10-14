// @vitest-environment node
/** Pull request changes announced to open pages (`server/git/announcer.ts`): once a moment, naming their issues. */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  GIT_ANNOUNCE_DELAY_MS,
  GIT_ANNOUNCED_ISSUES_MAX,
  createGitAnnouncer,
} from '../../server/git/announcer.js';
import { issuesOfPullRequests } from '../../server/git/store.js';
import type { StudioGitEvent } from '../../shared/git.js';
import { createBridgeHarness } from '../agents/bridge-harness.js';
import { connectedRepo, tokenConnection } from './helpers.js';

afterEach(() => {
  vi.useRealTimers();
});

function announcer(links: Record<string, string[]>) {
  vi.useFakeTimers();
  const published: StudioGitEvent[] = [];
  const asked: string[][] = [];
  const it = createGitAnnouncer({
    issuesOf: (ids) => {
      asked.push([...ids]);
      return Promise.resolve([
        ...new Set(ids.flatMap((id) => links[id] ?? [])),
      ]);
    },
    publish: (event) => published.push(event),
  });
  return { it, published, asked };
}

describe('git change announcements', () => {
  it('gathers a moment of stores into one announcement naming the linked issues', async () => {
    const {
      it: changes,
      published,
      asked,
    } = announcer({
      pr1: ['i1'],
      pr2: ['i1', 'i2'],
    });
    changes.changed('pr1');
    changes.changed('pr2');
    changes.changed('pr1');
    expect(published).toEqual([]);
    await vi.advanceTimersByTimeAsync(GIT_ANNOUNCE_DELAY_MS);
    expect(asked).toEqual([['pr1', 'pr2']]);
    expect(published).toEqual([
      { kind: 'studio.git.changed', issueIds: ['i1', 'i2'] },
    ]);
  });

  it('announces nothing for pull requests linked to no issue', async () => {
    const { it: changes, published } = announcer({});
    changes.changed('pr9');
    await vi.advanceTimersByTimeAsync(GIT_ANNOUNCE_DELAY_MS);
    expect(published).toEqual([]);
  });

  it('names nothing for a change it cannot tie to pull requests, or too many issues', async () => {
    const {
      it: changes,
      published,
      asked,
    } = announcer({
      pr1: ['i1'],
      many: Array.from(
        { length: GIT_ANNOUNCED_ISSUES_MAX + 1 },
        (_, index) => `i${index}`,
      ),
    });
    changes.changed('pr1');
    changes.changed();
    await vi.advanceTimersByTimeAsync(GIT_ANNOUNCE_DELAY_MS);
    expect(asked).toEqual([]);
    changes.changed('many');
    await changes.flush();
    expect(published).toEqual([
      { kind: 'studio.git.changed' },
      { kind: 'studio.git.changed' },
    ]);
  });

  it('announces nothing after it is closed', async () => {
    const { it: changes, published } = announcer({ pr1: ['i1'] });
    changes.changed('pr1');
    changes.close();
    await vi.advanceTimersByTimeAsync(GIT_ANNOUNCE_DELAY_MS * 2);
    expect(published).toEqual([]);
  });

  it('hears of a stored pull request by its id, and finds its linked issues', async () => {
    const h = await createBridgeHarness();
    try {
      await h.addUser('alice');
      const repo = await connectedRepo(
        h,
        'acme/announce',
        await tokenConnection(h),
      );
      const issue = await h.projects.issues.create(h.viewer('alice'), {
        title: 'Announced',
        start: false,
      });
      h.github.addPull('acme/announce', { number: 3 });
      const { pullRequest } = await h.git.link(
        h.viewer('alice'),
        issue.id,
        'https://github.com/acme/announce/pull/3',
        { type: 'user', id: 'alice' },
      );
      h.gitChanges.length = 0;
      h.github.pull('acme/announce', 3).title = 'Renamed';
      await h.git.pollRepo(repo);
      expect(h.gitChanges).toContain(pullRequest.id);
      expect(
        await issuesOfPullRequests(h.projects.tx.read(), [
          pullRequest.id,
          'none',
        ]),
      ).toEqual([issue.id]);
    } finally {
      await h.close();
    }
  });
});
