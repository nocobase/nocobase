import type { Hono } from 'hono';
import {
  generateSpecs,
  uniqueSymbol,
  type DescribeRouteOptions,
} from 'hono-openapi';
import { findTargetHandler, isMiddleware } from 'hono/utils/handler';
import type { OpenAPIV3_1 } from 'openapi-types';

import { apiNotFoundHandler } from '../api-error.js';
import {
  apiDocumentBaseComponents,
  invalidInputDescription,
  invalidInputResponseName,
} from './components.js';
import { expandRepositoryOperations } from './repository-document.js';

export type ApiDocument = OpenAPIV3_1.Document;

export interface ApiDocumentInfo {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}

/**
 * Paths, components and tags a plugin contributes to the document for routes it does not declare with
 * `describeRoute()`, such as Better Auth's. Paths are full paths below the application's base path, starting with
 * `/api/`.
 */
export interface ApiDocumentFragment {
  /** Who contributes the fragment, such as a plugin's package name. Named in warnings. */
  readonly owner: string;
  /**
   * camelCase prefix for an `operationId` or component name that collides with one already in the document. Defaults
   * to the owner's package name without its scope and `app-plugin-`, in camelCase.
   */
  readonly namespace?: string;
  readonly paths?: OpenAPIV3_1.PathsObject;
  readonly components?: OpenAPIV3_1.ComponentsObject;
  readonly tags?: readonly OpenAPIV3_1.TagObject[];
  /**
   * Security requirements the fragment adds to the document's top-level `security`, naming schemes declared in its
   * `components.securitySchemes`. The document lists every contributed requirement, each one an alternative: a
   * request satisfying any of them is authenticated, such as `[{ cookieAuth: [] }, { apiKeyAuth: [] }]`. A route that
   * needs no credential declares `security: []` in its `describeRoute()`. With nothing contributed the document has no
   * top-level `security`.
   */
  readonly security?: readonly OpenAPIV3_1.SecurityRequirementObject[];
}

export interface GenerateApiDocumentOptions {
  readonly info: ApiDocumentInfo;
  /** The path the router is mounted at. Defaults to `/api`. */
  readonly prefix?: string;
  readonly servers?: readonly OpenAPIV3_1.ServerObject[];
  readonly fragments?: readonly ApiDocumentFragment[];
  /**
   * Routes behind runtime dispatchers, documented like declared routes at their own prefix. Defaults to the source's
   * `forwardedApiRoutes`.
   */
  readonly forwarded?: ApiForwardedRoutes;
  /** Receives what the merge had to drop or rename, such as a fragment operation colliding with a declared route. */
  readonly onWarning?: (message: string) => void;
}

/** One endpoint of an API router and what `describeRoute()` declared for it. */
export interface ApiRouteDeclaration {
  readonly method: string;
  /** The Hono path including the prefix, such as `/api/users/:userId`. */
  readonly path: string;
  /** Whether a `describeRoute()` applies to it, including `describeRoute({ hide: true })`. */
  readonly declared: boolean;
  readonly hidden: boolean;
  /** The `operationId` the declaration names; absent when the document would have to invent one. */
  readonly operationId?: string;
  readonly tags?: readonly string[];
  readonly summary?: string;
  /** For an endpoint registered with `addUndeclaredApiRoute`, why it cannot be described. */
  readonly reason?: string;
}

/**
 * A Hono router a runtime dispatcher forwards requests to. The dispatcher is a single catch-all on the `/api` router,
 * so the router's routes are invisible there; registering it lets the document and the route inspection treat them
 * exactly like routes mounted on `/api`.
 */
export interface ApiForwardedRouter {
  /** Who registers the router, such as a plugin's package name. Named in warnings and duplicate-route errors. */
  readonly owner: string;
  /** The full path the router's own paths are appended to, `/api` or below it, such as `/api/authorization`. */
  readonly prefix: string;
  /**
   * The sub-path below `prefix` the dispatcher actually forwards to this router, such as `/sharingRules`, when the
   * router's paths include it. A route the router declares outside `prefix` + `scope` is never reached: it is left out
   * of the document and the duplicate-route check and reported as undeclared. Defaults to all of `prefix`.
   */
  readonly scope?: string;
  readonly router: Hono;
}

