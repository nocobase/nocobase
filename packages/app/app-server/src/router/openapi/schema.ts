import { createHash } from 'node:crypto';

import type { StandardSchemaV1 } from '@standard-schema/spec';
import { resolver as honoResolver } from 'hono-openapi';
import type { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';
import {
  $ZodRegistry,
  globalRegistry,
  toJSONSchema,
  type $ZodType,
  type GlobalMeta,
  type JSONSchema,
} from 'zod/v4/core';

type SchemaOrRef = OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

/** Whether a schema documents what a client sends (`input`) or what the server answers (`output`). */
export type ApiSchemaDirection = 'input' | 'output';

/** A schema converted for the API document: the schema itself and the components it refers to. */
export interface ConvertedApiSchema {
  readonly schema: SchemaOrRef;
  readonly components: OpenAPIV3_1.ComponentsObject | undefined;
}

const componentsPrefix = '#/components/schemas/';
const generatedDefinitionName = /^__schema\d+$/;
const componentName = /^[A-Za-z0-9._-]+$/;

// The name a recursive schema without a declared `ref` gets when it is exactly what `z.json()` describes, the common
// case. Any other anonymous recursive schema is named after a hash of its content.
const jsonValueName = 'JsonValue';

function encodePointer(segment: string): string {
  return segment.replaceAll('~', '~0').replaceAll('/', '~1');
}

function decodePointer(segment: string): string {
  return segment.replaceAll('~1', '/').replaceAll('~0', '~');
}

function isZodSchema(
  schema: StandardSchemaV1,
): schema is StandardSchemaV1 & $ZodType {
  return '_zod' in schema;
}

/**
 * zod's metadata seen through the API document's conventions: a schema whose own metadata declares `ref` is given that
 * `ref` as its zod `id`, so zod extracts it into a definition of that name and every use refers to it — including a
 * copy made by `.meta({ description })` or `.describe()`, which keeps its own description next to the `$ref` instead of
 * overwriting the shared one. A `ref` inherited from the schema a copy was made from is not an id of the copy, and the
 * `ref` key itself never reaches the emitted JSON Schema.
 */
class ApiMetadataRegistry extends $ZodRegistry<GlobalMeta> {
  private readonly claims = new Map<string, $ZodType>();
  private readonly cache = new WeakMap<$ZodType, GlobalMeta | undefined>();

  override get<S extends $ZodType>(schema: S): GlobalMeta | undefined {
    if (this.cache.has(schema)) return this.cache.get(schema);
    const meta = this.resolve(schema);
    this.cache.set(schema, meta);
    return meta;
  }

  private resolve(schema: $ZodType): GlobalMeta | undefined {
    const meta = globalRegistry.get(schema);
    if (!meta) return undefined;
    const { ref, ...rest } = meta;
    const bare = Object.keys(rest).length > 0 ? rest : undefined;
    if (typeof ref !== 'string' || rest.id !== undefined) return bare;
    const parent = schema._zod.parent;
    if (
      parent &&
      (globalRegistry.get(parent) as { ref?: unknown } | undefined)?.ref === ref
    ) {
      return bare;
    }
    // Two different schemas declaring the same `ref` in one conversion cannot both be that definition; the first one
    // seen is, the other is described inline rather than failing the whole document.
    const owner = this.claims.get(ref);
    if (owner && owner !== schema) return bare;
    this.claims.set(ref, schema);
    return { ...rest, id: ref };
  }
}

function zodJsonSchema(
  schema: $ZodType,
  direction: ApiSchemaDirection,
): JSONSchema.BaseSchema {
  return toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: direction,
    unrepresentable: 'any',
    cycles: 'ref',
    reused: 'inline',
    metadata: new ApiMetadataRegistry(),
    override: ({ zodSchema, jsonSchema }) => {
      const def = zodSchema._zod.def as {
        readonly type: string;
        readonly catchall?: unknown;
      };
      // A `Date` travels as an RFC 3339 string, as hono-openapi documents it.
      if (def.type === 'date') {
        jsonSchema.type = 'string';
        jsonSchema.format = 'date-time';
      }
      // zod closes a plain `z.object` in output mode because parsing strips unknown keys. A response schema is a
      // promise about the fields it lists, not a refusal of new ones: closing it would make every added field a
      // breaking change for a strict client. Only `z.strictObject` / `.strict()` (a `never` catchall) stays closed.
      if (
        direction === 'output' &&
        def.type === 'object' &&
        def.catchall === undefined &&
        jsonSchema.additionalProperties === false
      ) {
        delete jsonSchema.additionalProperties;
      }
    },
  });
}

