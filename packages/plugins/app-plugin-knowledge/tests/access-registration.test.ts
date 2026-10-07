// @vitest-environment node
import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import { registerBusinesses } from '../server/providers/authorization.js';
import {
  BUSINESS_KEYS,
  BUSINESS_SECTION,
  RESOURCE_TYPE,
  levelActionsOf,
} from '../shared/access.js';

describe('the businesses on the authorization plugin', () => {
  it('registers every level of every action and lists each business', async () => {
    const testDatabase = await createTestDatabase();
    const database = testDatabase.database;
    try {
      const authz = createAppAuthorization({
        connection: database.connection(),
      });
      registerBusinesses(authz);
      const type = authz.resourceTypes.get(RESOURCE_TYPE);
      for (const { business, key } of BUSINESS_KEYS) {
        const names = type.items?.get(business)?.actions.map((a) => a.name);
        for (const { name } of levelActionsOf(key))
          expect(names).toContain(name);
        expect(
          authz.ui.placementOf({ type: RESOURCE_TYPE, id: business })?.section,
        ).toBe(BUSINESS_SECTION);
      }
      expect(
        type.items?.get('kb.knowledge')?.actions.map((a) => a.name),
      ).toEqual(expect.arrayContaining(['read.related', 'read.all']));
    } finally {
      await testDatabase.destroy();
    }
  });
});
