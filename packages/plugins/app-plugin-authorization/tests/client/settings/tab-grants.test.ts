import { describe, expect, it } from 'vitest';

import {
  grantsOfTypes,
  tabsFor,
  withTabGrants,
} from '../../../client/settings/tab-grants.js';

const report = { type: 'example.report', id: 'sales' } as const;
const orders = { type: 'settings', id: 'orders' } as const;

describe('permission tabs for roles and API keys', () => {
  it('shows a tab for roles unless it says otherwise, and for keys only with the types it edits', () => {
    const tabs = [
      { key: 'members-only' },
      {
        key: 'both',
        targets: ['role', 'apiKey'] as const,
        resourceTypes: ['example.report'],
      },
      { key: 'key-without-types', targets: ['apiKey'] as const },
    ];
    expect(tabsFor(tabs, 'role').map((tab) => tab.key)).toEqual([
      'members-only',
      'both',
    ]);
    expect(tabsFor(tabs, 'apiKey').map((tab) => tab.key)).toEqual(['both']);
  });

  it('preserves sibling grants when two tabs edit different resources of one type', () => {
    const grant = (id: string) => ({
      resource: { type: 'composite', id },
      actions: [{ action: 'view' }],
    });
    const own = grant('multiApp.applications');
    const sibling = grant('deployment.instances');
    const owns = (resource: typeof own.resource) =>
      resource.id === own.resource.id;
    const grants = [own, sibling];
    expect(grantsOfTypes(grants, ['composite'], owns)).toEqual([own]);
    expect(withTabGrants(grants, ['composite'], [sibling], owns)).toEqual([
      sibling,
    ]);
  });

  it('gives a tab the grants of its types and takes back only those', () => {
    const grants = [
      { resource: orders, actions: [{ action: 'read' }] },
      { resource: report, actions: [{ action: 'view' }] },
    ];
    expect(grantsOfTypes(grants, ['example.report'])).toEqual([grants[1]]);
    expect(
      withTabGrants(
        grants,
        ['example.report'],
        [
          {
            resource: report,
            actions: [{ action: 'view' }, { action: 'export' }],
          },
          // Another type a tab does not own is ignored.
          { resource: orders, actions: [{ action: 'update' }] },
        ],
      ),
    ).toEqual([
      grants[0],
      { resource: report, actions: [{ action: 'view' }, { action: 'export' }] },
    ]);
    // A tab clearing its types removes their grants.
    expect(withTabGrants(grants, ['example.report'], [])).toEqual([grants[0]]);
  });
});
