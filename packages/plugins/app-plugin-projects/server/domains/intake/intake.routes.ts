/** Signed-in access to the caller's uploads and their extracted text. */
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  cliRoute,
  describeRoute,
  emptyResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { INTAKE_FILE_SIZE_MAX } from '../../../shared/intake.js';
import { viewerOf, type ViewerEnv } from '../../access/request.js';
import { invalid } from '../../kernel/errors.js';
import { domainRouter, PROJECTS_DOMAIN, tags } from '../../kernel/http.js';
import {
  IntakeFileParams,
  IntakeFileSchema,
  IntakeTextsBody,
  IntakeTextsResultSchema,
  singleFileBody,
} from '../../routes/schemas.js';
import type { IntakeService } from './intake.service.js';

/** Room for the multipart envelope around one file. */
const ENVELOPE = 64 * 1024;

/** Files named on the command line, uploaded first as intake files; their ids fill `fileIds`. */
const intakeFiles = {
  file: {
    upload: 'projectsUploadIntakeFile',
    field: 'fileIds',
    multiple: true,
    maxBytes: INTAKE_FILE_SIZE_MAX,
    description: 'A file whose text goes with it (repeatable).',
  },
} as const;
const people =
  'For people only: a scoped API key or an organization’s API key is refused (403 `SCOPED_KEY_FORBIDDEN`).';
const intakeInvalid = apiErrorResponse(
  400,
  'When the input is empty or too long, or names too many files (`INVALID_INTAKE`); when a file is not an upload of the caller’s (`INVALID_FILE`); or when the application stores no files (`FAILED_PRECONDITION`, `FILES_UNAVAILABLE`).',
);
export function createIntakeRoutes(intake: IntakeService): Hono<ViewerEnv> {
  const routes = domainRouter<ViewerEnv>();
  routes.post(
    '/files',
    describeRoute({
      tags,
      summary: 'Upload an intake file',
      operationId: 'projectsUploadIntakeFile',
      ...cliRoute({ command: 'intake file upload' }),
      description: `${people} One file as the \`file\` field of a multipart body, at most ${INTAKE_FILE_SIZE_MAX} bytes.`,
      requestBody: singleFileBody,
      responses: {
        201: dataResponse(IntakeFileSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When the body is not multipart with one `file` (`INVALID_FILE`), or the application stores no files (`FAILED_PRECONDITION`, `FILES_UNAVAILABLE`).',
        ),
        413: apiErrorResponse(
          413,
          'When the file is too large (`FILE_TOO_LARGE`).',
        ),
      },
    }),
    bodyLimit({
      maxSize: INTAKE_FILE_SIZE_MAX + ENVELOPE,
      onError: (context) =>
        apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'FILE_TOO_LARGE',
            domain: PROJECTS_DOMAIN,
            message: `A file may have at most ${INTAKE_FILE_SIZE_MAX} bytes.`,
            metadata: { maxBytes: INTAKE_FILE_SIZE_MAX },
            httpStatus: 413,
          }),
          context,
        ),
    }),
    async (context) => {
      let body: Record<string, unknown>;
      try {
        body = await context.req.parseBody();
      } catch {
        throw invalid('INVALID_FILE', 'Send one file as multipart form data.');
      }
      const file = body.file;
      if (!(file instanceof File))
        throw invalid('INVALID_FILE', 'Send one file as `file`.');
      return context.json(
        { data: await intake.upload(viewerOf(context), file) },
        201,
      );
    },
  );
  routes.delete(
    '/files/:fileId',
    describeRoute({
      tags,
      summary: 'Delete an intake file',
      operationId: 'projectsDeleteIntakeFile',
      ...cliRoute({
        command: 'intake file delete',
        flags: { fileId: { name: 'file' } },
        confirm: 'Delete this intake file?',
      }),
      description: `${people} Only the uploader’s own files.`,
      responses: {
        204: emptyResponse(),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IntakeFileParams),
    async (context) => {
      await intake.removeFile(
        viewerOf(context),
        context.req.valid('param').fileId,
      );
      return context.body(null, 204);
    },
  );
  routes.post(
    '/extractTexts',
    describeRoute({
      tags,
      summary: 'Extract the text of intake files',
      operationId: 'projectsExtractIntakeTexts',
      ...cliRoute({ command: 'intake extract', uploads: intakeFiles }),
      description: `${people} Reads text from the caller’s uploads.`,
      responses: {
        200: dataResponse(IntakeTextsResultSchema),
        ...apiErrorResponses,
        400: intakeInvalid,
      },
    }),
    apiValidator('json', IntakeTextsBody),
    async (context) =>
      context.json({
        data: await intake.texts(viewerOf(context), context.req.valid('json')),
      }),
  );
  return routes;
}
