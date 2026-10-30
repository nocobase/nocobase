import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest, type TestApp } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
  type TestSession,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { createStandaloneServer } from '../../server/standalone.js';
import {
  emptyOnboarding,
  type OnboardingDetail,
  type OnboardingInput,
} from '../../shared/onboarding.js';
import { resetOnboarding } from '../../server/providers/onboarding-reset.js';
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
  const users: Record<string, TestSession> = {};
  const authz = app.application.container.resolve(authorizationToken);
  for (const [name, role] of [
    ['owner', 'coordinator'],
    ['other', 'coordinator'],
    ['viewer', 'viewer'],
    ['member', ''],
  ] as const) {
    const credentials = {
      name,
      email: `${name}-${randomUUID()}@onboarding.example.test`,
      password: 'synthetic-onboarding-password',
    };
    expect(
      (await app.request('/auth/sign-up/email', write(credentials))).status,
    ).toBe(200);
    users[name] = await signIn(app, credentials);
    if (role)
      await authz.permissionSets.assign({
        id: randomUUID(),
        permissionSet: `onboarding-${role}`,
        subject: { type: 'user', id: users[name].user.id },
      });
  }
  const departmentId = randomUUID();
  await app.connection.repository('onboardingDepartments').createOne({
    values: {
      id: departmentId,
      name: 'Engineering',
      active: true,
      allowedUserId: null,
    },
  });
  const input: OnboardingInput = {
    fullName: 'Example employee',
    workEmail: `employee-${randomUUID()}@example.test`,
    nationality: 'CN',
    departmentId,
    jobTitle: 'Engineer',
    employmentType: 'fullTime',
    startDate: '2026-12-01',
    probationMonths: 3,
    contractEndDate: '',
    documents: [
      {
        kind: 'identity',
        title: 'Identity record',
        referenceNo: 'SYNTHETIC-001',
      },
    ],
  };
  const create = async (
    body: OnboardingInput = input,
    session = users.owner,
    key?: string,
  ) => session.fetch('/onboarding', write(body, 'POST', key));
  const get = async (
    id: string,
    session = users.owner,
  ): Promise<OnboardingDetail> =>
    (await (await session.fetch(`/onboarding/${id}`)).json()).data;
  const submit = async (
    id: string,
    version: number,
    session = users.owner,
    key?: string,
  ) =>
    session.fetch(
      `/onboarding/${id}/fire`,
      write({ transition: 'submit', version }, 'POST', key),
    );
  return { users, input, departmentId, create, get, submit };
}
test('native roles keep drafts private on lists, detail, save, submit and receipt replay', async ({
  testApp: app,
}) => {
  const f = await fixture(app);
  for (const [url, init] of [
    ['/onboarding', undefined],
    ['/onboarding', write(f.input)],
    ['/onboarding/candidates?kind=departments', undefined],
  ] as const)
    expect((await app.request(url, init)).status).toBe(401);
  expect((await f.users.member.fetch('/onboarding')).status).toBe(403);
  expect(
    (await f.users.viewer.fetch('/onboarding/candidates?kind=departments'))
      .status,
  ).toBe(403);
  const key = `${Date.now()}.${randomUUID()}`;
  const id = (await (await f.create(f.input, f.users.owner, key)).json()).data
    .id;
  const version = (await f.get(id)).record.lifecycleVersion;
  const administrator = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
  expect((await administrator.fetch(`/onboarding/${id}`)).status).toBe(404);
  for (const name of ['other', 'viewer']) {
    expect((await f.users[name].fetch(`/onboarding/${id}`)).status).toBe(404);
    expect(
      (
        await f.users[name].fetch(
          `/onboarding/${id}`,
          write({ ...f.input, version }, 'PATCH'),
        )
      ).status,
    ).toBe(name === 'viewer' ? 403 : 404);
    expect((await f.submit(id, version, f.users[name])).status).toBe(
      name === 'viewer' ? 403 : 404,
    );
    expect(
      (await (await f.users[name].fetch('/onboarding')).json()).data,
    ).toEqual([]);
  }
  for (const extra of [
    { coordinatorId: f.users.other.user.id },
    { status: 'submitted' },
    { employeeId: randomUUID() },
  ])
    expect(
      (
        await f.users.owner.fetch(
          '/onboarding',
          write({ ...f.input, ...extra }),
        )
      ).status,
    ).toBe(400);
  const otherId = (
    await (
      await f.create(
        { ...f.input, workEmail: 'other@example.test' },
        f.users.other,
      )
    ).json()
  ).data.id;
  const foreign = (await f.get(otherId, f.users.other)).documents[0].id;
  expect(
    (
      await f.users.owner.fetch(
        `/onboarding/${id}`,
        write(
          {
            ...f.input,
            documents: [{ ...f.input.documents[0], id: foreign }],
            version,
          },
          'PATCH',
        ),
      )
    ).status,
  ).toBe(403);
  // Revoked current permission must also deny replaying a previously successful receipt.
  const assignments = await app.connection
    .repository('authorizationPermissionSetAssignments')
    .findMany({ filter: { subjectId: f.users.owner.user.id } });
  expect(assignments.length).toBeGreaterThan(0);
  await app.connection
    .repository('authorizationPermissionSetAssignments')
    .deleteMany({ filter: { subjectId: f.users.owner.user.id } });
  expect((await f.create(f.input, f.users.owner, key)).status).toBe(403);
});
test('draft recovery, complete validation, conditional fields and cross-step documents are enforced at final submit', async ({
  testApp: app,
}) => {
  const f = await fixture(app);
  for (const invalid of [
    { workEmail: 'bad' },
    { startDate: '2026-02-30' },
    { probationMonths: 0 },
  ])
    expect((await f.create({ ...f.input, ...invalid })).status).toBe(400);
  for (const patch of [
    emptyOnboarding,
    { probationMonths: null },
    { nationality: 'US' },
    { employmentType: 'contractor' as const, contractEndDate: '2026-11-30' },
    { employmentType: 'contractor' as const, contractEndDate: '2027-01-01' },
    { documents: [{ kind: 'identity' as const, title: '', referenceNo: '' }] },
  ]) {
    const body = { ...f.input, ...patch };
    const saved = await f.create(body);
    expect(saved.status).toBe(200);
    const id = (await saved.json()).data.id;
    const detail = await f.get(id);
    expect(detail.record.fullName).toBe(body.fullName);
    expect((await f.submit(id, detail.record.lifecycleVersion)).status).toBe(
      400,
    );
    expect((await f.get(id)).record.status).toBe('draft');
  }
  const contractor = {
    ...f.input,
    employmentType: 'contractor' as const,
    nationality: 'US',
    probationMonths: null,
    contractEndDate: '2027-01-01',
    documents: [
      ...f.input.documents,
      {
        kind: 'workPermit' as const,
        title: 'Work permit',
        referenceNo: 'WP-SYNTHETIC',
      },
      {
        kind: 'serviceAgreement' as const,
        title: 'Agreement',
        referenceNo: 'SA-SYNTHETIC',
      },
    ],
  };
  const id = (await (await f.create(contractor)).json()).data.id;
  expect(
    (await f.submit(id, (await f.get(id)).record.lifecycleVersion)).status,
  ).toBe(200);
  const submitted = await f.get(id, f.users.viewer);
  expect(submitted.record).toMatchObject({
    status: 'submitted',
    employeeId: submitted.employee?.id,
  });
  expect(submitted.employee).toMatchObject({
    caseId: id,
    workEmail: f.input.workEmail,
  });
  expect(submitted.actions).toEqual({ edit: false, submit: false });
  expect(
    (
      await (
        await f.users.viewer.fetch('/onboarding?status=submitted&q=Example')
      ).json()
    ).meta.total,
  ).toBe(1);
});
test('rechecks department availability and scope on save and submit', async ({
  testApp: app,
}) => {
  const f = await fixture(app);
  const id = (await (await f.create()).json()).data.id;
  for (const values of [
    { active: false, allowedUserId: null },
    { active: true, allowedUserId: f.users.other.user.id },
  ]) {
    await app.connection
      .repository('onboardingDepartments')
      .updateOne({ filter: { id: f.departmentId }, values });
    expect((await f.create()).status).toBe(403);
    expect(
      (await f.submit(id, (await f.get(id)).record.lifecycleVersion)).status,
    ).toBe(403);
    expect(
      (
        await (
          await f.users.owner.fetch('/onboarding/candidates?kind=departments')
        ).json()
      ).data,
    ).toEqual([]);
  }
  expect(await app.connection.repository('onboardingEmployees').count()).toBe(
    0,
  );
});
test('same-key retries replay and different-key races, stale saves and duplicate emails produce only one employee', async ({
  testApp: app,
}) => {
  const f = await fixture(app);
  const key = `${Date.now()}.${randomUUID()}`;
  const creates = await Promise.all([
    f.create(f.input, f.users.owner, key),
    f.create(f.input, f.users.owner, key),
  ]);
  expect(creates.map((r) => r.status)).toEqual([200, 200]);
  const ids = await Promise.all(
    creates.map(async (r) => (await r.json()).data.id),
  );
  expect(new Set(ids).size).toBe(1);
  const id = ids[0];
  const original = await f.get(id);
  const saveKey = `${Date.now()}.${randomUUID()}`;
  const update = {
    ...f.input,
    fullName: 'Updated employee',
    version: original.record.lifecycleVersion,
  };
  expect(
    (
      await f.users.owner.fetch(
        `/onboarding/${id}`,
        write(update, 'PATCH', saveKey),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await f.users.owner.fetch(
        `/onboarding/${id}`,
        write(update, 'PATCH', saveKey),
      )
    ).headers.get('Idempotency-Replayed'),
  ).toBe('true');
  expect(
    (await f.users.owner.fetch(`/onboarding/${id}`, write(update, 'PATCH')))
      .status,
  ).toBe(409);
  const version = (await f.get(id)).record.lifecycleVersion;
  const submitKey = `${Date.now()}.${randomUUID()}`;
  const replies = await Promise.all([
    f.submit(id, version, f.users.owner, submitKey),
    f.submit(id, version, f.users.owner, submitKey),
  ]);
  expect(replies.map((r) => r.status)).toEqual([200, 200]);
  expect(
    replies.some((r) => r.headers.get('Idempotency-Replayed') === 'true'),
  ).toBe(true);
  expect((await f.submit(id, version)).status).toBe(409);
  expect(
    (
      await f.users.owner.fetch(
        `/onboarding/${id}`,
        write({ ...f.input, version }, 'PATCH'),
      )
    ).status,
  ).toBe(409);
  const second = (
    await (
      await f.create({ ...f.input, workEmail: f.input.workEmail.toUpperCase() })
    ).json()
  ).data.id;
  expect(
    (await f.submit(second, (await f.get(second)).record.lifecycleVersion))
      .status,
  ).toBe(409);
  expect((await f.get(second)).record.status).toBe('draft');
  const raceInput = { ...f.input, workEmail: 'race@example.test' };
  const raceId = (await (await f.create(raceInput)).json()).data.id;
  const v = (await f.get(raceId)).record.lifecycleVersion;
  const races = await Promise.all([f.submit(raceId, v), f.submit(raceId, v)]);
  expect(races.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(await app.connection.repository('onboardingEmployees').count()).toBe(
    2,
  );
  expect((await f.get(id)).history.map((h) => h.to)).toEqual([
    'draft',
    'submitted',
  ]);
  expect((await f.get(raceId)).history.map((h) => h.to)).toEqual([
    'draft',
    'submitted',
  ]);
  expect(
    (await f.submit(id, (await f.get(id)).record.lifecycleVersion)).status,
  ).toBe(409);
  const crossInput = { ...f.input, workEmail: 'cross-case@example.test' };
  const crossIds = await Promise.all([
    f.create(crossInput),
    f.create(crossInput),
  ]).then((replies) =>
    Promise.all(replies.map(async (r) => (await r.json()).data.id)),
  );
  const cross = await Promise.all(
    crossIds.map(async (id) =>
      f.submit(id, (await f.get(id)).record.lifecycleVersion),
    ),
  );
  expect(cross.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(
    await app.connection
      .repository('onboardingEmployees')
      .count({ filter: { workEmail: crossInput.workEmail } }),
  ).toBe(1);
  const editId = (
    await (
      await f.create({ ...f.input, workEmail: 'edit-race@example.test' })
    ).json()
  ).data.id;
  const editVersion = (await f.get(editId)).record.lifecycleVersion;
  const editRace = await Promise.all([
    f.submit(editId, editVersion),
    f.users.owner.fetch(
      `/onboarding/${editId}`,
      write(
        {
          ...f.input,
          workEmail: 'edit-race@example.test',
          fullName: 'Concurrent edit',
          version: editVersion,
        },
        'PATCH',
      ),
    ),
  ]);
  expect(editRace.map((r) => r.status).sort()).toEqual([200, 409]);
  const after = await f.get(editId);
  expect(
    after.record.status === 'submitted'
      ? after.employee?.fullName === f.input.fullName
      : after.record.fullName === 'Concurrent edit',
  ).toBe(true);
});
test('child and employee write failures roll back the full transaction and reset preserves roles and dictionaries', async ({
  testApp: app,
}) => {
  const f = await fixture(app);
  const id = (await (await f.create()).json()).data.id;
  const before = await f.get(id);
  let writes = 0;
  const off = app.connection.onRepositoryMutation(
    { collections: ['onboardingDocuments'] },
    {
      inTransaction: async (event, tx) => {
        if (event.operation !== 'createOne') return;
        expect(
          await tx.repository('onboardingDocuments').count(),
        ).toBeGreaterThan(0);
        writes++;
        throw new Error('Injected failure after persisted document');
      },
    },
  );
  try {
    expect((await f.create()).status).toBe(500);
    expect(
      (
        await f.users.owner.fetch(
          `/onboarding/${id}`,
          write(
            {
              ...f.input,
              fullName: 'Must roll back',
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
  const offEmployee = app.connection.onRepositoryMutation(
    { collections: ['onboardingEmployees'] },
    {
      inTransaction: async (event, tx) => {
        if (event.operation !== 'createOne') return;
        expect(await tx.repository('onboardingEmployees').count()).toBe(1);
        throw new Error('Injected failure after persisted employee');
      },
    },
  );
  try {
    expect((await f.submit(id, before.record.lifecycleVersion)).status).toBe(
      500,
    );
  } finally {
    offEmployee();
  }
  expect(await f.get(id)).toEqual(before);
  expect(await app.connection.repository('onboardingEmployees').count()).toBe(
    0,
  );
  expect(await resetOnboarding(app.connection, true)).toEqual({
    cases: 1,
    documents: 1,
    employees: 0,
    dryRun: true,
  });
  expect(await f.get(id)).toEqual(before);
  expect((await f.submit(id, before.record.lifecycleVersion)).status).toBe(200);
  expect(await resetOnboarding(app.connection, false)).toEqual({
    cases: 1,
    documents: 1,
    employees: 1,
    dryRun: false,
  });
  expect(await app.connection.repository('onboardingCases').count()).toBe(0);
  expect(await app.connection.repository('onboardingDepartments').count()).toBe(
    1,
  );
  expect(
    await app.connection
      .repository('lifecycleExampleTransitions')
      .count({ filter: { lifecycle: 'onboarding' } }),
  ).toBe(0);
  expect(
    await app.application.container
      .resolve(authorizationToken)
      .permissionSets.get('onboarding-coordinator'),
  ).toBeTruthy();
  const document = await app.application.container
    .resolve(apiDocsToken)
    .getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  expect(
    findUndeclaredApiRoutes(app.application).filter((route) =>
      route.path.includes('onboarding'),
    ),
  ).toEqual([]);
  expect(document.paths?.['/api/onboarding/{id}/fire']?.post?.operationId).toBe(
    'onboardingSubmit',
  );
});