/**
 * An endpoint a runtime dispatcher forwards to that the framework cannot see into, such as a plain function handler.
 * It always counts as undeclared and never appears in the document.
 */
export interface ApiUndeclaredRoute {
  /** Who registers the endpoint, such as a plugin's package name. */
  readonly owner: string;
  /** The HTTP method, or `ALL` for a handler answering every method. */
  readonly method: string;
  /** The full path, such as `/api/authorization/handWritten`. */
  readonly path: string;
  /** Why the endpoint cannot be described, reported with it. */
  readonly reason?: string;
}

/** What runtime dispatchers forward to, as registered on the `ApiDocsService`. */
export interface ApiForwardedRoutes {
  readonly routers: readonly ApiForwardedRouter[];
  readonly undeclared: readonly ApiUndeclaredRoute[];
}

/** An application whose API router can be inspected once its routes are registered. */
export interface ApiRouterSource {
  readonly apiRouter: Hono | undefined;
  /** Routes behind runtime dispatchers, inspected and documented along with `apiRouter`'s own. */
  readonly forwardedApiRoutes?: ApiForwardedRoutes;
}

const httpMethods = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

function isRouterSource(
  source: Hono | ApiRouterSource,
): source is ApiRouterSource {
  return 'apiRouter' in source;
}

function forwardedOf(
  source: Hono | ApiRouterSource,
): ApiForwardedRoutes | undefined {
  return isRouterSource(source) ? source.forwardedApiRoutes : undefined;
}

function resolveApiRouter(source: Hono | ApiRouterSource): Hono {
  const router = isRouterSource(source) ? source.apiRouter : source;
  if (!router) {
    throw new Error(
      'The application has not registered its routes yet. Start it before inspecting its API.',
    );
  }
  return router;
}

function describeSpecOf(handler: unknown): DescribeRouteOptions | undefined {
  const metadata = (
    findTargetHandler(handler as never) as unknown as Record<
      symbol,
      { readonly spec?: DescribeRouteOptions } | undefined
    >
  )[uniqueSymbol];
  return metadata?.spec;
}

function pathPrefixOf(path: string): string {
  return path.endsWith('/*') ? path.slice(0, -2) : path;
}

/**
 * Every endpoint of an API router with what `describeRoute()` declares for it, in registration order. The application's
 * catch-all for unknown paths is not an endpoint and is left out. A declaration applied with `router.use()` counts for
 * the paths below it, as it does in the document.
 *
 * For an application, or anything else carrying `forwardedApiRoutes`, the routes of every router registered with
 * `addApiRouter` follow at their own prefix, judged the same way, and every endpoint registered with
 * `addUndeclaredApiRoute` follows as undeclared.
 */
export function inspectApiRoutes(
  source: Hono | ApiRouterSource,
  prefix: string = '/api',
): ApiRouteDeclaration[] {
  const declarations = inspectRouter(resolveApiRouter(source), prefix);
  const forwarded = forwardedOf(source);
  for (const registration of forwarded?.routers ?? []) {
    const base = forwardedPath(registration);
    for (const route of inspectRouter(
      registration.router,
      registration.prefix,
    )) {
      declarations.push(
        isForwardedTo(registration, route.path)
          ? route
          : {
              method: route.method,
              path: route.path,
              declared: false,
              hidden: false,
              reason: `Declared outside the forwarded path ${base}, which the dispatcher never forwards to this router.`,
            },
      );
    }
  }
  for (const { method, path, reason } of forwarded?.undeclared ?? [])
    declarations.push({
      method,
      path,
      declared: false,
      hidden: false,
      ...(reason ? { reason } : {}),
    });
  return declarations;
}

/** The full path a dispatcher forwards to a registered router: its prefix followed by its scope. */
export function forwardedPath(registration: ApiForwardedRouter): string {
  return joinPath(registration.prefix, registration.scope ?? '/');
}

