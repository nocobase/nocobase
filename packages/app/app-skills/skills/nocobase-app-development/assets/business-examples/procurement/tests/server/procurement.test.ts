import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';
import {
  signIn,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../server/standalone.js';
import type { ProcurementDetail } from '../../shared/procurement.js';
import { resetProcurement } from '../../server/providers/procurement-reset.js';

const test = createAppTest({
  scope: 'test',
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    logging: { enabled: false },
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      emailAndPassword: { disableSignUp: false },
    },
  },
});
const write = (
  input: unknown,
  method = 'POST',
  key = `${Date.now()}.${randomUUID()}`,
) => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'Idempotency-Key': key,
  },
  body: JSON.stringify(input),
});
async function fixture(app: TestApp) {
  const caseId = randomUUID();
  const authz = app.application.container.resolve(authorizationToken);
  const users: Record<string, TestSession> = {};
  for (const [name, role] of [
    ['owner', 'applicant'],
    ['other', 'applicant'],
    ['reviewer', 'reviewer'],
    ['otherReviewer', 'reviewer'],
    ['member', ''],
  ] as const) {
    const credentials = {
      name,
      email: `${name}-${caseId}@procurement.example.test`,
      password: 'test-procurement-password',
    };
    expect(
      (await app.request('/auth/sign-up/email', write(credentials))).status,
    ).toBe(200);
    users[name] = await signIn(app, credentials);
    if (role)
      await authz.permissionSets.assign({
        id: randomUUID(),
        permissionSet: `procurement-${role}`,
        subject: { type: 'user', id: users[name].user.id },
      });
  }
  const supplierId = randomUUID(),
    materialId = randomUUID();
  await app.connection.repository('procurementSuppliers').createOne({
    values: {
      id: supplierId,
      name: 'Atlas Office',
      active: true,
      allowedUserId: null,
    },
  });
  await app.connection.repository('procurementMaterials').createOne({
    values: {
      id: materialId,
      name: 'Notebook',
      active: true,
      allowedUserId: null,
      unitPriceMinor: 1250,
    },
  });
  const input = {
    title: 'Office supplies',
    supplierId,
    reviewerId: users.reviewer.user.id,
    lines: [{ materialId, quantity: 2, unitPrice: '12.50' }],
    totalMinor: 2500,
  };
  const create = async (body = input, session = users.owner, key?: string) =>
    session.fetch('/procurement', write(body, 'POST', key));
  const get = async (id: string, session = users.owner) =>
    (
      (await (await session.fetch(`/procurement/${id}`)).json()) as {
        data: ProcurementDetail;
      }
    ).data;
  const fire = async (
    id: string,
    transition: string,
    version: number,
    session = users.owner,
    requestId = randomUUID(),
  ) =>
    session.fetch(
      `/procurement/${id}/fire`,
      write({ transition, version, requestId }),
    );
  return { users, supplierId, materialId, input, create, get, fire };
}

