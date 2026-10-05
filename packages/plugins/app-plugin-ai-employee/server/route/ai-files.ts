import { normalizeFilename } from '@nocobase/ai-employee';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Hono, MiddlewareHandler } from 'hono';

import type { ServiceFactory } from '../factory/service-factory.js';
import { tags } from './openapi.js';
import { AIFileResponse, FileParams, UploadHeaders } from './schemas.js';
import type { AIRouteGuards } from './settings-access.js';
import {
  AI_EMPLOYEE_ERROR_DOMAIN,
  AI_FILE_UPLOAD_MAX_BYTES,
  aiBodyLimit,
} from './utils.js';

/** `/aiEmployee/files`: attachments uploaded into a conversation, read back only by their uploader or an AI admin. */
export function createAIFilesRouter(
  app: Hono,
  services: ServiceFactory,
  { signedIn }: AIRouteGuards,
  uploadMaxSize: number = AI_FILE_UPLOAD_MAX_BYTES,
): void {
  app.post(
    '/aiEmployee/files',
    signedIn,
    describeRoute({
      tags,
      summary: 'Upload a file for a conversation',
      operationId: 'aiEmployeesUploadFile',
      description:
        'The answer is attached to a message as is; the file is read back at its `preview` address by its uploader, or by a user with AI settings access. Any signed-in user may upload.',
      requestBody: {
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
                  description: 'The file to upload.',
                },
              },
            },
          },
        },
      },
      responses: {
        201: dataResponse(AIFileResponse, 'The uploaded file.'),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
        413: apiErrorResponse(
          413,
          `The upload exceeds the limit, ${AI_FILE_UPLOAD_MAX_BYTES} bytes unless the application configures another (\`BODY_TOO_LARGE\`).`,
        ),
        415: apiErrorResponse(
          415,
          'The body is not `multipart/form-data` (`UNSUPPORTED_MEDIA_TYPE`).',
        ),
      },
    }),
    aiBodyLimit(uploadMaxSize),
    apiValidator('header', UploadHeaders),
    requireMultipart,
    async (context) => {
      // A multipart body has no JSON schema; its one field is checked here.
      const form = await context.req.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_INPUT',
          domain: AI_EMPLOYEE_ERROR_DOMAIN,
          message: 'The form must carry the upload in its "file" field.',
          fieldViolations: [
            { field: 'file', description: 'A file is required.' },
          ],
        });
      }
      const data = await services.fileService.create({
        actor: context.var.currentUser,
        file,
      });
      return context.json({ data }, 201);
    },
  );

  app.get(
    '/aiEmployee/files/:fileId/preview',
    signedIn,
    describeRoute({
      tags,
      summary: 'Read an uploaded file',
      operationId: 'aiEmployeesGetFilePreview',
      description:
        'Answers the content inline, with its stored media type. Only the uploader, or a user with AI settings access, may read a file; anyone else is refused with `403` (`FILE_ACCESS_DENIED`) whether or not the file exists.',
      responses: {
        200: {
          description: 'The file content.',
          headers: {
            'Content-Disposition': {
              description: '`inline`, with the original file name.',
              schema: { type: 'string' },
            },
          },
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary',
                description:
                  'Sent with the media type the file was uploaded with.',
              },
            },
          },
        },
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No file has this id (`FILE_NOT_FOUND`), or its content is gone from storage (`FILE_CONTENT_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', FileParams),
    async (context) => {
      const result = await services.fileService.preview({
        actor: context.var.currentUser,
        id: context.req.valid('param').fileId,
        canReadAnyFile: context.var.canAccessAISettings,
      });
      return new Response(result.stream, {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': inlineContentDisposition(result.filename),
        },
      });
    },
  );
}

/** An upload is a multipart form; any other body is refused before it is read. */
const requireMultipart: MiddlewareHandler = async (context, next) => {
  if (
    !context.req
      .header('content-type')
      ?.toLowerCase()
      .startsWith('multipart/form-data')
  ) {
    throw new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: 'UNSUPPORTED_MEDIA_TYPE',
      domain: AI_EMPLOYEE_ERROR_DOMAIN,
      message: 'Upload a file as multipart/form-data.',
      httpStatus: 415,
    });
  }
  await next();
};

/**
 * `filename` is a quoted ASCII fallback for clients that read nothing else;
 * `filename*` carries the real name, in any script, as RFC 6266 describes.
 */
function inlineContentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `inline; filename="${normalizeFilename(filename)}"; filename*=UTF-8''${encoded}`;
}
