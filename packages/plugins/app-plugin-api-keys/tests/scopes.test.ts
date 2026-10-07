// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createApiKeyScopes } from '../server/scopes.js';

describe('key scope access mapping', () => {
  it('maps a ref to several actions, every one allowed by a scope covering it', () => {
    const scopes = createApiKeyScopes();
    scopes.mapAccess((ref) =>
      ref.kind === 'business'
        ? {
            resource: { type: 'pm', id: ref.id },
            actions: [`${ref.action}.related`, `${ref.action}.all`],
          }
        : null,
    );
    const group = {
      id: 'issues',
      category: 'business' as const,
      title: 'Issues',
      levels: {
        write: [{ kind: 'business' as const, id: 'pm.issues', action: 'edit' }],
      },
    };
    scopes.groups.add(group);
    expect(scopes.accessOf(group, 'write')).toEqual([
      {
        resource: { type: 'pm', id: 'pm.issues' },
        actions: ['edit.related', 'edit.all'],
      },
    ]);
    const scope = scopes.compile('k', {
      groups: { issues: { level: 'write' } },
    });
    const issues = { type: 'pm', id: 'pm.issues' };
    expect(scope.allows(issues, 'edit.related')).toBe(true);
    expect(scope.allows(issues, 'edit.all')).toBe(true);
    expect(scope.allows(issues, 'delete')).toBe(false);
  });
});