test('native permissions, scoped lists, references and parent/child tampering are enforced on every entry', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  expect((await testApp.request('/procurement')).status).toBe(401);
  expect((await f.users.member.fetch('/procurement')).status).toBe(403);
  expect(
    (await f.users.member.fetch('/procurement?status=invalid')).status,
  ).toBe(403);
  expect((await f.users.member.fetch('/procurement', write({}))).status).toBe(
    403,
  );
  expect(
    (await f.users.reviewer.fetch('/procurement/candidates?kind=materials'))
      .status,
  ).toBe(403);
  expect(
    (await f.users.reviewer.fetch('/procurement/candidates?kind=invalid'))
      .status,
  ).toBe(403);
  const id = (await (await f.create()).json()).data.id;
  for (const actor of ['other', 'reviewer', 'otherReviewer', 'member'])
    expect((await f.users[actor].fetch(`/procurement/${id}`)).status).toBe(
      actor === 'member' ? 403 : 404,
    );
  expect(
    (await (await f.users.other.fetch('/procurement')).json()).data,
  ).toEqual([]);
  for (const extra of [
    { applicantId: f.users.other.user.id },
    { status: 'approved' },
    { totalMinor: 2499 },
  ])
    expect(
      (
        await f.users.owner.fetch(
          '/procurement',
          write({ ...f.input, ...extra }),
        )
      ).status,
    ).toBe(400);
  const otherId = (await (await f.create(f.input, f.users.other)).json()).data
    .id;
  const foreignLine = (await f.get(otherId, f.users.other)).lines[0];
  const version = (await f.get(id)).record.lifecycleVersion;
  expect(
    (
      await f.users.owner.fetch(
        `/procurement/${id}`,
        write(
          {
            ...f.input,
            lines: [{ ...f.input.lines[0], id: foreignLine.id }],
            version,
          },
          'PATCH',
        ),
      )
    ).status,
  ).toBe(403);
  for (const active of [true, false]) {
    const restrictedId = randomUUID();
    await testApp.connection.repository('procurementMaterials').createOne({
      values: {
        id: restrictedId,
        name: 'Hidden material',
        active,
        allowedUserId: f.users.other.user.id,
        unitPriceMinor: 100,
      },
    });
    expect(
      (
        await f.create({
          ...f.input,
          lines: [{ materialId: restrictedId, quantity: 1, unitPrice: '1.00' }],
          totalMinor: 100,
        })
      ).status,
    ).toBe(403);
  }
  const candidates = await (
    await f.users.owner.fetch(
      '/procurement/candidates?kind=materials&q=Note&active=true',
    )
  ).json();
  expect(candidates.data.map((r: { id: string }) => r.id)).toEqual([
    f.materialId,
  ]);
  const supplierId = randomUUID();
  await testApp.connection.repository('procurementSuppliers').createOne({
    values: {
      id: supplierId,
      name: 'Restricted supplier',
      active: true,
      allowedUserId: f.users.other.user.id,
    },
  });
  expect((await f.create({ ...f.input, supplierId })).status).toBe(403);
  expect(
    (
      await (
        await f.users.owner.fetch(
          '/procurement/candidates?kind=suppliers&q=Restricted',
        )
      ).json()
    ).data,
  ).toEqual([]);
  expect(
    (
      await (
        await f.users.owner.fetch(
          '/procurement/candidates?kind=materials&active=false',
        )
      ).json()
    ).data,
  ).toEqual([]);
  expect(
    (await f.create({ ...f.input, reviewerId: f.users.owner.user.id })).status,
  ).toBe(400);
  expect(
    (await f.create({ ...f.input, reviewerId: f.users.member.user.id })).status,
  ).toBe(400);
  expect(
    (
      await f.users.other.fetch(
        `/procurement/${id}`,
        write({ ...f.input, version }, 'PATCH'),
      )
    ).status,
  ).toBe(404);
});

