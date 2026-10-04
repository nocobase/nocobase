import { afterEach, beforeEach, expect, it } from 'vitest';
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

it('requires both scopes of the cross-region quote handover', async () => {
  const rule = await authz.sharingRules.get('example-proposal-handover');
  expect(rule).toBeDefined();
  for (const scopeKey of ['quotes', 'projects']) {
    expect(
      (
        await admin('sharingRules/example-proposal-handover', 'PATCH', {
          ...rule,
          actions: rule!.actions.filter(
            (action) => action.scopeKey === scopeKey,
          ),
        })
      ).status,
    ).toBe(200);
    const data = (
      await (await fixture.request('proposal', 'sales/quotes')).json()
    ).data;
    expect(
      data.find((row: { id: string }) => row.id === 'quote-7').operations
        .submit,
    ).toBe(scopeKey === 'quotes' ? 'projectScope' : 'quoteScope');
    expect(
      (await fixture.request('proposal', 'sales/quotes/quote-7/submit', {}))
        .status,
    ).toBe(403);
  }
  expect(
    (await admin('sharingRules/example-proposal-handover', 'PATCH', rule))
      .status,
  ).toBe(200);
  expect(
    (await fixture.request('proposal', 'sales/quotes/quote-7/submit', {}))
      .status,
  ).toBe(200);
});

it('explains a business action with its granting permission set and branch rules, and inspects the delegated engineer as live requests see them', async () => {
  const response = await admin('inspector/decide', 'POST', {
    subject: { type: 'user', id: fixture.users.assistant },
    resource: { type: 'composite', id: 'example.sales.projects' },
    action: 'view',
  });
  expect(response.status).toBe(200);
  const decision = (await response.json()).data;
  expect(decision.reasons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'GRANT_MATCHED',
        details: expect.objectContaining({
          source: expect.objectContaining({ id: 'example-sales-assistant' }),
        }),
      }),
    ]),
  );
  const database = decision.checks.find(
    (check: { resource: { type: string } }) =>
      check.resource.type === 'database.collection',
  );
  expect(database.decision.reasons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'SELECTION_EXPANDED',
        details: expect.objectContaining({
          source: expect.objectContaining({ plugin: 'sharing-rules' }),
        }),
      }),
      expect.objectContaining({
        code: 'SELECTION_RESTRICTED',
        details: expect.objectContaining({
          source: expect.objectContaining({ plugin: 'restriction-rules' }),
        }),
      }),
    ]),
  );
  const delegate = await admin('inspector/decide', 'POST', {
    subject: { type: 'user', id: fixture.users.proposal },
    resource: { type: 'composite', id: 'example.sales.quotes' },
    action: 'submit',
  });
  expect(delegate.status).toBe(200);
  const delegateDecision = (await delegate.json()).data;
  expect(delegateDecision.effect).toBe('conditional');
  expect(delegateDecision.reasons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'SELECTION_EXPANDED',
        details: expect.objectContaining({
          source: expect.objectContaining({ plugin: 'sharing-rules' }),
        }),
      }),
      expect.objectContaining({ code: 'SELECTION_RESTRICTED' }),
    ]),
  );
  expect((await fixture.request('delivery', 'sales/projects')).status).toBe(
    403,
  );
  expect(await ids('delivery', 'orders')).toEqual(['order-1', 'order-2']);
});
