import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { QUOTES, PROJECTS } from '../sales-authorization.js';
import {
  AUTHORIZATION_EXAMPLE_DOMAIN,
  authorizeSalesAction,
  forbidden,
  type SalesActionEnv,
  stateConflict,
  stateConflictError,
  writableRepository,
} from './mutations.js';
import { QuoteParams, UpdateQuoteInput } from './schemas.js';

export function createQuoteRoutes(
  database: DatabaseManager,
): Hono<SalesActionEnv> {
  const router = new Hono<SalesActionEnv>();

  router.patch(
    '/sales/quotes/:quoteId',
    authorizeSalesAction('example.sales.quotes', 'edit'),
    validator('param', (value) => parseApiInput(QuoteParams, value)),
    validator('json', (value) => parseApiInput(UpdateQuoteInput, value)),
    async (c) => {
      const { quoteId } = c.req.valid('param');
      const values = c.req.valid('json');
      const policy = c.var.salesPolicies[QUOTES];
      const editable = await writableRepository(
        database,
        QUOTES,
        policy,
        Object.keys(values),
      )?.findOne({ filter: { id: quoteId } });
      if (!editable) throw forbidden();
      if (editable.status !== 'draft')
        throw stateConflictError('Only a draft quote can be edited.');

      const { record } = await database
        .repository(QUOTES)
        .withPolicy(policy)
        .updateOne({
          filter: { id: quoteId, status: 'draft' },
          values: values as Record<string, string | number>,
        })
        .catch(stateConflict);

      return c.json({ data: record });
    },
  );

  router.post(
    '/sales/quotes/:quoteId/submit',
    authorizeSalesAction('example.sales.quotes', 'submit'),
    validator('param', (value) => parseApiInput(QuoteParams, value)),
    async (c) => {
      const { quoteId } = c.req.valid('param');
      const policy = c.var.salesPolicies[QUOTES];

      const quote = await writableRepository(database, QUOTES, policy, [
        'status',
      ])?.findOne({ filter: { id: quoteId } });
      if (!quote || typeof quote.projectId !== 'string') throw forbidden();

      const projectPolicy = c.var.salesPolicies[PROJECTS];
      const project = await database
        .repository(PROJECTS)
        .withPolicy(projectPolicy)
        .findOne({ filter: { id: quote.projectId } });
      if (!project) throw forbidden();
      if (quote.status !== 'draft')
        throw stateConflictError('Only a draft quote can be submitted.');

      // The stored quote, not this request, lacks an amount, so this is a precondition and names no request field.
      if (typeof quote.amount !== 'number' || quote.amount <= 0)
        throw new ApiError({
          status: 'FAILED_PRECONDITION',
          reason: 'QUOTE_AMOUNT_REQUIRED',
          domain: AUTHORIZATION_EXAMPLE_DOMAIN,
          message: 'A quote needs a positive amount before it is submitted.',
        });

      const { record } = await database
        .repository(QUOTES)
        .withPolicy(policy)
        .updateOne({
          filter: (filter) =>
            filter.and([
              filter.string('id').eq(quoteId),
              filter.string('status').eq('draft'),
              filter.number('amount').gt(0),
            ]),
          values: { status: 'submitted' },
        })
        .catch(stateConflict);

      return c.json({ data: record });
    },
  );

  return router;
}
