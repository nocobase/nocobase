/**
 * `/api/projects/attachments` and `/api/projects/issues/{issueId}/attachments` (`shared/attachments.ts`). Every path
 * acts as the signed-in person; the service decides what they may read and change.
 */
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context, Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import {
  ATTACHMENT_SIZE_MAX,
  type Attachment,
} from '../../../shared/attachments.js';
import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { invalid } from '../../kernel/errors.js';
import {
  boundedList,
  domainRouter,
  PROJECTS_DOMAIN,
  tags,
  personOrRunSecurity,
} from '../../kernel/http.js';
import {
  AttachmentContentQuery,
  IssueAttachmentsQuery,
  AttachmentParams,
  AttachmentSchema,
  BoundedListMeta,
  IssueParams,
  singleFileBody,
} from '../../routes/schemas.js';
import type { AttachmentService } from './attachment.service.js';

/** Room for the multipart envelope around one file. */
const ENVELOPE = 64 * 1024;

const sizeLimit = bodyLimit({
  maxSize: ATTACHMENT_SIZE_MAX + ENVELOPE,
  onError: (context) =>
    apiErrorHandler(
      new ApiError({
        status: 'INVALID_ARGUMENT',
        reason: 'FILE_TOO_LARGE',
        domain: PROJECTS_DOMAIN,
        message: `A file may have at most ${ATTACHMENT_SIZE_MAX} bytes.`,
        metadata: { maxBytes: ATTACHMENT_SIZE_MAX },
        httpStatus: 413,
      }),
      context,
    ),
});

const uploadErrors = {
  400: apiErrorResponse(
    400,
    'When the body is not multipart with one `file` (`INVALID_FILE`), or the application stores no files (`FAILED_PRECONDITION`, `FILES_UNAVAILABLE`).',
  ),
  413: apiErrorResponse(
    413,
    `When the file is over ${ATTACHMENT_SIZE_MAX} bytes (\`FILE_TOO_LARGE\`).`,
  ),
};

/** The one `file` of a multipart body; 400 `INVALID_FILE` otherwise. */
async function fileOf(context: Context): Promise<File> {
  let body: Record<string, unknown>;
  try {
    body = await context.req.parseBody();
  } catch {
    throw invalid('INVALID_FILE', 'Send one file as multipart form data.');
  }
  const file = body.file;
  if (!(file instanceof File))
    throw invalid('INVALID_FILE', 'Send one file as `file`.');
  return file;
}

