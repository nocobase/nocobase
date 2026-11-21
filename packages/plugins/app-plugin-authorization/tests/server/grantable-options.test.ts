import { describe, expect, it } from 'vitest';

import {
  grantableAuthorizationOptions,
  type AuthorizationOptions,
} from '../../server/options.js';

const options = {
  sections: [
    {
      name: 'business',
      title: 'Business',
      order: 0,
      subsections: [
        {
          name: 'shop',
          title: 'Shop',
          resources: [
            {
              type: 'composite',
              id: 'shop.orders',
              title: 'Orders',
              group: 'sales',
              actions: [
                { name: 'view', title: 'View' },
                { name: 'delete', title: 'Delete' },
              ],
              dataScopes: {
                view: [
                  {
                    key: 'order',
                    title: 'Orders',
                    collection: 'orders',
                    fields: [],
                    recordAccess: ['allRecords'],
                  },
                ],
              },
            },
            {
              type: 'composite',
              id: 'shop.payouts',
              title: 'Payouts',
              group: 'finance',
              actions: [{ name: 'approve', title: 'Approve' }],
            },
          ],
        },
      ],
    },
  ],
  subjectTypes: [
    { type: 'user', title: 'Users', selection: { type: 'collection' } },
  ],
  resourceGroups: [
    { name: 'commerce', title: 'Commerce' },
    { name: 'sales', title: 'Sales', parent: 'commerce' },
    { name: 'finance', title: 'Finance' },
  ],
  recordAccess: [
    {
      key: 'allRecords',
      title: 'All records',
      collections: ['orders', 'payouts'],
    },
    { key: 'payoutsIApprove', title: 'Mine', collections: ['payouts'] },
  ],
  collections: [
    { name: 'orders', title: 'Orders', fields: ['id'] },
    { name: 'payouts', title: 'Payouts', fields: ['id'] },
  ],
} as unknown as AuthorizationOptions;

describe('the catalogue a person may give a credential', () => {
  it('keeps only what the caller holds, with the collections it reads and no subject types', () => {
    const limited = grantableAuthorizationOptions(options, {
      unrestricted: false,
      permissions: [
        {
          resource: { type: 'composite', id: 'shop.orders' },
          actions: ['view'],
        },
      ],
    });
    expect(limited.sections[0]?.subsections[0]?.resources).toEqual([
      expect.objectContaining({
        id: 'shop.orders',
        actions: [{ name: 'view', title: 'View' }],
      }),
    ]);
    expect(limited.collections.map((item) => item.name)).toEqual(['orders']);
    // Nothing about payouts: not its group, not its record access, not its collection under a shared one.
    expect(limited.resourceGroups?.map((group) => group.name)).toEqual([
      'commerce',
      'sales',
    ]);
    expect(limited.recordAccess).toEqual([
      { key: 'allRecords', title: 'All records', collections: ['orders'] },
    ]);
    expect(limited.subjectTypes).toEqual([]);
  });

  it('adds only the actions the server names, such as those a key still holds after its holder lost them', () => {
    const limited = grantableAuthorizationOptions(
      options,
      { unrestricted: false, permissions: [] },
      [
        {
          resource: { type: 'composite', id: 'shop.orders' },
          actions: ['delete'],
        },
      ],
    );
    expect(limited.sections[0]?.subsections[0]?.resources).toEqual([
      expect.objectContaining({
        id: 'shop.orders',
        actions: [{ name: 'delete', title: 'Delete' }],
      }),
    ]);
  });

  it('keeps everything for an unrestricted caller but who may be assigned', () => {
    const all = grantableAuthorizationOptions(options, {
      unrestricted: true,
      permissions: [],
    });
    expect(all.sections).toEqual(options.sections);
    expect(all.subjectTypes).toEqual([]);
  });
});
