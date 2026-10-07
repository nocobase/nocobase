import { createHash } from 'node:crypto';

import type { OpenAPIV3_1 } from 'openapi-types';

import type { ApiDocument } from '../openapi/document.js';
import type { RepositoryApiAction } from '../repository-routes.js';
import {
  CLI_EXTENSION,
  CLI_MANIFEST_VERSION,
  type CliCaller,
  type CliCommand,
  type CliExclusion,
  type CliIdentity,
  type CliManifest,
  type CliOutputKind,
  type CliParameter,
  type CliRouteOptions,
  type CliWithheldCommand,
} from './types.js';

type Schema = OpenAPIV3_1.SchemaObject;
type SchemaOrRef = OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject;
type Operation = OpenAPIV3_1.OperationObject & {
  readonly [CLI_EXTENSION]?: CliRouteOptions | false;
};

export interface DeriveCliCommandsOptions {
  /**
   * The security schemes that name an identity: an operation whose requirements name one is offered to that identity.
   * `cookieAuth` and `apiKeyAuth` name a person by default.
   */
  readonly identitySchemes?: Readonly<Record<string, CliIdentity>>;
  /** Operations left out, as if their `x-cli` were `false`. */
  readonly exclude?: readonly CliExclusion[];
}

function excluded(
  exclusions: readonly CliExclusion[],
  path: string,
  operation: Operation,
): boolean {
  const tag = operation.tags?.[0];
  return exclusions.some(
    (rule) =>
      (tag !== undefined && rule.tags?.includes(tag)) ||
      rule.paths?.some((prefix) => path.startsWith(prefix)) ||
      (operation.operationId !== undefined &&
        rule.operationIds?.includes(operation.operationId)),
  );
}

const DEFAULT_IDENTITY_SCHEMES: Readonly<Record<string, CliIdentity>> = {
  cookieAuth: 'person',
  apiKeyAuth: 'person',
};

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

const REPOSITORY_ACTIONS: ReadonlySet<string> = new Set<RepositoryApiAction>([
  'findMany',
  'findOne',
  'count',
  'aggregate',
  'groupBy',
  'exists',
  'createOne',
  'updateOne',
  'deleteOne',
]);

