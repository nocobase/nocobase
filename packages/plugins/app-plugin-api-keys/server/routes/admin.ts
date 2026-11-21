/**
 * The administration of keys, for System settings › API keys: system keys (`/api/systemApiKeys`), members' personal
 * keys (`/api/apiKeys/members`) and the rules (`/api/apiKeys/rules`). Reading takes `settings:apiKeys/read`, every
 * change `settings:apiKeys/manage`; both only from a sign-in, never with a key.
 */
import type { AuthEnv } from '@nocobase/app-plugin-authentication/server';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import { z } from 'zod';

import type { MemberKeys } from '../member-keys.js';
import type { ScopedApiKeys } from '../scoped-keys.js';
import { API_KEYS_SETTINGS } from '../scoped-keys.js';
import type { SystemApiKeys } from '../system-keys.js';
import { KeyPermissionsSchema } from './schemas.js';

type Env = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

const tags = ['ApiKeys'];
const signInOnly =
  'Takes a signed-in session: a request made with any API key is refused (`403`).';

const readAccess = `${signInOnly} Requires \`settings:apiKeys\` \`read\`.`;
const manageAccess = `${signInOnly} Requires \`settings:apiKeys\` \`manage\`.`;

const keyNotFound = apiErrorResponse(
  404,
  'No system key with this id (`SYSTEM_KEY_NOT_FOUND`).',
);

const PersonSchema = z.object({ id: z.string(), name: z.string() });

const ManagedBySchema = z.object({
  kind: z.string(),
  id: z.string(),
  title: z.string(),
});

/** A system key; `ApiKeysKey` with what makes it one. */
export const SystemKeyViewSchema: z.ZodType = z
  .looseObject({
    identityId: z.string().meta({
      description: 'The service account the key acts as.',
    }),
    owner: PersonSchema.nullable().meta({
      description: 'Who receives its reminders; the key never acts as them.',
    }),
    managedBy: ManagedBySchema.nullable().meta({
      description:
        'The feature that manages the key; its permissions and rotation change there.',
    }),
    createdById: z.string().nullable(),
    permissions: KeyPermissionsSchema,
  })
  .meta({ ref: 'ApiKeysSystemKey' });

const CreatedSystemKeySchema = z.object({
  key: SystemKeyViewSchema,
  secret: z
    .string()
    .meta({ description: 'The key itself, shown only in this response.' }),
});

const SystemKeyEventSchema = z
  .object({
    id: z.string(),
    action: z.enum([
      'create',
      'update',
      'permissions',
      'rotate',
      'disable',
      'enable',
      'delete',
      'adopt',
    ]),
    actor: PersonSchema.nullable().meta({
      description: 'Who did it; null for the system itself.',
    }),
    details: z.record(z.string(), z.unknown()).nullable().meta({
      description:
        'What changed, such as the permissions `before` and `after`.',
    }),
    createdAt: z.string(),
  })
  .meta({ ref: 'ApiKeysSystemKeyEvent' });

const MemberKeySchema = z
  .looseObject({
    member: z.object({
      id: z.string(),
      name: z.string(),
      disabled: z.boolean(),
    }),
  })
  .meta({ ref: 'ApiKeysMemberKey' });

const RulesSchema = z
  .object({
    allowSameAsMe: z.boolean(),
    personalMaxDays: z.number().int().nullable(),
    personalDefaultDays: z.number().int(),
    idleDisableDays: z.number().int().nullable(),
    idleSince: z.string().nullable(),
    saved: z.boolean(),
  })
  .meta({ ref: 'ApiKeysRules' });

const RulesInput = z.strictObject({
  allowSameAsMe: z.boolean(),
  personalMaxDays: z.number().int().nullable(),
  personalDefaultDays: z.number().int(),
  idleDisableDays: z.number().int().nullable(),
});

const IdentityParams = z.object({ identityId: z.string().min(1) });
const MemberKeyParams = z.object({ keyId: z.string().min(1) });

const CreateSystemKeyBody = z.strictObject({
  name: z.string(),
  description: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  expiresInDays: z.number().int().nullable(),
  permissions: KeyPermissionsSchema,
});

const UpdateSystemKeyBody = z.strictObject({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
});

const SetPermissionsBody = z.strictObject({
  permissions: KeyPermissionsSchema,
});

const ListSystemKeysQuery = z.object({
  q: z.string().max(200).optional(),
});

