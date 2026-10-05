import {
  filterOperatorsForFieldType,
  isManagedField,
  isSortableFieldType,
  supportsFilterShorthand,
  writableFields,
  type CollectionDefinition,
  type FieldDefinition,
  type NormalizedRepositoryPolicy,
  type RelationFieldDefinition,
} from '@nocobase/db';
import type { MiddlewareHandler } from 'hono';
import { describeRoute, type DescribeRouteOptions } from 'hono-openapi';
import type { OpenAPIV3_1 } from 'openapi-types';

import type { RepositoryApiAction } from '../repository-routes.js';
import type { ApiSchema } from './describe.js';
import { convertApiSchema } from './schema.js';

/** The operation extension a data endpoint's declaration carries until the document generator expands it. */
const repositoryExtension = 'x-nocobase-repository';

type AnyFieldDefinition = NonNullable<CollectionDefinition['fields']>[number];

/** What the document generator needs to describe one data endpoint. */
export interface RepositoryEndpointDescriptor {
  readonly exposure: string;
  readonly collection: string;
  readonly connection: string | undefined;
  readonly action: RepositoryApiAction;
  readonly maxLimit: number;
  /** The exposure's fixed Policy, or `undefined` when the Policy is built per request from the principal. */
  readonly policy: NormalizedRepositoryPolicy | undefined;
  /** Fields the exposure adds to every returned record, documented read-only in its record schema. */
  readonly computedFields: Readonly<Record<string, ApiSchema>>;
  readonly loadCollection: () => Promise<CollectionDefinition | undefined>;
}

type SchemaObject = OpenAPIV3_1.SchemaObject;
type SchemaOrRef = OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;

const ref = (name: string): OpenAPIV3_1.ReferenceObject => ({
  $ref: `#/components/schemas/${name}`,
});

