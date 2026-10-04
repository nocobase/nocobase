import { normalizeFilename } from '@nocobase/ai-employee';
import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';

import type { ServiceFactory } from '../factory/service-factory.js';
import { FileParams, UploadHeaders } from './schemas.js';
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
    aiBodyLimit(uploadMaxSize),
    validator('header', (value) => {
      const headers = parseApiInput(UploadHeaders, value);
      if (
        !headers['content-type']
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
      return headers;
    }),
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
    validator('param', (value) => parseApiInput(FileParams, value)),
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
