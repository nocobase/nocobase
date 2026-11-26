import {
  MAIL_CONNECTION_REASONS,
  MailProviderRequestError,
} from '../services/errors.js';
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
  cliRoute,
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
  mailInvalidArgument,
  toPublicError,
} from '../services/errors.js';
import { mailAssemblyInfoToken, mailServiceToken } from '../tokens.js';
import { buildMailSettingsOverview } from '../settings-overview.js';
import {
  MAIL_ACCESS,
  mailAccessKey,
  type MailAccessRequirement,
} from '../../shared/access.js';
import {
  AccountConversationParams,
  AccountMessageAttachmentParams,
  AccountMessageParams,
  AccountParams,
  AttachmentParams,
  ConnectAccountInput,
  ListFoldersQuery,
  MailSyncFolderPreviewSchema,
  PreviewSyncFoldersInput,
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
  AdminAccountsQuery,
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
  MailUpdatedAccountSchema,
  MailAuthorizationSchema,
  MailBoundedListMeta,
  MailFolderListMeta,
  MailCursorListMeta,
  MailFolderSchema,
  MailIdentitySchema,
  MailLabelSchema,
  MailAdminAccountSchema,
  MailManagedSubmissionSchema,
  MailSettingsOverviewSchema,
  MailTeamAccountSchema,
  MailManagementActionResultSchema,
  MailMessageSchema,
  MailMessageSummarySchema,
  MailOutboundAttachmentSchema,
  MailLogCursorListMeta,
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
  readonly cli?: false;
}

/**
 * The permission check and the API document entry of one Mail route. Every route names the permission it requires
 * (`shared/access.ts`), the same one the client page that calls it declares as its `authz`; the check runs before the
 * route reads the request, and the document says which permission it is.
 */
function mailRoute(
  access: MailAccessRequirement,
  operationId: string,
  summary: string,
  responses: Record<string, ApiResponseObject>,
  options: MailRouteOptions = {},
): readonly [MiddlewareHandler<MailRoutesEnv>, MiddlewareHandler] {
  const errors: Record<string, ApiResponseObject> = {};
  for (const [code, description] of Object.entries(options.errors ?? {})) {
    const status = Number(code) as ApiErrorResponseCode;
    errors[code] =
      description === true
        ? apiErrorResponse(status)
        : apiErrorResponse(status, description);
  }
  const requirement = `Requires the \`${mailAccessKey(access)}\` permission.`;
  return [
    requireMailAccess(access),
    describeRoute({
      tags: ['Mail'],
      // The command line offers the route only to a caller holding the same permission the route checks.
      ...cliRoute(
        options.cli === false ? false : { action: mailAccessKey(access) },
      ),
      operationId,
      summary,
      description: options.description
        ? `${options.description} ${requirement}`
        : requirement,
      ...(options.requestBody ? { requestBody: options.requestBody } : {}),
      responses: { ...responses, ...apiErrorResponses, ...errors },
    }),
  ];
}

