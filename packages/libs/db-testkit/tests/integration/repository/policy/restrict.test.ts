import { expect, it, vi } from 'vitest';
import {
  ref,
  type DatabaseScope,
  type DatabaseScopePolicies,
} from '../../../../../db/src/index.js';
import { describeIntegrationDatabases } from '../../helpers.js';
import { createTenantFixture, selection } from '../fixtures/tenants.js';

const tenantPolicies = {
  policyProjects: {
    read: { scope: { tenantId: 'T1' }, fields: ['id', 'name'] },
    create: {
      scope: { tenantId: 'T1' },
      defaults: { tenantId: 'T1' },
      fields: ['id', 'name'],
    },
    update: { scope: { tenantId: 'T1' }, fields: ['name'] },
    delete: { scope: { tenantId: 'T1' } },
  },
} as const;

function assertRestricted(scope: DatabaseScope): void {
  expect(Object.keys(scope).sort()).toEqual([
    'afterCommit',
    'afterRollback',
    'explainPolicies',
    'repository',
    'transaction',
  ]);
  expect(Object.isFrozen(scope)).toBe(true);
  const repository = scope.repository('policyProjects');
  for (const candidate of [repository, repository.narrow({ delete: false })]) {
    expect(Object.isFrozen(candidate)).toBe(true);
    for (const key of [
      'withPolicy',
      'options',
      'connection',
      'inner',
      'adapter',
    ]) {
      expect(candidate).not.toHaveProperty(key);
    }
  }
  for (const name of ['policyTasks', 'toString', 'constructor', '__proto__']) {
    expect(() => scope.repository(name)).toThrowError(
      expect.objectContaining({ code: 'POLICY_REQUIRED', collection: name }),
    );
  }
}

