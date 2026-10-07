import { z } from 'zod';

import {
  KEY_SCOPE_LEVELS,
  type AccessRef,
  type ApiKeyView,
  type CreateApiKeyRequest,
  type CreatedApiKey,
  type KeyScopeObject,
  type KeyScopeOptions,
  type LocalizedText,
  type KeyScopeGroupGrant,
  type KeyScopeInput,
  type KeyScopeLevel,
} from '../../shared/scopes.js';

const KeyScopeLevelSchema: z.ZodType<KeyScopeLevel> = z.enum(
  KEY_SCOPE_LEVELS as [KeyScopeLevel, ...KeyScopeLevel[]],
);

const KeyScopeGroupGrantSchema: z.ZodType<KeyScopeGroupGrant> = z.strictObject({
  level: KeyScopeLevelSchema,
  objects: z
    .union([z.literal('all'), z.array(z.string().min(1)).min(1)])
    .optional(),
});

/** A key's scope; which groups exist and what they offer is checked by `ApiKeyScopes.validate`. */
export const KeyScopeInputSchema: z.ZodType<KeyScopeInput> = z.strictObject({
  groups: z.record(z.string().min(1), KeyScopeGroupGrantSchema),
});

/** The body of `POST /apiKeys`. */
export const CreateApiKeyInput: z.ZodType<CreateApiKeyRequest> = z.strictObject(
  {
    name: z.string(),
    description: z.string().nullable().optional(),
    expiresInDays: z.number().int().nullable(),
    scope: KeyScopeInputSchema.nullable(),
  },
);

export const ApiKeyParams: z.ZodObject<{ keyId: z.ZodString }> = z.object({
  keyId: z.string().min(1),
});

export const ScopeGroupParams: z.ZodObject<{ group: z.ZodString }> = z.object({
  group: z.string().min(1),
});

const MAX_PICKED_IDS = 100;

/** The query of `GET /apiKeys/scopeObjects/:group`: a search, or the records to look up by id (`id` repeated). */
export const ScopeObjectsQuery: z.ZodType<{
  q?: string | undefined;
  id?: string[] | undefined;
}> = z.object({
  q: z.string().max(200).optional(),
  id: z
    .union([z.string().min(1), z.array(z.string().min(1)).max(MAX_PICKED_IDS)])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Array.isArray(value) ? value : [value],
    ),
});

// Response schemas: they document what the routes send; nothing validates a response against them.

const dateTime = (): z.ZodString => z.string().meta({ format: 'date-time' });

const LocalizedTextSchema: z.ZodType<LocalizedText> = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    ref: 'ApiKeysLocalizedText',
    description: 'Plain text, or an i18n key in a namespace.',
  });

const AccessRefSchema: z.ZodType<AccessRef> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('page'), id: z.string() }),
  z.object({ kind: z.literal('settings'), id: z.string(), action: z.string() }),
  z.object({ kind: z.literal('business'), id: z.string(), action: z.string() }),
]);

const GrantResponseSchema = z.object({
  level: KeyScopeLevelSchema,
  objects: z.union([z.literal('all'), z.array(z.string())]).optional(),
});

const KeyScopeResponseSchema: z.ZodType<KeyScopeInput> = z
  .object({ groups: z.record(z.string(), GrantResponseSchema) })
  .meta({
    ref: 'ApiKeysKeyScope',
    description:
      'What the key may do, group by group; a group left out grants nothing.',
  });

export const KeyScopeOptionsSchema: z.ZodType<KeyScopeOptions> = z.object({
  groups: z
    .array(
      z.object({
        id: z.string(),
        category: z.enum(['business', 'administration', 'account']),
        title: LocalizedTextSchema,
        description: LocalizedTextSchema.nullable(),
        levels: z.array(KeyScopeLevelSchema),
        access: z.partialRecord(KeyScopeLevelSchema, z.array(AccessRefSchema)),
        held: z.partialRecord(KeyScopeLevelSchema, z.boolean()).meta({
          description:
            'Whether the caller holds everything up to each level; false shows it greyed out.',
        }),
        objects: z
          .object({ business: z.string(), title: LocalizedTextSchema })
          .nullable(),
      }),
    )
    .meta({ description: 'Empty when scoped keys are not offered.' }),
  presets: z.array(
    z.object({
      id: z.string(),
      title: LocalizedTextSchema,
      description: LocalizedTextSchema.nullable(),
      groups: z.record(
        z.string(),
        z.object({
          level: KeyScopeLevelSchema,
          objects: z.enum(['all', 'pick']).optional(),
        }),
      ),
      expiresInDays: z.number().int().nullable(),
    }),
  ),
  maxScopedKeyDays: z.number().int().nullable().meta({
    description:
      'The longest a scoped key may live, in days; null when "never expires" is allowed.',
  }),
  defaultExpiresInDays: z.number().int(),
  mayCreate: z.boolean().optional().meta({
    description: 'Whether the caller may create keys of their own.',
  }),
});

export const KeyScopeObjectSchema: z.ZodType<KeyScopeObject> = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const ApiKeyViewSchema: z.ZodType<ApiKeyView> = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    start: z.string().nullable().meta({
      description: 'The first characters of the key, to recognize it.',
    }),
    enabled: z.boolean(),
    createdAt: dateTime(),
    expiresAt: dateTime().nullable(),
    lastUsedAt: dateTime().nullable(),
    scope: KeyScopeResponseSchema.nullable().meta({
      description: 'Null for a key that acts as its owner in full.',
    }),
  })
  .meta({ ref: 'ApiKeysKey' });

export const CreatedApiKeySchema: z.ZodType<CreatedApiKey> = z
  .object({
    key: ApiKeyViewSchema,
    secret: z.string().meta({
      description: 'The key itself, shown only in this response.',
    }),
  })
  .meta({ ref: 'ApiKeysCreatedKey' });

export const ApiKeysListMeta: z.ZodType<{ total: number }> = z.object({
  total: z.number().int(),
});
