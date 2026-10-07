// @vitest-environment node
/** Every `/api/releases` route declares itself in the API document. */
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { Releases } from '../server/composition.js';
import { createReleasesApi } from '../server/routes/api.js';

function router(): Hono {
  // Only the route table is read; no request reaches the services.
  const services = { guard: {} } as unknown as Releases;
  const api = createReleasesApi(services, {
    authenticate: async (_context, next) => await next(),
    callerOf: () => Promise.reject(new Error('unused')),
  });
  return new Hono().route('/releases', api);
}

describe('API document', () => {
  it('declares every route with a releases operationId', async () => {
    const routes = router();
    expect(findUndeclaredApiRoutes(routes)).toEqual([]);

    const document = await generateApiDocument(routes, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);

    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) =>
          operation as { operationId?: string; tags?: readonly string[] },
      ),
    );
    const operationIds = operations.map(({ operationId }) => operationId);
    expect(operations.length).toBe(56);
    expect(new Set(operationIds).size).toBe(operationIds.length);
    for (const operation of operations) {
      expect(operation.operationId).toMatch(/^releases[A-Z]/);
      expect(operation.tags).toEqual(['Releases']);
    }
    expect(operationIds).toEqual(
      expect.arrayContaining([
        'releasesListApps',
        'releasesDeployApp',
        'releasesUploadRelease',
        'releasesCreateUploadTicket',
        'releasesReadAppLogs',
        'releasesApproveDeploymentRequest',
      ]),
    );

    const paths = document.paths ?? {};
    expect(
      paths['/api/releases/apps/{appId}/deploy']?.post?.responses,
    ).toHaveProperty('202');
    expect(
      paths['/api/releases/apps/{appId}/releases']?.post?.requestBody,
    ).toMatchObject({ content: { 'application/gzip': {} } });
  });
});
