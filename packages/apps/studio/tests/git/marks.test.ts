// @vitest-environment node
/**
 * The pull request marks of the issue list (`GET /git/marks`): only issues the caller sees, checked in a bounded number
 * of reads however many issues are asked for.
 */
import type { Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo, tokenConnection } from './helpers.js';

const REPO = 'acme/marks';
let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

async function linkedIssue(
  owner: string,
  number: number,
  projectId?: string,
): Promise<string> {
  const issue = await h.projects.issues.create(h.viewer(owner), {
    title: `Issue ${number}`,
    start: false,
    ...(projectId ? { projectId } : {}),
  });
  h.github.addPull(REPO, { number });
  await h.git.link(
    h.viewer(owner),
    issue.id,
    `https://github.com/${REPO}/pull/${number}`,
    { type: 'user', id: owner },
  );
  return issue.id;
}

describe('pull request marks', () => {
  it('marks only the issues the caller sees, in a bounded number of reads', async () => {
    await connectedRepo(h, REPO, await tokenConnection(h));
    const hidden = await h.projects.projects.create(h.viewer('bob'), {
      name: 'Private',
      visibility: 'members',
    });
    const mine: string[] = [];
    for (let number = 1; number <= 3; number += 1)
      mine.push(await linkedIssue('alice', number));
    const theirs = await linkedIssue('bob', 9, hidden.id);

    const ask = (ids: readonly string[]) =>
      h.request('GET', `/git/marks?issueIds=${ids.join(',')}`, {
        user: 'alice',
      });
    const knex = await h.database.connection().client<Knex>();
    let queries = 0;
    const count = () => {
      queries += 1;
    };
    knex.on('query', count);
    try {
      await ask(mine.slice(0, 1));
      queries = 0;
      const one = await ask(mine.slice(0, 1));
      const few = queries;
      queries = 0;
      const all = await ask([...mine, theirs]);
      expect(one.status).toBe(200);
      expect(Object.keys(all.body.data).sort()).toEqual([...mine].sort());
      expect(all.body.data[mine[0]!]).toMatchObject({
        count: 1,
        state: 'open',
        label: `${REPO}#1`,
      });
      // Three more issues, one of them hidden, cost no read per issue.
      expect(queries).toBe(few);
      // The hidden issue has its mark, for whoever sees it.
      const owner = await h.request('GET', `/git/marks?issueIds=${theirs}`, {
        user: 'bob',
      });
      expect(Object.keys(owner.body.data)).toEqual([theirs]);
    } finally {
      knex.off('query', count);
    }
  });
});
