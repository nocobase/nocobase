import type { DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';

import type { WorkflowService } from '../service.js';
import { WorkflowRepository } from '../repositories/workflow-repository.js';
import { WorkflowRunRepository } from '../repositories/workflow-run-repository.js';
import { createNodeRunRoutes } from './node-runs.js';
import { createWorkflowRunRoutes } from './workflow-runs.js';
import { createWorkflowDefinitionRoutes } from './workflows.js';

export function createWorkflowRoutes(
  database: DatabaseManager,
  service: WorkflowService,
): Hono {
  const workflows = new WorkflowRepository(database, service);
  const workflowRuns = new WorkflowRunRepository(database, service);
  const routes = new Hono();
  // `/workflows/runs/...` is mounted before `/workflows/:workflowId` so the fixed segment is matched first.
  routes.route('/', createWorkflowRunRoutes(workflowRuns));
  routes.route('/', createNodeRunRoutes(workflowRuns));
  routes.route('/', createWorkflowDefinitionRoutes(workflows));
  return routes;
}
