import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { boundedList, domainRouter, tags } from '../../kernel/http.js';
import {
  BoundedListMeta,
  CreateLabelBody,
  LabelParams,
  LabelSchema,
  UpdateLabelBody,
} from '../../routes/schemas.js';
import type { LabelService } from './label.service.js';

const manage = 'Needs `update` on the `pm.labels` settings item.';

/** `/api/projects/labels`. */
export function createLabelRoutes(labels: LabelService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/',
    describeRoute({
      tags,
      summary: 'List labels',
      operationId: 'projectsListLabels',
      ...cliRoute({
        command: 'label list',
        columns: ['id', 'name', 'color'],
      }),
      responses: {
        200: listResponse(LabelSchema, BoundedListMeta),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json(boundedList(await labels.list())),
  );
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Create a label',
      operationId: 'projectsCreateLabel',
      ...cliRoute({
        command: 'label create',
        args: ['name'],
        examples: ['label create bug --color "#e5484d"'],
      }),
      description: manage,
      responses: {
        201: dataResponse(LabelSchema),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'When a label has that name (`LABEL_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateLabelBody),
    async (context) =>
      context.json(
        {
          data: await labels.create(
            viewerOf(context),
            context.req.valid('json'),
          ),
        },
        201,
      ),
  );
  routes.patch(
    '/:labelId',
    describeRoute({
      tags,
      summary: 'Update a label',
      operationId: 'projectsUpdateLabel',
      ...cliRoute({
        command: 'label update',
        flags: { labelId: { name: 'label' } },
      }),
      description: manage,
      responses: {
        200: dataResponse(LabelSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
        409: apiErrorResponse(
          409,
          'When another label has that name (`LABEL_EXISTS`).',
        ),
      },
    }),
    apiValidator('param', LabelParams),
    apiValidator('json', UpdateLabelBody),
    async (context) =>
      context.json({
        data: await labels.update(
          viewerOf(context),
          context.req.valid('param').labelId,
          context.req.valid('json'),
        ),
      }),
  );
  routes.delete(
    '/:labelId',
    describeRoute({
      tags,
      summary: 'Delete a label',
      operationId: 'projectsDeleteLabel',
      ...cliRoute({
        command: 'label delete',
        flags: { labelId: { name: 'label' } },
        confirm: 'Delete this label? Issues lose it.',
      }),
      description: manage,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', LabelParams),
    async (context) => {
      await labels.remove(
        viewerOf(context),
        context.req.valid('param').labelId,
      );
      return context.body(null, 204);
    },
  );
  return routes;
}
