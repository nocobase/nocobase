import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';

import { QUOTES, PROJECTS } from '../sales-authorization.js';
import {
  AUTHORIZATION_EXAMPLE_DOMAIN,
  AUTHORIZATION_EXAMPLE_TAGS as tags,
  authorizeSalesAction,
  bodyTooLargeResponse,
  forbidden,
  forbiddenResponse,
  type SalesActionEnv,
  stateConflict,
  stateConflictError,
  writableRepository,
} from './mutations.js';
import { QuoteParams, SalesQuote, UpdateQuoteInput } from './schemas.js';

export function createQuoteRoutes(
  database: DatabaseManager,
): Hono<SalesActionEnv> {
  const router = new Hono<SalesActionEnv>();

  router.patch(
    '/sales/quotes/:quoteId',
    authorizeSalesAction('example.sales.quotes', 'edit'),
    describeRoute({
      tags,
      summary: 'Update a draft quote',
      operationId: 'authorizationExampleUpdateQuote',
      description:
        'Changes the amount or notes of a draft quote the caller may edit; send only the fields that change. Requires `composite:example.sales.quotes` `edit` with the changed fields writable.',
      responses: {
        200: dataResponse(SalesQuote, 'The updated quote.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The quote is no longer a draft (`STATE_CONFLICT`).',
        ),
        403: forbiddenResponse,
        413: bodyTooLargeResponse,
      },
    }),
    apiValidator('param', QuoteParams),
    apiValidator('json', UpdateQuoteInput),
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
    describeRoute({
      tags,
      summary: 'Submit a quote',
      operationId: 'authorizationExampleSubmitQuote',
      description:
        "Moves a draft quote with a positive amount to `submitted`. The caller's `submit` grant must cover both the quote and its project. Requires `composite:example.sales.quotes` `submit`.",
      responses: {
        200: dataResponse(SalesQuote, 'The submitted quote.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The quote is no longer a draft (`STATE_CONFLICT`), or it has no positive amount (`QUOTE_AMOUNT_REQUIRED`).',
        ),
        403: forbiddenResponse,
      },
    }),
    apiValidator('param', QuoteParams),
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
