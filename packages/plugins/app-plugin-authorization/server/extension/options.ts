import { z } from 'zod';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { createAuthorizationAdministration } from '../administration.js';
import { databaseHost } from '../database/api.js';
import type { AuthorizationExtensionHost } from '../host.js';
import { authorizationOptions } from '../options.js';
import {
  AUTHORIZATION_ERROR_DOMAIN,
  createSettingsRouter,
  settingsAccess,
  type SettingsRouterEnv,
} from './http.js';
import {
  AuthorizationOptionsSchema,
  PageMetaSchema,
  RecordOptionSchema,
  RecordsParams,
  RecordsQuery,
  ResolveSubjectsBody,
  SubjectListQuery,
  SubjectOptionSchema,
  SubjectTypeParams,
} from './schemas.js';

/** The tag every authorization settings route is listed under in the API document. */
export const AUTHORIZATION_API_TAGS: string[] = ['Authorization'];

/** `/sharingRules` → `SharingRules`: the default name a route prefix gives its operation ids. */
export function operationNameOf(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

/** `SharingRule` → `sharing rule`, for the summaries of routes a prefix shares. */
function labelOf(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

/**
 * `GET <prefix>/subjects/:type` and `POST <prefix>/subjects/:type/resolve`,
 * gated by `settings:<settings>` `<action>`. `name` makes their operation ids unique, such as
 * `authorizationListSharingRuleSubjects`.
 */
export function createSubjectRoutes(
  authz: Pick<AuthorizationExtensionHost, 'subjects'>,
  prefix: string,
  settings: string,
  action: string,
  name: string = operationNameOf(prefix),
): Hono<SettingsRouterEnv> {
  const routes = createSettingsRouter();
  const selectionOf = (type: string) => {
    const selection = authz.subjects.get(type)?.administration?.selection;
    if (selection?.type === 'collection') return selection;
    throw new ApiError({
      status: 'NOT_FOUND',
      reason: 'UNKNOWN_SUBJECT_TYPE',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `No subject directory is registered for subject type ${type}.`,
    });
  };
  routes.get(
    `${prefix}/subjects/:type`,
    settingsAccess(settings, action),
    describeRoute({
      tags: AUTHORIZATION_API_TAGS,
      summary: `List the subjects of one type for ${labelOf(name)} settings`,
      operationId: `authorizationList${name}Subjects`,
      description: `A page of the subjects of \`type\` an administrator can pick, such as users. \`q\` searches them. Requires \`settings:${settings}\` \`${action}\`.`,
      responses: {
        200: listResponse(SubjectOptionSchema, PageMetaSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No subject directory is registered for this subject type (`UNKNOWN_SUBJECT_TYPE`).',
        ),
      },
    }),
    apiValidator('param', SubjectTypeParams),
    apiValidator('query', SubjectListQuery),
    async (context) => {
      const selection = selectionOf(context.req.valid('param').type);
      const { q, page, pageSize } = context.req.valid('query');
      const result = await selection.list(
        { ...(q === undefined ? {} : { search: q }), page, pageSize },
        { authz: context.env.authorization },
      );
      return context.json({
        data: result.items,
        meta: { page, pageSize, total: result.total },
      });
    },
  );
  routes.post(
    `${prefix}/subjects/:type/resolve`,
    settingsAccess(settings, action),
    describeRoute({
      tags: AUTHORIZATION_API_TAGS,
      summary: `Resolve subjects by id for ${labelOf(name)} settings`,
      operationId: `authorizationResolve${name}Subjects`,
      description: `The titles of up to 100 subjects of \`type\`, for displaying stored assignments or rules. An id that names no subject is left out. Requires \`settings:${settings}\` \`${action}\`.`,
      responses: {
        200: dataResponse(z.array(SubjectOptionSchema)),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No subject directory is registered for this subject type (`UNKNOWN_SUBJECT_TYPE`).',
        ),
      },
    }),
    apiValidator('param', SubjectTypeParams),
    apiValidator('json', ResolveSubjectsBody),
    async (context) => {
      const selection = selectionOf(context.req.valid('param').type);
      return context.json({
        data: await selection.resolve(context.req.valid('json').ids, {
          authz: context.env.authorization,
        }),
      });
    },
  );
  return routes;
}

export interface RuleSupportRoutesOptions {
  /** The rule's route prefix, as registered with `authz.routes.add`, such as `/sharingRules`. */
  readonly path: string;
  /** The rule's settings item, such as `authorization.sharing-rules`. */
  readonly settings: string;
  /**
   * The PascalCase name the routes' operation ids use, such as `SharingRule` for `authorizationListSharingRuleOptions`.
   * Defaults to `path` in PascalCase.
   */
  readonly name?: string;
}

/**
 * `<path>/options`, `<path>/subjects/...` and `<path>/records/:collection`
 * for a rule plugin, each gated by `settings:<settings>` `read`. The records list pages by `page` and `pageSize` and
 * answers `404 COLLECTION_NOT_FOUND` for a name that is no Collection.
 */
export function createRuleSupportRoutes(
  authz: AuthorizationExtensionHost,
  options: RuleSupportRoutesOptions,
): Hono<SettingsRouterEnv> {
  const { path, settings } = options;
  const name = options.name ?? operationNameOf(path);
  const routes = createSubjectRoutes(authz, path, settings, 'read', name);
  routes.get(
    `${path}/options`,
    settingsAccess(settings, 'read'),
    describeRoute({
      tags: AUTHORIZATION_API_TAGS,
      summary: `List what a ${labelOf(name)} can target`,
      operationId: `authorizationList${name}Options`,
      description: `The workspace catalogue narrowed to composites with data scopes, which is all a rule can target, with the subject types, record access definitions and collections the settings page offers. Requires \`settings:${settings}\` \`read\`.`,
      responses: {
        200: dataResponse(AuthorizationOptionsSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) =>
      context.json({
        data: await authorizationOptions(authz, { rules: true }),
      }),
  );
  routes.get(
    `${path}/records/:collection`,
    settingsAccess(settings, 'read'),
    describeRoute({
      tags: AUTHORIZATION_API_TAGS,
      summary: `List a collection's records for the ${labelOf(name)} record picker`,
      operationId: `authorizationList${name}Records`,
      description: `A page of the collection's records, each with its id and a label read from the first of \`title\`, \`name\`, \`orderNumber\`, \`username\` and \`email\` it has. Requires \`settings:${settings}\` \`read\`.`,
      responses: {
        200: listResponse(RecordOptionSchema, PageMetaSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No collection of this name exists (`COLLECTION_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', RecordsParams),
    apiValidator('query', RecordsQuery),
    async (context) => {
      const database = databaseHost(authz.database);
      const administration = createAuthorizationAdministration({
        ...(database?.connection ? { connection: database.connection } : {}),
        resolveCollection: async (name) => database?.describe(name),
      });
      // Hono has already decoded the path parameter; decoding it again would corrupt a name containing `%`.
      const { collection } = context.req.valid('param');
      const { page, pageSize } = context.req.valid('query');
      const result = await administration.listRecords(collection, {
        page,
        pageSize,
      });
      if (!result)
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'COLLECTION_NOT_FOUND',
          domain: AUTHORIZATION_ERROR_DOMAIN,
          message: `Collection ${collection} was not found.`,
        });
      return context.json({
        data: result.items,
        meta: { page, pageSize, total: result.total },
      });
    },
  );
  return routes;
}
