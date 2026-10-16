import { describe, expect, it } from 'vitest';
import {
  setPermission,
  setScope,
  type CatalogResource,
} from '../../client/pages/settings/permissions-model.js';
const resource: CatalogResource = {
  type: 'composite',
  id: 'orders',
  title: 'Orders',
  actions: [{ name: 'edit', title: 'Edit' }],
  dataScopes: {
    edit: [
      {
        key: 'records',
        title: 'Records',
        collection: 'orders',
        fields: [],
        recordAccess: ['mine', 'all'],
        defaultValue: 'mine',
      },
    ],
  },
};
describe('settings permission drafts', () => {
  it('adds only the explicit action at its registered default and keeps unrelated policies intact', () => {
    const untouched = {
      resource: { type: 'settings', id: 'notification' },
      actions: [{ action: 'read', policy: { type: 'custom', region: 'east' } }],
    };
    const original = [untouched];
    const next = setPermission(original, resource, 'edit', true);
    expect(next).toContainEqual(untouched);
    expect(next[1]?.actions).toEqual([
      {
        action: 'edit',
        policy: { type: 'composite', scopes: { records: 'mine' } },
      },
    ]);
    expect(original).toEqual([untouched]);
    expect(setPermission(next, resource, 'edit', false)).toEqual([untouched]);
  });
  it('changes one scope without losing a different scope or custom grant', () => {
    const original = [
      {
        resource: { type: 'composite', id: 'orders' },
        actions: [
          {
            action: 'edit',
            policy: {
              type: 'composite',
              scopes: {
                records: 'mine',
                attachments: { selected: ['file-1'] },
              },
            },
          },
          { action: 'approve' },
        ],
      },
    ];
    const next = setScope(
      original,
      JSON.stringify(['composite', 'orders', 'edit', 'records']),
      'all',
    );
    expect(next[0]?.actions[0]?.policy).toMatchObject({
      scopes: { records: 'all', attachments: { selected: ['file-1'] } },
    });
    expect(next[0]?.actions[1]).toEqual({ action: 'approve' });
    expect(original[0]?.actions[0]?.policy.scopes.records).toBe('mine');
  });
});
