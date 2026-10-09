import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
  inspectApiRoutes,
  type ApiDocument,
  type OpenAPIV3_1,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono, type MiddlewareHandler } from 'hono';
import { beforeAll, describe, expect, it } from 'vitest';

import { mailApiRoutes } from '../../server/routes/api.js';
import type { MailService } from '../../server/contracts/service.js';
import { mailServiceToken } from '../../server/tokens.js';

const passThrough: MiddlewareHandler = async (_context, next) => {
  await next();
};

async function createMailApiRouter(): Promise<Hono> {
  const container = new ServiceContainer();
  // The document is generated from route declarations alone; no request reaches the service.
  container.instance(mailServiceToken, {} as MailService);
  container.instance(authenticationToken, {
    required: () => passThrough,
  } as unknown as Auth);
  container.instance(authorizationToken, {
    middleware: () => passThrough,
  } as unknown as AppAuthorization);
  const config = new AppConfig();
  await config.loadAll();
  return mailApiRoutes.createRouter({
    appName: 'test',
    publicBasePath: '/test',
    config,
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
}

const expectedOperations: readonly (readonly [string, string, string])[] = [
  ['get', '/api/mail/providers', 'mailListProviders'],
  ['get', '/api/mail/accounts', 'mailListAccounts'],
  ['post', '/api/mail/accounts/connect', 'mailConnectAccount'],
  ['patch', '/api/mail/accounts/{accountId}', 'mailUpdateAccount'],
  ['delete', '/api/mail/accounts/{accountId}', 'mailDeleteAccount'],
  ['post', '/api/mail/authorizations', 'mailCreateAuthorization'],
  ['get', '/api/mail/accounts/{accountId}/identities', 'mailListIdentities'],
  [
    'patch',
    '/api/mail/accounts/{accountId}/identities/{identityId}',
    'mailUpdateIdentity',
  ],
  ['get', '/api/mail/accounts/{accountId}/signatures', 'mailListSignatures'],
  ['post', '/api/mail/accounts/{accountId}/signatures', 'mailCreateSignature'],
  [
    'patch',
    '/api/mail/accounts/{accountId}/signatures/{signatureId}',
    'mailUpdateSignature',
  ],
  [
    'delete',
    '/api/mail/accounts/{accountId}/signatures/{signatureId}',
    'mailDeleteSignature',
  ],
  ['get', '/api/mail/accounts/{accountId}/folders', 'mailListFolders'],
  ['post', '/api/mail/accounts/{accountId}/sync', 'mailSyncAccount'],
  ['get', '/api/mail/templates', 'mailListTemplates'],
  ['post', '/api/mail/templates', 'mailCreateTemplate'],
  ['patch', '/api/mail/templates/{templateId}', 'mailUpdateTemplate'],
  ['delete', '/api/mail/templates/{templateId}', 'mailDeleteTemplate'],
  ['get', '/api/mail/labels', 'mailListLabels'],
  ['post', '/api/mail/labels', 'mailCreateLabel'],
  ['patch', '/api/mail/labels/{labelId}', 'mailUpdateLabel'],
  ['delete', '/api/mail/labels/{labelId}', 'mailDeleteLabel'],
  ['post', '/api/mail/attachments', 'mailUploadAttachment'],
  ['get', '/api/mail/attachments/{attachmentId}', 'mailDownloadAttachment'],
  ['get', '/api/mail/messages', 'mailListMessages'],
  ['get', '/api/mail/messages/countUnread', 'mailCountUnreadMessages'],
  ['post', '/api/mail/messages/send', 'mailSendMessage'],
  ['post', '/api/mail/messages/sendBulk', 'mailSendBulkMessages'],
  ['post', '/api/mail/messages/saveDraft', 'mailSaveDraft'],
  [
    'get',
    '/api/mail/accounts/{accountId}/conversations/{conversationId}/messages',
    'mailListConversationMessages',
  ],
  [
    'get',
    '/api/mail/accounts/{accountId}/messages/{messageId}',
    'mailGetMessage',
  ],
  [
    'patch',
    '/api/mail/accounts/{accountId}/messages/{messageId}',
    'mailUpdateMessage',
  ],
  [
    'delete',
    '/api/mail/accounts/{accountId}/messages/{messageId}',
    'mailDeleteMessage',
  ],
  [
    'get',
    '/api/mail/accounts/{accountId}/messages/{messageId}/attachments/{attachmentId}',
    'mailDownloadMessageAttachment',
  ],
  [
    'post',
    '/api/mail/accounts/{accountId}/messages/{messageId}/modifyLabels',
    'mailModifyMessageLabels',
  ],
  [
    'post',
    '/api/mail/accounts/{accountId}/messages/{messageId}/move',
    'mailMoveMessage',
  ],
  [
    'post',
    '/api/mail/accounts/{accountId}/messages/{messageId}/retryContent',
    'mailRetryMessageContent',
  ],
  [
    'post',
    '/api/mail/accounts/{accountId}/messages/{messageId}/resolveDraftConflict',
    'mailResolveDraftConflict',
  ],
  ['get', '/api/mail/syncRuns', 'mailListSyncRuns'],
  ['get', '/api/mail/syncRuns/{syncRunId}', 'mailGetSyncRun'],
  ['post', '/api/mail/syncRuns/{syncRunId}/retry', 'mailRetrySyncRun'],
  ['post', '/api/mail/syncRuns/{syncRunId}/cancel', 'mailCancelSyncRun'],
  ['get', '/api/mail/submissions', 'mailListSubmissions'],
  ['post', '/api/mail/submissions/{submissionId}/retry', 'mailRetrySubmission'],
  [
    'post',
    '/api/mail/submissions/{submissionId}/cancel',
    'mailCancelSubmission',
  ],
  ['get', '/api/mail/settings/accounts', 'mailListAdminAccounts'],
  ['get', '/api/mail/settings/syncRuns', 'mailListAdminSyncRuns'],
  ['get', '/api/mail/settings/submissions', 'mailListAdminSubmissions'],
  ['get', '/api/mail/management/accounts', 'mailListManagedAccounts'],
  [
    'get',
    '/api/mail/management/accounts/{accountId}/folders',
    'mailListManagedFolders',
  ],
  ['get', '/api/mail/management/messages', 'mailListManagedMessages'],
  [
    'post',
    '/api/mail/management/messages/batchApply',
    'mailBatchApplyManagedMessages',
  ],
  [
    'get',
    '/api/mail/management/accounts/{accountId}/messages/{messageId}',
    'mailGetManagedMessage',
  ],
  [
    'get',
    '/api/mail/management/accounts/{accountId}/messages/{messageId}/attachments/{attachmentId}',
    'mailDownloadManagedMessageAttachment',
  ],
];

function operation(
  document: ApiDocument,
  method: string,
  path: string,
): OpenAPIV3_1.OperationObject {
  const item = document.paths?.[path] as
    Record<string, OpenAPIV3_1.OperationObject> | undefined;
  const found = item?.[method];
  if (!found)
    throw new Error(`${method.toUpperCase()} ${path} is not documented`);
  return found;
}

describe('Mail API document', () => {
  let router: Hono;
  let document: ApiDocument;

  beforeAll(async () => {
    router = await createMailApiRouter();
    document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
  });

  it('refers only to schemas the document defines', () => {
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  });

  it('declares every route, hiding none', () => {
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const routes = inspectApiRoutes(router);
    expect(routes.filter((route) => route.hidden)).toEqual([]);
    expect(routes).toHaveLength(expectedOperations.length);
    for (const route of routes) expect(route.tags).toEqual(['Mail']);
  });

  it('documents each route under its operationId', () => {
    for (const [method, path, operationId] of expectedOperations) {
      expect(operation(document, method, path).operationId).toBe(operationId);
    }
    const operationIds = expectedOperations.map(([, , id]) => id);
    expect(new Set(operationIds).size).toBe(operationIds.length);
  });

  it('documents request inputs from the validators', () => {
    const send = operation(document, 'post', '/api/mail/messages/send');
    const body = send.requestBody as OpenAPIV3_1.RequestBodyObject;
    expect(body.content['application/json']?.schema).toBeDefined();
    const list = operation(document, 'get', '/api/mail/messages');
    expect(
      (list.parameters as OpenAPIV3_1.ParameterObject[]).map(
        (parameter) => parameter.name,
      ),
    ).toEqual(expect.arrayContaining(['pageSize', 'pageToken', 'accountId']));
  });

  it('documents the response bodies with shared schemas', () => {
    const get = operation(
      document,
      'get',
      '/api/mail/accounts/{accountId}/messages/{messageId}',
    );
    expect(Object.keys(get.responses ?? {})).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '404', '500']),
    );
    expect(document.components?.schemas).toHaveProperty('MailMessage');
    expect(document.components?.schemas).toHaveProperty('MailAccount');
    expect(document.components?.schemas).toHaveProperty('MailCursorListMeta');
    const label = operation(document, 'post', '/api/mail/labels');
    expect(Object.keys(label.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '409', '413']),
    );
  });

  it('documents the attachment upload as multipart with 413 and 415', () => {
    const upload = operation(document, 'post', '/api/mail/attachments');
    const body = upload.requestBody as OpenAPIV3_1.RequestBodyObject;
    expect(Object.keys(body.content)).toEqual(['multipart/form-data']);
    expect(Object.keys(upload.responses ?? {})).toEqual(
      expect.arrayContaining(['201', '413', '415']),
    );
  });

  it('documents attachment downloads as binary content', () => {
    const download = operation(
      document,
      'get',
      '/api/mail/accounts/{accountId}/messages/{messageId}/attachments/{attachmentId}',
    );
    const ok = download.responses?.['200'] as OpenAPIV3_1.ResponseObject;
    expect(ok.content?.['*/*']?.schema).toMatchObject({
      type: 'string',
      format: 'binary',
    });
  });
});