/** Answers 403 unless the caller holds `access`; the caller is already authenticated. */
function requireMailAccess(
  access: MailAccessRequirement,
): MiddlewareHandler<MailRoutesEnv> {
  return async (context, next) => {
    if (await context.get('authz').can(access)) return next();
    return apiErrorHandler(
      new ApiError({
        status: 'PERMISSION_DENIED',
        reason: 'MAIL_ACCESS_DENIED',
        domain: MAIL_DOMAIN,
        message: `The ${mailAccessKey(access)} permission is required.`,
        ...localized(context, 'errors.accessDenied'),
      }),
      context,
    );
  };
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

    // Authentication comes before everything; each route then checks its own permission (`mailRoute`) before it reads
    // the request, so a caller without access learns nothing about which accounts, messages, or runs exist.
    routes.use('*', authentication.required(), authorization.middleware());
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListProviders',
        'List the configured mail Providers',
        {
          '200': listResponse(MailProviderSchema, MailBoundedListMeta),
        },
      ),
      async (context) => context.json(boundedList(await mail.listProviders())),
    );
    routes.get(
      '/accounts',
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListAccounts',
        "List the caller's mail accounts",
        {
          '200': listResponse(MailAccountSchema, MailBoundedListMeta),
        },
      ),
      async (context) =>
        context.json(
          boundedList(await mail.listAccounts(operationContext(context))),
        ),
    );
    // Connecting verifies the credentials against the Provider before it stores anything, so it is a custom method on
    // the collection rather than a plain create, but it does create the account and answers 201 with it.
    routes.post(
      '/accounts/connect',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
              ...connectSyncFolders(input.syncFolderIds),
            }),
          },
          201,
        );
      },
    );
    routes.patch(
      '/accounts/:accountId',
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailUpdateAccount',
        'Update an account',
        { '200': dataResponse(MailUpdatedAccountSchema) },
        {
          description:
            'Suspends or resumes an account, or changes the folders it synchronizes. A changed `syncFolderIds` restarts the initial synchronization under the new selection and answers that run as `syncRun`: newly selected folders are imported from the account start date, and local messages left in no selected folder are deleted, with their folder links, participants, attachments and IMAP copies. Messages on the mail server are not affected. Use `mailPreviewSyncFolders` to show the count first.',
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`), must be reauthorized before it can be resumed (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), is not active when changing its folders (`MAIL_ACCOUNT_INACTIVE`), or a selected folder is not a folder of the account (`INVALID_MAIL_REQUEST`).',
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
            ...(context.req.valid('json').syncFolderIds !== undefined
              ? { syncFolderIds: context.req.valid('json').syncFolderIds }
              : {}),
          }),
        }),
    );
    // Previewing changes nothing, but the selection can name many long folder IDs, so it is a custom method with a body.
    routes.post(
      '/accounts/:accountId/previewSyncFolders',
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailPreviewSyncFolders',
        'Preview a change of synchronized folders',
        { '200': dataResponse(MailSyncFolderPreviewSchema) },
        {
          description:
            'Counts the local messages that saving this folder selection with `mailUpdateAccount` would delete, without changing anything.',
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`) or is not active (`MAIL_ACCOUNT_INACTIVE`), or a selected folder is not a folder of the account (`INVALID_MAIL_REQUEST`).',
            404: true,
            413: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      apiValidator('json', PreviewSyncFoldersInput),
      async (context) =>
        context.json({
          data: await mail.previewSyncFolders(
            operationContext(context),
            context.req.valid('param').accountId,
            context.req.valid('json').syncFolderIds,
          ),
        }),
    );
    // Removal is durable and asynchronous: the account is marked for removal and a background task deletes its
    // messages and Provider subscriptions, so the request is acknowledged with 202 and the account in its `removing`
    // state. When the background task has already deleted the row there is nothing left to show, and the 202 has no
    // body.
    routes.delete(
      '/accounts/:accountId',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
              ...connectSyncFolders(input.syncFolderIds),
            }),
          },
          201,
        );
      },
    );
    routes.get(
      '/accounts/:accountId/identities',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListFolders',
        "List an account's folders",
        { '200': listResponse(MailFolderSchema, MailFolderListMeta) },
        {
          errors: {
            400: 'The account is being removed (`MAIL_ACCOUNT_REMOVING`).',
            404: true,
          },
        },
      ),
      apiValidator('param', AccountParams),
      apiValidator('query', ListFoldersQuery),
      async (context) => {
        const { accountId } = context.req.valid('param');
        if (!context.req.valid('query').includeUnsynced)
          return context.json(
            boundedList(
              await mail.listFolders(operationContext(context), accountId),
            ),
          );
        const { folders, complete, failed, initialSyncCompleted } =
          await mail.listFolderChoices(operationContext(context), accountId);
        return context.json({
          data: folders,
          meta: {
            total: folders.length,
            complete,
            failed,
            initialSyncCompleted,
          },
        });
      },
    );
    routes.post(
      '/accounts/:accountId/sync',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListTemplates',
        "List the caller's templates",
        {
          '200': listResponse(MailTemplateSchema, MailBoundedListMeta),
        },
      ),
      async (context) =>
        context.json(
          boundedList(await mail.listTemplates(operationContext(context))),
        ),
    );
    routes.post(
      '/templates',
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailCreateTemplate',
        'Create a template',
        { '201': dataResponse(MailTemplateSchema) },
        {
          errors: {
            409: 'The caller already has a template with this name (`MAIL_TEMPLATE_ALREADY_EXISTS`).',
            413: true,
          },
        },
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailUpdateTemplate',
        'Update a template',
        { '200': dataResponse(MailTemplateSchema) },
        {
          description: 'Omitted fields keep their stored values.',
          errors: {
            404: true,
            409: 'Another template of the caller already has this name (`MAIL_TEMPLATE_ALREADY_EXISTS`).',
            413: true,
          },
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListLabels',
        "List the caller's labels",
        {
          '200': listResponse(MailLabelSchema, MailBoundedListMeta),
        },
      ),
      async (context) =>
        context.json(
          boundedList(await mail.listLabels(operationContext(context))),
        ),
    );
    routes.post(
      '/labels',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListMessages',
        "List the caller's messages",
        { '200': listResponse(MailMessageSummarySchema, MailCursorListMeta) },
        {
          description:
            'Filters by account, folder (including the virtual folders), label, conversation, search text, participant, unread and starred. Paged by `pageToken`. Participant filtering does not trim full threads or their conversation counts.',
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
          participant: query.participant,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailDeleteMessage',
        'Delete a message',
        { '204': emptyResponse() },
        {
          description:
            'Moves the message to the trash, or deletes it at the Provider when `permanently` is `true`. For IMAP soft deletion, sourceProviderFolderId selects the actual source folder. Omission is compatible only with one verified source; ambiguous sources, missing Trash, unsafe server capabilities and uncertain outcomes return explicit MAIL_IMAP_MOVE_* or MAIL_IMAP_TRASH_NOT_FOUND reasons. Never automatically retry an uncertain move.',
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
          sourceProviderFolderId:
            context.req.valid('query').sourceProviderFolderId,
        });
        return context.body(null, 204);
      },
    );
    routes.get(
      '/accounts/:accountId/messages/:messageId/original',
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailDownloadOriginalMessage',
        'Download the original MIME of one message',
        {
          '200': {
            description:
              'The complete provider-supplied MIME, with an attachment disposition naming the .eml file.',
            content: {
              'message/rfc822': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
        {
          cli: false,
          description:
            'Requires ownership of the message and account. The MIME may be at most 40 MiB. A failure after streaming begins interrupts the download.',
          errors: {
            400: 'The account is inactive (`MAIL_ACCOUNT_INACTIVE`), requires reauthorization (`MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`), or the original is unsupported (`MAIL_PROVIDER_OPERATION_UNSUPPORTED`) or too large (`MAIL_ORIGINAL_TOO_LARGE`).',
            404: 'The account or message could not be found, or the original is no longer available at the provider (`MAIL_ORIGINAL_NOT_FOUND`).',
            429: providerRateLimited,
            503: providerUnavailable,
          },
        },
      ),
      apiValidator('param', AccountMessageParams),
      async (context) => {
        const { accountId, messageId } = context.req.valid('param');
        const response = attachmentResponse(
          await mail.getOriginalMessage(
            operationContext(context),
            accountId,
            messageId,
          ),
        );
        response.headers.set('cache-control', 'private, no-store');
        return response;
      },
    );
    routes.get(
      '/accounts/:accountId/messages/:messageId/attachments/:attachmentId',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailMoveMessage',
        'Move a message to another folder',
        { '200': dataResponse(MailMessageSchema) },
        {
          description:
            'For IMAP, sourceProviderFolderId selects one actual source folder. Omission requires exactly one verified source. MAIL_IMAP_MOVE_SOURCE_REQUIRED rejects ambiguous or stale sources; MAIL_IMAP_MOVE_UNSUPPORTED reports an unsafe server; MAIL_IMAP_MOVE_OUTCOME_UNKNOWN requires mailbox verification and must not be automatically retried. Other providers ignore the optional source.',
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
            sourceProviderFolderId:
              context.req.valid('json').sourceProviderFolderId,
          }),
        });
      },
    );
    routes.post(
      '/accounts/:accountId/messages/:messageId/retryContent',
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListSyncRuns',
        "List the caller's synchronization runs",
        {
          '200': listResponse(MailSyncRunSchema, MailPageListMeta),
        },
      ),
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
        'mailListSubmissions',
        "List the caller's sent and scheduled messages",
        { '200': listResponse(MailSubmissionLogSchema, MailPageListMeta) },
        {
          description:
            "With `groupByBatch`, `pageSize` and `meta.total` count entries: a single send, scheduled ones included, is one entry, and a bulk send is one entry answered with every recipient's submission. With `bulkOnly` as well, only bulk sends.",
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
      ...mailRoute(
        MAIL_ACCESS.workspace,
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
    // Mail settings (`settings:mail.admin`): Providers, every member's accounts and operation logs, never a message's
    // content. `read` lists; `manage` retries and cancels other members' runs and submissions. The logs grow until the
    // retention period deletes finished ones, so they are paged by page number with filters.

    routes.get(
      '/settings/overview',
      ...mailRoute(
        MAIL_ACCESS.settingsRead,
        'mailGetSettingsOverview',
        'Get the Mail settings overview',
        { '200': dataResponse(MailSettingsOverviewSchema) },
        {
          description:
            'The Providers members can connect with their capabilities and account counts, account totals, and the runtime configuration with where each value comes from. It never carries a secret: the push webhook secret is only reported as configured or not.',
        },
      ),
      async (context) => {
        const mailConfig = config.get<MailConfig>('mail')!;
        const identity = config.get<AppIdentityConfig>('app');
        const [providers, accountCounts] = await Promise.all([
          mail.listProviders(),
          mail.countAccountsByProvider(operationContext(context)),
        ]);
        return context.json({
          data: buildMailSettingsOverview({
            config: mailConfig,
            providers,
            accountCounts,
            origin: resolveMailOAuthOrigin(
              identity?.publicOrigin,
              new URL(context.req.url).origin,
            ),
            publicBasePath,
            credentialVault: container.has(mailAssemblyInfoToken)
              ? container.resolve(mailAssemblyInfoToken).credentialVault
              : 'builtin',
            env: process.env,
            layers: configLayers(config),
          }),
        });
      },
    );
    routes.get(
      '/settings/accounts',
      ...mailRoute(
        MAIL_ACCESS.settingsRead,
        'mailListAdminAccounts',
        "List every member's mail accounts for the Mail settings page",
        { '200': listResponse(MailAdminAccountSchema, MailBoundedListMeta) },
        {
          description:
            'Owner, Provider, status and last synchronization of each account, without scopes, folders or messages.',
        },
      ),
      apiValidator('query', AdminAccountsQuery),
      async (context) => {
        const query = context.req.valid('query');
        return context.json(
          boundedList(
            await mail.listAdminAccounts(operationContext(context), {
              ...(query.status ? { statuses: query.status.split(',') } : {}),
              ...(query.provider ? { providerName: query.provider } : {}),
              ...(query.userId ? { userId: query.userId } : {}),
              ...(query.q ? { q: query.q } : {}),
            }),
          ),
        );
      },
    );
    routes.get(
      '/settings/syncRuns',
      ...mailRoute(
        MAIL_ACCESS.settingsRead,
        'mailListAdminSyncRuns',
        "List every member's synchronization runs",
        { '200': listResponse(MailSyncRunSchema, MailLogCursorListMeta) },
        {
          description:
            'Newest first, paged by `pageToken`. `canManage` is true for a caller who also holds `settings:mail.admin/manage`. A failure carries its code and category only.',
          errors: {
            400: '`pageToken` is not a token this list answered, or the request pages by `page`, which this list replaced with `pageToken` (`INVALID_MAIL_REQUEST`).',
          },
        },
      ),
      rejectPageNumber,
      apiValidator('query', ManagedLogsQuery),
      async (context) => {
        const query = context.req.valid('query');
        const result = await mail.listManagedSyncRunsPage(
          operationContext(context),
          query.pageToken,
          query.pageSize,
          managedLogFilter(query),
          await context.get('authz').can(MAIL_ACCESS.settingsManage),
        );
        return context.json(logPage(query.pageSize, result));
      },
    );
    routes.post(
      '/settings/syncRuns/:syncRunId/retry',
      ...mailRoute(
        MAIL_ACCESS.settingsManage,
        'mailRetryAdminSyncRun',
        "Retry any member's synchronization run",
        { '200': dataResponse(MailSyncRunSchema) },
        {
          description:
            "Starts a new run for a failed or cancelled one, as its owner's own retry would.",
          errors: {
            400: 'The run is not failed or cancelled (`MAIL_SYNC_RUN_STATE_INVALID`) or its account is not active (`MAIL_ACCOUNT_INACTIVE`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SyncRunParams),
      async (context) =>
        context.json({
          data: await mail.retryManagedSyncRun(
            operationContext(context),
            context.req.valid('param').syncRunId,
          ),
        }),
    );
    routes.post(
      '/settings/syncRuns/:syncRunId/cancel',
      ...mailRoute(
        MAIL_ACCESS.settingsManage,
        'mailCancelAdminSyncRun',
        "Cancel any member's synchronization run",
        { '200': dataResponse(MailSyncRunSchema) },
        {
          errors: {
            400: 'The run is not pending or running (`MAIL_SYNC_RUN_STATE_INVALID`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SyncRunParams),
      async (context) =>
        context.json({
          data: await mail.cancelManagedSyncRun(
            operationContext(context),
            context.req.valid('param').syncRunId,
          ),
        }),
    );
    routes.get(
      '/settings/submissions',
      ...mailRoute(
        MAIL_ACCESS.settingsRead,
        'mailListAdminSubmissions',
        "List every member's submissions",
        {
          '200': listResponse(
            MailManagedSubmissionSchema,
            MailLogCursorListMeta,
          ),
        },
        {
          description:
            'Newest first, paged by `pageToken`: account, recipient count, result and failure code, never the subject, body, addresses or attachments.',
          errors: {
            400: '`pageToken` is not a token this list answered, or the request pages by `page`, which this list replaced with `pageToken` (`INVALID_MAIL_REQUEST`).',
          },
        },
      ),
      rejectPageNumber,
      apiValidator('query', ManagedLogsQuery),
      async (context) => {
        const query = context.req.valid('query');
        const result = await mail.listManagedSubmissionsPage(
          operationContext(context),
          query.pageToken,
          query.pageSize,
          managedLogFilter(query),
          await context.get('authz').can(MAIL_ACCESS.settingsManage),
        );
        return context.json(logPage(query.pageSize, result));
      },
    );
    routes.post(
      '/settings/submissions/:submissionId/retry',
      ...mailRoute(
        MAIL_ACCESS.settingsManage,
        'mailRetryAdminSubmission',
        "Retry any member's failed submission",
        { '200': dataResponse(MailManagedSubmissionSchema) },
        {
          description:
            "Queues the failed submission again, as its owner's own retry would.",
          errors: {
            400: 'The submission cannot be retried in its current state (`MAIL_SUBMISSION_STATE_INVALID`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SubmissionParams),
      async (context) =>
        context.json({
          data: await mail.retryManagedSubmission(
            operationContext(context),
            context.req.valid('param').submissionId,
          ),
        }),
    );
    routes.post(
      '/settings/submissions/:submissionId/cancel',
      ...mailRoute(
        MAIL_ACCESS.settingsManage,
        'mailCancelAdminSubmission',
        "Cancel any member's pending or failed submission",
        { '200': dataResponse(MailManagedSubmissionSchema) },
        {
          errors: {
            400: 'The submission cannot be cancelled in its current state (`MAIL_SUBMISSION_STATE_INVALID`).',
            404: true,
          },
        },
      ),
      apiValidator('param', SubmissionParams),
      async (context) =>
        context.json({
          data: await mail.cancelManagedSubmission(
            operationContext(context),
            context.req.valid('param').submissionId,
          ),
        }),
    );

    // -----------------------------------------------------------------------------------------------------------------
    // Team mail (`mail:mail.management`): every member's synchronized mail, read only with `view`; `process` applies
    // batch actions. Reading a message here never marks it read.

    routes.get(
      '/management/accounts',
      ...mailRoute(
        MAIL_ACCESS.teamView,
        'mailListManagedAccounts',
        "List every member's mail accounts for Team mail",
        { '200': listResponse(MailTeamAccountSchema, MailBoundedListMeta) },
        { description: 'Owner and address of each account, for filtering.' },
      ),
      async (context) =>
        context.json(
          boundedList(await mail.listTeamAccounts(operationContext(context))),
        ),
    );
    routes.get(
      '/management/accounts/:accountId/folders',
      ...mailRoute(
        MAIL_ACCESS.teamView,
        'mailListManagedFolders',
        "List the folders of any user's account",
        { '200': listResponse(MailFolderSchema, MailBoundedListMeta) },
        {
          description: "Reading a member's message here does not mark it read.",
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
      ...mailRoute(
        MAIL_ACCESS.teamView,
        'mailListManagedMessages',
        "List messages across every member's accounts",
        { '200': listResponse(MailMessageSummarySchema, MailPageListMeta) },
        {
          description:
            '`userId` narrows the list to one member, `participant` to an address or `@domain`.',
        },
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
            participant: query.participant,
            offset: (query.page - 1) * query.pageSize,
            limit: query.pageSize,
            withTotal: true,
            unread: query.unread,
            starred: query.starred,
          },
          query.userId,
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
      ...mailRoute(
        MAIL_ACCESS.teamProcess,
        'mailBatchApplyManagedMessages',
        'Apply one action to several messages of any user',
        { '200': dataResponse(MailManagementActionResultSchema) },
        {
          description:
            'Each message succeeds or fails on its own; the result reports both. Viewing alone (`mail:mail.management/view`) is not enough.',
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
      ...mailRoute(
        MAIL_ACCESS.teamView,
        'mailGetManagedMessage',
        "Get a message of any user's account",
        { '200': dataResponse(MailMessageSchema) },
        {
          description: "Reading a member's message here does not mark it read.",
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
      ...mailRoute(
        MAIL_ACCESS.teamView,
        'mailDownloadManagedMessageAttachment',
        "Download an attachment of any user's message",
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

/** The configuration's layers, when the application's configuration keeps them apart (`AppConfig.layers()`). */
function configLayers(
  config: object,
): import('../settings-overview.js').MailSettingsOverviewInput['layers'] {
  const layers = (config as { layers?: unknown }).layers;
  return typeof layers === 'function'
    ? (layers.call(config) as ReturnType<typeof configLayers>)
    : undefined;
}

/**
 * The settings logs page by `pageToken`; they took `page` before. A request still sending `page` would otherwise be
 * answered the first page whatever page it asked for, so it is refused with a hint instead.
 */
const rejectPageNumber: MiddlewareHandler = async (context, next) => {
  if (context.req.query('page') !== undefined)
    throw mailInvalidArgument(
      'This list pages by pageToken: send the meta.nextPageToken of the previous page instead of page.',
      'page',
    );
  await next();
};

/** The body of a settings log page. */
function logPage<T>(
  pageSize: number,
  page: import('../../shared/mail.js').MailPage<T>,
): {
  data: readonly T[];
  meta: { pageSize: number; nextPageToken?: string; total: number };
} {
  return {
    data: page.items,
    meta: {
      pageSize,
      ...(page.nextCursor ? { nextPageToken: page.nextCursor } : {}),
      total: page.total ?? page.items.length,
    },
  };
}

/** The filter of a settings log list, from its query. */
function managedLogFilter(query: {
  readonly userId?: string;
  readonly accountId?: string;
  readonly status?: string;
  readonly from?: string;
  readonly to?: string;
}): import('../../shared/mail.js').MailManagedLogFilter {
  return {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.status ? { statuses: query.status.split(',') } : {}),
    ...(query.from ? { createdFrom: query.from } : {}),
    ...(query.to ? { createdBefore: query.to } : {}),
  };
}

/** Connecting accepts only an empty selection, meaning the folders are chosen after connecting. */
function connectSyncFolders(
  syncFolderIds: readonly string[] | null | undefined,
): { readonly syncFolderIds?: readonly [] | null } {
  if (syncFolderIds === undefined) return {};
  return { syncFolderIds: syncFolderIds === null ? null : [] };
}

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

function connectionLocalized(
  context: Context,
  error: unknown,
): { localizedMessage?: { locale: string; message: string } } {
  const reason =
    error instanceof MailError &&
    error.cause instanceof MailProviderRequestError
      ? error.cause.reasonCode
      : isMailProviderError(error)
        ? error.reasonCode
        : undefined;
  for (const protocol of ['imap', 'smtp']) {
    for (const suffix of MAIL_CONNECTION_REASONS) {
      if (reason === `${protocol}${suffix}`)
        return localized(context, `errors.connection${suffix}`, {
          protocol: protocol.toUpperCase(),
        });
    }
  }
  return {};
}

/** The request's translation of a Mail message key, as the error body's `localizedMessage`. */
function localized(
  context: Context,
  key: string,
  params?: { protocol: string },
): { localizedMessage?: { locale: string; message: string } } {
  try {
    const locale = getRequestLocale(context);
    const message = getRequestTranslator(context, MAIL_NAMESPACE)(key, params);
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
        ...localized(
          context,
          error.reason === 'MAIL_ACCOUNT_CREDENTIALS_INVALID'
            ? 'errors.accountCredentialsInvalid'
            : /^(?:to|cc|bcc|recipients)(?:\.|$)/u.test(error.field ?? '')
              ? 'errors.invalidRecipient'
              : 'errors.invalidRequest',
        ),
        ...connectionLocalized(context, error),
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
        originalMessageLocale(error.reason) ??
          imapMoveLocale(error.reason) ??
          (error.reason === 'MAIL_MESSAGE_NOT_FOUND'
            ? 'errors.messageNotFound'
            : error.reason === 'MAIL_SYNC_RUN_NOT_FOUND'
              ? 'errors.syncRunNotFound'
              : 'errors.requestFailed'),
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
        ...connectionLocalized(context, error),
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
        ...connectionLocalized(context, error),
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
        ...connectionLocalized(context, error),
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
        ...connectionLocalized(context, error),
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

function originalMessageLocale(reason: string): string | undefined {
  switch (reason) {
    case 'MAIL_ORIGINAL_NOT_FOUND':
      return 'errors.originalNotFound';
    case 'MAIL_ORIGINAL_TOO_LARGE':
      return 'errors.originalTooLarge';
    case 'MAIL_PROVIDER_OPERATION_UNSUPPORTED':
      return 'errors.operationUnsupported';
    default:
      return undefined;
  }
}

function imapMoveLocale(reason: string): string | undefined {
  return (
    {
      MAIL_IMAP_MOVE_SOURCE_REQUIRED: 'errors.imapMoveSourceRequired',
      MAIL_IMAP_MOVE_LOCATION_CHANGED: 'errors.imapMoveLocationChanged',
      MAIL_IMAP_MOVE_NOT_WRITABLE: 'errors.imapMoveNotWritable',
      MAIL_IMAP_MOVE_UNSUPPORTED: 'errors.imapMoveUnsupported',
      MAIL_IMAP_TRASH_NOT_FOUND: 'errors.imapTrashNotFound',
      MAIL_IMAP_MOVE_OUTCOME_UNKNOWN: 'errors.imapMoveOutcomeUnknown',
    } as Record<string, string>
  )[reason];
}
