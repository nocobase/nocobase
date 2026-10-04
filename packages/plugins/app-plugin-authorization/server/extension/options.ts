import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import type { Hono } from 'hono';
import { validator } from 'hono/validator';
import { createAuthorizationAdministration } from '../administration.js';
import { databaseHost } from '../database/api.js';
import type { AuthorizationExtensionHost } from '../host.js';
import { authorizationOptions } from '../options.js';
import {
  AUTHORIZATION_ERROR_DOMAIN,
  createSettingsRouter,
  requireSettings,
  settingsAccess,
  type SettingsRouterEnv,
} from './http.js';
import {
  RecordsParams,
  RecordsQuery,
  ResolveSubjectsBody,
  SubjectListQuery,
  SubjectTypeParams,
} from './schemas.js';

/**
 * `GET <prefix>/subjects/:type` and `POST <prefix>/subjects/:type/resolve`,
 * gated by `settings:<settings>` `<action>`.
 */
export function createSubjectRoutes(
  authz: Pick<AuthorizationExtensionHost, 'subjects'>,
  prefix: string,
  settings: string,
  action: string,
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
    validator('param', (value) => parseApiInput(SubjectTypeParams, value)),
    validator('query', (value) => parseApiInput(SubjectListQuery, value)),
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
    validator('param', (value) => parseApiInput(SubjectTypeParams, value)),
    validator('json', (value) => parseApiInput(ResolveSubjectsBody, value)),
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
  const routes = createSubjectRoutes(authz, path, settings, 'read');
  routes.get(`${path}/options`, async (context) => {
    await requireSettings(context.env.authorization, settings, 'read');
    return context.json({
      data: await authorizationOptions(authz, { rules: true }),
    });
  });
  routes.get(
    `${path}/records/:collection`,
    settingsAccess(settings, 'read'),
    validator('param', (value) => parseApiInput(RecordsParams, value)),
    validator('query', (value) => parseApiInput(RecordsQuery, value)),
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
