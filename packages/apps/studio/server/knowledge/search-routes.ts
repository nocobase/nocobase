/**
 * `/api/knowledgeSearch`, signed in: how the knowledge base is searched (Settings › Knowledge search), a singleton.
 *
 * | route | needs                           | what                                                              |
 * | ----- | ------------------------------- | ----------------------------------------------------------------- |
 * | `GET` | `studio.knowledgeSearch` `read`   | `KnowledgeSearchConfig`: the settings, the vector index, the spaces |
 * | `PUT` | `studio.knowledgeSearch` `manage` | takes `KnowledgeSearchSettings`, answers `KnowledgeSearchConfig`   |
 *
 * A model named must be one the agents plugin's model services offer with that kind (`embedding`, `rerank`, `chat` for
 * the context model): 400 `INVALID_MODEL` with the field otherwise. Errors are the standard body, domain `nb-studio`.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  offers,
  type ModelKind,
} from '@nocobase/app-plugin-agents/shared/models';
import {
  knowledgeAccessToken,
  knowledgeToken,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { SpaceRef } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import {
  spaceSettingKey,
  SYSTEM_SCOPE,
  type KnowledgeIndexStatus,
  type KnowledgeModelOption,
  type KnowledgeModelRef,
  type KnowledgeSearchConfig,
  type KnowledgeSearchSettings,
  type KnowledgeSearchSpaceOption,
} from '../../shared/knowledge.js';
import { studioAccessToken } from '../access/token.js';
import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  KnowledgeSearchSettingsInput,
  type KnowledgeSearchSettingsStore,
} from './search-settings.js';
import { KnowledgeSearchConfigSchema } from './schemas.js';

const tags = ['Studio'];

/** The knowledge search settings and the vector index, as the routes reach them (bound by `StudioKnowledgeProvider`). */
export interface StudioKnowledgeSearch {
  readonly settings: KnowledgeSearchSettingsStore;
  /** The vector index now; unavailable until the index is set up at boot. */
  index(): Promise<KnowledgeIndexStatus>;
}

export const studioKnowledgeSearchToken: ServiceToken<StudioKnowledgeSearch> =
  createServiceToken<StudioKnowledgeSearch>('studio/knowledge/search');

