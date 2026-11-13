import type { OpenAPIV3_1 } from 'openapi-types';

import type { ApiDocument } from '../openapi/document.js';
import type { CliCommand, CliIdempotency } from './types.js';

type ObjectValue = Record<string, unknown>;
const marker = 'x-idempotency';
const own = (value: ObjectValue, key: string) => Object.hasOwn(value, key);
const fail = (message: string): never => {
  throw new Error(`Invalid CLI idempotency declaration: ${message}`);
};

/** Resolve local references with siblings, refusing cycles and conflicting semantic declarations. */
function schemaParts(
  document: ApiDocument,
  value: unknown,
  seen: ReadonlySet<string> = new Set(),
): ObjectValue[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return fail('a parameter must have an object schema');
  const node = value as ObjectValue;
  const parts: ObjectValue[] = [];
  if (own(node, '$ref')) {
    const ref = node.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/') || seen.has(ref))
      return fail('unresolved, external or cyclic schema reference');
    let target: unknown = document;
    for (const key of ref.slice(2).split('/')) {
      const decoded = key.replaceAll('~1', '/').replaceAll('~0', '~');
      target =
        target && typeof target === 'object' && Object.hasOwn(target, decoded)
          ? (target as ObjectValue)[decoded]
          : undefined;
    }
    if (target === undefined) return fail('unresolved schema reference');
    parts.push(...schemaParts(document, target, new Set([...seen, ref])));
  }
  if (own(node, 'allOf')) {
    if (!Array.isArray(node.allOf) || node.allOf.length === 0)
      return fail('allOf must have branches');
    for (const branch of node.allOf)
      parts.push(...schemaParts(document, branch, seen));
  }
  parts.push(node);
  return parts;
}

function hasMarker(
  document: ApiDocument,
  value: unknown,
  seen = new Set<string>(),
): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value))
    return value.some((child) => hasMarker(document, child, seen));
  const node = value as ObjectValue;
  if (own(node, marker) && node[marker] !== false) return true;
  if (
    typeof node.$ref === 'string' &&
    node.$ref.startsWith('#/') &&
    !seen.has(node.$ref)
  ) {
    seen.add(node.$ref);
    let target: unknown = document;
    for (const key of node.$ref.slice(2).split('/'))
      target =
        target && typeof target === 'object'
          ? (target as ObjectValue)[
              key.replaceAll('~1', '/').replaceAll('~0', '~')
            ]
          : undefined;
    if (hasMarker(document, target, seen)) return true;
  }
  const children = [
    'allOf',
    'anyOf',
    'oneOf',
    'not',
    'if',
    'then',
    'else',
    'items',
    'prefixItems',
    'contains',
    'additionalProperties',
    'unevaluatedProperties',
    'propertyNames',
  ];
  if (children.some((key) => hasMarker(document, node[key], seen))) return true;
  return ['properties', 'patternProperties', 'dependentSchemas'].some((key) => {
    const entries = node[key];
    return (
      entries &&
      typeof entries === 'object' &&
      Object.values(entries).some((child) => hasMarker(document, child, seen))
    );
  });
}

const reserved = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'host',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'content-type',
  'content-encoding',
  'content-disposition',
  'accept',
  'accept-encoding',
  'expect',
  'origin',
  'referer',
  'user-agent',
  'range',
  'if-match',
  'if-none-match',
  'if-modified-since',
  'if-unmodified-since',
  'if-range',
  'x-http-method-override',
  'x-method-override',
  'dnt',
  'via',
  'date',
  'x-api-key',
  'x-run-token',
  'x-request-id',
  'forwarded',
]);