function pascal(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const actionSummaries: Readonly<Record<RepositoryApiAction, string>> = {
  findMany: 'List records',
  findOne: 'Get one record',
  count: 'Count records',
  aggregate: 'Aggregate records',
  groupBy: 'Group and aggregate records',
  exists: 'Check whether a record exists',
  createOne: 'Create a record',
  updateOne: 'Update one record',
  deleteOne: 'Delete one record',
};

/** The declaration a data endpoint registers, so it is documented without a hand-written `describeRoute()`. */
export function describeRepositoryEndpoint(
  descriptor: RepositoryEndpointDescriptor,
): MiddlewareHandler {
  const spec: DescribeRouteOptions & Record<string, unknown> = {
    tags: [pascal(descriptor.exposure)],
    summary: `${actionSummaries[descriptor.action]} of ${descriptor.exposure}`,
    operationId: `${descriptor.exposure}${pascal(descriptor.action)}`,
    [repositoryExtension]: descriptor,
  };
  return describeRoute(spec);
}

/** The scalar types whose filter operators the shared `RepositoryFilter` description lists. */
const describedFieldTypes = [
  'string',
  'char',
  'uuid',
  'text',
  'enum',
  'increments',
  'integer',
  'bigInt',
  'decimal',
  'float',
  'double',
  'date',
  'datetime',
  'datetimeTz',
  'time',
  'boolean',
  'json',
] as const;

function operatorTable(): string {
  const rows = new Map<string, string[]>();
  for (const type of describedFieldTypes) {
    const operators = filterOperatorsForFieldType(type);
    if (!operators) continue;
    const key = operators.map((operator) => `\`${operator}\``).join(' ');
    rows.set(key, [...(rows.get(key) ?? []), type]);
  }
  return [
    '| Field types | Operators |',
    '| --- | --- |',
    ...[...rows].map(
      ([operators, types]) => `| ${types.join(', ')} | ${operators} |`,
    ),
  ].join('\n');
}

const shorthandTypes = (): string =>
  describedFieldTypes
    .filter((type) => supportsFilterShorthand(type))
    .join(', ');

function filterDescription(): string {
  return [
    'A Repository filter. It takes one of two forms.',
    '',
    `**Shorthand**: \`{ "status": "active", "ownerId": "1" }\` matches records whose fields equal the given values, all conditions combined with AND. Only root scalar fields of these types may appear: ${shorthandTypes()}. \`null\` matches a database NULL. Operator objects such as \`{ "budget": { "$gte": 100 } }\` are not part of the syntax; use the AST.`,
    '',
    '**AST**: `{ "kind": "filter", "version": 1, "root": { "kind": "group", "logic": "and", "items": [...] } }`. `root` is a group; a group combines `items` with `logic` `and` or `or` and may nest. An item is a group, a condition `{ "kind": "condition", "path": ["status"], "operator": "$eq", "value": "active" }`, or a relation condition. `path` names logical fields; a path may pass through to-one relations, such as `["owner", "name"]`.',
    '',
    'Operators by field type, as the Repository validates them:',
    '',
    operatorTable(),
    '',
    'Empty values and dates: `$empty` on a string, uuid or text field matches NULL or an empty string, on any other scalar only NULL; `$eq` with `null` matches NULL and `$ne` with `null` matches anything not NULL; `$ne` and `$notIncludes` follow SQL NULL semantics and do not match NULL rows. Date values are `YYYY-MM-DD` for `date`, zone-free ISO date-times for `datetime` and ISO date-times with an offset or `Z` for `datetimeTz`. `$dateOn` and `$dateNotOn` apply to `date` only; `$dateBetween` takes `[start, end]` and is the half-open interval `[start, end)`; `$dateNotBefore` is `>=` and `$dateNotAfter` is `<=`. A string condition may set `"mode": "insensitive"` for case-insensitive matching.',
    '',
    'Relation conditions: `{ "kind": "relation", "path": ["tasks"], "quantifier": "some", "filter": { "kind": "group", ... } }`. `some` matches when at least one related record matches the nested group, `none` when none does (also when there are none); `exists` / `notEmpty` and `notExists` / `empty` test whether related records exist and take no nested filter. A to-many relation is only reachable through a quantifier.',
    '',
    'JSON conditions: a condition on a `json` field adds `"jsonPath": ["profile", "country"]` (string keys and array indexes) and uses the `$json*` operators: `$jsonEq` / `$jsonNe` compare a JSON value structurally, `$jsonHas`, `$jsonHasSome` and `$jsonHasEvery` test array members, `$jsonEmpty` / `$jsonNotEmpty` test for an empty array, and `$jsonDbNull`, `$jsonNull` and `$jsonAnyNull` distinguish a database NULL from a JSON null.',
    '',
    'A value may be a context variable, `{ "kind": "variable", "path": "$actor.id" }`, where the server supplies a context.',
  ].join('\n');
}

/** The shared Repository components every document with a data endpoint carries. */
function sharedRepositorySchemas(): Record<string, SchemaObject> {
  return {
    RepositoryFilterVariable: {
      type: 'object',
      description: 'A value the server fills in from the request context.',
      required: ['kind', 'path'],
      properties: {
        kind: { const: 'variable' },
        path: { type: 'string', examples: ['$actor.id'] },
      },
      additionalProperties: false,
    },
    RepositoryFilterCondition: {
      type: 'object',
      description:
        'A condition on a field, possibly reached through to-one relations.',
      required: ['kind', 'path', 'operator'],
      properties: {
        kind: { const: 'condition' },
        path: { type: 'array', items: { type: 'string' }, minItems: 1 },
        operator: { type: 'string', pattern: '^\\$[a-zA-Z]+$' },
        value: {},
        mode: { type: 'string', enum: ['default', 'insensitive'] },
        jsonPath: {
          type: 'array',
          items: {
            anyOf: [{ type: 'string' }, { type: 'integer', minimum: 0 }],
          },
        },
      },
      additionalProperties: false,
    },
    RepositoryFilterRelation: {
      type: 'object',
      description:
        'A condition on related records. Only `some` and `none` take a nested `filter`.',
      required: ['kind', 'path', 'quantifier'],
      properties: {
        kind: { const: 'relation' },
        path: { type: 'array', items: { type: 'string' }, minItems: 1 },
        quantifier: {
          type: 'string',
          enum: ['exists', 'notExists', 'some', 'none', 'empty', 'notEmpty'],
        },
        filter: ref('RepositoryFilterGroup'),
      },
      additionalProperties: false,
    },
    RepositoryFilterGroup: {
      type: 'object',
      required: ['kind', 'logic', 'items'],
      properties: {
        kind: { const: 'group' },
        logic: { type: 'string', enum: ['and', 'or'] },
        items: {
          type: 'array',
          items: {
            anyOf: [
              ref('RepositoryFilterGroup'),
              ref('RepositoryFilterCondition'),
              ref('RepositoryFilterRelation'),
            ],
          },
        },
      },
      additionalProperties: false,
    },
    RepositoryFilter: {
      description: filterDescription(),
      anyOf: [
        {
          type: 'object',
          title: 'Shorthand',
          additionalProperties: {
            anyOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
            ],
          },
          minProperties: 1,
        },
        {
          type: 'object',
          title: 'AST',
          required: ['kind', 'version', 'root'],
          properties: {
            kind: { const: 'filter' },
            version: { const: 1 },
            collection: { type: 'string' },
            root: ref('RepositoryFilterGroup'),
          },
          additionalProperties: false,
        },
      ],
    },
    RepositorySelect: {
      type: 'object',
      description:
        'Which fields and relations to return, as a Select AST: `{ "kind": "select", "version": 1, "root": { "kind": "selection", "fields": ["id", "name"], "includes": [{ "kind": "include", "relation": "owner", "select": { "kind": "selection", "fields": ["id"] } }] } }`. Without `select` the server returns every field the exposure may read and no relations. An include may carry its own `filter`, `sort`, `limit`, `cursor`, `direction` and `distinct` on to-many relations, and `combine` returns records and aggregates of one relation together. Asking for a field the exposure may not read is refused, not silently dropped.',
      required: ['kind', 'version', 'root'],
      properties: {
        kind: { const: 'select' },
        version: { const: 1 },
        collection: { type: 'string' },
        root: { type: 'object', additionalProperties: true },
      },
    },
    RepositorySort: {
      type: 'object',
      description:
        'The order of results, as a Sort AST: `{ "kind": "sort", "version": 1, "items": [{ "kind": "field", "path": ["status"], "direction": "asc" }, { "kind": "field", "path": ["name"], "direction": "desc", "nulls": "last" }] }`. Earlier items take precedence; the primary key is appended as a tie-breaker. A field path may pass through to-one relations; a to-many relation is sorted by an aggregate, `{ "kind": "aggregate", "relation": ["tasks"], "aggregate": "count", "direction": "desc" }` (`count`, `sum`, `avg`, `min`, `max`). Sorting a field twice is refused.',
      required: ['kind', 'version', 'items'],
      properties: {
        kind: { const: 'sort' },
        version: { const: 1 },
        collection: { type: 'string' },
        items: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
        },
      },
    },
    RepositoryRelationMutation: {
      type: 'object',
      description:
        'A nested write on a relation, such as `{ "connect": ... }`, `{ "create": ... }`, `{ "set": ... }` or `{ "disconnect": ... }`. Which operations and fields are accepted is decided by the exposure\'s Policy.',
      additionalProperties: true,
    },
    RepositoryCreatedTarget: {
      type: 'object',
      description: 'A related record a nested write created.',
      additionalProperties: true,
    },
  };
}