/** `issueId` → `issue-id`, `AiEmployee` → `ai-employee`. */
export function kebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1-$2')
    .replace(/[^A-Za-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .toLowerCase();
}

function isParam(segment: string): boolean {
  return segment.startsWith('{') && segment.endsWith('}');
}

function sameNoun(segment: string, noun: string): boolean {
  const word = kebabCase(segment);
  return word === noun || word === `${noun}s` || `${word}s` === noun;
}

/**
 * The command words derived from an operation's tag, path and method. A `POST` to a path that ends in a literal after
 * a parameter is a custom method (`POST /issues/{id}/close` → `close`), unless the path is a collection, which
 * `collections` names by having a `GET` on it (`POST /issues/{id}/comments` → `comments create`).
 */
export function deriveCommandWords(
  method: string,
  path: string,
  tag: string | undefined,
  collections: ReadonlySet<string> = new Set(),
): string[] {
  const segments = path
    .replace(/^\/api\/?/u, '')
    .split('/')
    .filter((segment) => segment !== '');
  const literal = segments.filter((segment) => !isParam(segment));
  const noun = kebabCase(tag ?? literal[0] ?? 'api') || 'api';
  const nouns = [...literal];
  if (nouns[0] !== undefined && sameNoun(nouns[0], noun)) nouns.shift();
  const last = segments.at(-1);
  let verb: string;
  switch (method) {
    case 'get':
      verb = last !== undefined && isParam(last) ? 'get' : 'list';
      break;
    case 'put':
      verb = 'set';
      break;
    case 'patch':
      verb = 'update';
      break;
    case 'delete':
      verb = 'delete';
      break;
    default: {
      const beforeLast = segments.at(-2);
      const custom =
        last !== undefined &&
        !isParam(last) &&
        nouns.length > 0 &&
        !collections.has(path) &&
        ((beforeLast !== undefined && isParam(beforeLast)) ||
          (segments.length === 2 && REPOSITORY_ACTIONS.has(last)));
      if (custom) {
        nouns.pop();
        verb = kebabCase(last);
      } else verb = 'create';
    }
  }
  return [noun, ...nouns.map(kebabCase), verb].filter((word) => word !== '');
}

function resolve<T extends object>(
  document: ApiDocument,
  value: T | OpenAPIV3_1.ReferenceObject | undefined,
): T | undefined {
  let current: unknown = value;
  for (let depth = 0; depth < 10; depth += 1) {
    if (!current || typeof current !== 'object' || !('$ref' in current))
      return current as T | undefined;
    const ref = (current as OpenAPIV3_1.ReferenceObject).$ref;
    if (!ref.startsWith('#/')) return undefined;
    current = ref
      .slice(2)
      .split('/')
      .reduce<unknown>(
        (node, key) =>
          node && typeof node === 'object'
            ? (node as Record<string, unknown>)[
                key.replaceAll('~1', '/').replaceAll('~0', '~')
              ]
            : undefined,
        document,
      );
  }
  return undefined;
}

function typesOf(schema: Schema): string[] {
  const type = schema.type as string | string[] | undefined;
  if (Array.isArray(type)) return type.filter((item) => item !== 'null');
  return type ? [type] : [];
}

interface ScalarShape {
  readonly type: CliParameter['type'];
  readonly enum?: readonly string[];
  readonly binary?: boolean;
}

function shapeOf(
  document: ApiDocument,
  value: SchemaOrRef | undefined,
): ScalarShape {
  const schema = resolve<Schema>(document, value);
  if (!schema) return { type: 'json' };
  const branches = [...(schema.anyOf ?? []), ...(schema.oneOf ?? [])]
    .map((branch) => resolve<Schema>(document, branch))
    .filter(
      (branch): branch is Schema =>
        branch !== undefined &&
        !(
          branch.type === 'null' ||
          (Array.isArray(branch.type) && typesOf(branch).length === 0)
        ),
    );
  if (branches.length > 0) {
    if (branches.length === 1) return shapeOf(document, branches[0]);
    const shapes = branches.map((branch) => shapeOf(document, branch));
    if (shapes.every((shape) => shape.type === 'string')) {
      const values = shapes.flatMap((shape) => shape.enum ?? []);
      return {
        type: 'string',
        ...(shapes.every((shape) => shape.enum) ? { enum: values } : {}),
      };
    }
    return { type: 'json' };
  }
  const types = typesOf(schema);
  const enumValues = Array.isArray(schema.enum)
    ? schema.enum.filter((item): item is string => typeof item === 'string')
    : undefined;
  if (types.length === 0 && schema.const !== undefined)
    return typeof schema.const === 'string'
      ? { type: 'string', enum: [schema.const] }
      : { type: 'json' };
  if (types.length === 0 && enumValues?.length)
    return { type: 'string', enum: enumValues };
  if (types.length !== 1) return { type: 'json' };
  switch (types[0]) {
    case 'string':
      // A query flag spelled `true` or `false` is a boolean on the command line.
      if (
        enumValues?.length === 2 &&
        enumValues.includes('true') &&
        enumValues.includes('false')
      )
        return { type: 'boolean' };
      return {
        type: 'string',
        ...(enumValues?.length ? { enum: enumValues } : {}),
        ...(schema.format === 'binary' ||
        schema.contentMediaType === 'application/octet-stream'
          ? { binary: true }
          : {}),
      };
    case 'number':
    case 'integer':
    case 'boolean':
      return { type: types[0] };
    case 'array': {
      const item = shapeOf(
        document,
        (schema as OpenAPIV3_1.ArraySchemaObject).items,
      );
      if (item.type === 'string')
        return {
          type: 'string[]',
          ...(item.enum ? { enum: item.enum } : {}),
          ...(item.binary ? { binary: true } : {}),
        };
      if (item.type === 'number' || item.type === 'integer')
        return { type: 'number[]' };
      return { type: 'json' };
    }
    default:
      return { type: 'json' };
  }
}

function descriptionOf(
  document: ApiDocument,
  value: SchemaOrRef | undefined,
): string | undefined {
  if (!value) return undefined;
  if ('$ref' in value) {
    const own = (value as { description?: unknown }).description;
    if (typeof own === 'string') return own;
  }
  return resolve<Schema>(document, value)?.description;
}

function identitiesOf(
  document: ApiDocument,
  operation: Operation,
  schemes: Readonly<Record<string, CliIdentity>>,
): CliIdentity[] {
  const requirements = operation.security ?? document.security;
  // A route that takes no credential (signing in, a webhook, a health check) is a person's to call: a run is offered
  // only what names its own credential.
  if (!requirements || requirements.length === 0) return ['person'];
  const found = new Set<CliIdentity>();
  for (const requirement of requirements) {
    const names = Object.keys(requirement);
    if (names.length === 0) found.add('person');
    for (const name of names) {
      const identity = schemes[name];
      if (identity) found.add(identity);
    }
  }
  return found.size > 0 ? [...found].sort() : ['person'];
}

function outputOf(
  document: ApiDocument,
  operation: Operation,
): CliCommand['output']['kind'] {
  const responses = operation.responses ?? {};
  for (const status of ['200', '201', '202', '204']) {
    const response = resolve<OpenAPIV3_1.ResponseObject>(
      document,
      responses[status] as OpenAPIV3_1.ResponseObject | undefined,
    );
    if (!response) continue;
    const content = response.content ?? {};
    const media = Object.keys(content);
    if (media.length === 0) return 'empty';
    const json = content['application/json'];
    if (!json) return 'download';
    const schema = resolve<Schema>(document, json.schema);
    const data = resolve<Schema>(document, schema?.properties?.data);
    if (data && schema?.properties?.meta && typesOf(data).includes('array'))
      return 'list';
    return 'data';
  }
  return 'data';
}

function operationsById(
  document: ApiDocument,
): Map<string, { readonly method: string; readonly path: string }> {
  const result = new Map<string, { method: string; path: string }>();
  for (const [path, item] of Object.entries(document.paths ?? {}))
    for (const method of METHODS) {
      const operation = item?.[method];
      if (operation?.operationId)
        result.set(operation.operationId, { method, path });
    }
  return result;
}

function basePathOf(document: ApiDocument): string {
  const url = document.servers?.[0]?.url ?? '';
  if (!url.startsWith('/')) return '';
  return url.replace(/\/+$/u, '');
}

interface Derived {
  readonly command: CliCommand;
  readonly explicit: boolean;
  readonly words: readonly string[];
  readonly fallback: readonly string[];
}

function deriveOne(
  document: ApiDocument,
  path: string,
  method: (typeof METHODS)[number],
  operation: Operation,
  schemes: Readonly<Record<string, CliIdentity>>,
  operations: ReturnType<typeof operationsById>,
  collections: ReadonlySet<string>,
): Derived | undefined {
  const hint = operation[CLI_EXTENSION];
  if (hint === false || hint?.hidden) return undefined;
  const options: CliRouteOptions = hint ?? {};
  const tag = operation.tags?.[0];
  const explicit = options.command
    ?.trim()
    .split(/\s+/u)
    .map((word) => kebabCase(word))
    .filter(Boolean);
  const words = explicit?.length
    ? explicit
    : deriveCommandWords(method, path, tag, collections);
  const noun = words[0] ?? 'api';
  const fallback = operation.operationId
    ? [noun, kebabCase(operation.operationId)]
    : [...words, method];

  const flagHints = options.flags ?? {};
  const inputs: Omit<CliParameter, 'name' | 'position'>[] = [];
  const parameters = (operation.parameters ?? [])
    .map((parameter) =>
      resolve<OpenAPIV3_1.ParameterObject>(document, parameter),
    )
    .filter(
      (parameter): parameter is OpenAPIV3_1.ParameterObject =>
        parameter !== undefined &&
        (parameter.in === 'path' || parameter.in === 'query'),
    );
  for (const parameter of parameters) {
    const shape = shapeOf(document, parameter.schema);
    const schema = resolve<Schema>(document, parameter.schema);
    inputs.push({
      field: parameter.name,
      in: parameter.in as 'path' | 'query',
      type: shape.type,
      required: parameter.in === 'path' || parameter.required === true,
      ...(parameter.description || descriptionOf(document, parameter.schema)
        ? {
            description:
              parameter.description ??
              descriptionOf(document, parameter.schema),
          }
        : {}),
      ...(shape.enum ? { enum: shape.enum } : {}),
      ...(schema?.default !== undefined ? { default: schema.default } : {}),
    });
  }

  let body: CliCommand['body'];
  const requestBody = resolve<OpenAPIV3_1.RequestBodyObject>(
    document,
    operation.requestBody,
  );
  const uploads = options.uploads ?? {};
  const uploadFields = new Set([
    ...Object.values(uploads).map((upload) => upload.field),
    ...(options.changedFiles ? [options.changedFiles.field] : []),
  ]);
  if (requestBody) {
    const media = requestBody.content['application/json']
      ? 'application/json'
      : requestBody.content['multipart/form-data']
        ? 'multipart/form-data'
        : undefined;
    if (media) {
      const schema = resolve<Schema>(
        document,
        requestBody.content[media]?.schema,
      );
      const properties = schema?.properties ?? {};
      const required = new Set(schema?.required ?? []);
      // A body without fields is given whole from a file, unless it allows none: an empty strict body is sent as `{}`.
      const file =
        options.bodyFile ??
        (Object.keys(properties).length === 0 &&
        schema?.additionalProperties !== false
          ? 'body'
          : undefined);
      body = {
        media,
        ...(file ? { file } : {}),
        ...(requestBody.required ? { required: true } : {}),
      };
      for (const [field, value] of Object.entries(properties)) {
        if (uploadFields.has(field)) continue;
        const shape = shapeOf(document, value);
        const property = resolve<Schema>(document, value);
        if (property?.readOnly) continue;
        const description = descriptionOf(document, value);
        inputs.push({
          field,
          in: 'body',
          type: shape.type,
          required: !file && required.has(field),
          ...(description ? { description } : {}),
          ...(shape.enum ? { enum: shape.enum } : {}),
          ...(property?.default !== undefined
            ? { default: property.default }
            : {}),
          ...(shape.binary
            ? { binary: true, multiple: shape.type === 'string[]' }
            : {}),
        });
      }
    }
  }

  const positional =
    options.args ??
    parameters
      .filter((parameter) => parameter.in === 'path')
      .map((parameter) => parameter.name);
  const result: CliParameter[] = [];
  for (const input of inputs) {
    const flag = flagHints[input.field] ?? {};
    if (flag.hidden && !input.required) continue;
    const position = positional.indexOf(input.field);
    const name =
      flag.name ?? (position >= 0 ? input.field : kebabCase(input.field));
    result.push({
      ...input,
      name,
      ...(position >= 0 ? { position } : {}),
      ...(flag.description ? { description: flag.description } : {}),
      ...(flag.alias ? { alias: flag.alias } : {}),
      ...(flag.contentFile ? { contentFile: true } : {}),
      ...(flag.prompt ? { prompt: true } : {}),
      ...(flag.fromEnv ? { fromEnv: flag.fromEnv } : {}),
      ...(flag.env?.length ? { env: flag.env } : {}),
    });
  }
  if (options.ticketUpload) {
    const { flag, maxBytes, accept, description, optional } =
      options.ticketUpload;
    // An optional file's name fills the body field named like the flag: it is no flag of its own.
    if (optional) {
      const index = result.findIndex(
        (parameter) => parameter.in === 'body' && parameter.field === flag,
      );
      if (index >= 0) result.splice(index, 1);
    }
    result.push({
      name: flag,
      field: flag,
      in: 'file',
      type: 'string',
      required: !optional,
      ...(description ? { description } : {}),
      ticket: {
        maxBytes,
        ...(accept?.length ? { accept } : {}),
        ...(optional ? { optional: true } : {}),
      },
    });
  }
  if (options.changedFiles) {
    const { flag, field, description, ...changed } = options.changedFiles;
    result.push({
      name: flag,
      field,
      in: 'file',
      type: 'boolean',
      required: false,
      ...(description ? { description } : {}),
      changed: {
        dir: changed.dir,
        manifest: changed.manifest,
        maxBytes: changed.maxBytes,
        maxFiles: changed.maxFiles,
        ...(changed.accept?.length ? { accept: changed.accept } : {}),
      },
    });
  }
  for (const [flag, upload] of Object.entries(uploads)) {
    const target = operations.get(upload.upload);
    if (!target) continue;
    result.push({
      name: flag,
      field: upload.field,
      in: 'file',
      type: upload.multiple ? 'string[]' : 'string',
      required: false,
      ...(upload.description ? { description: upload.description } : {}),
      upload: {
        method: target.method.toUpperCase(),
        path: `${basePathOf(document)}${target.path}`,
        part: upload.part ?? 'file',
        field: upload.field,
        multiple: upload.multiple ?? false,
        ...(upload.maxBytes ? { maxBytes: upload.maxBytes } : {}),
      },
    });
  }
  result.sort(
    (a, b) =>
      (a.position ?? Number.MAX_SAFE_INTEGER) -
      (b.position ?? Number.MAX_SAFE_INTEGER),
  );

  const output: CliOutputKind = outputOf(document, operation);
  const command: CliCommand = {
    id: words.join(':'),
    summary: operation.summary ?? operation.operationId ?? words.join(' '),
    ...(operation.description ? { description: operation.description } : {}),
    ...(operation.operationId ? { operationId: operation.operationId } : {}),
    method: method.toUpperCase() as CliCommand['method'],
    path: `${basePathOf(document)}${path}`,
    parameters: result,
    ...(body ? { body } : {}),
    output: {
      kind: output,
      ...(options.columns ? { columns: options.columns } : {}),
    },
    ...(options.confirm ? { confirm: options.confirm } : {}),
    ...(options.examples?.length ? { examples: options.examples } : {}),
    identities: options.identities?.length
      ? [...options.identities]
      : identitiesOf(document, operation, schemes),
    ...(options.action ? { action: options.action } : {}),
  };
  return {
    command,
    explicit: Boolean(explicit?.length),
    words,
    fallback,
  };
}

/**
 * Every command the API document describes, for every caller: each documented operation that is not hidden and whose
 * `x-cli` is not `false`. A derived name that two operations share falls back to the tag and the `operationId`; a name
 * an `x-cli.command` gives twice keeps its first operation.
 */
export function deriveAllCliCommands(
  document: ApiDocument,
  options: DeriveCliCommandsOptions = {},
): CliCommand[] {
  const schemes = { ...DEFAULT_IDENTITY_SCHEMES, ...options.identitySchemes };
  const exclusions = options.exclude ?? [];
  const operations = operationsById(document);
  const collections = new Set(
    Object.entries(document.paths ?? {})
      .filter(([, item]) => item?.get)
      .map(([path]) => path),
  );
  const derived: Derived[] = [];
  for (const [path, item] of Object.entries(document.paths ?? {}))
    for (const method of METHODS) {
      const operation = item?.[method] as Operation | undefined;
      if (!operation || excluded(exclusions, path, operation)) continue;
      const entry = deriveOne(
        document,
        path,
        method,
        operation,
        schemes,
        operations,
        collections,
      );
      if (entry) derived.push(entry);
    }
  const counts = new Map<string, number>();
  for (const entry of derived)
    counts.set(entry.command.id, (counts.get(entry.command.id) ?? 0) + 1);
  const explicitIds = new Set(
    derived.filter((entry) => entry.explicit).map((entry) => entry.command.id),
  );
  const taken = new Set<string>();
  const result: CliCommand[] = [];
  for (const entry of derived) {
    let { id } = entry.command;
    if (!entry.explicit && ((counts.get(id) ?? 0) > 1 || explicitIds.has(id)))
      id = entry.fallback.join(':');
    if (taken.has(id)) continue;
    taken.add(id);
    result.push(
      id === entry.command.id ? entry.command : { ...entry.command, id },
    );
  }
  return result.sort((a, b) => a.id.localeCompare(b.id));
}

/** The commands a caller may run: offered to its identity, and holding the action each one names. */
export function filterCliCommands(
  commands: readonly CliCommand[],
  caller: Pick<CliCaller, 'kind' | 'actions'>,
): CliCommand[] {
  return commands.filter(
    (command) => withheldReason(command, caller) === undefined,
  );
}

/** Why `caller` is not offered `command`; undefined when it is. */
function withheldReason(
  command: CliCommand,
  caller: Pick<CliCaller, 'kind' | 'actions'>,
): CliWithheldCommand['reason'] | undefined {
  if (!command.identities.includes(caller.kind)) return 'identity';
  if (command.action && !(caller.actions?.has(command.action) ?? false))
    return 'action';
  return undefined;
}

/** The manifest of `caller`'s commands, and of those it is not offered, with why. */
export function cliManifestOf(
  commands: readonly CliCommand[],
  caller: CliCaller,
): CliManifest {
  const identity = {
    kind: caller.kind,
    userId: caller.userId,
    displayName: caller.displayName,
    ...(caller.runId ? { runId: caller.runId } : {}),
    actions: [...(caller.actions ?? [])].sort(),
  };
  const offered: CliCommand[] = [];
  const withheld: CliWithheldCommand[] = [];
  for (const command of commands) {
    const reason = withheldReason(command, caller);
    if (reason === undefined) offered.push(command);
    else
      withheld.push({
        id: command.id,
        summary: command.summary,
        reason,
        identities: command.identities,
        ...(command.action ? { action: command.action } : {}),
      });
  }
  const etag = createHash('sha256')
    .update(JSON.stringify({ identity, commands: offered, withheld }))
    .digest('hex')
    .slice(0, 32);
  return {
    version: CLI_MANIFEST_VERSION,
    etag,
    identity,
    commands: offered,
    withheld,
  };
}

/** The manifest of the commands the API document describes that `caller` may run. */
export function deriveCliCommands(
  document: ApiDocument,
  caller: CliCaller,
  options: DeriveCliCommandsOptions = {},
): CliManifest {
  return cliManifestOf(deriveAllCliCommands(document, options), caller);
}
