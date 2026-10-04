// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import { DEPARTMENT_SUBJECT } from '../server/index.js';
import { ADMIN, createTestApp, createTree, type TestApp } from './helpers.js';

type Title = string | { key: string; ns: string };

interface Option {
  readonly id: string;
  readonly title: Title;
  readonly description?: Title;
}

const NS = '@nocobase/app-plugin-departments-example';

const SURFACE = '/api/authorization/permissionSets/subjects/org.department';

describe('the department subject type', () => {
  let test: TestApp;
  let admin: string;

  beforeAll(async () => {
    test = await createTestApp();
    admin = await test.signIn(ADMIN.email, ADMIN.password);
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  async function get<T>(pathname: string): Promise<T> {
    const response = await test.request('GET', pathname, { cookie: admin });
    expect(response.status).toBe(200);
    return ((await response.json()) as { data: T }).data;
  }

  async function list(
    query: string,
  ): Promise<{ items: Option[]; total: number }> {
    const response = await test.request('GET', `${SURFACE}?${query}`, {
      cookie: admin,
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Option[];
      meta: { total: number };
    };
    return { items: body.data, total: body.meta.total };
  }

  it('is announced under the localized Departments title', async () => {
    const options = await get<{
      subjectTypes: { type: string; title: unknown; selection: unknown }[];
    }>('/api/authorization/permissionSets/options');
    expect(
      options.subjectTypes.find((type) => type.type === DEPARTMENT_SUBJECT),
    ).toEqual({
      type: DEPARTMENT_SUBJECT,
      title: expect.objectContaining({ key: 'departments', ns: NS }),
      selection: { type: 'collection' },
    });
  });

  it('is listed and resolved only with the permission-sets settings entry', async () => {
    await test.organization.createDepartment({
      id: 'gate-1',
      title: 'Gate department',
    });
    const user = await test.signUp('subjectGate');
    const list = (cookie?: string): Promise<Response> =>
      test.request('GET', `${SURFACE}?page=1&pageSize=10&q=Gate`, {
        cookie,
      });
    const resolve = (ids: string[], cookie?: string): Promise<Response> =>
      test.request('POST', `${SURFACE}/resolve`, { cookie, json: { ids } });

    expect((await list()).status).toBe(401);
    expect((await resolve(['gate-1'])).status).toBe(401);
    expect((await list(user.cookie)).status).toBe(403);
    expect((await resolve(['gate-1'], user.cookie)).status).toBe(403);
    expect((await resolve([], user.cookie)).status).toBe(403);

    const set = definePermissionSet('subject-gate')
      .grant(
        test.authz.settings.grant('authorization.permission-sets', ['read']),
      )
      .build();
    await test.authz.permissionSets.create(set);
    await test.authz.permissionSets.assign({
      permissionSet: set.key,
      subject: { type: 'user', id: user.id },
    });

    const listed = await list(user.cookie);
    expect(listed.status).toBe(200);
    expect(
      ((await listed.json()) as { meta: { total: number } }).meta.total,
    ).toBe(1);
    const resolved = await resolve(['gate-1'], user.cookie);
    expect(resolved.status).toBe(200);
    expect(((await resolved.json()) as { data: Option[] }).data).toEqual([
      expect.objectContaining({ id: 'gate-1', title: 'Gate department' }),
    ]);
    const empty = await resolve([], user.cookie);
    expect(((await empty.json()) as { data: Option[] }).data).toEqual([]);
  });

  describe('selection', () => {
    it('matches the search as literal text', async () => {
      const { organization } = test;
      await organization.createDepartment({
        id: 'lit-1',
        title: '100% Growth',
      });
      await organization.createDepartment({
        id: 'lit-2',
        title: '1000 Growth',
      });
      await organization.createDepartment({ id: 'lit-3', title: 'A_B Team' });
      await organization.createDepartment({ id: 'lit-4', title: 'AxB Team' });

      const percent = await list('q=%25&page=1&pageSize=30');
      expect(percent.items.map((item) => item.id)).toEqual(['lit-1']);
      const underscore = await list('q=_&page=1&pageSize=30');
      expect(underscore.items.map((item) => item.id)).toEqual(['lit-3']);
      const insensitive = await list('q=growth&page=1&pageSize=30');
      expect(insensitive.items.map((item) => item.id)).toEqual([
        'lit-1',
        'lit-2',
      ]);
    });

    it('pages in a stable order and lists active departments only', async () => {
      for (const id of ['pg-e', 'pg-c', 'pg-a', 'pg-d', 'pg-b'])
        await test.organization.createDepartment({ id, title: 'Same title' });
      await test.organization.setActive('pg-e', false);

      const pages = [];
      for (const page of [1, 2, 3])
        pages.push(await list(`q=Same%20title&page=${page}&pageSize=2`));
      expect(pages.map((page) => page.total)).toEqual([4, 4, 4]);
      expect(pages.map((page) => page.items.map((item) => item.id))).toEqual([
        ['pg-a', 'pg-b'],
        ['pg-c', 'pg-d'],
        [],
      ]);
    });

    it('finds a seeded department by its title in either language', async () => {
      for (const search of ['north sales', '%E5%8C%97%E5%8C%BA'])
        expect((await list(`q=${search}&page=1&pageSize=30`)).items).toEqual([
          {
            id: 'north-sales',
            title: { key: 'seed.northSales', ns: NS },
            description: { key: 'seed.salesCenter', ns: NS },
          },
        ]);
    });

    it('resolves the requested ids, naming the parent and marking disabled ones', async () => {
      await createTree(test.organization, [
        ['res-root', null],
        ['res-child', 'res-root'],
      ]);
      await test.organization.setActive('res-root', false);

      const response = await test.request('POST', `${SURFACE}/resolve`, {
        cookie: admin,
        json: { ids: ['res-child', 'res-missing', 'trading', 'south-sales'] },
      });
      expect(response.status).toBe(200);
      const items = ((await response.json()) as { data: Option[] }).data;
      // Titles and descriptions are plain text or translation descriptors; the client renders both.
      expect(items).toEqual([
        {
          id: 'res-child',
          title: 'Dept res-child',
          description: { key: 'subject.disabled', ns: NS },
        },
        { id: 'trading', title: { key: 'seed.trading', ns: NS } },
        {
          id: 'south-sales',
          title: { key: 'seed.southSales', ns: NS },
          description: { key: 'seed.salesCenter', ns: NS },
        },
      ]);
    });
  });

  describe('filterActive', () => {
    it('reads through the caller transaction and respects its rollback', async () => {
      await createTree(test.organization, [
        ['fa-root', null],
        ['fa-child', 'fa-root'],
        ['fa-leaf', 'fa-child'],
      ]);
      const type = test.authz.subjects.get(DEPARTMENT_SUBJECT);
      if (!type) throw new Error('The department subject type is missing');
      const ids = ['fa-root', 'fa-child', 'fa-leaf'];
      const connection = vi.spyOn(test.database, 'connection');

      class Rollback extends Error {}
      await expect(
        test.database.transaction(async (transaction) => {
          await transaction.query
            .updateTable('departments')
            .set({ active: false })
            .where('id', '=', 'fa-child')
            .execute();
          connection.mockClear();
          // Disabling the child drops it and its descendant, read through the transaction alone.
          expect(
            await type.filterActive([...ids, 'fa-missing'], transaction),
          ).toEqual(['fa-root']);
          expect(await type.filterActive([], transaction)).toEqual([]);
          expect(connection).not.toHaveBeenCalled();
          throw new Rollback();
        }),
      ).rejects.toBeInstanceOf(Rollback);
      connection.mockRestore();

      expect(await type.filterActive(ids)).toEqual(ids);
    });
  });
});
