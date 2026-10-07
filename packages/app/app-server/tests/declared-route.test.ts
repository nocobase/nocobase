import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import {
  declaredRouteOf,
  describeRoute,
  cliRoute,
  declaredRouteActionOf,
  routeAcceptsScheme,
} from '../src/router/index.js';

describe('declaredRouteOf', () => {
  it('tells a router-wide middleware what the answering route declares', async () => {
    const seen: unknown[] = [];
    const router = new Hono();
    router.use('*', async (context, next) => {
      seen.push([
        declaredRouteOf(context)?.operationId,
        routeAcceptsScheme(context, 'runToken'),
        declaredRouteActionOf(context),
      ]);
      await next();
    });
    // A fixed path beside a parameter that also matches it keeps its own declaration.
    router.get(
      '/a/fixed',
      async (_context, next) => next(),
      describeRoute({ operationId: 'getFixed' }),
      (context) => context.text('fixed'),
    );
    router.get(
      '/a/:id',
      describeRoute({
        operationId: 'getA',
        security: [{ apiKeyAuth: [] }, { runToken: [] }],
        ...cliRoute({ action: 'docs/read' }),
      }),
      (context) => context.text('a'),
    );
    router.get('/b', describeRoute({ operationId: 'getB' }), (context) =>
      context.text('b'),
    );
    router.get('/c', (context) => context.text('c'));
    const app = new Hono();
    app.route('/api', router);

    await app.request('/api/a/1');
    await app.request('/api/b');
    await app.request('/api/c');
    await app.request('/api/a/fixed');
    expect(seen).toEqual([
      ['getA', true, 'docs/read'],
      ['getB', false, undefined],
      [undefined, false, undefined],
      ['getFixed', false, undefined],
    ]);
  });
});
