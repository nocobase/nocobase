// @vitest-environment node
/** The plugin's declarations: its server capabilities, and the business actions an application's roles hold. */
import { describe, expect, it } from 'vitest';

import plugin from '../server/index.js';
import {
  ACTOR_ACTIONS,
  BUSINESS_KEYS,
  PAGES,
  RELATIONS,
} from '../shared/access.js';

describe('@nocobase/app-plugin-knowledge', () => {
  it('declares its migrations, services and routes', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-knowledge',
      serviceProviders: expect.any(Array),
      routes: expect.any(Array),
      database: { migrations: './database/migrations' },
    });
  });

  it('offers reading, proposing, editing and managing spaces, and its page', () => {
    expect(PAGES).toEqual(['knowledge']);
    expect(BUSINESS_KEYS.map(({ key }) => key)).toEqual([
      'kb.knowledge/read',
      'kb.knowledge/propose',
      'kb.knowledge/edit',
      'kb.knowledge/manage',
    ]);
    expect(Object.keys(RELATIONS)).toHaveLength(BUSINESS_KEYS.length);
    expect(ACTOR_ACTIONS).not.toContain('kb.knowledge/edit');
    expect(ACTOR_ACTIONS).not.toContain('kb.knowledge/manage');
  });
});
