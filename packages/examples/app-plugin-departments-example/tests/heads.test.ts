// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DEPARTMENT_HEAD_SUBJECT } from '../server/index.js';
import {
  ADMIN,
  createProject,
  createTestApp,
  createTree,
  departmentsSettingsSet,
  readSales,
  type TestApp,
  type TestUser,
} from './helpers.js';

const BASE = '/api/departmentsExample';
const HEAD = { type: DEPARTMENT_HEAD_SUBJECT, id: '*' };

/**
 * Department heads: a fixed subject every head of an active department holds, and the seeded head set assigned to
 * it once. The tree `hd-root > hd-child` has one owner in `hd-child`; heads are appointed without joining.
 */
describe('department heads', () => {
  let test: TestApp;
  let admin: TestUser;
  let owner: TestUser;

  const isHead = async (user: TestUser): Promise<boolean> =>
    (await test.authz.subjects.resolveFor({ type: 'user', id: user.id })).some(
      (subject) => subject.type === HEAD.type && subject.id === HEAD.id,
    );

  const projects = async (user: TestUser): Promise<string[]> =>
    (await readSales(test, user.cookie)).ids.filter((id) =>
      id.startsWith('hd-'),
    );

  async function appoint(departmentId: string, managerId: string | null) {
    const response = await test.request(
      'PATCH',
      `${BASE}/departments/${departmentId}`,
      { cookie: admin.cookie, json: { managerId } },
    );
    expect(response.status).toBe(200);
    return (await response.json()) as {
      data: { managerId: string | null; manager: { title: string } | null };
    };
  }

  beforeAll(async () => {
    test = await createTestApp();
    admin = await test.signUp('headsAdmin');
    const set = departmentsSettingsSet(test.authz, 'heads-admin', [
      'read',
      'update',
    ]);
    await test.authz.permissionSets.create(set);
    await test.authz.permissionSets.assign({
      permissionSet: set.key,
      subject: { type: 'user', id: admin.id },
    });
    await createTree(test.organization, [
      ['hd-root', null],
      ['hd-child', 'hd-root'],
    ]);
    owner = await test.signUp('headsOwner');
    await test.organization.addMember({
      departmentId: 'hd-child',
      userId: owner.id,
    });
    await createProject(test, 'hd-child', owner.id);
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  it('resolves only for the head of an active department', async () => {
    const head = await test.signUp('headsResolve');
    const other = await test.signUp('headsOther');
    expect(await isHead(head)).toBe(false);

    await test.organization.updateDepartment('hd-child', {
      managerId: head.id,
    });
    expect(await isHead(head)).toBe(true);
    expect(await isHead(other)).toBe(false);

    // A disabled department, or a disabled ancestor, ends the post's effect.
    await test.organization.setActive('hd-root', false);
    expect(await isHead(head)).toBe(false);
    await test.organization.setActive('hd-root', true);
    expect(await isHead(head)).toBe(true);

    await test.organization.updateDepartment('hd-child', { managerId: null });
    expect(await isHead(head)).toBe(false);
  });

  it('is announced as a fixed, localized subject type', async () => {
    const response = await test.request(
      'GET',
      '/api/authorization/permissionSets/options',
      { cookie: await test.signIn(ADMIN.email, ADMIN.password) },
    );
    const body = (await response.json()) as {
      data: {
        subjectTypes: { type: string; title: unknown; selection: unknown }[];
      };
    };
    expect(
      body.data.subjectTypes.find((type) => type.type === HEAD.type),
    ).toEqual({
      type: HEAD.type,
      title: expect.objectContaining({ key: 'heads' }),
      selection: { type: 'fixed', id: '*' },
    });
  });

  it('gives a changed head the records below the post and takes them from the previous one', async () => {
    const first = await test.signUp('headsFirst');
    const second = await test.signUp('headsSecond');
    // Neither is a member of the tree, and neither holds any set of their own.
    expect((await readSales(test, first.cookie)).status).toBe(403);

    const appointed = await appoint('hd-root', first.id);
    expect(appointed.data).toMatchObject({
      managerId: first.id,
      manager: { title: 'headsFirst' },
    });
    // The seeded head set, assigned once to the heads subject, reaches the root and every department below it.
    expect(await projects(first)).toEqual(['hd-child']);
    expect((await readSales(test, first.cookie, 'orders')).ids).toContain(
      'hd-child-order',
    );

    await appoint('hd-root', second.id);
    expect((await readSales(test, first.cookie)).status).toBe(403);
    expect(await projects(second)).toEqual(['hd-child']);

    await appoint('hd-root', null);
    expect((await readSales(test, second.cookie)).status).toBe(403);
  });

  it('notifies the previous and the new head after the change commits', async () => {
    const before = await test.signUp('headsBefore');
    const after = await test.signUp('headsAfter');
    const notify = vi.spyOn(
      test.authz.permissionSets,
      'notifyAssignmentsChanged',
    );
    notify.mockResolvedValue(undefined);
    try {
      await appoint('hd-child', before.id);
      expect(notify.mock.calls).toEqual([[{ type: 'user', id: before.id }]]);

      notify.mockClear();
      await appoint('hd-child', after.id);
      expect(notify.mock.calls).toEqual(
        expect.arrayContaining([
          [{ type: 'user', id: before.id }],
          [{ type: 'user', id: after.id }],
        ]),
      );
      expect(notify).toHaveBeenCalledTimes(2);

      // Renaming touches no head and notifies nobody.
      notify.mockClear();
      const renamed = await test.request(
        'PATCH',
        `${BASE}/departments/hd-child`,
        {
          cookie: admin.cookie,
          json: { title: 'Renamed' },
        },
      );
      expect(renamed.status).toBe(200);
      expect(notify).not.toHaveBeenCalled();

      // Disabling a department reaches its head as well as its members.
      notify.mockClear();
      await test.request('POST', `${BASE}/departments/hd-child/deactivate`, {
        cookie: admin.cookie,
      });
      expect(notify.mock.calls).toEqual(
        expect.arrayContaining([
          [{ type: 'user', id: owner.id }],
          [{ type: 'user', id: after.id }],
        ]),
      );
    } finally {
      notify.mockRestore();
      await test.organization.setActive('hd-child', true);
      await test.organization.updateDepartment('hd-child', { managerId: null });
    }
  });

  it('moves a department from one head to another', async () => {
    const oldHead = await test.signUp('headsOldRoot');
    const newHead = await test.signUp('headsNewRoot');
    await createTree(test.organization, [['hd-other', null]]);
    await appoint('hd-root', oldHead.id);
    await appoint('hd-other', newHead.id);
    expect(await projects(oldHead)).toEqual(['hd-child']);
    const notify = vi.spyOn(
      test.authz.permissionSets,
      'notifyAssignmentsChanged',
    );
    notify.mockResolvedValue(undefined);
    try {
      const moved = await test.request(
        'PATCH',
        `${BASE}/departments/hd-child`,
        { cookie: admin.cookie, json: { parentId: 'hd-other' } },
      );
      expect(moved.status).toBe(200);
      expect(notify.mock.calls).toEqual(
        expect.arrayContaining([
          [{ type: 'user', id: owner.id }],
          [{ type: 'user', id: oldHead.id }],
          [{ type: 'user', id: newHead.id }],
        ]),
      );
    } finally {
      notify.mockRestore();
    }
    expect(await projects(oldHead)).toEqual([]);
    expect(await projects(newHead)).toEqual(['hd-child']);
    await test.organization.updateDepartment('hd-child', {
      parentId: 'hd-root',
    });
    await appoint('hd-root', null);
    await appoint('hd-other', null);
  });

  it('rejects a head who is not an enabled user', async () => {
    const response = await test.request(
      'PATCH',
      `${BASE}/departments/hd-root`,
      {
        cookie: admin.cookie,
        json: { managerId: 'nobody-at-all' },
      },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'USER_NOT_FOUND',
        domain: 'departmentsExample',
        fieldViolations: [{ field: 'managerId' }],
      },
    });
  });
});