describeIntegrationDatabases('DatabaseConnection.restrict', (context) => {
  it('denies unlisted collections and exposes only restricted capabilities, including in savepoints', async () => {
    await createTenantFixture(context);
    expect(context.connection).not.toHaveProperty('scope');
    const scope = context.connection.restrict(tenantPolicies, undefined);
    assertRestricted(scope);
    await scope.transaction(async (transaction) => {
      assertRestricted(transaction);
      await transaction.transaction(async (savepoint) => {
        assertRestricted(savepoint);
        expect(await savepoint.repository('policyProjects').count()).toBe(2);
      });
    });
    const empty: DatabaseScope = context.connection.restrict({}, undefined);
    expect(() => empty.repository('policyProjects')).toThrowError(
      expect.objectContaining({ code: 'POLICY_REQUIRED' }),
    );
    const bound = context.connection.withPolicies(tenantPolicies, undefined);
    expect(await bound.repository('policyProjects').count()).toBe(2);
    expect(await bound.repository('policyTasks').count()).toBe(5);
    expect(await bound.client()).toBe(await context.connection.client());
    expect(bound).not.toHaveProperty('restrict');
    await bound.transaction(async (transaction) => {
      expect(await transaction.repository('policyProjects').count()).toBe(2);
      expect(await transaction.repository('policyTasks').count()).toBe(5);
      expect(transaction).toHaveProperty('query');
      expect(transaction).not.toHaveProperty('restrict');
    });
  });

  it('enforces rows, fields and writes, and can narrow without widening or changing its parent', async () => {
    await createTenantFixture(context);
    const scope = context.connection.restrict(tenantPolicies, undefined);
    const projects = scope.repository('policyProjects');
    expect(
      await projects.findMany({ sort: (sort) => sort.field('id').asc() }),
    ).toEqual([
      { id: 'p1', name: 'Mine one' },
      { id: 'p2', name: 'Mine two' },
    ]);
    expect(await projects.findOne({ filter: { id: 'p3' } })).toBeUndefined();
    expect(await projects.exists({ filter: { id: 'p3' } })).toBe(false);
    const narrowed = projects.narrow({
      read: { scope: { id: 'p1' }, fields: ['id'] },
      update: false,
    });
    expect(await narrowed.findMany()).toEqual([{ id: 'p1' }]);
    expect(await narrowed.narrow({ read: true }).findMany()).toEqual([
      { id: 'p1' },
    ]);
    expect(await projects.count()).toBe(2);
    await expect(
      narrowed.updateOne({ filter: { id: 'p1' }, values: { name: 'Denied' } }),
    ).rejects.toMatchObject({ code: 'WRITE_FORBIDDEN' });
    await projects.createOne({ values: { id: 'p4', name: 'New' } });
    expect(
      await context.connection.repository('policyProjects').findOne({
        filter: { id: 'p4' },
        select: selection(['tenantId']),
      }),
    ).toEqual({ tenantId: 'T1' });
    expect(
      await projects.updateMany({ all: true, values: { name: 'Mine' } }),
    ).toEqual({ updatedCount: 3 });
    expect(
      await context.connection.repository('policyProjects').findOne({
        filter: { id: 'p3' },
        select: selection(['name']),
      }),
    ).toEqual({ name: 'Theirs' });
  });

  it('evaluates principal policies once and isolates bindings from later input changes', async () => {
    await createTenantFixture(context);
    const principal = { tenantId: 'T1' };
    const policy = {
      ...tenantPolicies.policyProjects,
      read: { scope: { tenantId: principal.tenantId }, fields: ['id'] },
    };
    const factory = vi.fn(() => policy);
    const scope = context.connection.restrict(
      { policyProjects: factory },
      principal,
    );
    principal.tenantId = 'T2';
    policy.read.scope.tenantId = 'T2';
    policy.read.fields.push('budget');
    const other = context.connection.restrict(
      {
        policyProjects: {
          ...tenantPolicies.policyProjects,
          read: { scope: { tenantId: 'T2' }, fields: ['id'] },
        },
      },
      undefined,
    );
    expect(
      await scope
        .repository('policyProjects')
        .findMany({ sort: (sort) => sort.field('id').asc() }),
    ).toEqual([{ id: 'p1' }, { id: 'p2' }]);
    expect(await other.repository('policyProjects').findMany()).toEqual([
      { id: 'p3' },
    ]);
    await scope.transaction(async (transaction) => {
      await transaction.transaction(async (savepoint) => {
        expect(await savepoint.repository('policyProjects').count()).toBe(2);
      });
    });
    expect(factory).toHaveBeenCalledExactlyOnceWith(principal);
  });

  it('preserves commit and rollback semantics across transactions and savepoints', async () => {
    await createTenantFixture(context);
    const scope = context.connection.restrict(tenantPolicies, undefined);
    const callbacks: string[] = [];
    const aborted = new Error('abort savepoint');
    const result = await scope.transaction(async (transaction) => {
      transaction.afterCommit(() => {
        callbacks.push('outer commit');
      });
      await transaction.repository('policyProjects').updateOne({
        filter: { id: 'p1' },
        values: { name: 'Committed' },
      });
      await expect(
        transaction.transaction(async (savepoint) => {
          savepoint.afterCommit(() => {
            callbacks.push('discarded commit');
          });
          savepoint.afterRollback((error) => {
            expect(error).toBe(aborted);
            callbacks.push('savepoint rollback');
          });
          await savepoint
            .repository('policyProjects')
            .deleteOne({ filter: { id: 'p2' } });
          throw aborted;
        }),
      ).rejects.toBe(aborted);
      await transaction.transaction(async (savepoint) => {
        savepoint.afterCommit(() => {
          callbacks.push('savepoint commit');
        });
      });
      expect(callbacks).toEqual(['savepoint rollback']);
      return 42;
    });
    expect(result).toBe(42);
    expect(callbacks).toEqual([
      'savepoint rollback',
      'outer commit',
      'savepoint commit',
    ]);
    await expect(
      scope.transaction(async (transaction) => {
        await transaction.transaction(async (savepoint) => {
          savepoint.afterRollback(() => {
            callbacks.push('outer rollback');
          });
          await savepoint
            .repository('policyProjects')
            .deleteOne({ filter: { id: 'p1' } });
        });
        throw aborted;
      }),
    ).rejects.toBe(aborted);
    expect(callbacks.at(-1)).toBe('outer rollback');
    expect(
      await scope
        .repository('policyProjects')
        .findMany({ sort: (sort) => sort.field('id').asc() }),
    ).toEqual([
      { id: 'p1', name: 'Committed' },
      { id: 'p2', name: 'Mine two' },
    ]);
  });

  it('expands read references once while preserving the source policy for relation access', async () => {
    await createTenantFixture(context);
    const scope = context.connection.restrict(
      {
        policyProjects: {
          ...tenantPolicies.policyProjects,
          read: {
            scope: { tenantId: 'T1' },
            fields: ['id'],
            relations: { tasks: ref('policyTasks') },
          },
        },
        policyTasks: {
          read: { scope: { tenantId: 'T1' }, fields: ['id'] },
          create: false,
          update: false,
          delete: false,
        },
      },
      undefined,
    );
    await scope.transaction(async (transaction) => {
      expect(
        await transaction.repository('policyProjects').findMany({
          filter: { id: 'p1' },
          select: {
            kind: 'select',
            version: 1,
            root: {
              kind: 'selection',
              fields: ['id'],
              includes: [
                {
                  kind: 'include',
                  relation: 'tasks',
                  select: { kind: 'selection', fields: ['id'], includes: [] },
                },
              ],
            },
          },
        }),
      ).toEqual([{ id: 'p1', tasks: [{ id: 't1' }] }]);
    });
  });

  it('detaches mutable dates from policy explanations and retains explicit prototype-like keys', async () => {
    const timestamp = new Date('2026-01-01T00:00:00Z');
    const policy = {
      read: true,
      update: false,
      delete: false,
      create: { scope: true, defaults: { createdAt: timestamp } },
    } as const;
    const policies: DatabaseScopePolicies<undefined> = Object.fromEntries([
      ['policyProjects', policy],
      ['__proto__', policy],
      ['constructor', policy],
    ]);
    const scope = context.connection.restrict(policies, undefined);
    timestamp.setFullYear(2030);
    const explanation = scope.explainPolicies();
    expect(Object.keys(explanation).sort()).toEqual([
      '__proto__',
      'constructor',
      'policyProjects',
    ]);
    expect(Object.isFrozen(explanation)).toBe(true);
    for (const snapshot of [
      explanation.policyProjects,
      scope.repository('policyProjects').explainPolicy(),
    ]) {
      if (typeof snapshot.create !== 'object')
        throw new Error('Expected create rules');
      const date = snapshot.create.defaults.createdAt as Date;
      expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      date.setFullYear(2040);
    }
    await scope.transaction(async (transaction) => {
      const current = transaction.explainPolicies().policyProjects;
      if (typeof current.create !== 'object')
        throw new Error('Expected create rules');
      expect((current.create.defaults.createdAt as Date).toISOString()).toBe(
        '2026-01-01T00:00:00.000Z',
      );
    });
  });
});
