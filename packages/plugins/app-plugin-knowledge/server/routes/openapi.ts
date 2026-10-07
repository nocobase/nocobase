/** What the knowledge routes share in the API document. */
import {
  apiErrorResponse,
  resolver,
  type ApiResponseObject,
  type DescribeRouteOptions,
} from '@nocobase/app-server/router';
import type { z } from 'zod';

/** The tag every knowledge operation is listed under. */
export const tags: string[] = ['Knowledge'];

/** A document or folder the URL names is missing, or hidden from the caller. */
export const docNotFoundResponse: ApiResponseObject = apiErrorResponse(
  404,
  'The document does not exist or the caller may not read it (`DOC_NOT_FOUND`).',
);

export const proposalNotFoundResponse: ApiResponseObject = apiErrorResponse(
  404,
  'The proposal does not exist or the caller may not read it (`PROPOSAL_NOT_FOUND`).',
);

/** The `413` of an upload, answered as the body arrives. */
export const fileTooLargeResponse: ApiResponseObject = apiErrorResponse(
  413,
  'The file exceeds the size the application allows (`FILE_TOO_LARGE`, `maxBytes` in `metadata`).',
);

export const notMultipartResponse: ApiResponseObject = apiErrorResponse(
  415,
  'The body is not `multipart/form-data` (`UNSUPPORTED_CONTENT_TYPE`).',
);

/** A multipart upload: one `file` and the text fields `form` describes. */
export function multipartBody(
  form: z.ZodType,
): NonNullable<DescribeRouteOptions['requestBody']> {
  return {
    required: true,
    content: { 'multipart/form-data': { schema: resolver(form, 'input') } },
  };
}

/** The `200` of a file download: the bytes, typed as stored. */
export const fileContentResponse: ApiResponseObject = {
  description:
    "The bytes, with the stored file's type (`application/octet-stream` when it is not a valid media type). An image, a PDF or plain text is served `inline` unless `download=true`; anything else is an `attachment`. Served with `X-Content-Type-Options: nosniff` and a sandboxing `Content-Security-Policy`.",
  headers: {
    'Content-Disposition': {
      description:
        '`inline` or `attachment`, with the file name as `filename` (ASCII) and `filename*` (UTF-8).',
      schema: { type: 'string' },
    },
  },
  content: {
    '*/*': { schema: { type: 'string', format: 'binary' } },
  },
};
