import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Env, MiddlewareHandler, ValidationTargets } from 'hono';
import {
  uniqueSymbol,
  validator,
  type ResolverReturnType,
  type ResponsesWithResolver,
} from 'hono-openapi';
import type { InferInput } from 'hono/validator';
import type { OpenAPIV3_1 } from 'openapi-types';

import { invalidApiInputError } from '../api-error.js';
import {
  apiErrorResponseNames,
  type ApiErrorResponseCode,
} from './components.js';
import {
  convertApiSchema,
  type ApiSchemaDirection,
  type ConvertedApiSchema,
} from './schema.js';

/**
 * Route metadata for the API document. Plugins take these from `@nocobase/app-server/router` and never import
 * `hono-openapi` themselves: the metadata is attached to middleware under a symbol that module owns, so a second copy
 * of it would attach metadata the document generator cannot see.
 */
export {
  describeRoute,
  type DescribeRouteOptions,
  type ResolverReturnType,
} from 'hono-openapi';
export type { OpenAPIV3_1 } from 'openapi-types';

/** One entry of `describeRoute({ responses })`: a response object whose schemas may be `resolver()` results. */
export type ApiResponseObject = ResponsesWithResolver[string];

/** A schema a response helper accepts: a Standard Schema such as a zod schema, or an OpenAPI schema or reference. */
export type ApiSchema =
  StandardSchemaV1 | OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

type SchemaOrRef = OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

type HasUndefined<T> = undefined extends T ? true : false;

/** The input `apiValidator(target, schema)` adds to a route, so `context.req.valid(target)` is typed by the schema. */
export interface ApiValidatorInput<
  Schema extends StandardSchemaV1,
  Target extends keyof ValidationTargets,
> {
  in: HasUndefined<StandardSchemaV1.InferInput<Schema>> extends true
    ? {
        [K in Target]?: [StandardSchemaV1.InferInput<Schema>] extends [
          ValidationTargets[K],
        ]
          ? StandardSchemaV1.InferInput<Schema>
          : InferInput<StandardSchemaV1.InferInput<Schema>, K>;
      }
    : {
        [K in Target]: [StandardSchemaV1.InferInput<Schema>] extends [
          ValidationTargets[K],
        ]
          ? StandardSchemaV1.InferInput<Schema>
          : InferInput<StandardSchemaV1.InferInput<Schema>, K>;
      };
  out: { [K in Target]: StandardSchemaV1.InferOutput<Schema> };
}

export interface ApiValidatorOptions {
  /** The request media type to document for a `json` or `form` body, when it is not the default. */
  readonly media?: string;
}

/**
 * A Standard Schema prepared for `describeRoute({ responses })` or `requestBody`, converted under the document's
 * conventions: definitions become components under stable names, a property keeps its own description next to the
 * `$ref` of a shared schema, and a response object is open unless the schema is strict. The response helpers use it
 * already; reach for it only for content they do not cover, such as a streaming media type.
 */
export function resolver(
  schema: StandardSchemaV1,
  direction: ApiSchemaDirection = 'output',
): ResolverReturnType {
  return {
    vendor: schema['~standard'].vendor,
    validate: schema['~standard'].validate,
    toJSONSchema: async () =>
      (await convertApiSchema(schema, direction)).schema as never,
    toOpenAPISchema: async () => {
      const converted = await convertApiSchema(schema, direction);
      return {
        schema: converted.schema as OpenAPIV3_1.SchemaObject,
        components: converted.components,
      };
    },
  };
}

// OpenAPI ignores a header parameter with one of these names: the request body's media type and the accepted ones
// are described by the operation, and credentials by its security requirements.
const ignoredHeaderParameters = new Set([
  'accept',
  'authorization',
  'content-type',
]);

function withoutIgnoredHeaders(
  converted: ConvertedApiSchema,
): ConvertedApiSchema {
  let schema = converted.schema as OpenAPIV3_1.SchemaObject &
    Partial<OpenAPIV3_1.ReferenceObject>;
  const schemas = { ...converted.components?.schemas };
  const ref = schema.$ref?.startsWith('#/components/schemas/')
    ? schema.$ref.slice('#/components/schemas/'.length)
    : undefined;
  if (ref !== undefined && schemas[ref]) {
    schema = { ...schemas[ref] };
    delete schemas[ref];
  }
  const properties = Object.entries(schema.properties ?? {}).filter(
    ([name]) => !ignoredHeaderParameters.has(name.toLowerCase()),
  );
  if (
    ref === undefined &&
    properties.length === Object.keys(schema.properties ?? {}).length
  ) {
    return converted;
  }
  const required = schema.required?.filter(
    (name) => !ignoredHeaderParameters.has(name.toLowerCase()),
  );
  return {
    schema: {
      ...schema,
      properties: Object.fromEntries(properties),
      ...(required ? { required } : {}),
    },
    components:
      Object.keys(schemas).length > 0
        ? { ...converted.components, schemas }
        : undefined,
  };
}

/**
 * Validate one part of the request — `param`, `query`, `json`, `header`, `form` or `cookie` — against a Standard Schema
 * such as a zod schema, and declare that schema in the API document. An invalid request is answered `400
 * INVALID_ARGUMENT` with reason `INVALID_INPUT`, domain `app`, and a field violation per issue before the handler
 * runs, exactly as `parseApiInput()` answers; the handler reads the parsed value from `context.req.valid(target)`.
 * Because of that, the document lists the 400 for invalid input on every route with a validator, without the route
 * declaring it.
 *
 * ```ts
 * router.post('/orders/:orderId/cancel', describeRoute({ ... }), apiValidator('param', OrderParams), apiValidator('json', CancelOrderInput), handler);
 * ```
 */