function nullable(schema: SchemaObject, field: FieldDefinition): SchemaObject {
  if (field.nullable === false || field.primaryKey) return schema;
  if (typeof schema.type === 'string')
    return { ...schema, type: [schema.type, 'null'] };
  if (schema.enum) {
    const members: unknown[] = schema.enum;
    return { ...schema, enum: [...members, null] };
  }
  return schema;
}

/** The JSON shape a scalar field's value takes over HTTP, before nullability. */
export function fieldValueSchema(field: FieldDefinition): SchemaObject {
  const describe = (schema: SchemaObject): SchemaObject => {
    const text = [field.title, field.description].filter(Boolean).join(': ');
    return text ? { ...schema, description: text } : schema;
  };
  switch (field.type) {
    case 'string':
    case 'char':
    case 'text':
      return describe({
        type: 'string',
        ...(field.length ? { maxLength: field.length } : {}),
      });
    case 'uuid':
      return describe({ type: 'string', format: 'uuid' });
    case 'enum':
      return describe({ type: 'string', enum: [...(field.values ?? [])] });
    case 'increments':
    case 'integer':
      return describe({ type: 'integer' });
    case 'bigInt':
      return describe({
        type: 'string',
        pattern: '^-?\\d+$',
        description:
          'A 64-bit integer as a decimal string, so it keeps its precision in JavaScript.',
      });
    case 'decimal':
      return describe({
        type: 'string',
        pattern: '^-?\\d+(\\.\\d+)?$',
        description: 'A decimal number as a string, so it keeps its precision.',
      });
    case 'float':
    case 'double':
      return describe({ type: 'number' });
    case 'boolean':
      return describe({ type: 'boolean' });
    case 'date':
      return describe({ type: 'string', format: 'date' });
    case 'datetime':
      return describe({
        type: 'string',
        description:
          'A date and time without a time zone, such as `2026-10-04T08:00:00.000`.',
      });
    case 'datetimeTz':
      return describe({ type: 'string', format: 'date-time' });
    case 'time':
      return describe({ type: 'string', examples: ['08:30:00'] });
    case 'json':
      return describe({
        description:
          'Any JSON value; the Collection does not constrain its structure.',
      });
    default:
      return describe({
        description: `A value of the \`${field.type}\` field type.`,
      });
  }
}

