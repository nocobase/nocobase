import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { CompositeResourceConditions } from '@nocobase/authorization/core';
import type {
  AuthorizationOptionsResponse,
  PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import { PROJECTS, QUOTES } from '../../server/sales-authorization.js';
import {
  projectReference,
  quoteResource,
} from '../../server/sales-resources.js';
import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { SharingRulesAuthorizationApi } from '@nocobase/authorization/sharing-rules';
import type { RestrictionRulesAuthorizationApi } from '@nocobase/authorization/restriction-rules';
import {
  adminRequest,
  createFixture,
  listIds,
  type SalesFixture,
} from '../helpers.js';

type SalesAuthorization = SalesFixture['authorization'] &
  DefaultAccessAuthorizationApi &
  SharingRulesAuthorizationApi &
  RestrictionRulesAuthorizationApi;

let fixture: SalesFixture;
let authz: SalesAuthorization;
beforeEach(async () => {
  fixture = await createFixture();
  authz = fixture.authorization as SalesAuthorization;
  await authz.permissionSets.create({ key: 'root', grants: [] });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: fixture.users.admin },
    permissionSet: 'root',
  });
});
afterEach(async () => {
  await fixture.database.disconnect();
});
const admin = (path: string, method?: string, body?: unknown) =>
  adminRequest(fixture, path, method, body);
const ids = (user: string, path?: string) => listIds(fixture, user, path);

