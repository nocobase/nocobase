// @vitest-environment node
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { projectsAccessToken } from '@nocobase/app-plugin-projects/server/tokens';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it } from 'vitest';

import { studioAccessToken } from '../../server/access/token.js';
import { buildsRoutes } from '../../server/builds/routes.js';
import { studioBuildsToken } from '../../server/builds/token.js';
import { studioDeploysToken } from '../../server/deploys/token.js';
import { previewsRoutes } from '../../server/previews/routes.js';
import { studioPreviewApiToken } from '../../server/previews/token.js';
import { projectInitsRoutes } from '../../server/projects-init/routes.js';
import { studioProjectInitsToken } from '../../server/projects-init/token.js';
import { studioRepositoryLinksToken } from '../../server/releases/provider.js';
import { releasesRoutes } from '../../server/releases/routes.js';

const pass: MiddlewareHandler = async (_context, next) => next();

/** The routers as Studio builds them, over services never called: only their declarations are read. */
async function routers() {
  const container = new ServiceContainer();
  container.instance(authenticationToken, { required: () => pass } as never);
  container.instance(authorizationToken, { middleware: () => pass } as never);
  for (const token of [
    projectsAccessToken,
    studioAccessToken,
    studioBuildsToken,
    studioDeploysToken,
    studioPreviewApiToken,
    studioProjectInitsToken,
    studioRepositoryLinksToken,
    releasesToken,
  ])
    container.instance(token, {} as never);
  const app = { container } as unknown as Application;
  return Promise.all(
    [previewsRoutes, projectInitsRoutes, releasesRoutes, buildsRoutes].map(
      (routes) => routes.createRouter(app),
    ),
  );
}

describe('the previews, deployments, project setup and build routes in the API document', () => {
  it('declares every route with a Studio operation', async () => {
    const operationIds: string[] = [];
    for (const router of await routers()) {
      expect(findUndeclaredApiRoutes(router)).toEqual([]);
      const document = await generateApiDocument(router, {
        info: { title: 'Test', version: '1.0.0' },
      });
      expect(findApiDocumentSchemaProblems(document)).toEqual([]);
      for (const item of Object.values(document.paths ?? {}))
        for (const operation of Object.values(item ?? {})) {
          const { operationId, tags } = operation as {
            operationId?: string;
            tags?: string[];
          };
          expect(tags).toEqual(['Studio']);
          operationIds.push(operationId!);
        }
    }
    expect(new Set(operationIds).size).toBe(operationIds.length);
    expect(
      operationIds.every((id) =>
        /^(previews|deploys|projectSetups|repositoryDeployments|builds)[A-Z]/u.test(
          id,
        ),
      ),
    ).toBe(true);
    expect(operationIds).toEqual(
      expect.arrayContaining([
        'previewsListPreviews',
        'deploysListMarks',
        'deploysDecideReopenSuggestion',
        'projectSetupsCreateProject',
        'projectSetupsRetry',
        'repositoryDeploymentsGetCiWorkflow',
        'buildsUploadArtifact',
        'buildsCreateUploadTicket',
        'buildsReportBuild',
        'buildsEnsureApp',
        'buildsDeploy',
      ]),
    );
  });

  it('documents the build upload as a binary body authenticated by its ticket', async () => {
    const builds = (await routers())[3]!;
    const document = await generateApiDocument(builds, {
      info: { title: 'Test', version: '1.0.0' },
    });
    const upload =
      document.paths?.['/api/builds/{buildId}/uploadArtifact']?.post;
    expect(upload?.security).toEqual([]);
    expect(upload?.description).toContain('Bearer fgb_');
    expect(upload?.requestBody).toMatchObject({
      content: { 'application/octet-stream': {} },
    });
  });
});

describe('the build routes on the command line', () => {
  it('names CI’s commands, streams the archive to a ticket and keeps the upload target off', async () => {
    const builds = (await routers())[3]!;
    const document = await generateApiDocument(builds, {
      info: { title: 'Test', version: '1.0.0' },
    });
    const cli = (path: string) =>
      (document.paths?.[path]?.post as Record<string, unknown> | undefined)?.[
        'x-cli'
      ];
    expect(cli('/api/builds/uploadTickets')).toMatchObject({
      command: 'release upload',
      ticketUpload: { flag: 'file', accept: ['.tar.gz', '.tgz'] },
      action: 'rel.apps/upload',
    });
    expect(cli('/api/builds/report')).toMatchObject({
      command: 'build status',
      action: 'rel.apps/upload',
    });
    // `--file` is optional: with it the archive is streamed to the ticket and deployed.
    expect(cli('/api/builds/deploy')).toMatchObject({
      command: 'deploy',
      ticketUpload: { flag: 'file', optional: true },
      action: 'rel.apps/deploy',
    });
    expect(cli('/api/builds/apps/{appId}/ensure')).toMatchObject({
      command: 'app ensure',
      args: ['appId'],
      action: 'rel.apps/upload',
    });
    expect(cli('/api/builds/{buildId}/uploadArtifact')).toBe(false);
  });
});