test('draft, submit, reject, edit, resubmit and approval preserve snapshots and legal actions', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const id = (await (await f.create()).json()).data.id;
  let detail = await f.get(id);
  expect(detail.actions).toEqual({
    edit: true,
    submit: true,
    approve: false,
    reject: false,
  });
  expect(detail.lines[0]).toMatchObject({
    materialName: 'Notebook',
    amountMinor: 2500,
    unitPrice: '12.50',
  });
  expect(
    (await f.fire(id, 'submit', detail.record.lifecycleVersion)).status,
  ).toBe(200);
  detail = await f.get(id);
  expect(detail.record.status).toBe('submitted');
  expect(
    (
      await (
        await f.users.owner.fetch(
          '/procurement?q=Office&status=submitted&pageSize=1',
        )
      ).json()
    ).meta,
  ).toMatchObject({ total: 1, pageSize: 1 });
  expect(
    (await (await f.users.owner.fetch('/procurement?status=draft')).json())
      .data,
  ).toEqual([]);
  expect(detail.actions.edit).toBe(false);
  expect(
    (
      await f.users.owner.fetch(
        `/procurement/${id}`,
        write({ ...f.input, version: detail.record.lifecycleVersion }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
  expect(
    (await f.fire(id, 'approve', detail.record.lifecycleVersion, f.users.owner))
      .status,
  ).toBe(403);
  expect(
    (
      await f.fire(
        id,
        'approve',
        detail.record.lifecycleVersion,
        f.users.otherReviewer,
      )
    ).status,
  ).toBe(404);
  expect(
    (
      await f.fire(
        id,
        'reject',
        detail.record.lifecycleVersion,
        f.users.reviewer,
      )
    ).status,
  ).toBe(200);
  detail = await f.get(id);
  expect(
    (
      await f.users.owner.fetch(
        `/procurement/${id}`,
        write(
          {
            ...f.input,
            title: 'Revised purchase',
            version: detail.record.lifecycleVersion,
          },
          'PATCH',
        ),
      )
    ).status,
  ).toBe(200);
  detail = await f.get(id);
  expect(
    (await f.fire(id, 'submit', detail.record.lifecycleVersion)).status,
  ).toBe(200);
  detail = await f.get(id, f.users.reviewer);
  expect(detail.actions).toEqual({
    edit: false,
    submit: false,
    approve: true,
    reject: true,
  });
  expect(
    (
      await f.fire(
        id,
        'approve',
        detail.record.lifecycleVersion,
        f.users.reviewer,
      )
    ).status,
  ).toBe(200);
  detail = await f.get(id);
  expect(detail.record).toMatchObject({
    title: 'Revised purchase',
    status: 'approved',
    totalMinor: 2500,
  });
  expect(detail.history.map((h) => h.to)).toEqual([
    'draft',
    'submitted',
    'rejected',
    'submitted',
    'approved',
  ]);
  expect(
    (
      await f.users.owner.fetch(
        `/procurement/${id}`,
        write({ ...f.input, version: detail.record.lifecycleVersion }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
});

test('rejects invalid amounts, incomplete submissions and stale/concurrent operations without duplicate effects', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  for (const line of [
    { quantity: 0, unitPrice: '1.00' },
    { quantity: 1.5, unitPrice: '1.00' },
    { quantity: 1, unitPrice: '-1.00' },
    { quantity: 1, unitPrice: '1.001' },
    { quantity: 100000, unitPrice: '9999999.99' },
  ])
    expect(
      (
        await f.create({
          ...f.input,
          lines: [{ materialId: f.materialId, ...line }],
          totalMinor: 0,
        })
      ).status,
    ).toBe(400);
  const draft = await f.create({
    ...f.input,
    title: '',
    supplierId: null,
    reviewerId: null,
    lines: [],
    totalMinor: 0,
  });
  expect(draft.status).toBe(200);
  const emptyId = (await draft.json()).data.id;
  expect(
    (
      await f.fire(
        emptyId,
        'submit',
        (await f.get(emptyId)).record.lifecycleVersion,
      )
    ).status,
  ).toBe(400);
  const operation = `${Date.now()}.${randomUUID()}`;
  const creates = await Promise.all([
    f.create(f.input, f.users.owner, operation),
    f.create(f.input, f.users.owner, operation),
  ]);
  expect(creates.map((r) => r.status)).toEqual([200, 200]);
  const ids = await Promise.all(
    creates.map(async (r) => (await r.json()).data.id),
  );
  expect(new Set(ids).size).toBe(1);
  const id = ids[0];
  const version = (await f.get(id)).record.lifecycleVersion;
  const submissions = await Promise.all([
    f.fire(id, 'submit', version),
    f.fire(id, 'submit', version),
  ]);
  expect(submissions.filter((r) => r.ok)).toHaveLength(1);
  const stale = await f.users.owner.fetch(
    `/procurement/${id}`,
    write({ ...f.input, version }, 'PATCH'),
  );
  expect(stale.ok).toBe(false);
  const current = await f.get(id);
  const decisions = await Promise.all([
    f.fire(id, 'approve', current.record.lifecycleVersion, f.users.reviewer),
    f.fire(id, 'reject', current.record.lifecycleVersion, f.users.reviewer),
  ]);
  expect(decisions.filter((r) => r.ok)).toHaveLength(1);
  expect((await f.get(id)).history).toHaveLength(3);
});

test('applicant quotes are validated snapshots while catalog references and actor names stay current', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const quoted = {
    ...f.input,
    lines: [{ materialId: f.materialId, quantity: 2, unitPrice: '0.01' }],
    totalMinor: 2,
  };
  for (const unitPrice of ['-0.01', '0.001', '1e2', 'NaN', '']) {
    expect(
      (
        await f.create({
          ...quoted,
          lines: [{ ...quoted.lines[0], unitPrice }],
        })
      ).status,
    ).toBe(400);
  }
  expect((await f.create({ ...quoted, totalMinor: 2500 })).status).toBe(400);
  const response = await f.create(quoted);
  expect(response.status).toBe(200);
  const id = (await response.json()).data.id;
  let detail = await f.get(id);
  expect(detail.lines[0]).toMatchObject({
    unitPrice: '0.01',
    unitPriceMinor: 1,
    amountMinor: 2,
    currentCatalogPriceMinor: 1250,
  });
  const snapshot = { ...detail.lines[0], currentCatalogPriceMinor: undefined };
  await testApp.connection
    .repository('procurementMaterials')
    .updateOne({
      filter: { id: f.materialId },
      values: { unitPriceMinor: 1800 },
    });
  expect(
    (await f.fire(id, 'submit', detail.record.lifecycleVersion)).status,
  ).toBe(200);
  detail = await f.get(id, f.users.reviewer);
  expect({ ...detail.lines[0], currentCatalogPriceMinor: undefined }).toEqual(
    snapshot,
  );
  expect(detail.lines[0].currentCatalogPriceMinor).toBe(1800);
  expect(detail.record.totalMinor).toBe(2);
  expect(detail.history.every((h) => h.actorName === 'owner')).toBe(true);
  expect(
    (
      await f.fire(
        id,
        'approve',
        detail.record.lifecycleVersion,
        f.users.reviewer,
      )
    ).status,
  ).toBe(200);
  detail = await f.get(id);
  expect(detail.history.at(-1)?.actorName).toBe('reviewer');
  expect(detail.record.totalMinor).toBe(2);
  // Zero is a valid applicant quote; it is not replaced by a catalog price.
  expect(
    (
      await f.create({
        ...quoted,
        lines: [{ ...quoted.lines[0], unitPrice: '0.00' }],
        totalMinor: 0,
      })
    ).status,
  ).toBe(200);
});

test('reviewer choices include eligible users beyond the first hundred ordinary users', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  await testApp.connection.repository('user').createMany({
    values: Array.from({ length: 120 }, (_, i) => ({
      id: `000-ordinary-${String(i).padStart(3, '0')}`,
      name: `Ordinary ${i}`,
      email: `ordinary-${i}@procurement.example.test`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  });
  const response = await f.users.owner.fetch(
    '/procurement/candidates?kind=reviewers',
  );
  expect(response.status).toBe(200);
  const choices = (await response.json()).data as { id: string }[];
  expect(choices.map((u) => u.id)).toContain(f.users.reviewer.user.id);
  expect(choices.map((u) => u.id)).not.toContain(f.users.member.user.id);
  expect(choices.some((u) => u.id.startsWith('000-ordinary'))).toBe(false);
});

test('a failure after the first real child insert rolls back creation and editing including history', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const id = (await (await f.create()).json()).data.id;
  const before = await f.get(id);
  const count = await testApp.connection
    .repository('procurementRequests')
    .count();
  const historyCount = await testApp.connection
    .repository('lifecycleExampleTransitions')
    .count({ filter: { lifecycle: 'procurement' } });
  let writes = 0;
  const off = testApp.connection.onRepositoryMutation(
    { collections: ['procurementLines'] },
    {
      inTransaction: async (event, tx) => {
        if (event.operation !== 'createOne') return;
        expect(await tx.repository('procurementLines').count()).toBeGreaterThan(
          0,
        );
        writes += 1;
        throw new Error('Injected failure after a persisted child write');
      },
    },
  );
  try {
    expect((await f.create()).status).toBe(500);
    expect(
      await testApp.connection.repository('procurementRequests').count(),
    ).toBe(count);
    expect(
      (
        await f.users.owner.fetch(
          `/procurement/${id}`,
          write(
            {
              ...f.input,
              title: 'Must roll back',
              version: before.record.lifecycleVersion,
            },
            'PATCH',
          ),
        )
      ).status,
    ).toBe(500);
  } finally {
    off();
  }
  expect(writes).toBe(2);
  expect(await f.get(id)).toEqual(before);
  expect(await testApp.connection.repository('procurementLines').count()).toBe(
    1,
  );
  expect(
    await testApp.connection
      .repository('lifecycleExampleTransitions')
      .count({ filter: { lifecycle: 'procurement' } }),
  ).toBe(historyCount);
  expect(await resetProcurement(testApp.connection, true)).toEqual({
    requests: 1,
    lines: 1,
    dryRun: true,
  });
  expect(await f.get(id)).toEqual(before);
  expect(await resetProcurement(testApp.connection, false)).toEqual({
    requests: 1,
    lines: 1,
    dryRun: false,
  });
  expect(
    await testApp.connection.repository('procurementRequests').count(),
  ).toBe(0);
  expect(await testApp.connection.repository('procurementLines').count()).toBe(
    0,
  );
  expect(
    await testApp.connection
      .repository('lifecycleExampleTransitions')
      .count({ filter: { lifecycle: 'procurement' } }),
  ).toBe(0);
  expect(
    await testApp.connection.repository('procurementMaterials').count(),
  ).toBe(1);
  expect(
    await testApp.connection.repository('procurementSuppliers').count(),
  ).toBe(1);
  expect(
    await testApp.application.container
      .resolve(authorizationToken)
      .permissionSets.get('procurement-applicant'),
  ).toBeTruthy();
});
