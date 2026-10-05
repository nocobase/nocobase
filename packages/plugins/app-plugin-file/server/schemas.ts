import type { OpenAPIV3_1 } from '@nocobase/app-server/router';

// Schemas of the upload endpoints in the API document at `/api/swagger/docs`. They are plain OpenAPI schemas rather than
// zod ones because nothing here validates against them: an upload's body is multipart and is checked in code, and a
// response is never validated.

type SchemaObject = OpenAPIV3_1.SchemaObject;

const binary: SchemaObject = {
  type: 'string',
  format: 'binary',
  description:
    'The file content. Its name and type become `filename`, `ext` and `mimeType`.',
};

/**
 * The URL a file record's content is served at. It is added to every record a file exposure returns, the data endpoints'
 * included, where it is declared as a computed field.
 */
export const contentUrlSchema: SchemaObject = {
  type: 'string',
  description:
    "The stable URL that serves the content: the application's public base path, the exposure's access path, then `{id}.{ext}` (or `{id}` without an extension). It is derived, never persisted, and present when the record carries `id` and `ext`.",
};

/** The file record an upload creates, with the content URL the response adds. */
export const fileRecordSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'disk',
    'key',
    'filename',
    'ext',
    'mimeType',
    'size',
    'createdAt',
    'updatedAt',
    'contentUrl',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    disk: {
      type: 'string',
      description: 'The storage disk the object was written to.',
    },
    key: { type: 'string', description: 'The object key on `disk`.' },
    filename: { type: 'string', description: 'The original file name.' },
    ext: {
      type: 'string',
      description:
        'The lowercase extension without a dot; empty for a file without one.',
    },
    mimeType: { type: 'string' },
    size: { type: 'integer', minimum: 0, description: 'The size in bytes.' },
    createdAt: { type: 'string', description: 'An ISO 8601 timestamp.' },
    updatedAt: { type: 'string', description: 'An ISO 8601 timestamp.' },
    contentUrl: contentUrlSchema,
  },
};

/** The multipart body of `uploadOne`: exactly one `file` field. */
export const uploadOneBodySchema: SchemaObject = {
  type: 'object',
  required: ['file'],
  properties: { file: binary },
};

/** The multipart body of `uploadMany`: one or more `file` fields. */
export const uploadManyBodySchema: SchemaObject = {
  type: 'object',
  required: ['file'],
  properties: {
    file: {
      type: 'array',
      items: binary,
      minItems: 1,
      description: 'Repeat the `file` field once per file.',
    },
  },
};

export const uploadOneResultSchema: SchemaObject = {
  type: 'object',
  required: ['record', 'createdTargets'],
  properties: {
    record: fileRecordSchema,
    createdTargets: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
      description:
        'Related records the write created; always empty for an upload.',
    },
    version: { anyOf: [{ type: 'string' }, { type: 'integer' }] },
  },
};

export const uploadManyResultSchema: SchemaObject = {
  type: 'object',
  required: ['createdCount', 'records'],
  properties: {
    createdCount: { type: 'integer', minimum: 1 },
    records: { type: 'array', items: fileRecordSchema },
  },
};