/** `filename*` per RFC 5987, so any name survives; the plain `filename` is an ASCII fallback. */
export function contentDisposition(
  kind: 'inline' | 'attachment',
  filename: string,
): string {
  const ascii = filename.replace(/[^\x20-\x7e]|["\\]/gu, '_') || 'file';
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/gu,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

const MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/iu;

/** The headers a file is served with: inline only for a safe image, unless a download is asked for. */
export function contentHeaders(
  attachment: Attachment,
  download: boolean,
): Record<string, string> {
  const inline = attachment.previewable && !download;
  const type = attachment.mimeType.split(';')[0]?.trim() ?? '';
  return {
    'Content-Type': MIME.test(type) ? type : 'application/octet-stream',
    'Content-Length': String(attachment.size),
    'Content-Disposition': contentDisposition(
      inline ? 'inline' : 'attachment',
      attachment.filename,
    ),
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'Cache-Control': 'private, no-store',
  };
}

/** Under `/api/projects/attachments`. */
export function createAttachmentRoutes(
  attachments: AttachmentService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.post(
    '/',
    describeRoute({
      tags,
      summary: 'Upload a file',
      operationId: 'projectsUploadAttachment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'attachment upload',
        action: 'pm.attachments/upload',
      }),
      description: `Needs \`upload\` on \`pm.attachments\`. One file as the \`file\` field of a multipart body, at most ${ATTACHMENT_SIZE_MAX} bytes. The upload is attached to nothing until it is sent with a comment (\`attachmentIds\`); one left so for 24 hours is purged.`,
      requestBody: singleFileBody,
      responses: {
        201: dataResponse(AttachmentSchema),
        ...apiErrorResponses,
        ...uploadErrors,
      },
    }),
    sizeLimit,
    async (context) =>
      context.json(
        {
          data: await attachments.upload(
            viewerOf(context),
            await fileOf(context),
          ),
        },
        201,
      ),
  );
  routes.get(
    '/:attachmentId',
    describeRoute({
      tags,
      summary: 'Get a file',
      operationId: 'projectsGetAttachment',
      ...cliRoute({
        command: 'attachment get',
        flags: { attachmentId: { name: 'file' } },
      }),
      description:
        'Readable by whoever sees its issue; an upload attached to nothing by its uploader only.',
      responses: {
        200: dataResponse(AttachmentSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AttachmentParams),
    async (context) =>
      context.json({
        data: await attachments.get(
          viewerOf(context),
          context.req.valid('param').attachmentId,
        ),
      }),
  );
  routes.get(
    '/:attachmentId/content',
    describeRoute({
      tags,
      summary: 'Download a file',
      operationId: 'projectsDownloadAttachment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue attachment download',
        flags: {
          attachmentId: {
            name: 'file',
            description: 'The file id; `issue attachment list` gives them.',
          },
          download: { hidden: true },
        },
        action: 'pm.issues/view',
      }),
      description:
        'The file’s bytes. A safe raster image is served inline unless `download=true`; anything else, SVG and HTML included, as a download. Always with `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox` and `Cache-Control: private, no-store`.',
      responses: {
        200: {
          description:
            'The bytes, with the type the uploader declared (`application/octet-stream` when it is not a valid media type) and a `Content-Disposition` naming the file.',
          content: {
            'application/octet-stream': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AttachmentParams),
    apiValidator('query', AttachmentContentQuery),
    async (context) => {
      const { attachment, body } = await attachments.content(
        viewerOf(context),
        context.req.valid('param').attachmentId,
      );
      return new Response(body, {
        status: 200,
        headers: contentHeaders(
          attachment,
          context.req.valid('query').download,
        ),
      });
    },
  );
  routes.delete(
    '/:attachmentId',
    describeRoute({
      tags,
      summary: 'Delete a file',
      operationId: 'projectsDeleteAttachment',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'attachment delete',
        flags: { attachmentId: { name: 'file' } },
        action: 'pm.attachments/upload',
        confirm: 'Delete this file?',
      }),
      description:
        'An issue’s own file, by its uploader or by whoever may moderate comments on the issue; a comment’s files go with the comment.',
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When the file was sent with a comment (`COMMENT_ATTACHMENT`).',
        ),
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', AttachmentParams),
    async (context) => {
      await attachments.remove(
        viewerOf(context),
        context.req.valid('param').attachmentId,
      );
      return context.body(null, 204);
    },
  );
  return routes;
}

/** Under `/api/projects/issues`: `GET /{issueId}/attachments` and `POST /{issueId}/attachments` (one file). */
export function createIssueAttachmentRoutes(
  attachments: AttachmentService,
): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.get(
    '/:issueId/attachments',
    describeRoute({
      tags,
      summary: 'List an issue’s files',
      operationId: 'projectsListIssueAttachments',
      security: personOrRunSecurity,
      ...cliRoute({
        command: 'issue attachment list',
        flags: {
          issueId: { name: 'issue' },
          comments: { description: 'Its comments’ files too.' },
        },
        columns: ['id', 'filename', 'size', 'mimeType', 'commentId'],
        action: 'pm.issues/view',
      }),
      description:
        'The issue’s own files, oldest first; with `comments=true`, then the files of its comments that are not deleted (each with its `commentId`). `issueId` is an id or an identifier.',
      responses: {
        200: listResponse(AttachmentSchema, BoundedListMeta),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IssueParams),
    apiValidator('query', IssueAttachmentsQuery),
    async (context) =>
      context.json(
        boundedList(
          await attachments.list(
            viewerOf(context),
            context.req.valid('param').issueId,
            { comments: context.req.valid('query').comments === 'true' },
          ),
        ),
      ),
  );
  routes.post(
    '/:issueId/attachments',
    describeRoute({
      tags,
      summary: 'Attach a file to an issue',
      operationId: 'projectsUploadIssueAttachment',
      ...cliRoute({
        command: 'issue attachment add',
        flags: { issueId: { name: 'issue' } },
        action: 'pm.attachments/upload',
        examples: ['issue attachment add PM-12 --file design.png'],
      }),
      description: `Needs \`upload\` on \`pm.attachments\` and \`edit\` on the issue. One file as the \`file\` field of a multipart body, at most ${ATTACHMENT_SIZE_MAX} bytes.`,
      requestBody: singleFileBody,
      responses: {
        201: dataResponse(AttachmentSchema),
        ...apiErrorResponses,
        ...uploadErrors,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IssueParams),
    sizeLimit,
    async (context) =>
      context.json(
        {
          data: await attachments.uploadToIssue(
            viewerOf(context),
            context.req.valid('param').issueId,
            await fileOf(context),
          ),
        },
        201,
      ),
  );
  return routes;
}
