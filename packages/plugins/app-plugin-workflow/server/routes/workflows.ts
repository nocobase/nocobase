import { parseApiInput } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { validator } from 'hono/validator';

import { workflowErrorHandler } from './errors.js';
import { paginate, parseBoolean, toPageResponse } from './helpers.js';
import {
  PageQuery,
  WorkflowListQuery,
  WorkflowParametersInput,
  WorkflowParams,
  WorkflowSourceParams,
} from './schemas.js';
import type { WorkflowRepository } from '../repositories/workflow-repository.js';

export function createWorkflowDefinitionRoutes(
  workflows: Pick<
    WorkflowRepository,
    | 'list'
    | 'enable'
    | 'disable'
    | 'getParameters'
    | 'updateParameters'
    | 'getSource'
    | 'sourceRevisions'
    | 'get'
    | 'revisions'
  >,
): Hono {
  const routes = new Hono();
  routes.onError(workflowErrorHandler);

  routes.get(
    '/workflows',
    validator('query', (value) => parseApiInput(WorkflowListQuery, value)),
    async (c) => {
      const { q, enabled, page, pageSize } = c.req.valid('query');
      const enabledFilter = parseBoolean(enabled);
      const result = await workflows.list({
        ...(q === undefined ? {} : { query: q }),
        ...(enabledFilter === undefined ? {} : { enabled: enabledFilter }),
        ...(page === undefined ? {} : { page }),
        ...(pageSize === undefined ? {} : { pageSize }),
      });
      return c.json(toPageResponse(result));
    },
  );

  // Fixed segments are registered before `/workflows/:workflowId`, which a numeric id or an Artifact hash can never
  // shadow: neither form can spell `sources`.
  routes.get(
    '/workflows/sources/:key',
    validator('param', (value) => parseApiInput(WorkflowSourceParams, value)),
    async (c) =>
      c.json({ data: await workflows.getSource(c.req.valid('param').key) }),
  );
  routes.get(
    '/workflows/sources/:key/revisions',
    validator('param', (value) => parseApiInput(WorkflowSourceParams, value)),
    validator('query', (value) => parseApiInput(PageQuery, value)),
    async (c) =>
      c.json(
        paginate(
          await workflows.sourceRevisions(c.req.valid('param').key),
          c.req.valid('query'),
        ),
      ),
  );

  routes.get(
    '/workflows/:workflowId',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    async (c) =>
      c.json({ data: await workflows.get(c.req.valid('param').workflowId) }),
  );
  routes.get(
    '/workflows/:workflowId/revisions',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    validator('query', (value) => parseApiInput(PageQuery, value)),
    async (c) =>
      c.json(
        paginate(
          await workflows.revisions(c.req.valid('param').workflowId),
          c.req.valid('query'),
        ),
      ),
  );
  routes.get(
    '/workflows/:workflowId/parameters',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    async (c) =>
      c.json({
        data: await workflows.getParameters(c.req.valid('param').workflowId),
      }),
  );
  routes.put(
    '/workflows/:workflowId/parameters',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    validator('json', (value) => parseApiInput(WorkflowParametersInput, value)),
    async (c) => {
      const data = await workflows.updateParameters(
        c.req.valid('param').workflowId,
        c.req.valid('json').parameterValues,
      );
      return c.json({ data });
    },
  );
  routes.post(
    '/workflows/:workflowId/enable',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    async (c) =>
      c.json({ data: await workflows.enable(c.req.valid('param').workflowId) }),
  );
  routes.post(
    '/workflows/:workflowId/disable',
    validator('param', (value) => parseApiInput(WorkflowParams, value)),
    async (c) =>
      c.json({
        data: await workflows.disable(c.req.valid('param').workflowId),
      }),
  );

  return routes;
}
