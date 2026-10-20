import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';

import { viewerOf } from '../../server/errors.js';

describe('session interface language', () => {
  test.each([
    ['zh-CN', 'en-US', 'zh-CN'],
    ['en-US', 'zh-CN', 'en-US'],
    ['zh-cn', 'en-US', 'zh-CN'],
    [undefined, 'zh-CN', 'zh-CN'],
    ['invalid_tag', 'en-US', 'en-US'],
  ])(
    'uses the browser locale %s ahead of the server locale %s',
    async (header, stored, expected) => {
      const router = new Hono<AuthEnv>();
      router.use('*', async (context, next) => {
        context.set('auth', { user: { id: 'u1' } } as never);
        context.set('locale' as never, stored as never);
        await next();
      });
      router.get('/', (context) => context.json(viewerOf(context)));
      const response = await router.request('/', {
        headers: header ? { 'Accept-Language': header } : {},
      });
      expect(await response.json()).toEqual({ userId: 'u1', locale: expected });
    },
  );
});
