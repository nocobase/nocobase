import {
  generateApiDocument,
  inspectApiRoutes,
} from '@nocobase/app-server/router';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { createFixture } from './helpers.js';

const PREFIX = '/api/authorizationExample/';

let fixture: Awaited<ReturnType<typeof createFixture>>;
beforeAll(async () => {
  fixture = await createFixture();
});
afterAll(() => fixture.destroy());

it('declares every hand-written route for the API document', async () => {
  // The fixture mounts the plugin's routes under /api itself, so they are inspected without a further prefix.
  const routes = inspectApiRoutes(fixture.router, '').filter(({ path }) =>
    path.startsWith(PREFIX),
  );
  expect(routes.filter(({ declared }) => !declared)).toEqual([]);

  const handWritten = routes.filter(
    ({ path }) => !path.startsWith(`${PREFIX}salesProjects/`),
  );
  expect(
    handWritten.every(({ tags }) => tags?.[0] === 'AuthorizationExample'),
  ).toBe(true);
  expect(handWritten.map(({ operationId }) => operationId).sort()).toEqual([
    'authorizationExampleDeliverOrder',
    'authorizationExampleGetContext',
    'authorizationExampleGetOrderRelations',
    'authorizationExampleListOrders',
    'authorizationExampleListProjects',
    'authorizationExampleListQuotes',
    'authorizationExampleResetData',
    'authorizationExampleSubmitQuote',
    'authorizationExampleUpdateOrderRelations',
    'authorizationExampleUpdateQuote',
  ]);
});

it('documents the routes with shared response schemas', async () => {
  const document = await generateApiDocument(fixture.router, {
    info: { title: 'Authorization example', version: '0.0.0' },
    prefix: '',
  });

  const deliver =
    document.paths?.['/api/authorizationExample/sales/orders/{orderId}/deliver']
      ?.post;
  expect(Object.keys(deliver?.responses ?? {})).toEqual(
    expect.arrayContaining(['200', '400', '403', '413']),
  );
  expect(document.components?.schemas).toEqual(
    expect.objectContaining({
      AuthorizationExampleQuoteRow: expect.any(Object),
      AuthorizationExampleOrder: expect.any(Object),
      AuthorizationExampleOrderRelations: expect.any(Object),
      AuthorizationExampleSalesListMeta: expect.any(Object),
    }),
  );
  // The project data endpoints are documented by the framework, without a declaration of their own.
  expect(
    document.paths?.['/api/authorizationExample/salesProjects/findMany']?.post,
  ).toBeDefined();
});
