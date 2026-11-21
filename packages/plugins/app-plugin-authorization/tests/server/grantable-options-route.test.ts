import type { DatabaseConnection } from '@nocobase/db';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { createAppAuthorization } from '../../server/authorization.js';
import { mountedRouter, TEST_USER } from '../helpers/mounted-router.js';

/** Permission Sets need a connection to build their store; nothing here queries. */
const connection = { query: {} } as unknown as DatabaseConnection;

describe('GET /api/authorization/permissionSets/grantableOptions', () => {
  it('answers a member only what they hold, whatever the request asks for', async () => {
    const authorization = createAppAuthorization({ connection });
    vi.spyOn(authorization.permissionSets, 'getEffective').mockResolvedValue([
      {
        key: 'reader',
        grants: [
          {
            resource: {
              type: 'settings',
              id: 'authorization.permission-sets',
            },
            actions: [{ action: 'update' }],
          },
        ],
      },
    ]);
    const router = new Hono().route('/', await mountedRouter(authorization));
    const read = (path: string) =>
      router.request(path, { headers: { [TEST_USER]: 'member-1' } });

    // The whole catalogue is for whoever may read roles in full; this member may not.
    expect(
      (await read('/api/authorization/permissionSets/options')).status,
    ).toBe(403);
    // A resource named in the request is not added: what is listed is decided by the server alone.
    const answer = await read(
      '/api/authorization/permissionSets/grantableOptions?include=settings:authorization.permission-sets',
    );
    expect(answer.status).toBe(200);
    const body = (await answer.json()) as {
      data: {
        sections: {
          subsections: {
            resources: {
              type: string;
              id: string;
              actions: { name: string }[];
            }[];
          }[];
        }[];
        subjectTypes: unknown[];
        recordAccess: unknown[];
        collections: unknown[];
        resourceGroups?: unknown[];
      };
    };
    const resources = body.data.sections.flatMap((section) =>
      section.subsections.flatMap((subsection) => subsection.resources),
    );
    expect(resources).toEqual([
      expect.objectContaining({
        type: 'settings',
        id: 'authorization.permission-sets',
        actions: [expect.objectContaining({ name: 'update' })],
      }),
    ]);
    expect(body.data.subjectTypes).toEqual([]);
    // What the held resource does not read stays out: no record access, collections or resource groups.
    expect(body.data.recordAccess).toEqual([]);
    expect(body.data.collections).toEqual([]);
    expect(body.data.resourceGroups).toBeUndefined();
  });
});
