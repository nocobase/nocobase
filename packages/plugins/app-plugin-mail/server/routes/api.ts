import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiErrorResponseCode,
  type DescribeRouteOptions,
  type ApiResponseObject,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { getRequestLocale, getRequestTranslator } from '@nocobase/i18n/server';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';

import {
  type MailConfig,
  resolveMailOAuthCallbackUrl,
  resolveMailOAuthOrigin,
} from '../config.js';
import { MailIdempotencyConflictError } from '../operations/send-mail.js';
import {
  classifyMailProviderError,
  isMailProviderError,
  MailError,
  toPublicError,
} from '../services/errors.js';
import { mailServiceToken } from '../tokens.js';
import {
  AccountConversationParams,
  AccountMessageAttachmentParams,
  AccountMessageParams,
  AccountParams,
  AttachmentParams,
  ConnectAccountInput,
  ConversationMessagesQuery,
  DeleteMessageQuery,
  IdentityParams,
  LabelParams,
  ManageMessagesInput,
  ManagementMessagesQuery,
  MessagesQuery,
  ModifyMessageLabelsInput,
  MoveMessageInput,
  ResolveDraftConflictInput,
  SaveDraftInput,
  ManagedLogsQuery,
  SaveLabelInput,
  SaveSignatureInput,
  SaveTemplateInput,
  SendBulkInput,
  SendMessageInput,
  SignatureParams,
  StartAuthorizationInput,
  StartSyncInput,
  SubmissionParams,
  SubmissionsQuery,
  SyncRunParams,
  SyncRunsQuery,
  TemplateParams,
  UpdateAccountInput,
  UpdateIdentityInput,
  UpdateLabelInput,
  UpdateMessageInput,
  UpdateSignatureInput,
  UpdateTemplateInput,
  MailAccountSchema,
  MailAuthorizationSchema,
  MailBoundedListMeta,
  MailCursorListMeta,
  MailFolderSchema,
  MailIdentitySchema,
  MailLabelSchema,
  MailManagedAccountSchema,
  MailManagementActionResultSchema,
  MailMessageSchema,
  MailMessageSummarySchema,
  MailOutboundAttachmentSchema,
  MailPageListMeta,
  MailProviderSchema,
  MailSignatureSchema,
  MailSubmissionLogSchema,
  MailSubmissionSchema,
  MailSyncRunSchema,
  MailTemplateSchema,
  MailUnreadCountSchema,
} from './schemas.js';

type MailRoutesEnv = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

/** The namespace of every Mail route and the domain of every error Mail defines. */
const MAIL_DOMAIN = 'mail';
const MAIL_NAMESPACE = '@nocobase/app-plugin-mail';
const MAX_ATTACHMENT_UPLOAD_BYTES = 27 * 1024 * 1024;
const MAX_JSON_REQUEST_BYTES = 8 * 1024 * 1024;
const MAIL_WORKSPACE_RESOURCE = 'mail.workspace';
const MAIL_ADMIN_RESOURCE = 'mail.admin';
const MAIL_MANAGEMENT_RESOURCE = 'mail.management';

/** Answered by a route that waits for the mail Provider when the Provider throttles the request. */
const providerRateLimited =
  'The mail Provider is rate limiting requests or a Provider quota ran out (`MAIL_PROVIDER_REQUEST_FAILED`). When the Provider says how long to wait, `Retry-After` and `metadata.retryAfter` give the delay in seconds.';
/** Answered by a route that waits for the mail Provider when the Provider cannot be reached or fails on its side. */
const providerUnavailable =
  'The mail Provider could not be reached, timed out or failed on its side (`MAIL_PROVIDER_REQUEST_FAILED`); retrying later may succeed.';

interface MailRouteOptions {
  readonly description?: string;
  /**
   * Statuses this route answers beyond 401, 403 and 500, `true` for the shared description or its own. The 400 for
   * invalid input comes from `apiValidator()`; list 400 here only for another reason, such as a failed precondition.
   */
  readonly errors?: Partial<Record<ApiErrorResponseCode, true | string>>;
  readonly requestBody?: DescribeRouteOptions['requestBody'];
}

/** The API document entry of one Mail route. */
function mailRoute(
  operationId: string,
  summary: string,
  responses: Record<string, ApiResponseObject>,
  options: MailRouteOptions = {},
): MiddlewareHandler {
  const errors: Record<string, ApiResponseObject> = {};
  for (const [code, description] of Object.entries(options.errors ?? {})) {
    const status = Number(code) as ApiErrorResponseCode;
    errors[code] =
      description === true
        ? apiErrorResponse(status)
        : apiErrorResponse(status, description);
  }
  return describeRoute({
    tags: ['Mail'],
    operationId,
    summary,
    ...(options.description ? { description: options.description } : {}),
    ...(options.requestBody ? { requestBody: options.requestBody } : {}),
    responses: { ...responses, ...apiErrorResponses, ...errors },
  });
}

/** A file answered as it is stored, with the attachment's own media type. */
const attachmentDownloadResponse: ApiResponseObject = {
  description:
    'The file, with its own `Content-Type` and a `Content-Disposition: attachment` header naming it.',
  content: { '*/*': { schema: { type: 'string', format: 'binary' } } },
};

const attachmentUploadBody: DescribeRouteOptions['requestBody'] = {
  required: true,
  content: {
    'multipart/form-data': {
      schema: {
        type: 'object',
        required: ['file'],
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'The file to attach, at most 27 MiB.',
          },
        },
      },
    },
  },
};