const ListMemberKeysQuery = z.object({
  q: z.string().max(200).optional(),
  sameAsMember: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  idleDays: z.coerce.number().int().min(1).max(3650).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

const TotalMeta = z.object({ total: z.number().int() });

function access(action: 'read' | 'manage'): MiddlewareHandler<Env> {
  return async (context, next) => {
    await context.get('authz').require({
      resource: { type: 'settings', id: API_KEYS_SETTINGS },
      action,
    });
    await next();
  };
}

const userId = (context: Context<Env>) => context.get('auth')!.user.id;

/** Members' keys and the rules, on the `/apiKeys` router, before its `/:keyId` routes. */
export function installKeyAdministration(
  routes: Hono<Env>,
  services: {
    readonly keys: ScopedApiKeys;
    readonly members: MemberKeys;
  },
): void {
  const { keys, members } = services;
  routes.get(
    '/members',
    access('read'),
    describeRoute({
      tags,
      summary: "List members' personal keys",
      operationId: 'apiKeysListMemberKeys',
      description: `${readAccess} Every member's personal keys, newest first, never a secret: \`sameAsMember\` keeps those that act as their member in full, \`idleDays\` those unused for that long.`,
      responses: {
        200: listResponse(MemberKeySchema, TotalMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListMemberKeysQuery),
    async (context) => {
      const query = context.req.valid('query');
      const { data, total } = await members.list({
        ...(query.q ? { search: query.q } : {}),
        sameAsMember: query.sameAsMember,
        ...(query.idleDays ? { idleDays: query.idleDays } : {}),
        ...(query.page ? { page: query.page } : {}),
        ...(query.pageSize ? { pageSize: query.pageSize } : {}),
      });
      return context.json({ data, meta: { total } });
    },
  );
  routes.delete(
    '/members/:keyId',
    access('manage'),
    describeRoute({
      tags,
      summary: "Revoke a member's personal key",
      operationId: 'apiKeysRevokeMemberKey',
      description: `${manageAccess} Revokes the key; whatever uses it stops at once.`,
      responses: {
        204: emptyResponse('The key was revoked.'),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'No member key with this id (`KEY_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', MemberKeyParams),
    async (context) => {
      await members.revoke(context.req.valid('param').keyId);
      return context.body(null, 204);
    },
  );
  routes.get(
    '/rules',
    access('read'),
    describeRoute({
      tags,
      summary: 'Get the rules for API keys',
      operationId: 'apiKeysGetRules',
      description: `${readAccess} The rules as they apply now: the saved ones, or the application's configuration (\`saved: false\`).`,
      responses: { 200: dataResponse(RulesSchema), ...apiErrorResponses },
    }),
    async (context) => context.json({ data: await keys.rules() }),
  );
  routes.put(
    '/rules',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Save the rules for API keys',
      operationId: 'apiKeysSaveRules',
      description: `${manageAccess} They act on keys made or rotated afterwards; idle disabling acts on every key, counting idle time from now (\`INVALID_RULES\` for values out of range).`,
      responses: { 200: dataResponse(RulesSchema), ...apiErrorResponses },
    }),
    apiValidator('json', RulesInput),
    async (context) =>
      context.json({
        data: await keys.setRules(context.req.valid('json'), userId(context)),
      }),
  );
}

/** `/systemApiKeys`. */
export function installSystemKeys(
  routes: Hono<Env>,
  systemKeys: SystemApiKeys,
): void {
  routes.get(
    '/',
    access('read'),
    describeRoute({
      tags,
      summary: 'List system keys',
      operationId: 'apiKeysListSystemKeys',
      description: `${readAccess} Every system key, managed ones included, newest first; \`q\` matches the name.`,
      responses: {
        200: listResponse(SystemKeyViewSchema, TotalMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListSystemKeysQuery),
    async (context) => {
      const { q } = context.req.valid('query');
      const data = await systemKeys.list(q ? { search: q } : {});
      return context.json({ data, meta: { total: data.length } });
    },
  );
  routes.post(
    '/',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Create a system key',
      operationId: 'apiKeysCreateSystemKey',
      description: `${manageAccess} Creates the key's own service account and gives it permissions the caller holds (\`KEY_SCOPE_EXCEEDS_YOURS\`), never an action a person's only (\`KEY_ACTION_HUMAN_ONLY\`), and record scopes of every record or chosen ones (\`SYSTEM_KEY_SCOPE\`). The secret is in this response only.`,
      responses: {
        201: dataResponse(CreatedSystemKeySchema, 'The created key.'),
        ...apiErrorResponses,
      },
    }),
    apiValidator('json', CreateSystemKeyBody),
    async (context) => {
      context.header('Cache-Control', 'no-store');
      return context.json(
        {
          data: await systemKeys.create(
            userId(context),
            context.req.valid('json'),
          ),
        },
        201,
      );
    },
  );
  routes.get(
    '/:identityId',
    access('read'),
    describeRoute({
      tags,
      summary: 'Get a system key',
      operationId: 'apiKeysGetSystemKey',
      description: readAccess,
      responses: {
        200: dataResponse(SystemKeyViewSchema),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    async (context) =>
      context.json({
        data: await systemKeys.get(context.req.valid('param').identityId),
      }),
  );
  routes.patch(
    '/:identityId',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Edit a system key',
      operationId: 'apiKeysUpdateSystemKey',
      description: `${manageAccess} Renames it or changes its description or owner; recorded in its activity.`,
      responses: {
        200: dataResponse(SystemKeyViewSchema),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    apiValidator('json', UpdateSystemKeyBody),
    async (context) =>
      context.json({
        data: await systemKeys.update(
          context.req.valid('param').identityId,
          userId(context),
          context.req.valid('json'),
        ),
      }),
  );
  routes.put(
    '/:identityId/permissions',
    access('manage'),
    describeRoute({
      tags,
      summary: "Replace a system key's permissions",
      operationId: 'apiKeysSetSystemKeyPermissions',
      description: `${manageAccess} Takes effect at once and is recorded with the permissions before and after. A managed key's permissions change only where it is managed (\`SYSTEM_KEY_MANAGED\`).`,
      responses: {
        200: dataResponse(SystemKeyViewSchema),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    apiValidator('json', SetPermissionsBody),
    async (context) =>
      context.json({
        data: await systemKeys.setPermissions(
          context.req.valid('param').identityId,
          userId(context),
          context.req.valid('json').permissions,
        ),
      }),
  );
  routes.post(
    '/:identityId/rotate',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Rotate a system key',
      operationId: 'apiKeysRotateSystemKey',
      description: `${manageAccess} A new value; the old one stops at once, and the identity, name, permissions and activity stay.`,
      responses: {
        200: dataResponse(CreatedSystemKeySchema),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    async (context) => {
      context.header('Cache-Control', 'no-store');
      return context.json({
        data: await systemKeys.rotate(
          context.req.valid('param').identityId,
          userId(context),
        ),
      });
    },
  );
  for (const [path, enabled] of [
    ['disable', false],
    ['enable', true],
  ] as const)
    routes.post(
      `/:identityId/${path}`,
      access('manage'),
      describeRoute({
        tags,
        summary: `${enabled ? 'Enable' : 'Disable'} a system key`,
        operationId: enabled
          ? 'apiKeysEnableSystemKey'
          : 'apiKeysDisableSystemKey',
        description: enabled
          ? `${manageAccess} The key works again.`
          : `${manageAccess} The key stops at once; a managed key's manager is told.`,
        responses: {
          200: dataResponse(SystemKeyViewSchema),
          ...apiErrorResponses,
          404: keyNotFound,
        },
      }),
      apiValidator('param', IdentityParams),
      async (context) => {
        const { identityId } = context.req.valid('param');
        return context.json({
          data: enabled
            ? await systemKeys.enable(identityId, userId(context))
            : await systemKeys.disable(identityId, userId(context)),
        });
      },
    );
  routes.delete(
    '/:identityId',
    access('manage'),
    describeRoute({
      tags,
      summary: 'Delete a system key',
      operationId: 'apiKeysDeleteSystemKey',
      description: `${manageAccess} Deletes the key, its service account and its permissions; its activity stays. A managed key's manager is told.`,
      responses: {
        204: emptyResponse('The key was deleted.'),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    async (context) => {
      await systemKeys.remove(
        context.req.valid('param').identityId,
        userId(context),
      );
      return context.body(null, 204);
    },
  );
  routes.get(
    '/:identityId/events',
    access('read'),
    describeRoute({
      tags,
      summary: "List a system key's activity",
      operationId: 'apiKeysListSystemKeyEvents',
      description: `${readAccess} Newest first: who did what and when, with what changed.`,
      responses: {
        200: listResponse(SystemKeyEventSchema, TotalMeta),
        ...apiErrorResponses,
        404: keyNotFound,
      },
    }),
    apiValidator('param', IdentityParams),
    async (context) => {
      const data = await systemKeys.events(
        context.req.valid('param').identityId,
      );
      return context.json({ data, meta: { total: data.length } });
    },
  );
}
