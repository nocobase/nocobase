/**
 * `/api/projects/intake` (`shared/intake.ts`): the caller's own files, their text, and the rule split;
 * `/api/projects/intake/aiAvailability` and `/aiJobs` (`shared/intake-ai.ts`): requests to AI and how they go. Every
 * path acts as the signed-in person; the plans stored are theirs to decide.
 */
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

import { INTAKE_FILE_SIZE_MAX } from '../../../../shared/intake.js';
import { viewerOf, type ViewerEnv } from '../../../access/request.js';
import { invalid } from '../../../kernel/errors.js';
import { domainRouter, PROJECTS_DOMAIN, tags } from '../../../kernel/http.js';
import {
  IntakeAiAvailabilitySchema,
  IntakeAiJobSchema,
  IntakeAiStartBody,
  IntakeFileParams,
  IntakeFileSchema,
  IntakeJobParams,
  IntakeSplitBody,
  IntakeSplitResultSchema,
  IntakeTextsBody,
  IntakeTextsResultSchema,
  singleFileBody,
} from '../../../routes/schemas.js';
import type { IntakeAiService } from './intake.ai.service.js';
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
const jobClosed = apiErrorResponse(
  400,
  'When the job is no longer running (`INTAKE_JOB_CLOSED`).',
);

export function createIntakeRoutes(
  intake: IntakeService,
  ai: IntakeAiService,
): Hono<ViewerEnv> {
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
    '/split',
    describeRoute({
      tags,
      summary: 'Split text and files into draft issues',
      operationId: 'projectsSplitIntake',
      ...cliRoute({
        command: 'intake split',
        flags: { text: { contentFile: true }, projectId: { name: 'project' } },
        uploads: intakeFiles,
        examples: ['intake split --text-file notes.md --project 12'],
      }),
      description: `${people} Splits by rules, without a model, into a pending plan of \`issue.create\` rows the caller decides. When a row fails its rehearsal, \`plan\` is null and \`request\` and \`rehearsal\` say what to correct before \`POST /api/projects/plans\`.`,
      responses: {
        200: dataResponse(IntakeSplitResultSchema),
        ...apiErrorResponses,
        400: intakeInvalid,
      },
    }),
    apiValidator('json', IntakeSplitBody),
    async (context) =>
      context.json({
        data: await intake.split(viewerOf(context), context.req.valid('json')),
      }),
  );
  routes.post(
    '/extractTexts',
    describeRoute({
      tags,
      summary: 'Extract the text of intake files',
      operationId: 'projectsExtractIntakeTexts',
      ...cliRoute({ command: 'intake extract', uploads: intakeFiles }),
      description: `${people} Reads the caller’s files as the split would, without splitting.`,
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
  routes.get(
    '/aiAvailability',
    describeRoute({
      tags,
      summary: 'Check whether the caller can ask AI for drafts',
      operationId: 'projectsGetIntakeAiAvailability',
      ...cliRoute({ command: 'intake ai availability' }),
      description: people,
      responses: {
        200: dataResponse(IntakeAiAvailabilitySchema),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json({ data: await ai.availability(viewerOf(context)) }),
  );
  routes.post(
    '/aiJobs',
    describeRoute({
      tags,
      summary: 'Ask AI to split, revise or break down drafts',
      operationId: 'projectsStartIntakeAiJob',
      ...cliRoute({
        command: 'intake ai start',
        flags: {
          text: { contentFile: true },
          projectId: { name: 'project' },
          planId: { name: 'plan' },
          issueId: { name: 'issue' },
          instruction: { contentFile: true },
        },
        uploads: intakeFiles,
        examples: [
          'intake ai start --mode split --text-file notes.md',
          'intake ai start --mode breakdown --issue PM-12',
        ],
      }),
      description: `${people} Needs \`create\` on \`pm.issues\`, and for a breakdown seeing the issue. The job runs until the organiser the application binds delivers the drafts; poll it with \`GET /api/projects/intake/aiJobs/{jobId}\`.`,
      responses: {
        201: dataResponse(IntakeAiJobSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'When the input is empty or too long, or the draft cannot be revised (`INVALID_INTAKE`); or when no organiser is bound or it refused to start (`FAILED_PRECONDITION`, `AI_UNAVAILABLE`).',
        ),
        404: apiErrorResponse(
          404,
          'When the issue to break down is not found.',
        ),
      },
    }),
    apiValidator('json', IntakeAiStartBody),
    async (context) =>
      context.json(
        { data: await ai.start(viewerOf(context), context.req.valid('json')) },
        201,
      ),
  );
  routes.get(
    '/aiJobs/:jobId',
    describeRoute({
      tags,
      summary: 'Get an AI draft job',
      operationId: 'projectsGetIntakeAiJob',
      ...cliRoute({
        command: 'intake ai get',
        flags: { jobId: { name: 'job' } },
      }),
      description: `${people} The caller’s own jobs only.`,
      responses: {
        200: dataResponse(IntakeAiJobSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IntakeJobParams),
    async (context) =>
      context.json({
        data: await ai.get(viewerOf(context), context.req.valid('param').jobId),
      }),
  );
  routes.post(
    '/aiJobs/:jobId/cancel',
    describeRoute({
      tags,
      summary: 'Cancel an AI draft job',
      operationId: 'projectsCancelIntakeAiJob',
      ...cliRoute({
        command: 'intake ai cancel',
        flags: { jobId: { name: 'job' } },
        confirm: 'Cancel this AI draft job?',
      }),
      description: people,
      responses: {
        200: dataResponse(IntakeAiJobSchema),
        ...apiErrorResponses,
        400: jobClosed,
        404: apiErrorResponse(404),
      },
    }),
    apiValidator('param', IntakeJobParams),
    async (context) =>
      context.json({
        data: await ai.cancel(
          viewerOf(context),
          context.req.valid('param').jobId,
        ),
      }),
  );
  return routes;
}