function isRelation(
  field: AnyFieldDefinition,
): field is RelationFieldDefinition {
  return 'target' in field && typeof field.target === 'string';
}

function scalarFields(collection: CollectionDefinition): FieldDefinition[] {
  return (collection.fields ?? []).filter(
    (field): field is FieldDefinition => !isRelation(field),
  );
}

function relationFields(
  collection: CollectionDefinition,
): RelationFieldDefinition[] {
  return (collection.fields ?? []).filter(isRelation);
}

interface FieldSelection {
  readonly fields: ReadonlySet<string>;
  readonly relations: ReadonlySet<string>;
}

function readSelection(
  collection: CollectionDefinition,
  policy: NormalizedRepositoryPolicy | undefined,
): FieldSelection | undefined {
  const all = {
    fields: new Set(scalarFields(collection).map((field) => field.name)),
    relations: new Set(relationFields(collection).map((field) => field.name)),
  };
  if (policy === undefined || policy.read === true) return all;
  if (policy.read === false) return undefined;
  return {
    fields: new Set(policy.read.fields.filter((name) => all.fields.has(name))),
    relations: new Set(
      Object.keys(policy.read.relations).filter((name) =>
        all.relations.has(name),
      ),
    ),
  };
}

function writeSelection(
  collection: CollectionDefinition,
  node:
    | NormalizedRepositoryPolicy['create']
    | NormalizedRepositoryPolicy['update']
    | undefined,
  principalDependent: boolean,
): FieldSelection | undefined {
  const writable = new Set(writableFields(collection));
  const relations = new Set(
    relationFields(collection).map((field) => field.name),
  );
  if (principalDependent || node === true)
    return { fields: writable, relations };
  if (node === false || node === undefined) return undefined;
  return {
    fields: new Set(node.fields.filter((name) => writable.has(name))),
    relations: new Set(
      Object.keys(node.relations).filter((name) => relations.has(name)),
    ),
  };
}

const principalNote =
  " The exposure builds its Policy from the caller, so this lists every field of the Collection; the caller's permissions restrict which of them a request may use.";

interface ExposureSchemas {
  readonly record: SchemaOrRef;
  readonly createValues: SchemaOrRef | undefined;
  readonly updateValues: SchemaOrRef | undefined;
  readonly filter: SchemaOrRef;
  readonly sortableFields: readonly string[];
}

/**
 * The exposure's computed fields as read-only record properties, converted under the document's conventions, with the
 * components their schemas refer to added to `schemas`. A name the Collection also has is left to the Collection: the
 * routes refuse such a declaration when they are created, so this only happens when the Collection gained the field
 * afterwards.
 */
async function computedFieldProperties(
  descriptor: RepositoryEndpointDescriptor,
  collection: CollectionDefinition | undefined,
  schemas: Record<string, SchemaOrRef>,
): Promise<Record<string, SchemaOrRef>> {
  const taken = new Set((collection?.fields ?? []).map((field) => field.name));
  const properties: Record<string, SchemaOrRef> = {};
  for (const [name, schema] of Object.entries(descriptor.computedFields)) {
    if (taken.has(name)) continue;
    let converted: SchemaOrRef;
    if (typeof schema === 'object' && '~standard' in schema) {
      const result = await convertApiSchema(schema, 'output');
      converted = result.schema;
      for (const [key, component] of Object.entries(
        result.components?.schemas ?? {},
      ))
        schemas[key] ??= component;
    } else {
      converted = schema;
    }
    properties[name] = { ...converted, readOnly: true };
  }
  return properties;
}

