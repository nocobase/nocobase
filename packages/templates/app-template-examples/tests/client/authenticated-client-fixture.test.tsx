import { expect, it } from 'vitest';
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';

const render = createAuthenticatedClientRenderer();
const identities = new Set<string>();
const permissionSets = new Set<string>();
const resource = { type: 'settings', id: 'authorization.default-access' };

it.each([
  { name: 'administrator', member: false, granted: false },
  { name: 'permitted member', member: true, granted: true },
  { name: 'unpermitted member', member: true, granted: false },
])(
  'isolates the $name session and grants in a reused application',
  async ({ member, granted }) => {
    const view = await render(<span>Isolated client</span>, {
      member,
      grants: granted ? [{ resource, actions: [{ action: 'read' }] }] : [],
    });
    expect(identities.has(view.session.user.id)).toBe(false);
    expect(permissionSets.has(view.permissionSetKey)).toBe(false);
    identities.add(view.session.user.id);
    permissionSets.add(view.permissionSetKey);
    expect(view.identity().session?.user.id).toBe(view.session.user.id);

    const response = await view.session.fetch('/authorization/permissions');
    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.unrestricted).toBe(!member);
    const permission = expect.objectContaining({
      resource,
      actions: expect.arrayContaining(['read']),
    });
    if (granted) expect(data.permissions).toContainEqual(permission);
    else expect(data.permissions).not.toContainEqual(permission);
  },
);
