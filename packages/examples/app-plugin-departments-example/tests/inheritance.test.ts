// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTestApp,
  createTree,
  readSales,
  SALES_SETS,
  type TestApp,
  type TestUser,
} from './helpers.js';

/**
 * North projects the engineer set's "own region" scope selects, the seeded demo ones included; this tree carries no
 * confidentiality restriction.
 */
const NORTH = [
  'dept-project-northgate',
  'dept-project-riverside',
  'project-1',
  'project-2',
  'project-4',
];

interface Case {
  /** Holds the set only through the department tree. */
  readonly inherited: TestUser;
  /** Holds the same set through the tree and directly. */
  readonly direct: TestUser;
  readonly assignmentId: string;
  readonly ids: { root: string; child: string; leaf: string };
}

/**
 * Each case gets its own tree `root > child > leaf`, where `leaf` works in the North region, the authorization
 * example's engineer set assigned to `root`, and two members of `leaf`; the second also holds the set directly.
 */
async function setUp(test: TestApp, name: string): Promise<Case> {
  const ids = { root: `${name}`, child: `${name}-child`, leaf: `${name}-leaf` };
  await createTree(test.organization, [
    [ids.root, null],
    [ids.child, ids.root],
    [ids.leaf, ids.child, 'North'],
  ]);
  const assignment = await test.authz.permissionSets.assign({
    permissionSet: SALES_SETS.engineer,
    subject: { type: 'org.department', id: ids.root },
  });
  const inherited = await test.signUp(`${name}Inherited`);
  const direct = await test.signUp(`${name}Direct`);
  for (const user of [inherited, direct])
    await test.organization.addMember({
      departmentId: ids.leaf,
      userId: user.id,
    });
  await test.authz.permissionSets.assign({
    permissionSet: SALES_SETS.engineer,
    subject: { type: 'user', id: direct.id },
  });
  return { inherited, direct, assignmentId: assignment.id, ids };
}

describe('a permission set assigned to a department', () => {
  let test: TestApp;

  beforeAll(async () => {
    test = await createTestApp();
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  it('reaches direct members and the members of every department below it', async () => {
    const { inherited, ids } = await setUp(test, 'reach');
    const directMember = await test.signUp('reachRoot');
    await test.organization.addMember({
      departmentId: ids.root,
      userId: directMember.id,
    });

    // The leaf member inherits from two levels up, and the leaf's region selects the North projects.
    expect(await readSales(test, inherited.cookie)).toEqual({
      status: 200,
      ids: NORTH,
    });
    // A member of the root holds the set too; the root has no region, so the region scope selects nothing.
    expect(await readSales(test, directMember.cookie)).toEqual({
      status: 200,
      ids: [],
    });
    const snapshot = await test.request(
      'GET',
      '/api/authorization/permissions',
      {
        cookie: inherited.cookie,
      },
    );
    expect(JSON.stringify(await snapshot.json())).toContain(
      'example.sales.projects',
    );

    const outsider = await test.signUp('reachOutsider');
    expect((await readSales(test, outsider.cookie)).status).toBe(403);
  });

  it('is revoked by removing the member', async () => {
    const { inherited, direct, ids } = await setUp(test, 'remove');
    await test.organization.removeMember(ids.leaf, inherited.id);
    await test.organization.removeMember(ids.leaf, direct.id);

    expect((await readSales(test, inherited.cookie)).status).toBe(403);
    // The direct assignment keeps the action; leaving the regional department took the region with it.
    expect(await readSales(test, direct.cookie)).toEqual({
      status: 200,
      ids: [],
    });
  });

  it('is revoked by unassigning the set from the department', async () => {
    const { inherited, direct, assignmentId } = await setUp(test, 'unassign');
    await test.authz.permissionSets.revoke(assignmentId);

    expect((await readSales(test, inherited.cookie)).status).toBe(403);
    expect(await readSales(test, direct.cookie)).toEqual({
      status: 200,
      ids: NORTH,
    });
  });

  it('is revoked by disabling the department', async () => {
    const { inherited, direct, ids } = await setUp(test, 'disable');
    await test.organization.setActive(ids.leaf, false);

    expect((await readSales(test, inherited.cookie)).status).toBe(403);
    expect((await readSales(test, direct.cookie)).status).toBe(200);
  });

  it('is revoked by disabling an ancestor department', async () => {
    const { inherited, direct, ids } = await setUp(test, 'ancestor');
    await test.organization.setActive(ids.root, false);

    expect((await readSales(test, inherited.cookie)).status).toBe(403);
    expect((await readSales(test, direct.cookie)).status).toBe(200);

    // Re-enabling the ancestor restores the inheritance and the region; no child row was rewritten.
    await test.organization.setActive(ids.root, true);
    expect(await readSales(test, inherited.cookie)).toEqual({
      status: 200,
      ids: NORTH,
    });
  });
});