/** Whether the dispatcher forwards a request for `path`, a full path such as `/api/authorization/x`, to the router. */
export function isForwardedTo(
  registration: ApiForwardedRouter,
  path: string,
): boolean {
  const base = forwardedPath(registration);
  return path === base || path.startsWith(base === '/' ? '/' : `${base}/`);
}

function joinPath(prefix: string, path: string): string {
  return `${prefix}${path === '/' ? '' : path}` || '/';
}

function inspectRouter(router: Hono, prefix: string): ApiRouteDeclaration[] {
  const contexts: { readonly prefix: string; spec: DescribeRouteOptions }[] =
    [];
  const endpoints = new Map<
    string,
    { method: string; path: string; specs: DescribeRouteOptions[] }
  >();
  for (const route of router.routes) {
    const target = findTargetHandler(route.handler);
    if (target === (apiNotFoundHandler as unknown)) continue;
    const spec = describeSpecOf(route.handler);
    const key = `${route.method} ${route.path}`;
    const middleware = isMiddleware(target);
    if (route.method === 'ALL' && middleware) {
      if (spec) contexts.push({ prefix: pathPrefixOf(route.path), spec });
      continue;
    }
    let endpoint = endpoints.get(key);
    if (!endpoint && !middleware) {
      endpoint = { method: route.method, path: route.path, specs: [] };
      endpoints.set(key, endpoint);
    }
    if (endpoint && spec) endpoint.specs.push(spec);
    // A describeRoute() registered before the endpoint's handler under the same method and path.
    if (!endpoint && spec) {
      endpoints.set(key, {
        method: route.method,
        path: route.path,
        specs: [spec],
      });
    }
  }
  const declarations: ApiRouteDeclaration[] = [];
  for (const endpoint of endpoints.values()) {
    const applicable = [
      ...contexts
        .filter(
          (context) =>
            endpoint.path === context.prefix ||
            endpoint.path.startsWith(`${context.prefix}/`),
        )
        .map((context) => context.spec),
      ...endpoint.specs,
    ];
    let hidden = false;
    let operationId: string | undefined;
    let summary: string | undefined;
    const tags = new Set<string>();
    for (const spec of applicable) {
      if (spec.hide) hidden = true;
      if (typeof spec.operationId === 'string') operationId = spec.operationId;
      if (spec.summary) summary = spec.summary;
      for (const tag of spec.tags ?? []) tags.add(tag);
    }
    declarations.push({
      method: endpoint.method,
      path: joinPath(prefix, endpoint.path),
      declared: applicable.length > 0,
      hidden,
      ...(operationId ? { operationId } : {}),
      ...(tags.size > 0 ? { tags: [...tags] } : {}),
      ...(summary ? { summary } : {}),
    });
  }
  return declarations;
}

/**
 * The endpoints that declare nothing: neither `describeRoute({...})` nor `describeRoute({ hide: true })`. For an
 * application this includes the routes behind runtime dispatchers, and every endpoint registered with
 * `addUndeclaredApiRoute`. Each is a defect the API document check reports.
 */
export function findUndeclaredApiRoutes(
  source: Hono | ApiRouterSource,
  prefix: string = '/api',
): { readonly method: string; readonly path: string }[] {
  return inspectApiRoutes(source, prefix)
    .filter((route) => !route.declared)
    .map(({ method, path }) => ({ method, path }));
}

/**
 * Generate the OpenAPI 3.1 document for an API router: every route declared with `describeRoute()` and not hidden,
 * data endpoints expanded from their Collections, and the fragments merged in.
 */