let jsonValueCanonical: string | undefined;

function canonicalJsonValue(): string {
  // `z.json()` converted on its own is a root that refers to itself as `#`.
  if (jsonValueCanonical === undefined) {
    const root: Record<string, unknown> = {
      ...zodJsonSchema(z.json(), 'output'),
    };
    delete root.$schema;
    jsonValueCanonical = canonicalize(root, '', new Set());
  }
  return jsonValueCanonical;
}

/** The content of a definition with its references to itself spelled `#` and those to other unnamed ones neutralized. */
function canonicalize(
  definition: unknown,
  self: string,
  anonymous: ReadonlySet<string>,
): string {
  return JSON.stringify(definition, (key, value: unknown) => {
    if (key !== '$ref' || typeof value !== 'string') return value;
    const name = definitionName(value);
    if (name === self) return '#';
    if (name !== undefined && anonymous.has(name)) return '#anonymous';
    return value;
  });
}

function definitionName(ref: string): string | undefined {
  for (const prefix of ['#/$defs/', '#/definitions/', componentsPrefix]) {
    if (ref.startsWith(prefix)) return decodePointer(ref.slice(prefix.length));
  }
  return undefined;
}

function nameAnonymous(
  canonical: string,
  taken: (name: string) => boolean,
): string {
  if (canonical === canonicalJsonValue() && !taken(jsonValueName))
    return jsonValueName;
  return `Recursive${createHash('sha256').update(canonical).digest('hex').slice(0, 8)}`;
}

function omitRef(definition: Record<string, unknown>): Record<string, unknown> {
  const rest = { ...definition };
  delete rest.$ref;
  return rest;
}

function rewrite(value: unknown, refFor: (ref: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => rewrite(item, refFor));
  if (typeof value !== 'object' || value === null) return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] =
      key === '$ref' && typeof child === 'string'
        ? refFor(child)
        : rewrite(child, refFor);
  }
  return result;
}

/**
 * Turn a JSON Schema with local definitions into an OpenAPI schema whose definitions are components.
 *
 * - Every definition becomes a component. One with a declared name keeps it; one a converter named itself (`__schema0`,
 *   which would collide across routes and plugins) is named `JsonValue` when it is `z.json()` and after a hash of its
 *   content otherwise, so the same schema always gets the same name and different schemas never share one.
 * - A declared definition that only refers to an unnamed one, as `z.json().meta({ ref })` does because the recursion
 *   runs through the schema it was copied from, takes the unnamed definition's content under the declared name.
 * - A root that refers to itself as `#` becomes a component too, since `#` in a document is the document.
 * - Every `$ref` to a definition is rewritten to `#/components/schemas/...`.
 */
function hoistDefinitions(
  root: Record<string, unknown>,
  definitions: Readonly<Record<string, unknown>>,
): ConvertedApiSchema {
  const names = new Map<string, string>();
  const anonymous = new Set(
    Object.keys(definitions).filter((name) =>
      generatedDefinitionName.test(name),
    ),
  );
  const declared = new Set(
    Object.keys(definitions).filter((name) => !anonymous.has(name)),
  );
  const used = new Set(declared);
  for (const name of declared) names.set(name, name);
  const aliases = new Map<string, string>();
  for (const name of declared) {
    const definition = definitions[name] as { $ref?: unknown } | undefined;
    const target =
      typeof definition?.$ref === 'string'
        ? definitionName(definition.$ref)
        : undefined;
    if (target === undefined || !anonymous.has(target) || names.has(target)) {
      continue;
    }
    names.set(target, name);
    aliases.set(name, target);
  }
  for (const name of anonymous) {
    if (names.has(name)) continue;
    const assigned = nameAnonymous(
      canonicalize(definitions[name], name, anonymous),
      (candidate) => used.has(candidate),
    );
    names.set(name, assigned);
    used.add(assigned);
  }

  const selfReferencing = JSON.stringify(root).includes('"$ref":"#"');
  let rootName: string | undefined;
  if (selfReferencing) {
    rootName = nameAnonymous(canonicalize(root, '', anonymous), (candidate) =>
      used.has(candidate),
    );
  }

  const refFor = (ref: string): string => {
    if (ref === '#' && rootName)
      return `${componentsPrefix}${encodePointer(rootName)}`;
    const name = definitionName(ref);
    if (name === undefined) return ref;
    return `${componentsPrefix}${encodePointer(names.get(name) ?? name)}`;
  };

  const schemas: Record<string, SchemaOrRef> = {};
  for (const [name, definition] of Object.entries(definitions)) {
    if (anonymous.has(name) && aliases.has(names.get(name)!)) continue;
    const target = aliases.get(name);
    const content =
      target === undefined
        ? definition
        : {
            ...(definitions[target] as object),
            ...omitRef(definition as Record<string, unknown>),
          };
    schemas[names.get(name) ?? name] = rewrite(content, refFor) as SchemaOrRef;
  }
  let schema = rewrite(root, refFor) as SchemaOrRef;
  if (rootName) {
    schemas[rootName] = schema;
    schema = { $ref: `${componentsPrefix}${encodePointer(rootName)}` };
  }
  return {
    schema,
    components: Object.keys(schemas).length > 0 ? { schemas } : undefined,
  };
}

