// @vitest-environment node
/** `/api/knowledge` in the API document: every route declared, the schemas sound. */
import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, describe, expect, it } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { knowledgeToken } from '../server/tokens.js';
import { createKnowledgeHarness, type KnowledgeHarness } from './harness.js';

describe('knowledge API document', () => {
  let h: KnowledgeHarness | undefined;
  afterEach(async () => {
    await h?.close();
  });

  it('declares every route', async () => {
    h = await createKnowledgeHarness();
    const container = new ServiceContainer();
    container.instance(authenticationToken, {
      required: () => async (_context, next) => {
        await next();
      },
    } as Auth);
    container.instance(knowledgeToken, h.knowledge);
    const router = await apiRoutes.createRouter({
      appName: 'test',
      publicBasePath: '',
      config: {} as AppPluginApplication['config'],
      paths: {} as AppPluginApplication['paths'],
      router: {} as AppPluginApplication['router'],
      container,
    });

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);

    const operations = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => operation as { operationId?: string; tags?: string[] },
      ),
    );
    const ids = operations.map((operation) => operation.operationId ?? '');
    expect(ids).toHaveLength(35);
    expect(new Set(ids).size).toBe(ids.length);
    for (const operation of operations) {
      expect(operation.operationId).toMatch(/^knowledge[A-Z]/u);
      expect(operation.tags).toEqual(['Knowledge']);
    }
    expect(ids).toEqual(
      expect.arrayContaining([
        'knowledgeRedeemTicket',
        'knowledgeSearchDocs',
        'knowledgeCreateDoc',
        'knowledgeUploadDoc',
        'knowledgeGetDocFile',
        'knowledgeReplaceDocPermissions',
        'knowledgeAcceptProposal',
        'knowledgeRequestProposalChanges',
        'knowledgeRequestDocChanges',
        'knowledgeArchiveDoc',
        'knowledgeGetChunking',
        'knowledgeUpdateChunking',
        'knowledgeListUnindexedDocs',
        'knowledgeGetDocIndex',
        'knowledgeReindexDoc',
      ]),
    );

    const paths = document.paths ?? {};
    // The ticket is the credential, not a session or an API key.
    expect(
      paths['/api/knowledge/tickets/{ticketId}/redeem']?.post?.security,
    ).toEqual([]);
    expect(
      Object.keys(
        (
          paths['/api/knowledge/docs/upload']?.post?.requestBody as {
            content: Record<string, unknown>;
          }
        ).content,
      ),
    ).toEqual(['multipart/form-data']);
    expect(
      Object.keys(
        paths['/api/knowledge/docs/{docId}/file']?.get?.responses?.['200']
          ?.content ?? {},
      ),
    ).toEqual(['*/*']);
  });
});