export function apiValidator<
  Schema extends StandardSchemaV1,
  Target extends keyof ValidationTargets,
  E extends Env = Env,
  P extends string = string,
>(
  target: Target,
  schema: Schema,
  options?: ApiValidatorOptions,
): MiddlewareHandler<E, P, ApiValidatorInput<Schema, Target>> {
  const middleware = validator(
    target,
    schema,
    (result) => {
      if (!result.success) throw invalidApiInputError(result.error);
    },
    options,
  );
  // Document the schema the way the response helpers do, rather than with hono-openapi's own conversion.
  const metadata = (
    middleware as unknown as Record<symbol, Record<string, unknown>>
  )[uniqueSymbol];
  const input = resolver(schema, 'input');
  metadata.toJSONSchema = input.toJSONSchema;
  metadata.toOpenAPISchema = async () => {
    const converted = await convertApiSchema(schema, 'input');
    return target === 'header' ? withoutIgnoredHeaders(converted) : converted;
  };
  return middleware as unknown as MiddlewareHandler<
    E,
    P,
    ApiValidatorInput<Schema, Target>
  >;
}

function isStandardSchema(schema: ApiSchema): schema is StandardSchemaV1 {
  return typeof schema === 'object' && schema !== null && '~standard' in schema;
}

interface ResolvedSchemas {
  readonly schemas: Readonly<Record<string, SchemaOrRef>>;
  readonly components: OpenAPIV3_1.ComponentsObject | undefined;
}

async function resolveParts(
  parts: Readonly<Record<string, ApiSchema>>,
): Promise<ResolvedSchemas> {
  const schemas: Record<string, SchemaOrRef> = {};
  let components: OpenAPIV3_1.ComponentsObject | undefined;
  for (const [key, part] of Object.entries(parts)) {
    if (!isStandardSchema(part)) {
      schemas[key] = part;
      continue;
    }
    // Responses describe what the server sends, so a schema with a transform documents its output.
    const result = await convertApiSchema(part, 'output');
    schemas[key] = result.schema;
    const collected = { ...result.components?.schemas };
    if (Object.keys(collected).length > 0) {
      components = {
        ...components,
        schemas: { ...components?.schemas, ...collected },
      };
    }
  }
  return { schemas, components };
}

/**
 * A `resolver()`-shaped value whose OpenAPI schema is built from several schemas, each a Standard Schema or a plain
 * OpenAPI schema, resolved when the document is generated.
 */
function composeSchema(
  parts: Readonly<Record<string, ApiSchema>>,
  build: (schemas: Readonly<Record<string, SchemaOrRef>>) => SchemaOrRef,
): ResolverReturnType {
  return {
    vendor: 'nocobase',
    validate: (value: unknown) => ({ value }),
    toJSONSchema: async () =>
      build((await resolveParts(parts)).schemas) as never,
    toOpenAPISchema: async () => {
      const resolved = await resolveParts(parts);
      return {
        schema: build(resolved.schemas) as OpenAPIV3_1.SchemaObject,
        components: resolved.components,
      };
    },
  };
}

/** A `200`-style JSON response whose body is `{ data }`, `data` being described by `schema`. */
export function dataResponse(
  schema: ApiSchema,
  description: string = 'Success.',
): ApiResponseObject {
  return {
    description,
    content: {
      'application/json': {
        schema: composeSchema({ data: schema }, ({ data }) => ({
          type: 'object',
          required: ['data'],
          properties: { data: data },
        })),
      },
    },
  };
}

/**
 * A JSON list response, `{ data: [...], meta }`. `itemSchema` describes one element; `metaSchema` defaults to the
 * shared `ApiListMeta` (`total`, `page`, `pageSize`, `nextPageToken`).
 */
export function listResponse(
  itemSchema: ApiSchema,
  metaSchema?: ApiSchema,
  description: string = 'Success.',
): ApiResponseObject {
  return {
    description,
    content: {
      'application/json': {
        schema: composeSchema(
          {
            item: itemSchema,
            meta: metaSchema ?? { $ref: '#/components/schemas/ApiListMeta' },
          },
          ({ item, meta }) => ({
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: { type: 'array', items: item },
              meta: meta,
            },
          }),
        ),
      },
    },
  };
}

/** A response without a body, such as a `204`. */
export function emptyResponse(
  description: string = 'No content.',
): ApiResponseObject {
  return { description };
}

/**
 * The shared error response for one HTTP status, in the standard error body. Without `description` it refers to the
 * shared component; with one it describes when this route answers that status.
 */
export function apiErrorResponse(
  code: ApiErrorResponseCode,
  description?: string,
): ApiResponseObject {
  if (description === undefined) {
    return { $ref: `#/components/responses/${apiErrorResponseNames[code]}` };
  }
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ApiErrorBody' },
      },
    },
  };
}

/**
 * The error responses of an authenticated route that checks a permission: no session or API key, refused permission
 * and an unexpected failure. Spread them into `responses` and add the route's own, such as `apiErrorResponse(404)`. A
 * route without a permission check lists `apiErrorResponse(401)` and `apiErrorResponse(500)` instead, and a public one
 * only `apiErrorResponse(500)`. There is no 400 here: a route with an `apiValidator()` gets the 400 for invalid input
 * in the document automatically, and lists `apiErrorResponse(400, description)` itself only for another reason, such
 * as a failed precondition.
 */
export const apiErrorResponses: Readonly<
  Record<'401' | '403' | '500', ApiResponseObject>
> = Object.freeze({
  '401': apiErrorResponse(401),
  '403': apiErrorResponse(403),
  '500': apiErrorResponse(500),
});
