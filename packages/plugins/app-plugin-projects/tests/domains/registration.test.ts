// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BUSINESS_KEYS,
  BUSINESS_SECTION,
  RESOURCE_TYPE,
  levelActionsOf,
} from '../../shared/access.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
});
afterEach(() => h.close());

describe('the businesses on the authorization plugin', () => {
  it('registers every level of every business action as its own action', () => {
    const type = h.authorization.resourceTypes.get(RESOURCE_TYPE);
    for (const { business, key } of BUSINESS_KEYS) {
      const item = type.items?.get(business);
      expect(item?.description).toBeDefined();
      for (const { name } of levelActionsOf(key))
        expect(item?.actions.map((action) => action.name)).toContain(name);
    }
    expect(type.items?.get('pm.issues')?.actions.map((a) => a.name)).toEqual(
      expect.arrayContaining(['edit.related', 'edit.all', 'delete']),
    );
  });

  it('lists each business in its workspace subsection', () => {
    for (const { business } of BUSINESS_KEYS)
      expect(
        h.authorization.ui.placementOf({ type: RESOURCE_TYPE, id: business })
          ?.section,
      ).toBe(BUSINESS_SECTION);
  });
});
