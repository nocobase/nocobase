import { Hono } from 'hono';

import {
  parseBoolean,
  readBody,
  readEnabled,
  readParameterValues,
  readPage,
  toPageResponse,
} from './helpers.js';
import type { WorkflowRepository } from '../repositories/workflow-repository.js';
import { translateWorkflowMessage } from '../i18n.js';

export function createWorkflowDefinitionRoutes(
  workflows: Pick<
    WorkflowRepository,
    | 'list'
    | 'enable'
    | 'disable'
    | 'setStatus'
    | 'getParameters'
    | 'updateParameters'
    | 'getSource'
    | 'sourceRevisions'
    | 'get'
    | 'revisions'
  >,
): Hono {
  const routes = new Hono();

  routes.get('/workflows', async (c) => {
    const enabled = parseBoolean(c.req.query('enabled'));
    const page = await workflows.list({
      query: c.req.query('q'),
      ...(enabled === undefined ? {} : { enabled }),
      ...readPage(c.req.query('page'), c.req.query('pageSize')),
    });
    return c.json(toPageResponse(page));
  });

  routes.get('/workflows/by-key/:key/source', async (c) =>
    c.json({ data: await workflows.getSource(c.req.param('key')) }),
  );
  routes.get('/workflows/by-key/:key/source/revisions', async (c) =>
    c.json({ data: await workflows.sourceRevisions(c.req.param('key')) }),
  );

  routes.get('/workflows/:id', async (c) =>
    c.json({ data: await workflows.get(c.req.param('id')) }),
  );
  routes.get('/workflows/:id/revisions', async (c) =>
    c.json({ data: await workflows.revisions(c.req.param('id')) }),
  );
  routes.get('/workflows/:id/parameters', async (c) =>
    c.json({ data: await workflows.getParameters(c.req.param('id')) }),
  );
  routes.put('/workflows/:id/parameters', async (c) => {
    const data = await workflows.updateParameters(
      c.req.param('id'),
      await readParameterValues(c.req.raw),
    );
    return c.json({ data });
  });
  routes.patch('/workflows/:id/status', async (c) => {
    const enabled = readEnabled(await readBody(c.req.raw));
    if (enabled === undefined)
      return c.json(
        {
          message: translateWorkflowMessage(
            c,
            'errors.enabledBoolean',
            'enabled must be a boolean',
          ),
        },
        400,
      );
    const data = await workflows.setStatus(c.req.param('id'), enabled);
    return c.json({ data });
  });
  routes.post('/workflows/:id/enable', async (c) => {
    return c.json({
      data: await workflows.enable(c.req.param('id')),
    });
  });
  routes.post('/workflows/:id/disable', async (c) =>
    c.json({ data: await workflows.disable(c.req.param('id')) }),
  );

  return routes;
}