it('saves all three rule types through their production HTTP routes and validates their targets', async () => {
  const resource = { type: 'composite', id: 'example.sales.projects' };
  const changed = await admin(
    'defaultAccess/example-default-projects',
    'PATCH',
    {
      key: 'example-default-projects',
      resource,
      actions: [
        { action: 'view', scopeKey: 'projects', selection: { type: 'all' } },
      ],
    },
  );
  expect(changed.status).toBe(200);
  expect(await changed.json()).toMatchObject({
    data: {
      key: 'example-default-projects',
      resource,
      actions: [
        { action: 'view', scopeKey: 'projects', selection: { type: 'all' } },
      ],
    },
  });
  expect(await ids('engineer')).toEqual([
    'project-1',
    'project-2',
    'project-3',
    'project-8',
  ]);
  expect(
    (
      await admin(
        'restrictionRules/example-public-authorizationExampleProjects',
        'DELETE',
      )
    ).status,
  ).toBe(204);
  expect(await ids('engineer')).toEqual([
    'project-1',
    'project-2',
    'project-3',
    'project-4',
    'project-8',
  ]);
  // Default access is keyed now: removing the rule clears the baseline.
  expect(
    (await admin('defaultAccess/example-default-projects', 'DELETE')).status,
  ).toBe(204);
  expect(
    (await admin('sharingRules/example-selected-projects', 'DELETE')).status,
  ).toBe(204);
  expect(await ids('assistant')).toEqual([]);
  expect(
    (
      await admin('sharingRules', 'POST', {
        key: 'one',
        resource,
        subjects: [{ type: 'user', id: fixture.users.assistant }],
        actions: [
          {
            action: 'view',
            scopeKey: 'projects',
            selection: { type: 'records', ids: ['project-3'] },
          },
        ],
      })
    ).status,
  ).toBe(201);
  expect(await ids('assistant')).toEqual(['project-3']);
  for (const path of ['defaultAccess', 'sharingRules', 'restrictionRules']) {
    const response = await admin(`${path}/options`);
    expect(response.status).toBe(200);
    const options = (await response.json())
      .data as AuthorizationOptionsResponse;
    expect(
      wireResources(options)
        .find(
          (item) =>
            item.type === 'composite' && item.id === 'example.sales.projects',
        )
        ?.actions.map((action) => action.name),
    ).toEqual(['view', 'edit']);
  }
  expect(
    (
      await admin('defaultAccess', 'POST', {
        key: 'invalid',
        resource,
        actions: [
          { action: 'view', scopeKey: 'missing', selection: { type: 'all' } },
        ],
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await admin('sharingRules', 'POST', {
        key: 'invalid',
        resource,
        subjects: [],
        actions: [
          {
            action: 'delete',
            selection: { type: 'records', ids: ['project-1'] },
          },
        ],
      })
    ).status,
  ).toBe(400);
});

it('keeps two shared record lists on one operation separate through HTTP, storage and repository checks', async () => {
  await authz.permissionSets.update('example-sales-assistant', {
    key: 'example-sales-assistant',
    grants: [quoteResource.reference().grant('submit')],
  });
  await authz.defaultAccess.delete('example-default-quotes');
  const response = await admin('sharingRules', 'POST', {
    key: 'multi-table',
    resource: { type: 'composite', id: 'example.sales.quotes' },
    subjects: [{ type: 'user', id: fixture.users.assistant }],
    actions: [
      {
        action: 'submit',
        scopeKey: 'quotes',
        selection: { type: 'records', ids: ['quote-3'] },
      },
      {
        action: 'submit',
        scopeKey: 'projects',
        selection: { type: 'records', ids: ['project-2'] },
      },
    ],
  });
  expect(response.status).toBe(201);
  const saved = (await authz.sharingRules.get('multi-table'))!;
  expect(saved.actions).toEqual([
    {
      action: 'submit',
      scopeKey: 'quotes',
      selection: { type: 'records', ids: ['quote-3'] },
    },
    {
      action: 'submit',
      scopeKey: 'projects',
      selection: { type: 'records', ids: ['project-2'] },
    },
  ]);
  const scope = authz.for({
    principal: { type: 'user', id: fixture.users.assistant },
  });
  const projects = await fixture.database
    .repository(PROJECTS)
    .withPolicy(await authz.database.policyFor(PROJECTS, scope))
    .findMany();
  expect(projects.map((item) => item.id)).toEqual(['project-2']);
  const quotePolicy = await authz.database.policyFor(QUOTES, scope);
  await expect(
    fixture.database
      .repository(QUOTES)
      .withPolicy(quotePolicy)
      .updateOne({
        filter: { id: 'quote-2' },
        values: { status: 'submitted' },
      }),
  ).rejects.toThrow();
  await fixture.database
    .repository(QUOTES)
    .withPolicy(quotePolicy)
    .updateOne({ filter: { id: 'quote-3' }, values: { status: 'submitted' } });
  // The sharing rule cannot grant the separate edit feature or its amount field.
  expect(await scope.can({ resource: saved.resource, action: 'edit' })).toBe(
    false,
  );
  await expect(
    fixture.database
      .repository(QUOTES)
      .withPolicy(quotePolicy)
      .updateOne({ filter: { id: 'quote-3' }, values: { amount: 1 } }),
  ).rejects.toThrow();
  expect(
    (
      await admin('sharingRules/multi-table', 'PATCH', {
        ...saved,
        actions: saved.actions.slice(1),
      })
    ).status,
  ).toBe(200);
  expect((await authz.sharingRules.get('multi-table'))?.actions).toEqual(
    saved.actions.slice(1),
  );
});

it('applies defaults and restrictions to the selected business scope without expanding sibling scopes', async () => {
  await authz.permissionSets.update('example-sales-assistant', {
    key: 'example-sales-assistant',
    grants: [quoteResource.reference().grant('submit')],
  });
  expect(
    (
      await admin('defaultAccess/example-default-quotes', 'PATCH', {
        key: 'example-default-quotes',
        resource: { type: 'composite', id: 'example.sales.quotes' },
        actions: [
          {
            action: 'submit',
            scopeKey: 'projects',
            selection: { type: 'records', ids: ['project-2'] },
          },
          {
            action: 'submit',
            scopeKey: 'quotes',
            selection: { type: 'records', ids: ['quote-1', 'quote-2'] },
          },
        ],
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await admin('restrictionRules', 'POST', {
        key: 'only-first-quote',
        resource: { type: 'composite', id: 'example.sales.quotes' },
        subjects: [{ type: 'user', id: fixture.users.assistant }],
        actions: [
          {
            action: 'submit',
            scopeKey: 'quotes',
            selection: { type: 'records', ids: ['quote-1'] },
          },
        ],
      })
    ).status,
  ).toBe(201);
  const scope = authz.for({
    principal: { type: 'user', id: fixture.users.assistant },
  });
  const policy = await authz.database.policyFor(QUOTES, scope);
  await expect(
    fixture.database
      .repository(QUOTES)
      .withPolicy(policy)
      .updateOne({
        filter: { id: 'quote-2' },
        values: { status: 'submitted' },
      }),
  ).rejects.toThrow();
  await fixture.database
    .repository(QUOTES)
    .withPolicy(policy)
    .updateOne({ filter: { id: 'quote-1' }, values: { status: 'submitted' } });
  const projects = await fixture.database
    .repository(PROJECTS)
    .withPolicy(await authz.database.policyFor(PROJECTS, scope))
    .findMany();
  expect(projects.map((item) => item.id)).toEqual(['project-2']);
});

it('narrows business endpoints to their operation while generic data policies aggregate grants', async () => {
  await authz.defaultAccess.delete('example-default-quotes');
  await authz.permissionSets.update('example-sales-assistant', {
    key: 'example-sales-assistant',
    grants: [
      projectReference.grant({ view: { projects: 'allRecords' } }),
      quoteResource.reference().grant({
        submit: { quotes: 'allRecords', projects: 'recordsIOwn' },
      }),
    ],
  });
  const scope = authz.for({
    principal: { type: 'user', id: fixture.users.assistant },
  });
  const generic = await fixture.database
    .repository(PROJECTS)
    .withPolicy(await authz.database.policyFor(PROJECTS, scope))
    .findMany();
  expect(generic.map((item) => item.id).sort()).toEqual([
    'project-1',
    'project-2',
    'project-3',
    'project-8',
  ]);
  expect(
    (await fixture.request('assistant', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (await fixture.request('assistant', 'sales/quotes/quote-1/submit', {}))
      .status,
  ).toBe(200);
  const invalid = await admin(
    'permissionSets/example-sales-assistant',
    'PATCH',
    {
      key: 'example-sales-assistant',
      grants: [
        {
          resource: { type: 'composite', id: 'example.sales.projects' },
          actions: [
            {
              action: 'view',
              policy: {
                type: 'composite',
                scopes: { projects: 'unknown-policy' },
              },
            },
          ],
        },
      ],
    },
  );
  expect(invalid.status).toBe(400);
});

it('exposes pages in permission sets and inspection while data rules only list business scopes', async () => {
  const offered = new Map<string, readonly string[]>();
  for (const path of [
    'permissionSets',
    'defaultAccess',
    'sharingRules',
    'restrictionRules',
    'inspector',
  ]) {
    const options = (await (await admin(`${path}/options`)).json())
      .data as AuthorizationOptionsResponse;
    const workspace = path === 'permissionSets' || path === 'inspector';
    const subsections = (name: string) =>
      options.sections
        .find((section) => section.name === name)
        ?.subsections.map((item) => item.name);
    const resources = wireResources(options);
    expect(
      options.sections.some((section) =>
        section.subsections.some((item) => item.recordType?.type === 'page'),
      ),
    ).toBe(workspace);
    // Rule plugins can only target composites with data scopes.
    expect([...new Set(resources.map((item) => item.type))]).toEqual(
      workspace ? ['composite', 'settings'] : ['composite'],
    );
    expect(subsections('business')).toEqual([
      'example.sales',
      'example.delivery',
    ]);
    if (workspace)
      expect(subsections('administration')).toContain('authorization');
    const project = resources.find(
      (item) =>
        item.type === 'composite' && item.id === 'example.sales.projects',
    )!;
    const choices = project.dataScopes!.view![0]!.recordAccess;
    offered.set(path, choices);
    expect(choices).toContain('recordsIOwn');
    expect(choices).toContain('example.sales.public');
    expect(choices).toContain('customFilter');
    expect(choices).not.toContain('recordsICreated');
    expect(choices).not.toContain('example.sales.own');
  }
  // Permission Sets and every rule plugin offer the same record access.
  expect(
    new Set([...offered.values()].map((choices) => choices.join())),
  ).toHaveProperty('size', 1);
  const sets = (await (await admin('permissionSets')).json())
    .data as PermissionSet[];
  expect(
    sets.find((set) => set.key === 'example-sales-engineer')?.title,
  ).toMatchObject({
    key: 'roles.engineer',
    ns: '@nocobase/app-plugin-authorization-example',
  });
});

it('returns executable policies for both submit targets without a second policy lookup', async () => {
  const policyLookup = vi
    .spyOn(authz.database, 'policyFor')
    .mockRejectedValue(new Error('Unexpected second authorization'));
  try {
    const scope = authz.for({
      principal: { type: 'user', id: fixture.users.engineer },
    });
    const request = {
      resource: { type: 'composite', id: 'example.sales.quotes' },
      action: 'submit',
    };
    const decision = await scope.authorize(request);
    expect(decision.effect).toBe('conditional');
    const conditions = decision.conditions as CompositeResourceConditions;
    expect(conditions.type).toBe('composite');
    expect(Object.keys(conditions.database!)).toEqual(
      expect.arrayContaining([PROJECTS, QUOTES]),
    );
    const quotes = conditions.database![QUOTES]!;
    const projects = conditions.database![PROJECTS];
    expect(quotes).toMatchObject({
      create: false,
      delete: false,
      update: { fields: ['status'] },
    });
    expect(projects).toMatchObject({
      create: false,
      update: false,
      delete: false,
    });
    // The separately granted quote-edit action must not add amount writes to submit.
    await expect(
      fixture.database
        .repository(QUOTES)
        .withPolicy(quotes)
        .updateOne({ filter: { id: 'quote-2' }, values: { amount: 1 } }),
    ).rejects.toMatchObject({ code: 'FIELD_WRITE_FORBIDDEN' });
    // A boolean check is only feature visibility, never evidence that row conditions ran.
    expect(await scope.can(request)).toBe(true);
    await expect(scope.require(request)).rejects.toBeInstanceOf(Error);
    expect(
      (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
        .status,
    ).toBe(200);
    expect(policyLookup).not.toHaveBeenCalled();
  } finally {
    policyLookup.mockRestore();
  }
});

it('fails closed for ungranted or unknown composed operations, including root typos', async () => {
  const assistant = authz.for({
    principal: { type: 'user', id: fixture.users.assistant },
  });
  const denied = await assistant.authorize({
    resource: { type: 'composite', id: 'example.sales.quotes' },
    action: 'submit',
  });
  expect(denied.effect).toBe('deny');
  expect(denied.conditions).toBeUndefined();
  const root = authz.for({
    principal: { type: 'user', id: fixture.users.admin },
  });
  expect(
    (
      await root.authorize({
        resource: { type: 'composite', id: 'example.sales.quotes' },
        action: 'typo',
      })
    ).effect,
  ).toBe('deny');
  const decision = await root.authorize({
    resource: { type: 'composite', id: 'example.sales.quotes' },
    action: 'submit',
  });
  expect(decision.conditions?.database?.[PROJECTS]).toEqual({
    read: true,
    create: false,
    update: false,
    delete: false,
  });
  expect(decision.conditions?.database?.[QUOTES]).toEqual({
    read: true,
    create: false,
    update: true,
    delete: false,
  });
});

/** Every resource an `options` response lists, in section order. */
function wireResources(
  options: AuthorizationOptionsResponse,
): AuthorizationOptionsResponse['sections'][number]['subsections'][number]['resources'] {
  return options.sections.flatMap((section) =>
    section.subsections.flatMap((item) => item.resources),
  );
}