export async function generateApiDocument(
  source: Hono | ApiRouterSource,
  options: GenerateApiDocumentOptions,
): Promise<ApiDocument> {
  const router = resolveApiRouter(source);
  const prefix = options.prefix ?? '/api';
  const base = apiDocumentBaseComponents();
  const generated = await generateRouterSpecs(router, options, base);
  const paths: OpenAPIV3_1.PathsObject = {};
  for (const [path, item] of Object.entries(generated.paths)) {
    paths[joinPath(prefix, path)] = item;
  }
  const document: ApiDocument = {
    openapi: '3.1.0',
    // hono-openapi fills in a description of its own when none is given.
    info: {
      title: options.info.title,
      version: options.info.version,
      ...(options.info.description
        ? { description: options.info.description }
        : {}),
    },
    ...(generated.servers ? { servers: generated.servers } : {}),
    paths,
    components: {
      ...generated.components,
      schemas: { ...base.schemas, ...generated.components.schemas },
      responses: { ...base.responses, ...generated.components.responses },
    },
  };
  const warn = options.onWarning ?? (() => undefined);
  // Routes behind a runtime dispatcher are declared routes too: merged before the fragments, so a fragment operation on
  // the same method and path is the one dropped. Their components are generated from the same base, so the shared
  // ones are identical and stay shared.
  for (const forwarded of (options.forwarded ?? forwardedOf(source))?.routers ??
    []) {
    const specs = await generateRouterSpecs(
      forwarded.router,
      options,
      apiDocumentBaseComponents(),
    );
    const forwardedPaths: OpenAPIV3_1.PathsObject = {};
    for (const [path, item] of Object.entries(specs.paths)) {
      const full = joinPath(forwarded.prefix, path);
      // A route outside the forwarded path is never reached; `inspectApiRoutes` reports it instead.
      if (isForwardedTo(forwarded, full)) forwardedPaths[full] = item;
    }
    mergeApiDocumentFragment(
      document,
      {
        owner: forwarded.owner,
        paths: forwardedPaths,
        components: specs.components,
      },
      warn,
    );
  }
  // Data endpoints are expanded once every router is in, so a dispatcher forwarding one documents it in full too.
  // Fragments come after: they carry finished operations, never a data endpoint placeholder.
  await expandRepositoryOperations(document);
  for (const fragment of options.fragments ?? []) {
    mergeApiDocumentFragment(document, fragment, warn);
  }
  document.tags = collectTags(document, options.fragments ?? []);
  return document;
}

type GeneratedSpecs = Awaited<ReturnType<typeof generateSpecs>>;

async function generateRouterSpecs(
  router: Hono,
  options: GenerateApiDocumentOptions,
  base: OpenAPIV3_1.ComponentsObject,
): Promise<GeneratedSpecs> {
  const specs = await generateSpecs(router, {
    documentation: {
      info: {
        title: options.info.title,
        version: options.info.version,
        ...(options.info.description
          ? { description: options.info.description }
          : {}),
      },
      ...(options.servers ? { servers: [...options.servers] } : {}),
      components: base,
    },
    // The 400 for invalid input is added below, also to an operation that declares a 400 of its own.
    defaultValidationErrorResponse: false,
    excludeMethods: ['OPTIONS'],
  });
  addInvalidInputResponses(specs.paths, validatedOperations(router));
  return specs;
}