/**
 * Convert a Standard Schema for the API document. A zod schema is converted with zod itself under the document's
 * conventions (see `ApiMetadataRegistry` and the open response objects above); any other vendor goes through
 * hono-openapi's converter. Either way the result's definitions are hoisted into `components.schemas` under stable
 * names and every reference points there.
 */
export async function convertApiSchema(
  schema: StandardSchemaV1,
  direction: ApiSchemaDirection,
): Promise<ConvertedApiSchema> {
  if (isZodSchema(schema)) {
    const { $defs, ...root } = zodJsonSchema(schema, direction) as Record<
      string,
      unknown
    > & {
      $defs?: Record<string, unknown>;
    };
    delete root.$schema;
    return hoistDefinitions(root, $defs ?? {});
  }
  const result = await honoResolver(schema, {
    options: { io: direction },
  }).toOpenAPISchema();
  const { $defs, ...root } = result.schema as Record<string, unknown> & {
    $defs?: Record<string, unknown>;
  };
  const hoisted = hoistDefinitions(root, {
    ...result.components?.schemas,
    ...$defs,
  });
  return {
    schema: hoisted.schema,
    components:
      result.components || hoisted.components
        ? { ...result.components, schemas: hoisted.components?.schemas ?? {} }
        : undefined,
  };
}

/**
 * Every place in a document that refers to a schema it cannot resolve or names a component in a way that breaks the
 * document: a local `$ref` whose target does not exist (such as `#/$defs/...`, which means nothing in an OpenAPI
 * document), a component named by a converter (`__schema0`) rather than by its declaration, and a component name the
 * OpenAPI specification does not allow. An empty list means the schemas are sound.
 *
 * ```ts
 * expect(findApiDocumentSchemaProblems(await generateApiDocument(app, options))).toEqual([]);
 * ```
 */
export function findApiDocumentSchemaProblems(
  document: OpenAPIV3_1.Document,
): string[] {
  const problems: string[] = [];
  const components = (document.components ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  for (const [kind, entries] of Object.entries(components)) {
    for (const name of Object.keys(entries ?? {})) {
      if (generatedDefinitionName.test(name)) {
        problems.push(
          `components/${kind}/${name} is a name generated by the schema converter, not a declared one.`,
        );
      } else if (!componentName.test(name)) {
        problems.push(
          `components/${kind}/${name} is not a valid OpenAPI component name.`,
        );
      }
    }
  }
  const resolves = (ref: string): boolean => {
    if (!ref.startsWith('#/')) return false;
    let current: unknown = document;
    for (const segment of ref.slice(2).split('/')) {
      if (typeof current !== 'object' || current === null) return false;
      const key = decodePointer(segment);
      if (!Object.prototype.hasOwnProperty.call(current, key)) return false;
      current = (current as Record<string, unknown>)[key];
    }
    return current !== undefined;
  };
  const visit = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}/${index}`));
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}/${encodePointer(key)}`;
      if (key === '$ref' && typeof child === 'string') {
        // A reference to another document is not this document's to resolve.
        if (child.startsWith('#') && !resolves(child)) {
          problems.push(
            `${path} refers to ${child}, which does not exist in the document.`,
          );
        }
        continue;
      }
      visit(child, childPath);
    }
  };
  visit(document, '#');
  return problems;
}