function computedNote(names: readonly string[]): string {
  if (names.length === 0) return '';
  return ` ${names.map((name) => `\`${name}\``).join(', ')} ${names.length > 1 ? 'are' : 'is'} added by the server to the records it returns rather than stored: never written, selected, filtered or sorted on.`;
}

async function buildExposureSchemas(
  descriptor: RepositoryEndpointDescriptor,
  collection: CollectionDefinition | undefined,
  schemas: Record<string, SchemaOrRef>,
): Promise<ExposureSchemas> {
  const prefix = pascal(descriptor.exposure);
  const principalDependent = descriptor.policy === undefined;
  const note = principalDependent ? principalNote : '';
  const computed = await computedFieldProperties(
    descriptor,
    collection,
    schemas,
  );
  const computedText = computedNote(Object.keys(computed));
  if (!collection) {
    const missing = `The Collection \`${descriptor.collection}\` could not be read when this document was generated, so its fields are not listed.`;
    schemas[`${prefix}Record`] = {
      type: 'object',
      description: `${missing}${computedText}`,
      ...(Object.keys(computed).length > 0 ? { properties: computed } : {}),
      additionalProperties: true,
    };
    return {
      record: ref(`${prefix}Record`),
      createValues: {
        type: 'object',
        description: missing,
        additionalProperties: true,
      },
      updateValues: {
        type: 'object',
        description: missing,
        additionalProperties: true,
      },
      filter: ref('RepositoryFilter'),
      sortableFields: [],
    };
  }
  const byName = new Map(
    (collection.fields ?? []).map((field) => [field.name, field]),
  );
  const readable = readSelection(collection, descriptor.policy) ?? {
    fields: new Set<string>(),
    relations: new Set<string>(),
  };

  const recordProperties: Record<string, SchemaOrRef> = {};
  for (const name of readable.fields) {
    const field = byName.get(name) as FieldDefinition;
    const schema = nullable(fieldValueSchema(field), field);
    recordProperties[name] = isManagedField(collection, field)
      ? { ...schema, readOnly: true }
      : schema;
  }
  for (const name of readable.relations) {
    const relation = byName.get(name) as RelationFieldDefinition;
    const toMany =
      relation.type === 'hasMany' || relation.type === 'belongsToMany';
    const target: SchemaObject = {
      type: 'object',
      additionalProperties: true,
      description: `A related \`${relation.target}\` record.`,
    };
    recordProperties[name] = {
      ...(toMany
        ? { type: 'array', items: target }
        : { anyOf: [target, { type: 'null' }] }),
      description: `The \`${relation.type}\` relation to \`${relation.target}\`. Returned only when \`select\` includes it.`,
    };
  }
  Object.assign(recordProperties, computed);
  schemas[`${prefix}Record`] = {
    type: 'object',
    description: `A \`${collection.name ?? descriptor.collection}\` record as \`${descriptor.exposure}\` returns it. Without \`select\` every listed scalar field is returned.${computedText}${note}`,
    properties: recordProperties,
  };

  const values = (kind: 'create' | 'update'): SchemaOrRef | undefined => {
    const selection = writeSelection(
      collection,
      principalDependent ? undefined : descriptor.policy[kind],
      principalDependent,
    );
    const name = `${prefix}${pascal(kind)}Values`;
    if (!selection) {
      schemas[name] = {
        type: 'object',
        description: `The exposure's Policy refuses every ${kind}.`,
        maxProperties: 0,
      };
      return ref(name);
    }
    const properties: Record<string, SchemaOrRef> = {};
    for (const fieldName of selection.fields) {
      const field = byName.get(fieldName) as FieldDefinition;
      properties[fieldName] = nullable(fieldValueSchema(field), field);
    }
    for (const relationName of selection.relations) {
      properties[relationName] = ref('RepositoryRelationMutation');
    }
    const required =
      kind === 'create'
        ? [...selection.fields].filter((fieldName) => {
            const field = byName.get(fieldName) as FieldDefinition;
            return (
              (field.nullable === false || field.primaryKey === true) &&
              field.defaultValue === undefined &&
              !(
                descriptor.policy &&
                descriptor.policy.create !== true &&
                descriptor.policy.create !== false &&
                Object.hasOwn(descriptor.policy.create.defaults, fieldName)
              )
            );
          })
        : [];
    schemas[name] = {
      type: 'object',
      description: `The fields a ${kind} may write. Fields the database or the Repository assigns, such as an auto-increment key or the optimistic-lock version, are never written.${note}`,
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false,
    };
    return ref(name);
  };

  const filterable = scalarFields(collection).filter((field) =>
    readable.fields.has(field.name),
  );
  const shorthandProperties: Record<string, SchemaOrRef> = {};
  const conditions: SchemaOrRef[] = [];
  for (const field of filterable) {
    const value = fieldValueSchema(field);
    if (supportsFilterShorthand(field.type)) {
      shorthandProperties[field.name] = { anyOf: [value, { type: 'null' }] };
    }
    const operators = filterOperatorsForFieldType(field.type);
    if (!operators) continue;
    conditions.push({
      type: 'object',
      title: field.name,
      description: `A condition on \`${field.name}\` (\`${field.type}\`).`,
      required: ['kind', 'path', 'operator'],
      properties: {
        kind: { const: 'condition' },
        path: {
          type: 'array',
          items: { const: field.name },
          minItems: 1,
          maxItems: 1,
        },
        operator: { type: 'string', enum: [...operators] },
        value: {
          anyOf: [
            value,
            { type: 'array', items: value },
            { type: 'null' },
            ref('RepositoryFilterVariable'),
          ],
        },
        ...(field.type === 'json'
          ? {
              jsonPath: {
                type: 'array',
                items: {
                  anyOf: [{ type: 'string' }, { type: 'integer', minimum: 0 }],
                },
              },
            }
          : {}),
        ...(['string', 'char', 'uuid', 'text'].includes(field.type)
          ? { mode: { type: 'string', enum: ['default', 'insensitive'] } }
          : {}),
      },
      additionalProperties: false,
    });
  }
  schemas[`${prefix}FilterCondition`] = {
    description: `A condition on a field of \`${descriptor.exposure}\`, on a field reached through to-one relations (\`RepositoryFilterCondition\`), or on related records (\`RepositoryFilterRelation\`).`,
    anyOf: [
      ...conditions,
      ref('RepositoryFilterCondition'),
      ref('RepositoryFilterRelation'),
    ],
  };
  schemas[`${prefix}FilterGroup`] = {
    type: 'object',
    required: ['kind', 'logic', 'items'],
    properties: {
      kind: { const: 'group' },
      logic: { type: 'string', enum: ['and', 'or'] },
      items: {
        type: 'array',
        items: {
          anyOf: [ref(`${prefix}FilterGroup`), ref(`${prefix}FilterCondition`)],
        },
      },
    },
    additionalProperties: false,
  };
  schemas[`${prefix}Filter`] = {
    description: `A filter on \`${descriptor.exposure}\`: the shorthand over its fields, or a Filter AST. The grammar, the operators of each field type and the relation and JSON conditions are described in \`RepositoryFilter\`.${note}`,
    anyOf: [
      {
        type: 'object',
        title: 'Shorthand',
        properties: shorthandProperties,
        additionalProperties: false,
        minProperties: 1,
      },
      {
        type: 'object',
        title: 'AST',
        required: ['kind', 'version', 'root'],
        properties: {
          kind: { const: 'filter' },
          version: { const: 1 },
          collection: { const: collection.name ?? descriptor.collection },
          root: ref(`${prefix}FilterGroup`),
        },
        additionalProperties: false,
      },
    ],
  };
  return {
    record: ref(`${prefix}Record`),
    createValues: values('create'),
    updateValues: values('update'),
    filter: ref(`${prefix}Filter`),
    sortableFields: filterable
      .filter((field) => isSortableFieldType(field.type))
      .map((field) => field.name),
  };
}