/** An OpenAPI path for a Hono path, `/apps/:appId{[a-z]+}` becoming `/apps/{appId}`, as hono-openapi converts it. */
function toOpenApiPath(path: string): string {
  return path
    .split('/')
    .map((segment) => {
      if (!segment.startsWith(':')) return segment;
      const match = /^:([^{?]+)/.exec(segment);
      return `{${match ? match[1] : segment.slice(1).replace(/\?$/, '')}}`;
    })
    .join('/');
}

interface ValidatedOperations {
  /** `METHOD /openapi/path` of every endpoint with an `apiValidator()` of its own. */
  readonly endpoints: ReadonlySet<string>;
  /** Path prefixes a validator applied with `router.use()` covers. */
  readonly prefixes: readonly string[];
}

/** The operations of a router that validate their input with `apiValidator()` (or any hono-openapi validator). */
function validatedOperations(router: Hono): ValidatedOperations {
  const endpoints = new Set<string>();
  const prefixes: string[] = [];
  for (const route of router.routes) {
    const metadata = (
      findTargetHandler(route.handler) as unknown as Record<
        symbol,
        Record<string, unknown> | undefined
      >
    )[uniqueSymbol];
    // describeRoute() metadata carries `spec`; a validator's carries the schema conversion instead.
    if (!metadata || 'spec' in metadata || !('toOpenAPISchema' in metadata))
      continue;
    const path = toOpenApiPath(route.path);
    if (route.method === 'ALL') prefixes.push(pathPrefixOf(path));
    else endpoints.add(`${route.method} ${path}`);
  }
  return { endpoints, prefixes };
}

/**
 * Document the 400 an `apiValidator()` answers on every operation that has one, and on no other. A route declares a
 * 400 itself only for another reason, such as a failed precondition: a declared `apiErrorResponse(400)` without a
 * description already covers invalid input and is kept as it is, and a declared 400 with a description keeps it after
 * the description of invalid input.
 */
function addInvalidInputResponses(
  paths: OpenAPIV3_1.PathsObject,
  validated: ValidatedOperations,
): void {
  for (const [path, item] of Object.entries(paths)) {
    for (const method of httpMethods) {
      const operation = item?.[method];
      if (!operation) continue;
      const covered =
        validated.endpoints.has(`${method.toUpperCase()} ${path}`) ||
        validated.prefixes.some(
          (prefix) => path === prefix || path.startsWith(`${prefix}/`),
        );
      if (!covered) continue;
      const responses = (operation.responses ??= {});
      const declared = responses['400'];
      if (!declared) {
        responses['400'] = {
          $ref: `#/components/responses/${invalidInputResponseName}`,
        };
      } else if (!('$ref' in declared)) {
        responses['400'] = {
          ...declared,
          description: `${invalidInputDescription}\n\n${declared.description}`,
        };
      }
    }
  }
}

function collectTags(
  document: ApiDocument,
  fragments: readonly ApiDocumentFragment[],
): OpenAPIV3_1.TagObject[] {
  const described = new Map<string, OpenAPIV3_1.TagObject>();
  for (const tag of [
    ...(document.tags ?? []),
    ...fragments.flatMap((fragment) => fragment.tags ?? []),
  ]) {
    const existing = described.get(tag.name);
    described.set(
      tag.name,
      existing
        ? {
            ...tag,
            ...existing,
            description: existing.description ?? tag.description,
          }
        : tag,
    );
  }
  const used = new Set<string>();
  for (const item of Object.values(document.paths ?? {})) {
    for (const method of httpMethods) {
      for (const tag of item?.[method]?.tags ?? []) used.add(tag);
    }
  }
  return [...used]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => described.get(name) ?? { name });
}

const componentKinds = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
  'securitySchemes',
  'links',
  'callbacks',
  'pathItems',
] as const;

type ComponentKind = (typeof componentKinds)[number];