export const mailApiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container, config, publicBasePath }) => {
    const router = new Hono();
    const routes = new Hono<MailRoutesEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const mail = container.resolve(mailServiceToken);

    // Authentication and page access come before anything reads the request, so a caller without access learns
    // nothing about which accounts, messages, or runs exist.
    routes.use(
      '*',
      authentication.required(),
      authorization.middleware(),
      async (context, next) => {
        const resource = /(?:^|\/)mail\/settings(?:\/|$)/u.test(
          context.req.path,
        )
          ? MAIL_ADMIN_RESOURCE
          : /(?:^|\/)mail\/management(?:\/|$)/u.test(context.req.path)
            ? MAIL_MANAGEMENT_RESOURCE
            : MAIL_WORKSPACE_RESOURCE;
        const allowed = await context.get('authz').can({
          resource: { type: 'page', id: resource },
          action: 'access',
        });
        if (!allowed) {
          return apiErrorHandler(
            new ApiError({
              status: 'PERMISSION_DENIED',
              reason: 'MAIL_ACCESS_DENIED',
              domain: MAIL_DOMAIN,
              message: `Access to the ${resource} page is required.`,
              ...localized(context, 'errors.accessDenied'),
            }),
            context,
          );
        }
        await next();
      },
    );
    routes.onError((error, context) => {
      const apiError = toMailApiError(error, context);
      return withRetryAfter(apiErrorHandler(apiError, context), apiError);
    });

    const jsonBodyLimit = bodyLimit({
      maxSize: MAX_JSON_REQUEST_BYTES,
      onError: (context) =>
        apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'BODY_TOO_LARGE',
            domain: MAIL_DOMAIN,
            message: `The request body exceeds ${MAX_JSON_REQUEST_BYTES} bytes.`,
            httpStatus: 413,
            ...localized(context, 'errors.invalidRequest'),
          }),
          context,
        ),
    }) as MiddlewareHandler<MailRoutesEnv>;
    routes.use('*', async (context, next) => {
      if (
        (context.req.method === 'POST' || context.req.method === 'PATCH') &&
        !/\/mail\/attachments$/u.test(context.req.path)
      ) {
        return jsonBodyLimit(
          context as Parameters<typeof jsonBodyLimit>[0],
          next,
        );
      }
      return next();
    });

    // -----------------------------------------------------------------------------------------------------------------
    // Accounts, Providers, and authorization

    routes.get(
      '/providers',
      mailRoute('mailListProviders', 'List the configured mail Providers', {
        '200': listResponse(MailProviderSchema, MailBoundedListMeta),
      }),
      async (context) => context.json(boundedList(await mail.listProviders())),
    );
    routes.get(
      '/accounts',
      mailRoute('mailListAccounts', "List the caller's mail accounts", {
        '200': listResponse(MailAccountSchema, MailBoundedListMeta),
      }),
      async (context) =>
        context.json(
          boundedList(await mail.listAccounts(operationContext(context))),
        ),
    );
    // Connecting verifies the credentials against the Provider before it stores anything, so it is a custom method on
    // the collection rather than a plain create, but it does create the account and answers 201 with it.
    routes.post(
      '/accounts/connect',
      mailRoute(
        'mailConnectAccount',
        'Connect an account with credentials',
        { '201': dataResponse(MailAccountSchema) },
        {
          description:
            'Verifies the address, user name and password against a credentials Provider (such as IMAP/SMTP) before storing anything, then creates the account and starts its first synchronization. OAuth Providers connect through `mailCreateAuthorization` instead.',
          errors: {
            400: 'The named mail Provider is not configured or is disabled (`MAIL_PROVIDER_UNAVAILABLE`), the Provider refused the sign-in with these credentials (`MAIL_ACCOUNT_CREDENTIALS_INVALID`, with a field violation on `password`), or the Provider rejected the request otherwise (`MAIL_PROVIDER_REQUEST_FAILED`).',
            413: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('json', ConnectAccountInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json(
          {
            data: await mail.connectAccount(operationContext(context), {
              provider: { type: input.type, name: input.name },
              address: input.address,
              ...(input.displayName !== undefined
                ? { displayName: input.displayName }
                : {}),
              username: input.username ?? input.address,
              password: input.password,
              initialSyncReceivedAfter: input.initialSyncReceivedAfter,
            }),
          },
          201,
        );
      },
    );
    routes.patch(
      '/accounts/:accountId',
      mailRoute(
        'mailUpdateAccount',
        'Suspend or resume an account',
        { '200': dataResponse(MailAccountSchema) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`), or must be reauthorized before it can be resumed (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      apiValidator('json', UpdateAccountInput),
      async (context) =>
        context.json({
          data: await mail.updateAccount(operationContext(context), {
            accountId: context.req.valid('param').accountId,
            status: context.req.valid('json').status,
          }),
        }),
    );
    // Removal is durable and asynchronous: the account is marked for removal and a background task deletes its
    // messages and Provider subscriptions, so the request is acknowledged with 202 and the account in its `removing`
    // state. When the background task has already deleted the row there is nothing left to show, and the 202 has no
    // body.
    routes.delete(
      '/accounts/:accountId',
      mailRoute(
        'mailDeleteAccount',
        'Remove an account',
        {
          '202': dataResponse(
            MailAccountSchema,
            'Removal started. The body holds the account in its `removing` state, or is empty when the background removal has already deleted it.',
          ),
        },
        {
          description:
            'Removal is asynchronous: the account is marked `removing` and a background task deletes its messages and Provider subscriptions.',
          errors: { 404: true },
        },
      ),
      apiValidator('param', AccountParams),
      async (context) => {
        const account = await mail.removeAccount(
          operationContext(context),
          context.req.valid('param').accountId,
        );
        return account
          ? context.json({ data: account }, 202)
          : context.body(null, 202);
      },
    );
    routes.post(
      '/authorizations',
      mailRoute(
        'mailCreateAuthorization',
        'Start connecting an OAuth account',
        { '201': dataResponse(MailAuthorizationSchema) },
        {
          description:
            'Answers the Provider authorization URL to open in a browser. The Provider redirects back to the Mail OAuth callback, which creates the account; that callback is a browser flow and is not part of this API.',
          errors: {
            400: 'The named mail Provider is not configured or is disabled (`MAIL_PROVIDER_UNAVAILABLE`), or its configuration does not allow the requested `scopes` (`MAIL_PROVIDER_REQUEST_FAILED`).',
            413: true,
          },
        },
      ),
      apiValidator('json', StartAuthorizationInput),
      async (context) => {
        const input = context.req.valid('json');
        const identity = config.get<AppIdentityConfig>('app')!;
        const origin = resolveMailOAuthOrigin(
          identity.publicOrigin,
          new URL(context.req.url).origin,
        );
        const configuredMail = config.get<MailConfig>('mail')!;
        return context.json(
          {
            data: await mail.startAuthorization(operationContext(context), {
              provider: { type: input.type, name: input.name },
              redirectUri: resolveMailOAuthCallbackUrl(
                configuredMail.oauthCallbackUrl,
                origin,
                publicBasePath,
              ).toString(),
              ...(input.scopes !== undefined ? { scopes: input.scopes } : {}),
              initialSyncReceivedAfter: input.initialSyncReceivedAfter,
            }),
          },
          201,
        );
      },
    );
    routes.get(
      '/accounts/:accountId/identities',
      mailRoute(
        'mailListIdentities',
        'List the addresses an account can send from',
        { '200': listResponse(MailIdentitySchema, MailBoundedListMeta) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      async (context) =>
        context.json(
          boundedList(
            await mail.listIdentities(
              operationContext(context),
              context.req.valid('param').accountId,
            ),
          ),
        ),
    );
    routes.patch(
      '/accounts/:accountId/identities/:identityId',
      mailRoute(
        'mailUpdateIdentity',
        'Change the display name of a sending address',
        { '200': dataResponse(MailIdentitySchema) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', IdentityParams),
      apiValidator('json', UpdateIdentityInput),
      async (context) => {
        const { accountId, identityId } = context.req.valid('param');
        return context.json({
          data: await mail.updateIdentity(operationContext(context), {
            accountId,
            identityId,
            displayName: context.req.valid('json').displayName,
          }),
        });
      },
    );
    routes.get(
      '/accounts/:accountId/signatures',
      mailRoute(
        'mailListSignatures',
        "List an account's signatures",
        { '200': listResponse(MailSignatureSchema, MailBoundedListMeta) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      async (context) =>
        context.json(
          boundedList(
            await mail.listSignatures(
              operationContext(context),
              context.req.valid('param').accountId,
            ),
          ),
        ),
    );
    routes.post(
      '/accounts/:accountId/signatures',
      mailRoute(
        'mailCreateSignature',
        'Create a signature',
        { '201': dataResponse(MailSignatureSchema) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      apiValidator('json', SaveSignatureInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json(
          {
            data: await mail.saveSignature(operationContext(context), {
              accountId: context.req.valid('param').accountId,
              name: input.name,
              text: input.text ?? '',
              html: input.html,
              isDefault: input.isDefault,
            }),
          },
          201,
        );
      },
    );
    routes.patch(
      '/accounts/:accountId/signatures/:signatureId',
      mailRoute(
        'mailUpdateSignature',
        'Update a signature',
        { '200': dataResponse(MailSignatureSchema) },
        {
          description: 'Omitted fields keep their stored values.',
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', SignatureParams),
      apiValidator('json', UpdateSignatureInput),
      async (context) => {
        const { accountId, signatureId } = context.req.valid('param');
        return context.json({
          data: await mail.updateSignature(operationContext(context), {
            ...context.req.valid('json'),
            id: signatureId,
            accountId,
          }),
        });
      },
    );
    routes.delete(
      '/accounts/:accountId/signatures/:signatureId',
      mailRoute(
        'mailDeleteSignature',
        'Delete a signature',
        { '204': emptyResponse() },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SignatureParams),
      async (context) => {
        const { accountId, signatureId } = context.req.valid('param');
        await mail.deleteSignature(
          operationContext(context),
          accountId,
          signatureId,
        );
        return context.body(null, 204);
      },
    );
    routes.get(
      '/accounts/:accountId/folders',
      mailRoute(
        'mailListFolders',
        "List an account's folders",
        { '200': listResponse(MailFolderSchema, MailBoundedListMeta) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      async (context) =>
        context.json(
          boundedList(
            await mail.listFolders(
              operationContext(context),
              context.req.valid('param').accountId,
            ),
          ),
        ),
    );
    routes.post(
      '/accounts/:accountId/sync',
      mailRoute(
        'mailSyncAccount',
        'Start synchronizing an account',
        {
          '202': dataResponse(
            MailSyncRunSchema,
            'Synchronization was queued; follow it with `mailGetSyncRun`.',
          ),
        },
        {
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`), an incremental synchronization was requested before the initial one completed (`MAIL_INITIAL_SYNC_REQUIRED`), or an initial synchronization has no start date (`INVALID_MAIL_REQUEST`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      apiValidator('json', StartSyncInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json(
          {
            data: await mail.startSync(operationContext(context), {
              accountId: context.req.valid('param').accountId,
              ...(input.mode !== undefined ? { mode: input.mode } : {}),
              ...(input.receivedAfter !== undefined
                ? { receivedAfter: input.receivedAfter }
                : {}),
            }),
          },
          202,
        );
      },
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Templates and labels

    routes.get(
      '/templates',
      mailRoute('mailListTemplates', "List the caller's templates", {
        '200': listResponse(MailTemplateSchema, MailBoundedListMeta),
      }),
      async (context) =>
        context.json(
          boundedList(await mail.listTemplates(operationContext(context))),
        ),
    );
    routes.post(
      '/templates',
      mailRoute(
        'mailCreateTemplate',
        'Create a template',
        { '201': dataResponse(MailTemplateSchema) },
        { errors: { 413: true } },
      ),
      apiValidator('json', SaveTemplateInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json(
          {
            data: await mail.saveTemplate(operationContext(context), {
              name: input.name,
              subject: input.subject ?? '',
              text: input.text,
              html: input.html,
            }),
          },
          201,
        );
      },
    );
    routes.patch(
      '/templates/:templateId',
      mailRoute(
        'mailUpdateTemplate',
        'Update a template',
        { '200': dataResponse(MailTemplateSchema) },
        {
          description: 'Omitted fields keep their stored values.',
          errors: { 404: true, 413: true },
        },
      ),
      apiValidator('param', TemplateParams),
      apiValidator('json', UpdateTemplateInput),
      async (context) =>
        context.json({
          data: await mail.updateTemplate(operationContext(context), {
            ...context.req.valid('json'),
            id: context.req.valid('param').templateId,
          }),
        }),
    );
    routes.delete(
      '/templates/:templateId',
      mailRoute(
        'mailDeleteTemplate',
        'Delete a template',
        { '204': emptyResponse() },
        { errors: { 404: true } },
      ),
      apiValidator('param', TemplateParams),
      async (context) => {
        await mail.deleteTemplate(
          operationContext(context),
          context.req.valid('param').templateId,
        );
        return context.body(null, 204);
      },
    );
    routes.get(
      '/labels',
      mailRoute('mailListLabels', "List the caller's labels", {
        '200': listResponse(MailLabelSchema, MailBoundedListMeta),
      }),
      async (context) =>
        context.json(
          boundedList(await mail.listLabels(operationContext(context))),
        ),
    );
    routes.post(
      '/labels',
      mailRoute(
        'mailCreateLabel',
        'Create a label',
        { '201': dataResponse(MailLabelSchema) },
        {
          errors: { 409: 'A label with this name already exists.', 413: true },
        },
      ),
      apiValidator('json', SaveLabelInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json(
          {
            data: await mail.createLabel(operationContext(context), {
              name: input.name,
              color: input.color,
            }),
          },
          201,
        );
      },
    );
    routes.patch(
      '/labels/:labelId',
      mailRoute(
        'mailUpdateLabel',
        'Update a label',
        { '200': dataResponse(MailLabelSchema) },
        {
          description: 'Omitted fields keep their stored values.',
          errors: {
            404: true,
            409: 'Another label already has this name.',
            413: true,
          },
        },
      ),
      apiValidator('param', LabelParams),
      apiValidator('json', UpdateLabelInput),
      async (context) =>
        context.json({
          data: await mail.updateLabel(operationContext(context), {
            ...context.req.valid('json'),
            id: context.req.valid('param').labelId,
          }),
        }),
    );
    routes.delete(
      '/labels/:labelId',
      mailRoute(
        'mailDeleteLabel',
        'Delete a label',
        { '204': emptyResponse() },
        { errors: { 404: true } },
      ),
      apiValidator('param', LabelParams),
      async (context) => {
        await mail.deleteLabel(
          operationContext(context),
          context.req.valid('param').labelId,
        );
        return context.body(null, 204);
      },
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Outbound attachments

    routes.post(
      '/attachments',
      mailRoute(
        'mailUploadAttachment',
        'Upload an attachment for a message being composed',
        {
          '201': dataResponse(
            MailOutboundAttachmentSchema,
            'The file was stored.',
          ),
        },
        {
          description:
            'Uploads one file as `multipart/form-data` with a `file` part. Pass the answered `id` in `attachmentIds` when sending or saving a draft. An upload that is never used expires.',
          errors: {
            400: 'The body has no readable `file` part, or the file is over 25 MiB or has no name (`INVALID_MAIL_REQUEST`), or attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`).',
            413: 'The upload exceeds 27 MiB.',
            415: 'The body is not `multipart/form-data`.',
          },
          requestBody: attachmentUploadBody,
        },
      ),
      bodyLimit({
        maxSize: MAX_ATTACHMENT_UPLOAD_BYTES,
        onError: (context) =>
          apiErrorHandler(
            new ApiError({
              status: 'INVALID_ARGUMENT',
              reason: 'BODY_TOO_LARGE',
              domain: MAIL_DOMAIN,
              message: `The attachment upload exceeds ${MAX_ATTACHMENT_UPLOAD_BYTES} bytes.`,
              httpStatus: 413,
              ...localized(context, 'errors.invalidRequest'),
            }),
            context,
          ),
      }),
      async (context) => {
        // A multipart body has no JSON schema; its type and file field are validated here.
        const mediaType = (context.req.header('content-type') ?? '')
          .split(';', 1)[0]
          ?.trim()
          .toLowerCase();
        if (mediaType !== 'multipart/form-data') {
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'INVALID_MAIL_REQUEST',
            domain: MAIL_DOMAIN,
            message: 'An attachment upload must be multipart/form-data.',
            httpStatus: 415,
          });
        }
        let form: FormData;
        try {
          form = await context.req.formData();
        } catch (cause) {
          throw invalidField('file', 'A valid multipart body is required.', {
            cause,
          });
        }
        const file = form.get('file');
        if (!(file instanceof File)) {
          throw invalidField('file', 'Mail attachment file is required.');
        }
        return context.json(
          {
            data: await mail.uploadAttachment(operationContext(context), {
              fileName: file.name,
              contentType: file.type || 'application/octet-stream',
              size: file.size,
              stream: file.stream(),
            }),
          },
          201,
        );
      },
    );
    routes.get(
      '/attachments/:attachmentId',
      mailRoute(
        'mailDownloadAttachment',
        'Download an uploaded attachment',
        { '200': attachmentDownloadResponse },
        {
          errors: {
            400: 'Attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AttachmentParams),
      async (context) => {
        const content = await mail.getUploadedAttachment(
          operationContext(context),
          context.req.valid('param').attachmentId,
        );
        return new Response(content.stream, {
          headers: {
            'content-type': content.contentType,
            'content-disposition': attachmentDisposition(content.fileName),
            'x-content-type-options': 'nosniff',
            'cache-control': 'private, no-store',
          },
        });
      },
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Messages. Fixed segments under /messages are registered before anything that takes an id.

    routes.get(
      '/messages',
      mailRoute(
        'mailListMessages',
        "List the caller's messages",
        { '200': listResponse(MailMessageSummarySchema, MailCursorListMeta) },
        {
          description:
            'Filters by account, folder (including the virtual folders), label, conversation, search text, unread and starred. Paged by `pageToken`.',
          errors: {
            400: '`pageToken` is not a token this list answered (`INVALID_MAIL_REQUEST`).',
          },
        },
      ),
      apiValidator('query', MessagesQuery),
      async (context) => {
        const query = context.req.valid('query');
        const page = await mail.listMessages(operationContext(context), {
          accountIds: query.accountId ? [query.accountId] : undefined,
          folderIds: query.folderId ? [query.folderId] : undefined,
          labelIds: query.labelId ? [query.labelId] : undefined,
          conversationId: query.conversationId,
          query: query.q,
          cursor: query.pageToken,
          limit: query.pageSize,
          withTotal: true,
          unread: query.unread,
          starred: query.starred,
        });
        return context.json({ data: page.items, meta: cursorMeta(page) });
      },
    );
    routes.get(
      '/messages/countUnread',
      mailRoute(
        'mailCountUnreadMessages',
        "Count the caller's unread messages",
        { '200': dataResponse(MailUnreadCountSchema) },
      ),
      async (context) =>
        context.json({
          data: await mail.getUnreadCount(operationContext(context)),
        }),
    );
    routes.post(
      '/messages/send',
      mailRoute(
        'mailSendMessage',
        'Send a message',
        { '200': dataResponse(MailSubmissionSchema) },
        {
          description:
            'Hands the message to the outbox, or schedules it when `scheduledAt` is given. Repeating a request with the same `idempotencyKey` answers the same submission.',
          errors: {
            400: 'The account, sending identity, signature, draft, related message or an attachment the body names does not exist (`MAIL_*_NOT_FOUND`), the account is not active (`MAIL_ACCOUNT_INACTIVE`), the draft is scheduled (`MAIL_DRAFT_SCHEDULED`), attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`), or the message is otherwise invalid, such as attachments over 25 MiB in total or a `scheduledAt` in the past (`INVALID_MAIL_REQUEST`).',
            409: 'The idempotency key was used for a different request, or the draft revision is outdated.',
            413: true,
          },
        },
      ),
      apiValidator('json', SendMessageInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json({
          data: await mail.sendMessage(operationContext(context), {
            ...input,
            subject: input.subject ?? '',
            text: input.text ?? '',
            html: input.html,
          }),
        });
      },
    );
    routes.post(
      '/messages/sendBulk',
      mailRoute(
        'mailSendBulkMessages',
        'Send one message to each recipient separately',
        {
          '200': dataResponse(
            z.array(MailSubmissionSchema),
            'One submission per recipient.',
          ),
        },
        {
          description:
            'Each recipient receives an individual copy and cannot see the others.',
          errors: {
            400: 'The account, sending identity, signature, draft, related message or an attachment the body names does not exist (`MAIL_*_NOT_FOUND`), the account is not active (`MAIL_ACCOUNT_INACTIVE`), the draft is scheduled (`MAIL_DRAFT_SCHEDULED`), attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`), or the request is otherwise invalid, such as an `idempotencyKey` used for a different draft or recipient count (`INVALID_MAIL_REQUEST`).',
            409: 'The idempotency key was used for a different request.',
            413: true,
          },
        },
      ),
      apiValidator('json', SendBulkInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json({
          data: await mail.sendBulk(operationContext(context), {
            ...input,
            subject: input.subject ?? '',
            text: input.text ?? '',
            html: input.html,
            forwardBodyIncluded: input.forwardBodyIncluded === true,
          }),
        });
      },
    );
    // Saving a draft creates it or replaces the draft named by `draftMessageId` or `draftKey`, so it is a custom method
    // rather than a create.
    routes.post(
      '/messages/saveDraft',
      mailRoute(
        'mailSaveDraft',
        'Create or replace a draft',
        { '200': dataResponse(MailMessageSchema) },
        {
          description:
            'Replaces the draft named by `draftMessageId` or `draftKey`, or creates one.',
          errors: {
            400: 'The account, sending identity, draft, related message or an attachment the body names does not exist (`MAIL_*_NOT_FOUND`), the account is not active (`MAIL_ACCOUNT_INACTIVE`), the draft is scheduled (`MAIL_DRAFT_SCHEDULED`), or the draft is otherwise invalid, such as both a reply and a forward (`INVALID_MAIL_REQUEST`).',
            409: 'The idempotency key was used for a different request, or `draftRevision` is not newer than the stored draft.',
            413: true,
          },
        },
      ),
      apiValidator('json', SaveDraftInput),
      async (context) => {
        const input = context.req.valid('json');
        return context.json({
          data: await mail.saveDraft(operationContext(context), {
            ...input,
            to: input.to ?? [],
            subject: input.subject ?? '',
            text: input.text ?? '',
            html: input.html,
          }),
        });
      },
    );
    routes.get(
      '/accounts/:accountId/conversations/:conversationId/messages',
      mailRoute(
        'mailListConversationMessages',
        'List the messages of a conversation',
        { '200': listResponse(MailMessageSchema, MailCursorListMeta) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`), or `pageToken` is not a token this list answered (`INVALID_MAIL_REQUEST`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AccountConversationParams),
      apiValidator('query', ConversationMessagesQuery),
      async (context) => {
        const { accountId, conversationId } = context.req.valid('param');
        const query = context.req.valid('query');
        const page = await mail.listConversationMessages(
          operationContext(context),
          accountId,
          conversationId,
          { cursor: query.pageToken, limit: query.pageSize },
        );
        return context.json({ data: page.items, meta: cursorMeta(page) });
      },
    );
    routes.get(
      '/accounts/:accountId/messages/:messageId',
      mailRoute(
        'mailGetMessage',
        'Get a message',
        { '200': dataResponse(MailMessageSchema) },
        { errors: { 404: true } },
      ),
      apiValidator('param', AccountMessageParams),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        const message = await mail.getMessage(
          operationContext(context),
          accountId,
          messageId,
        );
        if (!message) throw messageNotFound(context);
        return context.json({ data: message });
      },
    );
    routes.patch(
      '/accounts/:accountId/messages/:messageId',
      mailRoute(
        'mailUpdateMessage',
        'Mark a message read or starred, or change its note',
        { '200': dataResponse(MailMessageSchema) },
        {
          description:
            '`read` and `starred` are synchronized to the Provider; `note` and `todo` stay in NocoBase.',
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`) or must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot change read or starred state (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`), or rejected the change (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            413: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      apiValidator('json', UpdateMessageInput),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        const input = context.req.valid('json');
        return context.json({
          data: await mail.updateMessage(operationContext(context), {
            accountId,
            messageId,
            read: input.read,
            starred: input.starred,
            note: input.note,
            todo: input.todo,
          }),
        });
      },
    );
    routes.delete(
      '/accounts/:accountId/messages/:messageId',
      mailRoute(
        'mailDeleteMessage',
        'Delete a message',
        { '204': emptyResponse() },
        {
          description:
            'Moves the message to the trash, or deletes it at the Provider when `permanently` is `true`.',
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`) or must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), the draft is scheduled (`MAIL_DRAFT_SCHEDULED`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot delete messages (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`), or rejected the request (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      apiValidator('query', DeleteMessageQuery),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        await mail.deleteMessage(operationContext(context), {
          accountId,
          messageId,
          permanently: context.req.valid('query').permanently,
        });
        return context.body(null, 204);
      },
    );
    routes.get(
      '/accounts/:accountId/messages/:messageId/attachments/:attachmentId',
      mailRoute(
        'mailDownloadMessageAttachment',
        'Download an attachment of a message',
        { '200': attachmentDownloadResponse },
        {
          errors: {
            400: 'The attachment is not available at the Provider (`MAIL_ATTACHMENT_UNAVAILABLE`), attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`), the account must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot download attachments (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`) or rejected the request (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageAttachmentParams),
      async (context) => {
        const { accountId, messageId, attachmentId } =
          context.req.valid('param');
        return attachmentResponse(
          await mail.getAttachment(
            operationContext(context),
            accountId,
            messageId,
            attachmentId,
          ),
        );
      },
    );
    routes.post(
      '/accounts/:accountId/messages/:messageId/modifyLabels',
      mailRoute(
        'mailModifyMessageLabels',
        'Add or remove labels on a message',
        { '200': dataResponse(MailMessageSchema) },
        {
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`), or a label id names no label of the caller (`MAIL_LABEL_NOT_FOUND`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      apiValidator('json', ModifyMessageLabelsInput),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        const input = context.req.valid('json');
        return context.json({
          data: await mail.updateMessageLabels(operationContext(context), {
            accountId,
            messageId,
            addLabelIds: input.addLabelIds,
            removeLabelIds: input.removeLabelIds,
          }),
        });
      },
    );
    routes.post(
      '/accounts/:accountId/messages/:messageId/move',
      mailRoute(
        'mailMoveMessage',
        'Move a message to another folder',
        { '200': dataResponse(MailMessageSchema) },
        {
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`) or must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), the message is a scheduled or local-only draft (`MAIL_DRAFT_SCHEDULED`, `MAIL_DRAFT_LOCAL_ONLY`), `providerFolderId` names no folder of the account (`MAIL_FOLDER_NOT_FOUND`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot move messages (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`), or rejected the move (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            413: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      apiValidator('json', MoveMessageInput),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        return context.json({
          data: await mail.moveMessage(operationContext(context), {
            accountId,
            messageId,
            providerFolderId: context.req.valid('json').providerFolderId,
          }),
        });
      },
    );
    routes.post(
      '/accounts/:accountId/messages/:messageId/retryContent',
      mailRoute(
        'mailRetryMessageContent',
        'Download the body of a message again',
        { '200': dataResponse(MailMessageSchema) },
        {
          description:
            'For a message whose `contentStatus` is `deferred` or `failed`.',
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`) or must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot load message content (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`), or rejected the request (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        return context.json({
          data: await mail.retryMessageContent(
            operationContext(context),
            accountId,
            messageId,
          ),
        });
      },
    );
    routes.post(
      '/accounts/:accountId/messages/:messageId/resolveDraftConflict',
      mailRoute(
        'mailResolveDraftConflict',
        'Resolve a draft changed both here and at the Provider',
        { '200': dataResponse(MailMessageSchema) },
        {
          description:
            '`useRemote` takes the Provider version; `keepLocal` overwrites it with the local one.',
          errors: {
            400: 'The account is not active (`MAIL_ACCOUNT_INACTIVE`), the draft is scheduled (`MAIL_DRAFT_SCHEDULED`), or the message has no draft conflict (`MAIL_DRAFT_CONFLICT_NOT_FOUND`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      apiValidator('json', ResolveDraftConflictInput),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        return context.json({
          data: await mail.resolveDraftConflict(operationContext(context), {
            accountId,
            messageId,
            action: context.req.valid('json').action,
          }),
        });
      },
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Sync runs and submissions: the caller's own logs, paged by page number.

    routes.get(
      '/syncRuns',
      mailRoute('mailListSyncRuns', "List the caller's synchronization runs", {
        '200': listResponse(MailSyncRunSchema, MailPageListMeta),
      }),
      apiValidator('query', SyncRunsQuery),
      async (context) => {
        const { page, pageSize } = context.req.valid('query');
        const result = await mail.listSyncRunsPage(
          operationContext(context),
          (page - 1) * pageSize,
          pageSize,
        );
        return context.json({
          data: result.items,
          meta: { page, pageSize, total: result.total },
        });
      },
    );
    routes.get(
      '/syncRuns/:syncRunId',
      mailRoute(
        'mailGetSyncRun',
        'Get a synchronization run',
        { '200': dataResponse(MailSyncRunSchema) },
        { errors: { 404: true } },
      ),
      apiValidator('param', SyncRunParams),
      async (context) => {
        const run = await mail.getSyncRun(
          operationContext(context),
          context.req.valid('param').syncRunId,
        );
        if (!run) {
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'MAIL_SYNC_RUN_NOT_FOUND',
            domain: MAIL_DOMAIN,
            message: 'Mail sync run was not found.',
            ...localized(context, 'errors.syncRunNotFound'),
          });
        }
        return context.json({ data: run });
      },
    );
    routes.post(
      '/syncRuns/:syncRunId/retry',
      mailRoute(
        'mailRetrySyncRun',
        'Retry a synchronization run',
        { '202': dataResponse(MailSyncRunSchema, 'The run was queued again.') },
        {
          errors: {
            400: 'The run is not failed or cancelled (`MAIL_SYNC_RUN_STATE_INVALID`), its account is being removed or is not active (`MAIL_ACCOUNT_REMOVING`, `MAIL_ACCOUNT_INACTIVE`), or an incremental run is retried before the initial synchronization completed (`MAIL_INITIAL_SYNC_REQUIRED`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SyncRunParams),
      async (context) =>
        context.json(
          {
            data: await mail.retrySyncRun(
              operationContext(context),
              context.req.valid('param').syncRunId,
            ),
          },
          202,
        ),
    );
    routes.post(
      '/syncRuns/:syncRunId/cancel',
      mailRoute(
        'mailCancelSyncRun',
        'Cancel a synchronization run',
        { '200': dataResponse(MailSyncRunSchema) },
        {
          errors: {
            400: 'The run is no longer pending or running (`MAIL_SYNC_RUN_STATE_INVALID`), or its account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SyncRunParams),
      async (context) =>
        context.json({
          data: await mail.cancelSyncRun(
            operationContext(context),
            context.req.valid('param').syncRunId,
          ),
        }),
    );
    routes.get(
      '/submissions',
      mailRoute(
        'mailListSubmissions',
        "List the caller's sent and scheduled messages",
        { '200': listResponse(MailSubmissionLogSchema, MailPageListMeta) },
        {
          description:
            'With `groupByBatch`, a bulk send counts as one row and `meta.total` counts batches.',
        },
      ),
      apiValidator('query', SubmissionsQuery),
      async (context) => {
        const { page, pageSize, bulkOnly, groupByBatch } =
          context.req.valid('query');
        const result = await mail.listSubmissionsPage(
          operationContext(context),
          bulkOnly ?? false,
          (page - 1) * pageSize,
          groupByBatch ?? false,
          pageSize,
        );
        return context.json({
          data: result.items,
          meta: { page, pageSize, total: result.total },
        });
      },
    );
    routes.post(
      '/submissions/:submissionId/retry',
      mailRoute(
        'mailRetrySubmission',
        'Retry a failed submission',
        { '200': dataResponse(MailSubmissionLogSchema) },
        {
          errors: {
            400: 'The submission has not failed (`MAIL_SUBMISSION_STATE_INVALID`), or its account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SubmissionParams),
      async (context) =>
        context.json({
          data: await mail.retrySubmission(
            operationContext(context),
            context.req.valid('param').submissionId,
          ),
        }),
    );
    routes.post(
      '/submissions/:submissionId/cancel',
      mailRoute(
        'mailCancelSubmission',
        'Cancel a scheduled or pending submission',
        { '200': dataResponse(MailSubmissionLogSchema) },
        {
          errors: {
            400: 'The submission is no longer pending or failed (`MAIL_SUBMISSION_STATE_INVALID`), or its account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SubmissionParams),
      async (context) =>
        context.json({
          data: await mail.cancelSubmission(
            operationContext(context),
            context.req.valid('param').submissionId,
          ),
        }),
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Administration (`mail.admin`): every user's accounts and operation logs. The logs grow without bound, so sync
    // runs and submissions are separate lists paged by page number, as the caller's own logs are.
    //
    // `/settings/accounts` and `/management/accounts` read the same list but are separate operations of separate
    // pages: each is gated by its own page permission, and merging them would force granting one page to use the
    // other.

    routes.get(
      '/settings/accounts',
      mailRoute(
        'mailListAdminAccounts',
        "List every user's mail accounts for the Mail settings page",
        { '200': listResponse(MailManagedAccountSchema, MailBoundedListMeta) },
        { description: 'Requires access to the `mail.admin` page.' },
      ),
      async (context) =>
        context.json(
          boundedList(
            await mail.listManagedAccounts(operationContext(context)),
          ),
        ),
    );
    routes.get(
      '/settings/syncRuns',
      mailRoute(
        'mailListAdminSyncRuns',
        "List every user's synchronization runs",
        { '200': listResponse(MailSyncRunSchema, MailPageListMeta) },
        { description: 'Requires access to the `mail.admin` page.' },
      ),
      apiValidator('query', ManagedLogsQuery),
      async (context) => {
        const { page, pageSize } = context.req.valid('query');
        const result = await mail.listManagedSyncRunsPage(
          operationContext(context),
          (page - 1) * pageSize,
          pageSize,
        );
        return context.json({
          data: result.items,
          meta: { page, pageSize, total: result.total },
        });
      },
    );
    routes.get(
      '/settings/submissions',
      mailRoute(
        'mailListAdminSubmissions',
        "List every user's submissions",
        { '200': listResponse(MailSubmissionLogSchema, MailPageListMeta) },
        { description: 'Requires access to the `mail.admin` page.' },
      ),
      apiValidator('query', ManagedLogsQuery),
      async (context) => {
        const { page, pageSize } = context.req.valid('query');
        const result = await mail.listManagedSubmissionsPage(
          operationContext(context),
          (page - 1) * pageSize,
          pageSize,
        );
        return context.json({
          data: result.items,
          meta: { page, pageSize, total: result.total },
        });
      },
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Management (`mail.management`): every user's mailboxes, as an administrative table paged by page number.

    routes.get(
      '/management/accounts',
      mailRoute(
        'mailListManagedAccounts',
        "List every user's mail accounts for mailbox management",
        { '200': listResponse(MailManagedAccountSchema, MailBoundedListMeta) },
        { description: 'Requires access to the `mail.management` page.' },
      ),
      async (context) =>
        context.json(
          boundedList(
            await mail.listManagedAccounts(operationContext(context)),
          ),
        ),
    );
    routes.get(
      '/management/accounts/:accountId/folders',
      mailRoute(
        'mailListManagedFolders',
        "List the folders of any user's account",
        { '200': listResponse(MailFolderSchema, MailBoundedListMeta) },
        {
          description: 'Requires access to the `mail.management` page.',
          errors: { 404: true },
        },
      ),
      apiValidator('param', AccountParams),
      async (context) =>
        context.json(
          boundedList(
            await mail.listManagedFolders(
              operationContext(context),
              context.req.valid('param').accountId,
            ),
          ),
        ),
    );
    routes.get(
      '/management/messages',
      mailRoute(
        'mailListManagedMessages',
        "List messages across every user's accounts",
        { '200': listResponse(MailMessageSummarySchema, MailPageListMeta) },
        { description: 'Requires access to the `mail.management` page.' },
      ),
      apiValidator('query', ManagementMessagesQuery),
      async (context) => {
        const query = context.req.valid('query');
        const result = await mail.listManagedMessages(
          operationContext(context),
          {
            accountIds: query.accountId ? [query.accountId] : undefined,
            folderIds: query.folderId ? [query.folderId] : undefined,
            query: query.q,
            offset: (query.page - 1) * query.pageSize,
            limit: query.pageSize,
            withTotal: true,
            unread: query.unread,
            starred: query.starred,
          },
        );
        return context.json({
          data: result.items,
          meta: {
            page: query.page,
            pageSize: query.pageSize,
            total: result.total ?? result.items.length,
          },
        });
      },
    );
    routes.post(
      '/management/messages/batchApply',
      mailRoute(
        'mailBatchApplyManagedMessages',
        'Apply one action to several messages of any user',
        { '200': dataResponse(MailManagementActionResultSchema) },
        {
          description:
            'Requires access to the `mail.management` page. Each message succeeds or fails on its own; the result reports both.',
          errors: { 413: true },
        },
      ),
      apiValidator('json', ManageMessagesInput),
      async (context) =>
        context.json({
          data: await mail.manageMessages(
            operationContext(context),
            context.req.valid('json'),
          ),
        }),
    );
    routes.get(
      '/management/accounts/:accountId/messages/:messageId',
      mailRoute(
        'mailGetManagedMessage',
        "Get a message of any user's account",
        { '200': dataResponse(MailMessageSchema) },
        {
          description: 'Requires access to the `mail.management` page.',
          errors: { 404: true },
        },
      ),
      apiValidator('param', AccountMessageParams),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        const message = await mail.getManagedMessage(
          operationContext(context),
          accountId,
          messageId,
        );
        if (!message) throw messageNotFound(context);
        return context.json({ data: message });
      },
    );
    routes.get(
      '/management/accounts/:accountId/messages/:messageId/attachments/:attachmentId',
      mailRoute(
        'mailDownloadManagedMessageAttachment',
        "Download an attachment of any user's message",
        { '200': attachmentDownloadResponse },
        {
          description: 'Requires access to the `mail.management` page.',
          errors: {
            400: 'The attachment is not available at the Provider (`MAIL_ATTACHMENT_UNAVAILABLE`), attachment storage is not configured (`MAIL_ATTACHMENT_STORAGE_NOT_CONFIGURED`), the account must be reconnected because the mail Provider no longer accepts its authorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), or the mail Provider is not configured (`MAIL_PROVIDER_UNAVAILABLE`), cannot download attachments (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`) or rejected the request (`MAIL_PROVIDER_REQUEST_FAILED`).',
            404: true,
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageAttachmentParams),
      async (context) => {
        const { accountId, messageId, attachmentId } =
          context.req.valid('param');
        return attachmentResponse(
          await mail.getManagedAttachment(
            operationContext(context),
            accountId,
            messageId,
            attachmentId,
          ),
        );
      },
    );

    router.route('/mail', routes);
    return router;
  });

function operationContext(context: {
  get(
    key: 'auth',
  ): NonNullable<import('@nocobase/app-plugin-authentication').AuthSession>;
  req: { raw: Request };
}): { actorId: string; signal: AbortSignal } {
  return {
    actorId: context.get('auth').user.id,
    signal: context.req.raw.signal,
  };
}

/**
 * The body of a bounded list: a user's accounts, an account's folders, the configured Providers, and similar lists
 * whose size the user or the configuration limits. They are answered whole, with `meta.total`.
 */
function boundedList<T>(items: readonly T[]): {
  data: readonly T[];
  meta: { total: number };
} {
  return { data: items, meta: { total: items.length } };
}

/** `meta` for a cursor-paged feed: the opaque token for the next page, absent on the last one, and the total. */
function cursorMeta(page: {
  readonly nextCursor?: string;
  readonly total?: number;
}): { nextPageToken?: string; total?: number } {
  return {
    ...(page.nextCursor ? { nextPageToken: page.nextCursor } : {}),
    ...(page.total !== undefined ? { total: page.total } : {}),
  };
}

function attachmentResponse(
  content: import('../../shared/mail.js').MailAttachmentContent,
): Response {
  const headers = new Headers({
    'content-type': safeContentType(content.contentType),
    'content-disposition': attachmentDisposition(content.fileName),
    'x-content-type-options': 'nosniff',
  });
  if (content.size !== undefined) {
    headers.set('content-length', String(content.size));
  }
  return new Response(content.stream, { headers });
}

/** The request's translation of a Mail message key, as the error body's `localizedMessage`. */
function localized(
  context: Context,
  key: string,
): { localizedMessage?: { locale: string; message: string } } {
  try {
    const locale = getRequestLocale(context);
    const message = getRequestTranslator(context, MAIL_NAMESPACE)(key);
    return locale && message ? { localizedMessage: { locale, message } } : {};
  } catch {
    // A router mounted without the i18n middleware answers without a translation.
    return {};
  }
}

function messageNotFound(context: Context): ApiError {
  return new ApiError({
    status: 'NOT_FOUND',
    reason: 'MAIL_MESSAGE_NOT_FOUND',
    domain: MAIL_DOMAIN,
    message: 'Mail message was not found.',
    ...localized(context, 'errors.messageNotFound'),
  });
}

function invalidField(
  field: string,
  description: string,
  options: { readonly cause?: unknown } = {},
): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_MAIL_REQUEST',
    domain: MAIL_DOMAIN,
    message: description,
    fieldViolations: [{ field, description }],
    cause: options.cause,
  });
}

/**
 * Translate Mail's own errors into the standard error body. Anything else is returned unchanged, so `apiErrorHandler`
 * renders what the framework recognizes and the application answers the rest with an opaque 500.
 */
function toMailApiError(error: unknown, context: Context): unknown {
  if (error instanceof MailIdempotencyConflictError) {
    return new ApiError({
      status: 'ABORTED',
      reason: 'MAIL_IDEMPOTENCY_CONFLICT',
      domain: MAIL_DOMAIN,
      message: error.message,
      ...localized(context, 'errors.idempotencyConflict'),
      cause: error,
    });
  }
  if (error instanceof MailError) {
    if (error.status === 'INVALID_ARGUMENT') {
      return new ApiError({
        status: 'INVALID_ARGUMENT',
        reason: error.reason,
        domain: MAIL_DOMAIN,
        message: error.message,
        ...(error.field
          ? {
              fieldViolations: [
                { field: error.field, description: error.message },
              ],
            }
          : {}),
        ...localized(context, 'errors.invalidRequest'),
        cause: error,
      });
    }
    // A missing resource is 404 only when the URL names it; one the body or query refers to makes the request invalid.
    if (
      error.status === 'NOT_FOUND' &&
      error.field &&
      !pathParameters(context)[error.field]
    ) {
      return new ApiError({
        status: 'INVALID_ARGUMENT',
        reason: error.reason,
        domain: MAIL_DOMAIN,
        message: error.message,
        fieldViolations: [{ field: error.field, description: error.message }],
        ...localized(context, 'errors.invalidRequest'),
        cause: error,
      });
    }
    return new ApiError({
      status: error.status,
      reason: error.reason,
      domain: MAIL_DOMAIN,
      message: error.message,
      ...localized(
        context,
        error.reason === 'MAIL_MESSAGE_NOT_FOUND'
          ? 'errors.messageNotFound'
          : error.reason === 'MAIL_SYNC_RUN_NOT_FOUND'
            ? 'errors.syncRunNotFound'
            : 'errors.requestFailed',
      ),
      cause: error,
    });
  }
  if (isMailProviderError(error)) return mailProviderApiError(error, context);
  // Anything else, including a TypeError from a programming mistake, is unexpected and becomes an opaque 500.
  return error;
}

/**
 * The answer to a Provider failure a route met while it waited for the Provider, by the kind `classifyMailProviderError`
 * assigns. `metadata` carries the public Provider error (`code`, `category`, `retryable`, and `retryAfterMs` and an
 * allowlisted `reasonCode` when known), never the Provider's own message; a known delay is also `metadata.retryAfter`
 * in whole seconds, which `withRetryAfter` repeats as the `Retry-After` header.
 */
function mailProviderApiError(
  error: import('../../shared/mail.js').MailProviderError,
  context: Context,
): ApiError {
  const publicError = toPublicError(error);
  const retryAfter =
    error.retryAfterMs !== undefined && error.retryAfterMs > 0
      ? Math.ceil(error.retryAfterMs / 1000)
      : undefined;
  const metadata = {
    ...publicError,
    ...(retryAfter === undefined ? {} : { retryAfter }),
  };
  switch (classifyMailProviderError(error)) {
    case 'RATE_LIMITED':
      return new ApiError({
        status: 'RESOURCE_EXHAUSTED',
        reason: 'MAIL_PROVIDER_REQUEST_FAILED',
        domain: MAIL_DOMAIN,
        message: 'The mail Provider is rate limiting requests.',
        metadata,
        ...localized(context, 'errors.providerRateLimited'),
        cause: error,
      });
    case 'UNAVAILABLE':
      return new ApiError({
        status: 'UNAVAILABLE',
        reason: 'MAIL_PROVIDER_REQUEST_FAILED',
        domain: MAIL_DOMAIN,
        message: 'The mail Provider could not be reached.',
        metadata,
        ...localized(context, 'errors.providerUnavailable'),
        cause: error,
      });
    case 'REAUTHORIZATION_REQUIRED':
      return new ApiError({
        status: 'FAILED_PRECONDITION',
        reason: 'MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED',
        domain: MAIL_DOMAIN,
        message:
          'The mail Provider no longer accepts the account authorization; reconnect the account.',
        metadata,
        ...localized(context, 'errors.reauthorizationRequired'),
        cause: error,
      });
    case 'REJECTED':
      return new ApiError({
        status: 'FAILED_PRECONDITION',
        reason: 'MAIL_PROVIDER_REQUEST_FAILED',
        domain: MAIL_DOMAIN,
        message: 'The mail Provider rejected the request.',
        metadata,
        ...localized(context, 'errors.requestFailed'),
        cause: error,
      });
  }
}

/** Repeat a known Provider delay as the `Retry-After` header of a 429 or 503. */
function withRetryAfter(response: Response, error: unknown): Response {
  if (
    !(error instanceof ApiError) ||
    (error.status !== 'RESOURCE_EXHAUSTED' && error.status !== 'UNAVAILABLE')
  )
    return response;
  const retryAfter = error.metadata?.retryAfter;
  if (typeof retryAfter === 'number')
    response.headers.set('Retry-After', String(retryAfter));
  return response;
}

function pathParameters(context: Context): Record<string, string> {
  try {
    return context.req.param();
  } catch {
    return {};
  }
}

function attachmentDisposition(fileName: string): string {
  const fallback =
    Array.from(fileName, (character) => {
      const code = character.codePointAt(0) ?? 0;
      return code >= 0x20 &&
        code <= 0x7e &&
        character !== '"' &&
        character !== '\\'
        ? character
        : '_';
    }).join('') || 'attachment';
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/gu,
    (character) => `%${character.codePointAt(0)?.toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

function safeContentType(value: string): string {
  return /^[\w!#$&^_.+-]+\/[\w!#$&^_.+-]+(?:\s*;[^\r\n]*)?$/u.test(value)
    ? value
    : 'application/octet-stream';
}
