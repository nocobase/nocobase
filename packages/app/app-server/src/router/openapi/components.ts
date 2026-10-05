import type { OpenAPIV3_1 } from 'openapi-types';

import { apiErrorStatusCodes } from '../api-error.js';

const schemaRef = (name: string): OpenAPIV3_1.ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

/** The HTTP statuses that have a shared error response component, with the component's name. */
export const apiErrorResponseNames: {
  readonly 400: 'BadRequest';
  readonly 401: 'Unauthenticated';
  readonly 403: 'PermissionDenied';
  readonly 404: 'NotFound';
  readonly 409: 'Conflict';
  readonly 413: 'PayloadTooLarge';
  readonly 415: 'UnsupportedMediaType';
  readonly 429: 'TooManyRequests';
  readonly 500: 'InternalError';
  readonly 501: 'NotImplemented';
  readonly 503: 'Unavailable';
  readonly 504: 'DeadlineExceeded';
} = Object.freeze({
  400: 'BadRequest',
  401: 'Unauthenticated',
  403: 'PermissionDenied',
  404: 'NotFound',
  409: 'Conflict',
  413: 'PayloadTooLarge',
  415: 'UnsupportedMediaType',
  429: 'TooManyRequests',
  500: 'InternalError',
  501: 'NotImplemented',
  503: 'Unavailable',
  504: 'DeadlineExceeded',
});

export type ApiErrorResponseCode = keyof typeof apiErrorResponseNames;

const errorDescriptions: Readonly<Record<ApiErrorResponseCode, string>> = {
  400: 'The request is invalid (`INVALID_ARGUMENT`, with `fieldViolations` naming each invalid field) or the resource state forbids it (`FAILED_PRECONDITION`).',
  401: 'No valid session or API key (`UNAUTHENTICATED`).',
  403: 'The caller may not do this (`PERMISSION_DENIED`).',
  404: 'The resource the URL names does not exist (`NOT_FOUND`).',
  409: 'The resource already exists (`ALREADY_EXISTS`) or a concurrent change won (`ABORTED`).',
  413: 'The request body exceeds a size limit (`INVALID_ARGUMENT`, reason `BODY_TOO_LARGE`).',
  415: 'The request content type is not supported (`INVALID_ARGUMENT`).',
  429: 'A rate limit or quota was exceeded (`RESOURCE_EXHAUSTED`); wait for `Retry-After`.',
  500: 'An unexpected failure (`INTERNAL`); the body reveals nothing about its cause.',
  501: 'The operation is not implemented (`UNIMPLEMENTED`).',
  503: 'A dependency is unavailable (`UNAVAILABLE`); retrying later may succeed.',
  504: 'The operation did not finish in time (`DEADLINE_EXCEEDED`).',
};

/** The schemas and responses every API document carries: the standard error body and list metadata. */
export function apiDocumentBaseComponents(): OpenAPIV3_1.ComponentsObject {
  const responses: Record<string, OpenAPIV3_1.ResponseObject> = {};
  for (const [code, name] of Object.entries(apiErrorResponseNames)) {
    responses[name] = {
      description: errorDescriptions[Number(code) as ApiErrorResponseCode],
      content: { 'application/json': { schema: schemaRef('ApiErrorBody') } },
    };
  }
  responses[invalidInputResponseName] = {
    description: invalidInputDescription,
    content: { 'application/json': { schema: schemaRef('ApiErrorBody') } },
  };
  return {
    schemas: {
      ApiFieldViolation: {
        type: 'object',
        description: 'One invalid field in a request.',
        required: ['field', 'description'],
        properties: {
          field: {
            type: 'string',
            description:
              'Path to the field, such as `releaseId` or `items.2.name`.',
          },
          description: { type: 'string' },
          reason: { type: 'string' },
        },
      },
      ApiErrorPayload: {
        type: 'object',
        required: ['code', 'status', 'reason', 'domain', 'message'],
        properties: {
          code: { type: 'integer', description: 'The HTTP status.' },
          status: {
            type: 'string',
            enum: Object.keys(apiErrorStatusCodes),
            description:
              'The canonical error category; it decides the HTTP status.',
          },
          reason: {
            type: 'string',
            description:
              'What went wrong, in UPPER_SNAKE_CASE, unique within `domain`. Clients branch on this.',
          },
          domain: {
            type: 'string',
            description:
              'Who defined `reason`: a plugin namespace, or `app` for the framework.',
          },
          message: {
            type: 'string',
            description:
              'Developer-facing English text. Never shown to users or parsed by clients.',
          },
          localizedMessage: {
            type: 'object',
            required: ['locale', 'message'],
            properties: {
              locale: { type: 'string' },
              message: { type: 'string' },
            },
          },
          fieldViolations: {
            type: 'array',
            items: schemaRef('ApiFieldViolation'),
          },
          metadata: { type: 'object', additionalProperties: true },
          requestId: {
            type: 'string',
            description:
              'The id also sent in the `x-request-id` response header.',
          },
        },
      },
      ApiErrorBody: {
        type: 'object',
        description: 'The body of every failed `/api` response.',
        required: ['error'],
        properties: { error: schemaRef('ApiErrorPayload') },
      },
      ApiListMeta: {
        type: 'object',
        description:
          'List metadata. A list pages by `pageToken` (answering `nextPageToken`, absent on the last page) or by `page` (answering `page`, `pageSize` and `total`); an unpaged configuration list answers `total`. A list may add fields of its own.',
        properties: {
          total: { type: 'integer', minimum: 0 },
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1 },
          nextPageToken: { type: 'string' },
        },
        additionalProperties: true,
      },
    },
    responses,
  };
}

/** The description of the 400 a route answers when `apiValidator()` rejects its input. */
export const invalidInputDescription: string =
  'The request does not match the parameters or body this operation accepts (`INVALID_ARGUMENT`, reason `INVALID_INPUT`, with `fieldViolations` naming each invalid field).';

/** The shared response `apiValidator()` failures are documented with: the 400 every route with a validator can answer. */
export const invalidInputResponseName = 'InvalidInput';