function defaultNamespace(owner: string): string {
  const bare = owner.replace(/^@[^/]+\//, '').replace(/^app-plugin-/, '');
  return bare.replace(/[-_.\s]+([a-zA-Z0-9])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function uniqueName(base: string, taken: (name: string) => boolean): string {
  if (!taken(base)) return base;
  let index = 2;
  while (taken(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function rewriteRefs(
  value: unknown,
  renames: ReadonlyMap<string, string>,
): unknown {
  if (Array.isArray(value))
    return value.map((item) => rewriteRefs(item, renames));
  if (typeof value !== 'object' || value === null) return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] =
      key === '$ref' && typeof child === 'string'
        ? (renames.get(child) ?? child)
        : rewriteRefs(child, renames);
  }
  return result;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Merge one fragment into a document in place.
 *
 * - A component whose name is free is added; one identical to an existing component is shared; one that differs is
 *   renamed with the fragment's namespace in PascalCase as prefix (`AuthSession`; a security scheme takes it in
 *   camelCase, `authCookieAuth`), and every `$ref` and security requirement in the fragment follows the rename.
 * - An operation whose method and path the document already has is dropped with a warning: a declared route is what
 *   actually answers.
 * - An `operationId` already in use is prefixed with the namespace (`authSignIn`), then numbered if still taken.
 * - Tags merge by name; a description already in the document wins.
 * - Security requirements are appended to the document's top-level `security` unless an identical one is already
 *   there, following any rename of the security schemes they name.
 */
export function mergeApiDocumentFragment(
  document: ApiDocument,
  fragment: ApiDocumentFragment,
  onWarning: (message: string) => void = () => undefined,
): void {
  const namespace = fragment.namespace ?? defaultNamespace(fragment.owner);
  const components = (document.components ??= {}) as Record<
    ComponentKind,
    Record<string, unknown> | undefined
  >;
  const renames = new Map<string, string>();
  const additions: [ComponentKind, string, unknown][] = [];
  const fragmentComponents = (fragment.components ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  for (const kind of componentKinds) {
    for (const [name, component] of Object.entries(
      fragmentComponents[kind] ?? {},
    )) {
      const existing = components[kind]?.[name];
      if (existing === undefined) {
        additions.push([kind, name, component]);
        continue;
      }
      if (sameJson(existing, component)) continue;
      // Security schemes are named in camelCase, as a requirement names them (`authCookieAuth`); every other component
      // in PascalCase (`AuthSession`).
      const renamed = uniqueName(
        kind === 'securitySchemes'
          ? `${namespace}${capitalize(name)}`
          : `${capitalize(namespace)}${name}`,
        (candidate) =>
          components[kind]?.[candidate] !== undefined ||
          fragmentComponents[kind]?.[candidate] !== undefined,
      );
      renames.set(
        `#/components/${kind}/${name}`,
        `#/components/${kind}/${renamed}`,
      );
      additions.push([kind, renamed, component]);
      onWarning(
        `${fragment.owner}: component ${kind}/${name} differs from the one already in the API document and was renamed to ${renamed}.`,
      );
    }
  }
  for (const [kind, name, component] of additions) {
    (components[kind] ??= {})[name] = rewriteRefs(component, renames);
  }
  // A security requirement names its scheme by key rather than by `$ref`, so a renamed scheme is followed here.
  const schemeRenames = new Map<string, string>();
  for (const [from, to] of renames) {
    const prefix = '#/components/securitySchemes/';
    if (from.startsWith(prefix))
      schemeRenames.set(from.slice(prefix.length), to.slice(prefix.length));
  }
  const renameSecurity = (
    requirements: readonly OpenAPIV3_1.SecurityRequirementObject[],
  ): OpenAPIV3_1.SecurityRequirementObject[] =>
    requirements.map((requirement) =>
      Object.fromEntries(
        Object.entries(requirement).map(([name, scopes]) => [
          schemeRenames.get(name) ?? name,
          scopes,
        ]),
      ),
    );
  if (fragment.security && fragment.security.length > 0) {
    const security = (document.security ??= []);
    for (const requirement of renameSecurity(fragment.security)) {
      if (!security.some((existing) => sameJson(existing, requirement)))
        security.push(requirement);
    }
  }

  const operationIds = new Set<string>();
  for (const item of Object.values(document.paths ?? {})) {
    for (const method of httpMethods) {
      const operationId = item?.[method]?.operationId;
      if (operationId) operationIds.add(operationId);
    }
  }
  const paths = (document.paths ??= {});
  for (const [path, rawItem] of Object.entries(fragment.paths ?? {})) {
    if (!rawItem) continue;
    const item = rewriteRefs(rawItem, renames) as OpenAPIV3_1.PathItemObject;
    const target = (paths[path] ??= {});
    for (const [key, value] of Object.entries(item)) {
      const method = key as (typeof httpMethods)[number];
      if (!httpMethods.includes(method)) {
        if (!(key in target)) (target as Record<string, unknown>)[key] = value;
        continue;
      }
      if (target[method]) {
        onWarning(
          `${fragment.owner}: ${method.toUpperCase()} ${path} is already declared by a route and was left out of the fragment.`,
        );
        continue;
      }
      const operation = { ...(value as OpenAPIV3_1.OperationObject) };
      if (operation.security && schemeRenames.size > 0)
        operation.security = renameSecurity(operation.security);
      if (operation.operationId && operationIds.has(operation.operationId)) {
        const renamed = uniqueName(
          `${namespace}${capitalize(operation.operationId)}`,
          (candidate) => operationIds.has(candidate),
        );
        onWarning(
          `${fragment.owner}: operationId ${operation.operationId} of ${method.toUpperCase()} ${path} is already used and was renamed to ${renamed}.`,
        );
        operation.operationId = renamed;
      }
      if (operation.operationId) operationIds.add(operation.operationId);
      (target as Record<string, unknown>)[method] = operation;
    }
  }
}
