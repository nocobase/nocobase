// @vitest-environment node
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it } from 'vitest';

import { gitRoutes, gitWebhookRoutes } from '../../server/git/routes.js';
import { studioGitToken } from '../../server/git/token.js';

const pass: MiddlewareHandler = async (_context, next) => next();

/** The routers as Studio builds them, over services never called: only their declarations are read. */
async function routers() {
  const container = new ServiceContainer();
  container.instance(authenticationToken, { required: () => pass } as never);
  container.instance(authorizationToken, { middleware: () => pass } as never);
  container.instance(studioGitToken, {} as never);
  const app = { container } as unknown as Application;
  return Promise.all(
    [gitRoutes, gitWebhookRoutes].map((routes) => routes.createRouter(app)),
  );
}

describe('the git routes in the API document', () => {
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
    expect(operationIds.every((id) => /^(git|webhooks)[A-Z]/u.test(id))).toBe(
      true,
    );
    expect(operationIds).toEqual(
      expect.arrayContaining([
        'gitListConnections',
        'gitStartAppManifest',
        'gitAuthorizeConnection',
        'gitMergePullRequest',
        'gitOpenPullRequest',
        'gitListMarks',
        'webhooksReceiveGithubConnectionEvent',
        'webhooksReceiveGithubRepositoryEvent',
      ]),
    );
  });

  it('documents the webhooks as public, signed by GitHub', async () => {
    const [, webhooks] = await routers();
    const document = await generateApiDocument(webhooks!, {
      info: { title: 'Test', version: '1.0.0' },
    });
    const receive =
      document.paths?.['/api/webhooks/github/connections/{connectionId}']?.post;
    expect(receive?.security).toEqual([]);
    expect(receive?.description).toContain('X-Hub-Signature-256');
    expect(Object.keys(receive?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '404',
      '500',
    ]);
  });
});
