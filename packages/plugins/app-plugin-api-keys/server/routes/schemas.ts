import { z } from 'zod';

import {
  KEY_SCOPE_LEVELS,
  type AccessRef,
  type ApiKeyDetailView,
  type ApiKeyView,
  type CreateApiKeyRequest,
  type GrantablePermissions,
  type KeyPermissions,
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

const KeyResourceSchema = z.object({
  type: z.string().min(1).describe('The resource type, such as `settings`.'),
  id: z.string().min(1).describe('The resource id.'),
});

const KeyPolicySchema = z
  .looseObject({ type: z.string().min(1) })
  .describe(
    'The record scopes of a composite action: `{ type: "composite", scopes: { <scope>: <selection> } }`.',
  );

const KeyPermissionGrantSchema = z.object({
  resource: KeyResourceSchema,
  actions: z.array(
    z.object({
      action: z.string().min(1),
      policy: KeyPolicySchema.optional(),
    }),
  ),
});

/** Format-`2` permissions, as a permission set's grants; what each names is checked by `ScopedApiKeys`. */
export const KeyPermissionsSchema: z.ZodType<KeyPermissions> = z
  .object({
    grants: z.array(KeyPermissionGrantSchema),
    objects: z
      .record(z.string(), z.array(z.string()))
      .optional()
      .describe(
        'The records each business is limited to; every record when left out.',
      ),
  })
  .meta({
    ref: 'ApiKeysKeyPermissions',
    description:
      'What the key may do, as a permission set’s grants; the key never exceeds its holder’s current permissions.',
  });

/** The body of `POST /apiKeys`. */
export const CreateApiKeyInput: z.ZodType<CreateApiKeyRequest> = z.strictObject(
  {
    name: z.string().describe('The name to display.'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('A description of the record.'),
    expiresInDays: z
      .number()
      .int()
      .nullable()
      .describe(
        'The number of days until the key expires; null means no expiry.',
      ),
    scope: KeyScopeInputSchema.nullable().optional().meta({
      deprecated: true,
      description:
        'Deprecated: send `permissions`. The format-1 permission scope; null makes a key that acts as the caller in full.',
    }),
    permissions: KeyPermissionsSchema.nullable()
      .optional()
      .describe(
        'What the key may do; null makes a key that acts as the caller in full. Send this or `scope`, not both.',
      ),
  },
);

export const ApiKeyParams: z.ZodObject<{ keyId: z.ZodString }> = z.object({
  keyId: z.string().min(1).describe('The key identifier.'),
});

export const ScopeGroupParams: z.ZodObject<{ group: z.ZodString }> = z.object({
  group: z.string().min(1).describe('The API key scope group.'),
});

export const ObjectSourceParams: z.ZodObject<{ business: z.ZodString }> =
  z.object({
    business: z
      .string()
      .min(1)
      .describe(
        'A business whose records a key may be limited to, such as `rel.apps`; its grants name it as their resource id.',
      ),
  });

const MAX_PICKED_IDS = 100;

/** The query of `GET /apiKeys/scopeObjects/:group`: a search, or the records to look up by id (`id` repeated). */
export const ScopeObjectsQuery: z.ZodType<{
  q?: string | undefined;
  id?: string[] | undefined;
}> = z.object({
  q: z.string().max(200).optional().describe('Text to search for.'),
  id: z
    .union([z.string().min(1), z.array(z.string().min(1)).max(MAX_PICKED_IDS)])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : Array.isArray(value) ? value : [value],
    )
    .describe('The record identifier.'),
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
      deprecated: true,
      description:
        'Deprecated: read `permissions`. The format-1 groups of the key; null for a key that acts as its owner in full.',
    }),
    permissions: KeyPermissionsSchema.nullable().meta({
      description: 'Null for a key that acts as its owner in full.',
    }),
  })
  .meta({ ref: 'ApiKeysKey' });

const GrantableActionSchema = z.object({
  action: z.string(),
  title: LocalizedTextSchema.nullable(),
  humanOnly: LocalizedTextSchema.nullable().meta({
    description: 'Why no key may hold this action; null when a key may.',
  }),
  risk: z.enum(['high', 'sensitive']).nullable(),
  scopes: z.record(z.string(), z.array(z.string())).optional().meta({
    description:
      'For a composite action, the record access keys the caller holds each data scope at; a key may be given these or narrower ones. Absent when every scope is open to the caller.',
  }),
});

export const GrantablePermissionsSchema: z.ZodType<GrantablePermissions> =
  z.object({
    unrestricted: z.boolean(),
    grants: z
      .array(
        z.object({
          resource: KeyResourceSchema,
          title: LocalizedTextSchema.nullable(),
          actions: z.array(GrantableActionSchema),
        }),
      )
      .meta({ description: 'The actions the caller holds today.' }),
    templates: z.array(
      z.object({
        id: z.string(),
        title: LocalizedTextSchema,
        description: LocalizedTextSchema.nullable(),
        expiresInDays: z.number().int().nullable(),
        permissions: KeyPermissionsSchema,
        pick: z.array(z.string()).meta({
          description:
            'The businesses whose records the key is limited to, chosen when it is made.',
        }),
      }),
    ),
    objectSources: z.array(z.string()),
    maxScopedKeyDays: z.number().int().nullable(),
    defaultExpiresInDays: z.number().int(),
    mayCreate: z.boolean(),
    allowSameAsMe: z.boolean().meta({
      description:
        'Whether a key that acts as the caller in full (`permissions: null`) may be created.',
    }),
  });

export const ApiKeyDetailSchema: z.ZodType<ApiKeyDetailView> = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    start: z.string().nullable(),
    enabled: z.boolean(),
    createdAt: dateTime(),
    expiresAt: dateTime().nullable(),
    lastUsedAt: dateTime().nullable(),
    scope: KeyScopeResponseSchema.nullable().meta({ deprecated: true }),
    permissions: KeyPermissionsSchema.nullable(),
    lapsed: z.array(KeyPermissionGrantSchema).meta({
      description:
        'The actions of `permissions` the owner no longer holds: the key lost them too, and gets them back when the owner does.',
    }),
  })
  .meta({ ref: 'ApiKeysKeyDetail' });

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

/** `GET /api/apiKeys`'s meta: what the caller may create, so a list shows or hides New key without another request. */
export const OwnApiKeysListMeta: z.ZodType<{
  total: number;
  mayCreate: boolean;
  allowSameAsMe: boolean;
}> = z.object({
  total: z.number().int(),
  mayCreate: z.boolean().meta({
    description: 'Whether the caller may create keys of their own.',
  }),
  allowSameAsMe: z.boolean().meta({
    description:
      'Whether a key that acts as the caller in full may be created.',
  }),
});