export const knowledgeSearchRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    if (
      !container.has(authenticationToken) ||
      !container.has(studioKnowledgeSearchToken)
    )
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const search = container.resolve(studioKnowledgeSearchToken);

    const userIdOf = (context: Context) =>
      (context.get('auth' as never) as { user: { id: string } }).user.id;

    async function rights(
      context: Context,
    ): Promise<{ read: boolean; manage: boolean }> {
      if (!container.has(studioAccessToken))
        return { read: false, manage: false };
      const { settings } = await container
        .resolve(studioAccessToken)
        .grantsOfUser(userIdOf(context));
      return {
        read: settings['studio.knowledgeSearch/read'] === true,
        manage: settings['studio.knowledgeSearch/manage'] === true,
      };
    }

    /** The spaces that hold knowledge, the system's first, with their titles. */
    async function spaces(): Promise<KnowledgeSearchSpaceOption[]> {
      const rows = await container
        .resolve(databaseManagerToken)
        .connection()
        .repository<{ scope: string; scopeId: string }>('kbSpaces')
        .findMany({});
      const access = container.has(knowledgeAccessToken)
        ? container.resolve(knowledgeAccessToken)
        : null;
      const options: KnowledgeSearchSpaceOption[] = [];
      for (const row of rows) {
        const ref: SpaceRef = { scope: row.scope, scopeId: row.scopeId };
        const title = (await access?.title(ref).catch(() => null)) ?? null;
        options.push({
          key: spaceSettingKey(ref),
          scope: ref.scope,
          scopeId: ref.scopeId,
          title: title ?? (ref.scope === SYSTEM_SCOPE ? '' : ref.scopeId),
        });
      }
      return options.sort(
        (a, b) =>
          Number(b.scope === SYSTEM_SCOPE) - Number(a.scope === SYSTEM_SCOPE) ||
          a.title.localeCompare(b.title),
      );
    }

    /** The models of one kind the enabled model services offer. */
    async function modelsOf(kind: ModelKind): Promise<KnowledgeModelOption[]> {
      if (!container.has(agentsToken)) return [];
      const catalog = await container
        .resolve(agentsToken)
        .online.gateway.catalog(kind);
      return catalog.services.flatMap((service) =>
        service.models.map((model) => ({
          modelService: service.name,
          model: model.value,
          label: model.label,
          serviceTitle: service.title,
        })),
      );
    }

    async function config(canManage: boolean): Promise<KnowledgeSearchConfig> {
      const index = await search.index();
      return {
        settings: await search.settings.get(),
        index: {
          ...index,
          store: index.store ? { type: index.store.type } : null,
        },
        spaces: container.has(knowledgeToken) ? await spaces() : [],
        models: {
          embedding: await modelsOf('embedding'),
          rerank: await modelsOf('rerank'),
          chat: await modelsOf('chat'),
        },
        canManage,
      };
    }

    /** Whether the model services offer each model named, with its kind. */
    async function checkModels(settings: KnowledgeSearchSettings) {
      if (!container.has(agentsToken))
        throw studioError(
          'FAILED_PRECONDITION',
          'MODEL_SERVICES_UNAVAILABLE',
          'There are no model services.',
        );
      const gateway = container.resolve(agentsToken).online.gateway;
      const named: [KnowledgeModelRef | null, ModelKind, string][] = [
        [settings.embedding, 'embedding', 'embedding'],
        [settings.rerank, 'rerank', 'rerank'],
        [settings.contextModel, 'chat', 'contextModel'],
      ];
      for (const [ref, kind, field] of named) {
        if (!ref) continue;
        if (!offers(await gateway.catalog(kind), ref.modelService, ref.model)) {
          const message = `The model services offer no ${kind} model ${ref.model} of ${ref.modelService}.`;
          throw studioError('INVALID_ARGUMENT', 'INVALID_MODEL', message, {
            fieldViolations: [{ field, description: message }],
          });
        }
      }
    }

    /** Refuses a caller without `studio.knowledgeSearch/<action>`, before the input is read. */
    const may =
      (action: 'read' | 'manage', message: string): MiddlewareHandler =>
      async (context, next) => {
        if (!(await rights(context))[action])
          throw studioError('PERMISSION_DENIED', 'FORBIDDEN', message);
        await next();
      };

    const routes = new Hono();
    routes.onError(studioErrorHandler);
    routes.use('*', authentication.required());

    routes.get(
      '/',
      may('read', 'You may not see the knowledge search settings.'),
      describeRoute({
        tags,
        summary: 'Get the knowledge search settings',
        operationId: 'knowledgeSearchGetSettings',
        description:
          'Needs `studio.knowledgeSearch` `read`. Answers the settings with the vector index, the spaces and the models to choose from.',
        responses: {
          200: dataResponse(KnowledgeSearchConfigSchema),
          ...apiErrorResponses,
        },
        ...cliRoute({ command: 'kb settings get' }),
      }),
      async (c) => c.json({ data: await config((await rights(c)).manage) }),
    );

    routes.put(
      '/',
      may(
        'manage',
        'Only someone who manages the knowledge search settings may change them.',
      ),
      describeRoute({
        tags,
        summary: 'Replace the knowledge search settings',
        operationId: 'knowledgeSearchReplaceSettings',
        description:
          'Needs `studio.knowledgeSearch` `manage`. Changing the embedding model builds a new index in the background.',
        responses: {
          200: dataResponse(KnowledgeSearchConfigSchema),
          400: apiErrorResponse(
            400,
            'When a model named is not one the model services offer with that kind (`INVALID_MODEL`), or there are no model services.',
          ),
          ...apiErrorResponses,
        },
        ...cliRoute({
          command: 'kb settings set',
          bodyFile: 'file',
          examples: ['kb settings set --file ./search-settings.json'],
        }),
      }),
      apiValidator('json', KnowledgeSearchSettingsInput),
      async (c) => {
        const settings = c.req.valid('json');
        await checkModels(settings);
        await search.settings.save(settings);
        return c.json({ data: await config(true) });
      },
    );

    const router = new Hono();
    router.route('/knowledgeSearch', routes);
    return router;
  });