function data(schema: SchemaOrRef): SchemaObject {
  return { type: 'object', required: ['data'], properties: { data: schema } };
}

function jsonContent(
  schema: SchemaOrRef,
): OpenAPIV3_1.ResponseObject['content'] {
  return { 'application/json': { schema } };
}

const errorRef = (name: string): OpenAPIV3_1.ReferenceObject => ({
  $ref: `#/components/responses/${name}`,
});

function buildOperation(
  descriptor: RepositoryEndpointDescriptor,
  exposure: ExposureSchemas,
  base: OpenAPIV3_1.OperationObject,
): OpenAPIV3_1.OperationObject {
  const properties: Record<string, SchemaOrRef> = {};
  const required: string[] = [];
  const action = descriptor.action;
  const sortDescription = exposure.sortableFields.length
    ? ` Sortable fields: ${exposure.sortableFields.map((name) => `\`${name}\``).join(', ')}.`
    : '';
  const option: Record<string, () => SchemaOrRef> = {
    filter: () => exposure.filter,
    select: () => ref('RepositorySelect'),
    sort: () => ({
      allOf: [ref('RepositorySort')],
      description: `The order of results.${sortDescription}`,
    }),
    distinct: () => ({
      description:
        'Fields whose combination keeps one representative row each, such as `["status"]`.',
    }),
    limit: () => ({
      type: 'integer',
      minimum: 0,
      maximum: descriptor.maxLimit,
      default: descriptor.maxLimit,
      description: `How many records to return, at most ${descriptor.maxLimit}.`,
    }),
    offset: () => ({
      type: 'integer',
      minimum: 0,
      description: 'How many records to skip. Exclusive with `cursor`.',
    }),
    cursor: () => ({
      type: 'object',
      additionalProperties: true,
      description:
        'The sort values of the record to continue after, one per sort field including the appended primary key, such as `{ "id": "42" }`. Requires an explicit `sort` on non-nullable fields; exclusive with `offset`.',
    }),
    direction: () => ({
      type: 'string',
      enum: ['forward', 'backward'],
      description:
        'Which side of `cursor` to read. `backward` still returns records in `sort` order.',
    }),
    values: () =>
      (action === 'createOne'
        ? exposure.createValues
        : exposure.updateValues) ?? {
        type: 'object',
      },
    ifVersion: () => ({
      anyOf: [{ type: 'string' }, { type: 'integer' }],
      description:
        'Apply only if the record still has this optimistic-lock version; otherwise the request fails with 409 `VERSION_CONFLICT`.',
    }),
    aggregate: () => ({
      type: 'object',
      additionalProperties: true,
      description:
        'Named aggregates, such as `{ "total": { "sum": "amount" }, "orders": { "count": true } }`.',
    }),
    by: () => ({
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      description: 'The fields to group by.',
    }),
    having: () => ({
      type: 'object',
      additionalProperties: true,
      description: 'A filter on the aggregates of each group.',
    }),
  };
  const accepted: Record<RepositoryApiAction, readonly string[]> = {
    findMany: [
      'filter',
      'select',
      'sort',
      'distinct',
      'limit',
      'offset',
      'cursor',
      'direction',
    ],
    findOne: ['filter', 'select', 'sort'],
    count: ['filter'],
    aggregate: ['filter', 'aggregate'],
    groupBy: ['by', 'filter', 'aggregate', 'having', 'sort'],
    exists: ['filter'],
    createOne: ['values', 'select'],
    updateOne: ['filter', 'values', 'select', 'ifVersion'],
    deleteOne: ['filter', 'select', 'ifVersion'],
  };
  for (const name of accepted[action]) properties[name] = option[name]();
  if (['findOne', 'updateOne', 'deleteOne'].includes(action))
    required.push('filter');
  if (['createOne', 'updateOne'].includes(action)) required.push('values');
  if (action === 'aggregate' || action === 'groupBy')
    required.push('aggregate');
  if (action === 'groupBy') required.push('by');

  const mutation = (record: SchemaOrRef): SchemaObject => ({
    type: 'object',
    required: ['record', 'createdTargets'],
    properties: {
      record,
      createdTargets: { type: 'array', items: ref('RepositoryCreatedTarget') },
      version: { anyOf: [{ type: 'string' }, { type: 'integer' }] },
    },
  });
  const results: Record<RepositoryApiAction, SchemaOrRef> = {
    findMany: { type: 'array', items: exposure.record },
    findOne: { anyOf: [exposure.record, { type: 'null' }] },
    count: { type: 'integer', minimum: 0 },
    exists: { type: 'boolean' },
    aggregate: {
      type: 'object',
      additionalProperties: true,
      description:
        'One value per named aggregate. Integers beyond the safe range are strings.',
    },
    groupBy: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
      description:
        'One row per group: the `by` fields and the named aggregates. Integers beyond the safe range are strings.',
    },
    createOne: mutation(exposure.record),
    updateOne: mutation(exposure.record),
    deleteOne: {
      type: 'object',
      required: ['deleted'],
      properties: {
        deleted: { const: true },
        record: {
          allOf: [exposure.record],
          description: 'The deleted record, when `select` asks for it.',
        },
      },
    },
  };
  const success: OpenAPIV3_1.ResponseObject = {
    description:
      action === 'findMany'
        ? 'The records. With `Accept: application/x-ndjson` the records stream instead, one JSON frame per line: `{"type":"record","data":{...}}` for each record, then `{"type":"end"}`, or `{"type":"error","error":{...}}` if the read fails after the stream has started. Errors detected before the first frame answer with the standard error body.'
        : 'Success.',
    content: {
      ...jsonContent(data(results[action])),
      ...(action === 'findMany'
        ? {
            'application/x-ndjson': {
              schema: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string', enum: ['record', 'end', 'error'] },
                  data: exposure.record,
                  error: ref('ApiErrorPayload'),
                },
              },
            },
          }
        : {}),
    },
  };
  return {
    ...base,
    description: `\`${descriptor.exposure}\` exposes the \`${descriptor.collection}\` Collection. The body accepts only the options listed; any other option is refused with 400 \`UNSUPPORTED_REPOSITORY_OPTION\`.`,
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties,
            ...(required.length > 0 ? { required } : {}),
            additionalProperties: false,
          },
        },
      },
    },
    responses: {
      '200': success,
      '400': errorRef('BadRequest'),
      '403': errorRef('PermissionDenied'),
      ...(['findOne', 'updateOne', 'deleteOne'].includes(action)
        ? { '404': errorRef('NotFound') }
        : {}),
      ...(action === 'updateOne' || action === 'deleteOne'
        ? { '409': errorRef('Conflict') }
        : {}),
      '413': errorRef('PayloadTooLarge'),
      '415': errorRef('UnsupportedMediaType'),
      '500': errorRef('InternalError'),
    },
  };
}