function safeHeader(document: ApiDocument, name: string): string {
  const lower = name.toLowerCase();
  if (
    !/^[!#$%&'*+.^_`|~0-9a-z-]+$/u.test(lower) ||
    reserved.has(lower) ||
    /^(?:x-nocobase-|x-nb-|sec-|proxy-|x-forwarded-|access-control-request-)/u.test(
      lower,
    )
  )
    return fail('reserved or invalid header name');
  for (const value of Object.values(
    document.components?.securitySchemes ?? {},
  )) {
    const scheme = Object.assign(
      {},
      ...schemaParts(document, value),
    ) as unknown as OpenAPIV3_1.SecuritySchemeObject;
    if (
      scheme.type === 'apiKey' &&
      scheme.in === 'header' &&
      scheme.name.toLowerCase() === lower
    )
      return fail('an authentication header cannot be an operation key');
  }
  return lower;
}

/** Ordinary headers remain ignored. Only an explicit schema marker enables the dedicated mechanism. */
export function deriveCliIdempotency(
  document: ApiDocument,
  method: string,
  parameters: readonly OpenAPIV3_1.ParameterObject[],
): CliIdempotency | undefined {
  let result: CliIdempotency | undefined;
  for (const parameter of parameters) {
    if (own(parameter as unknown as ObjectValue, marker))
      return fail(
        'put x-idempotency on the parameter schema, not the parameter',
      );
    if (
      Object.values(parameter.content ?? {}).some((media) =>
        hasMarker(document, media.schema),
      )
    )
      return fail(
        'operation-key parameters must declare schema rather than content',
      );
    if (!hasMarker(document, parameter.schema)) continue;
    const parts = schemaParts(document, parameter.schema);
    const marks = parts
      .filter((part) => own(part, marker))
      .map((part) => part[marker]);
    if (marks.some((value) => value !== true && value !== false))
      return fail('x-idempotency must be true or false');
    if (!marks.includes(true))
      return fail('a marker inside an unsupported composition is ambiguous');
    if (marks.includes(false)) return fail('conflicting x-idempotency markers');
    if (parameter.in !== 'header')
      return fail('only header parameters may be marked');
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()))
      return fail('read methods cannot declare an operation key');
    if (result) return fail('only one operation key is allowed per operation');
    if (
      parameter.required !== true ||
      parameter.content ||
      (parameter.style && parameter.style !== 'simple') ||
      parameter.explode === true
    )
      return fail(
        'the marked header must be required and use simple string serialization',
      );
    const allowed = new Set([
      '$ref',
      'allOf',
      'type',
      'minLength',
      'maxLength',
      'title',
      'description',
      'examples',
      'example',
      'deprecated',
      marker,
    ]);
    let stringType = false;
    let minLength = 1;
    let maxLength: number | undefined;
    for (const part of parts) {
      for (const key of Object.keys(part))
        if (!allowed.has(key))
          return fail(`unsupported operation-key schema keyword: ${key}`);
      if (part.type !== undefined) {
        if (part.type !== 'string')
          return fail('the operation key must be a non-null string');
        stringType = true;
      }
      for (const key of ['minLength', 'maxLength'] as const) {
        const value = part[key];
        if (value === undefined) continue;
        if (!Number.isSafeInteger(value) || (value as number) < 0)
          return fail(`invalid ${key}`);
        if (key === 'minLength')
          minLength = Math.max(minLength, value as number);
        else maxLength = Math.min(maxLength ?? Infinity, value as number);
      }
    }
    if (!stringType || minLength > 50 || (maxLength ?? Infinity) < 50)
      return fail(
        'the schema must accept a 50-character timestamp.UUID operation key',
      );
    if (
      parameters.filter(
        (candidate) =>
          candidate.in === 'header' &&
          candidate.name.toLowerCase() === parameter.name.toLowerCase(),
      ).length !== 1
    )
      return fail('duplicate header parameters');
    result = {
      header: safeHeader(document, parameter.name),
      flag: 'operation-key',
      minLength,
      ...(maxLength === undefined ? {} : { maxLength }),
    };
  }
  return result;
}

/** Refuse unsupported multi-request flows and ambiguous flag names before publishing any command. */
export function validateCliIdempotencyCommand(command: CliCommand): void {
  if (!command.idempotency) return;
  if (
    command.readBinding ||
    command.parameters.some(
      (parameter) => parameter.upload || parameter.ticket || parameter.changed,
    )
  )
    return fail('operation keys support only a single target request');
  const names = command.parameters.flatMap((parameter) => [
    parameter.name,
    parameter.alias,
    ...(parameter.contentFile ? [`${parameter.name}-file`] : []),
  ]);
  if (
    [...names, command.body?.file].some(
      (name) => name?.toLowerCase() === 'operation-key',
    )
  )
    return fail('--operation-key conflicts with an existing parameter');
}

/** Body/file metadata is never interpreted as header metadata. */
export function rejectBodyIdempotency(
  document: ApiDocument,
  body: unknown,
): void {
  if (!body || typeof body !== 'object') return;
  const content = (body as OpenAPIV3_1.RequestBodyObject).content;
  if (
    Object.values(content ?? {}).some((media) =>
      hasMarker(document, media.schema),
    )
  )
    return fail('only header parameter schemas may declare x-idempotency');
}
