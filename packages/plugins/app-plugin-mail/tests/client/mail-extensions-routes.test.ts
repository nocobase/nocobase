import { describe, expect, it, vi } from 'vitest';

import {
  MailExtensions,
  resolveMailTemplateVariables,
} from '../../client/extensions.js';
import { mailRoutes } from '../../client/routes.js';
import { MAIL_ACCESS } from '../../shared/access.js';

interface RouteLike {
  readonly name?: string;
  readonly path?: string;
  readonly authz?: unknown;
  readonly navigation?: { readonly order?: number };
  readonly parent?: string;
}

function routesByName(
  contributions: ReturnType<typeof mailRoutes>,
): ReadonlyMap<string, RouteLike> {
  const routes = new Map<string, RouteLike>();
  for (const contribution of contributions) {
    for (const route of contribution.routes as readonly RouteLike[]) {
      if (route.name) routes.set(route.name, route);
    }
  }
  return routes;
}

describe('Mail pages', () => {
  it('registers the four pages with the requirements the API checks', () => {
    const routes = routesByName(mailRoutes());

    expect([...routes.keys()].sort()).toEqual([
      'mail',
      'mailAccounts',
      'mailSettings',
      'mailTeam',
    ]);
    expect(routes.get('mail')).toMatchObject({
      path: '/mail',
      authz: MAIL_ACCESS.workspace,
    });
    expect(routes.get('mailTeam')).toMatchObject({
      path: '/mail/team',
      authz: MAIL_ACCESS.teamView,
    });
    expect(routes.get('mailSettings')).toMatchObject({
      authz: MAIL_ACCESS.settingsRead,
    });
    expect(routes.get('mail')?.navigation).toBeDefined();
  });

  it('moves or hides a navigation entry while keeping its page', () => {
    const routes = routesByName(
      mailRoutes({
        mail: { order: 5, parent: 'crm' },
        mailTeam: false,
      }),
    );

    expect(routes.get('mail')).toMatchObject({
      parent: 'crm',
      navigation: { order: 5 },
    });
    expect(routes.get('mailTeam')).toMatchObject({ path: '/mail/team' });
    expect(routes.get('mailTeam')?.navigation).toBeUndefined();
  });
});

describe('Mail extension points', () => {
  it('lists slot entries by order and rejects a second entry with the same name', () => {
    const mail = new MailExtensions();
    const component = (): null => null;

    mail.slots.workspaceActions.add({ name: 'late', order: 10, component });
    const removeEarly = mail.slots.workspaceActions.add({
      name: 'early',
      order: -1,
      component,
    });

    expect(mail.slots.workspaceActions.list().map(({ name }) => name)).toEqual([
      'early',
      'late',
    ]);
    expect(() =>
      mail.slots.workspaceActions.add({ name: 'late', component }),
    ).toThrow(/already registered/u);

    removeEarly();
    expect(mail.slots.workspaceActions.list().map(({ name }) => name)).toEqual([
      'late',
    ]);
  });

  it('keeps Provider types by type and completion handlers until removed', () => {
    const mail = new MailExtensions();
    mail.providerTypes.add({ type: 'crm-gateway', title: 'CRM gateway' });
    expect(mail.providerTypes.get('crm-gateway')?.title).toBe('CRM gateway');
    expect(() => mail.providerTypes.add({ type: 'crm-gateway' })).toThrow();

    const handler = vi.fn();
    const remove = mail.composer.onComplete.add(handler);
    expect(mail.composer.onComplete.list()).toEqual([handler]);
    remove();
    expect(mail.composer.onComplete.list()).toEqual([]);
  });

  it('resolves registered template variables and leaves a failing one out', async () => {
    const mail = new MailExtensions();
    mail.templateVariables.add({
      key: 'customer',
      label: 'Customer',
      resolve: ({ to }) => ({ name: to.split('@')[0] }),
    });
    mail.templateVariables.add({
      key: 'broken',
      label: 'Broken',
      resolve: () => {
        throw new Error('lookup failed');
      },
    });

    await expect(
      resolveMailTemplateVariables(mail, {
        accountId: 'account-1',
        to: 'alex@globex.com',
      }),
    ).resolves.toEqual({ customer: { name: 'alex' } });
  });
});