const methods = ['get', 'put', 'post', 'delete', 'patch'] as const;

/**
 * Replace each data endpoint's placeholder declaration in `document` with its operation: per-field record, `values`
 * and filter schemas read from the Collection, and the shared Repository components.
 */
export async function expandRepositoryOperations(
  document: OpenAPIV3_1.Document,
): Promise<void> {
  const pending: {
    readonly operation: OpenAPIV3_1.OperationObject & Record<string, unknown>;
    readonly descriptor: RepositoryEndpointDescriptor;
    readonly assign: (operation: OpenAPIV3_1.OperationObject) => void;
  }[] = [];
  for (const item of Object.values(document.paths ?? {})) {
    if (!item) continue;
    for (const method of methods) {
      const operation = item[method] as
        (OpenAPIV3_1.OperationObject & Record<string, unknown>) | undefined;
      const descriptor = operation?.[repositoryExtension] as
        RepositoryEndpointDescriptor | undefined;
      if (!operation || !descriptor) continue;
      pending.push({
        operation,
        descriptor,
        assign: (built) => {
          (item as Record<string, unknown>)[method] = built;
        },
      });
    }
  }
  if (pending.length === 0) return;
  const components = (document.components ??= {});
  const schemas = (components.schemas ??= {}) as Record<string, SchemaOrRef>;
  Object.assign(schemas, sharedRepositorySchemas());
  const exposures = new Map<string, Promise<ExposureSchemas>>();
  for (const { operation, descriptor, assign } of pending) {
    let exposure = exposures.get(descriptor.exposure);
    if (!exposure) {
      exposure = descriptor
        .loadCollection()
        .catch(() => undefined)
        .then((collection) =>
          buildExposureSchemas(descriptor, collection, schemas),
        );
      exposures.set(descriptor.exposure, exposure);
    }
    const { [repositoryExtension]: _descriptor, ...base } = operation;
    assign(buildOperation(descriptor, await exposure, base));
  }
}
