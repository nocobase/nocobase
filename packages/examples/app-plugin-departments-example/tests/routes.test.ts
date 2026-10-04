// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  createTestApp,
  createTree,
  departmentsSettingsSet,
  salesRegion,
  type TestApp,
  type TestUser,
} from './helpers.js';

const BASE = '/api/departmentsExample';

describe('organization routes', () => {
  let test: TestApp;
  let nobody: TestUser;
  let reader: TestUser;
  let manager: TestUser;

  beforeAll(async () => {
    test = await createTestApp();
    const { authz } = test;
    nobody = await test.signUp('routesNobody');
    reader = await test.signUp('routesReader');
    manager = await test.signUp('routesManager');
    const read = departmentsSettingsSet(authz, 'routes-read', ['read']);
    const update = departmentsSettingsSet(authz, 'routes-update', [
      'read',
      'update',
    ]);
    await authz.permissionSets.create(read);
    await authz.permissionSets.create(update);
    await authz.permissionSets.assign({
      permissionSet: read.key,
      subject: { type: 'user', id: reader.id },
    });
    await authz.permissionSets.assign({
      permissionSet: update.key,
      subject: { type: 'user', id: manager.id },
    });
    await createTree(test.organization, [
      ['rt-root', null],
      ['rt-child', 'rt-root'],
    ]);
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  it('answers 401 without a session', async () => {
    for (const pathname of [
      `${BASE}/departments`,
      `${BASE}/departments/rt-root`,
      `${BASE}/departments/rt-root/members`,
      `${BASE}/memberCandidates`,
    ]) {
      const response = await test.request('GET', pathname);
      expect(response.status, `GET ${pathname}`).toBe(401);
      expect(await response.json()).toMatchObject({
        error: { status: 'UNAUTHENTICATED' },
      });
    }
    for (const [method, pathname, json] of [
      ['POST', `${BASE}/departments`, { title: 'Anonymous' }],
      ['PATCH', `${BASE}/departments/rt-root`, { title: 'Anonymous' }],
      ['POST', `${BASE}/departments/rt-root/activate`, undefined],
      ['POST', `${BASE}/departments/rt-root/deactivate`, undefined],
      ['POST', `${BASE}/departments/rt-root/members`, { userId: 'x' }],
      ['DELETE', `${BASE}/departments/rt-root/members/x`, undefined],
      ['POST', `${BASE}/departments/rt-root/members/x/makePrimary`, undefined],
    ] as const)
      expect(
        (
          await test.request(method, pathname, {
            ...(json === undefined ? {} : { json }),
          })
        ).status,
        `${method} ${pathname}`,
      ).toBe(401);
  });

  it('answers 403 without the organization settings item', async () => {
    const response = await test.request('GET', `${BASE}/departments`, {
      cookie: nobody.cookie,
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { status: 'PERMISSION_DENIED', reason: 'AUTHORIZATION_DENIED' },
    });
  });

  it('lets read list but not write', async () => {
    const list = await test.request('GET', `${BASE}/departments`, {
      cookie: reader.cookie,
    });
    expect(list.status).toBe(200);
    const body = (await list.json()) as { data: { id: string }[] };
    expect(body.data.map((row) => row.id)).toContain('rt-child');

    expect(
      (
        await test.request('GET', `${BASE}/departments/rt-root/members`, {
          cookie: reader.cookie,
        })
      ).status,
    ).toBe(200);
    for (const [method, pathname, json] of [
      ['POST', `${BASE}/departments`, { title: 'Reader' }],
      ['POST', `${BASE}/departments/rt-root/deactivate`, undefined],
      ['POST', `${BASE}/departments/rt-root/members`, { userId: reader.id }],
      // Permission comes before existence: a department that does not exist is still a 403.
      ['POST', `${BASE}/departments/nope/members`, { userId: reader.id }],
      ['PATCH', `${BASE}/departments/nope`, { title: 'Reader' }],
      // And before validation: input the validator would refuse is still a 403.
      ['POST', `${BASE}/departments`, { unknownField: true }],
      ['PATCH', `${BASE}/departments/rt-root`, { title: 42 }],
      ['POST', `${BASE}/departments/rt-root/members`, {}],
    ] as const)
      expect(
        (
          await test.request(method, pathname, {
            cookie: reader.cookie,
            ...(json === undefined ? {} : { json }),
          })
        ).status,
      ).toBe(403);
    for (const query of ['', '?pageSize=1000'])
      expect(
        (
          await test.request('GET', `${BASE}/memberCandidates${query}`, {
            cookie: reader.cookie,
          })
        ).status,
      ).toBe(403);
  });

  it('lets update write, and validates input', async () => {
    const created = await test.request('POST', `${BASE}/departments`, {
      cookie: manager.cookie,
      json: { id: 'rt-new', title: 'New', parentId: 'rt-root' },
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      data: { id: 'rt-new', parentId: 'rt-root', active: true },
    });

    const cases: [string, string, unknown, number, string][] = [
      ['POST', `${BASE}/departments`, { title: '' }, 400, 'INVALID_INPUT'],
      [
        'POST',
        `${BASE}/departments`,
        { id: 'rt-new', title: 'Again' },
        409,
        'DEPARTMENT_EXISTS',
      ],
      [
        'POST',
        `${BASE}/departments`,
        { title: 'X', parentId: 'nope' },
        400,
        'PARENT_NOT_FOUND',
      ],
      [
        'POST',
        `${BASE}/departments`,
        { title: 'X', unknown: true },
        400,
        'INVALID_INPUT',
      ],
      [
        'PATCH',
        `${BASE}/departments/rt-root`,
        { parentId: 'rt-child' },
        400,
        'PARENT_CYCLE',
      ],
      [
        'PATCH',
        `${BASE}/departments/rt-root`,
        { region: '' },
        400,
        'INVALID_INPUT',
      ],
      [
        'PATCH',
        `${BASE}/departments/nope`,
        { title: 'Missing' },
        404,
        'DEPARTMENT_NOT_FOUND',
      ],
      [
        'POST',
        `${BASE}/departments/nope/activate`,
        undefined,
        404,
        'DEPARTMENT_NOT_FOUND',
      ],
      [
        'POST',
        `${BASE}/departments/nope/members`,
        { userId: manager.id },
        404,
        'DEPARTMENT_NOT_FOUND',
      ],
      [
        'POST',
        `${BASE}/departments/rt-root/members`,
        { userId: 'ghost' },
        400,
        'USER_NOT_FOUND',
      ],
      [
        'DELETE',
        `${BASE}/departments/rt-root/members/${nobody.id}`,
        undefined,
        404,
        'MEMBER_NOT_FOUND',
      ],
      [
        'POST',
        `${BASE}/departments/rt-root/members/${nobody.id}/makePrimary`,
        undefined,
        404,
        'MEMBER_NOT_FOUND',
      ],
    ];
    for (const [method, pathname, json, status, reason] of cases) {
      const response = await test.request(method, pathname, {
        cookie: manager.cookie,
        ...(json === undefined ? {} : { json }),
      });
      expect(response.status, `${method} ${pathname}`).toBe(status);
      expect(
        ((await response.json()) as { error: { reason: string } }).error.reason,
        `${method} ${pathname}`,
      ).toBe(reason);
    }
    const missing = await test.request('GET', `${BASE}/departments/nope`, {
      cookie: manager.cookie,
    });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'DEPARTMENT_NOT_FOUND',
        domain: 'departmentsExample',
      },
    });

    const ghost = await test.request(
      'POST',
      `${BASE}/departments/rt-root/members`,
      { cookie: manager.cookie, json: { userId: 'ghost' } },
    );
    expect(await ghost.json()).toMatchObject({
      error: { fieldViolations: [{ field: 'userId' }] },
    });

    expect(
      (
        await test.request('GET', `${BASE}/memberCandidates?pageSize=101`, {
          cookie: manager.cookie,
        })
      ).status,
    ).toBe(400);

    const users = await test.request(
      'GET',
      `${BASE}/memberCandidates?q=routesnobody&page=1&pageSize=10`,
      { cookie: manager.cookie },
    );
    expect(users.status).toBe(200);
    expect(await users.json()).toEqual({
      data: [
        { id: nobody.id, title: expect.any(String), description: nobody.email },
      ],
      meta: { page: 1, pageSize: 10, total: 1 },
    });
  });

  it('notifies each affected user after the membership write commits', async () => {
    const notify = vi.spyOn(
      test.authz.permissionSets,
      'notifyAssignmentsChanged',
    );
    // Record, at notification time, whether the write is already visible outside its transaction.
    const committed: boolean[] = [];
    notify.mockImplementation(async (subject) => {
      const row = await test.database
        .connection()
        .query.selectFrom('departmentMembers')
        .select('active')
        .where('userId', '=', subject.id)
        .where('departmentId', '=', 'rt-child')
        .executeTakeFirst();
      committed.push(row !== undefined);
    });
    try {
      const member = await test.signUp('routesMember');
      const added = await test.request(
        'POST',
        `${BASE}/departments/rt-child/members`,
        { cookie: manager.cookie, json: { userId: member.id } },
      );
      expect(added.status).toBe(201);
      expect(await added.json()).toMatchObject({
        data: { userId: member.id, primary: true },
      });
      expect(notify.mock.calls).toEqual([[{ type: 'user', id: member.id }]]);
      expect(committed).toEqual([true]);

      // Disabling the parent reaches every member below it.
      notify.mockClear();
      const disabled = await test.request(
        'POST',
        `${BASE}/departments/rt-root/deactivate`,
        { cookie: manager.cookie },
      );
      expect(disabled.status).toBe(200);
      expect(await disabled.json()).toMatchObject({
        data: { id: 'rt-root', active: false },
      });
      expect(notify.mock.calls).toEqual([[{ type: 'user', id: member.id }]]);

      // A write that fails notifies nobody.
      notify.mockClear();
      const failed = await test.request(
        'DELETE',
        `${BASE}/departments/rt-child/members/${nobody.id}`,
        { cookie: manager.cookie },
      );
      expect(failed.status).toBe(404);
      expect(notify).not.toHaveBeenCalled();

      const removed = await test.request(
        'DELETE',
        `${BASE}/departments/rt-child/members/${member.id}`,
        { cookie: manager.cookie },
      );
      expect(removed.status).toBe(204);
      expect(await removed.text()).toBe('');
      expect(notify.mock.calls).toEqual([[{ type: 'user', id: member.id }]]);
    } finally {
      notify.mockRestore();
      await test.organization.setActive('rt-root', true);
    }
  });

  it('keeps the sales region in sync with membership and the department region', async () => {
    await createTree(test.organization, [
      ['rg-north', 'rt-root', 'North'],
      ['rg-west', 'rt-root', 'West'],
    ]);
    const member = await test.signUp('regionMember');
    const write = async (
      method: string,
      pathname: string,
      json?: unknown,
    ): Promise<void> => {
      const response = await test.request(method, `${BASE}${pathname}`, {
        cookie: manager.cookie,
        ...(json === undefined ? {} : { json }),
      });
      expect(response.status, `${method} ${pathname}`).toBeLessThan(300);
    };

    expect(await salesRegion(test, member.id)).toBeUndefined();
    await write('POST', '/departments/rg-north/members', { userId: member.id });
    expect(await salesRegion(test, member.id)).toBe('North');

    // A second, non-primary regional department leaves the primary one's region in force.
    await write('POST', '/departments/rg-west/members', { userId: member.id });
    expect(await salesRegion(test, member.id)).toBe('North');
    await write(
      'POST',
      `/departments/rg-west/members/${member.id}/makePrimary`,
    );
    expect(await salesRegion(test, member.id)).toBe('West');

    // Changing a department's region reaches its members.
    await write('PATCH', '/departments/rg-west', { region: 'South' });
    expect(await salesRegion(test, member.id)).toBe('South');

    await write('DELETE', `/departments/rg-west/members/${member.id}`);
    expect(await salesRegion(test, member.id)).toBe('North');
    await write('PATCH', '/departments/rg-north', { region: null });
    expect(await salesRegion(test, member.id)).toBeUndefined();
  });
});
