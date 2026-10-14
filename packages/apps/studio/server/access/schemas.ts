/**
 * The input and answers of the access routes (`routes.ts`). The shapes are checked here; what a value may be (a page, a capability,
 * a level an action offers, a role that exists) is the services' to say, with their own reasons.
 */
import {
  KEY_SCOPE_LEVELS,
  type AccessRef,
  type KeyScopeInput,
  type KeyScopeLevel,
  type KeyScopeOptions,
  type LocalizedText,
} from '@nocobase/app-plugin-api-keys/shared/scopes';
import { z } from 'zod';

import {
  LEVELS,
  type AccessCatalog,
  type AccessMe,
  type AccessSettings,
  type CatalogText,
  type CreatedOrgApiKey,
  type MemberWithRoles,
  type OrgApiKey,
  type OrgApiKeyEvent,
  type Role,
  type RoleTitle,
} from '../../shared/access.js';
import { PAGES } from '../../shared/pages.js';

export const RoleParams = z.object({ roleKey: z.string().min(1) });

export const MemberParams = z.object({ userId: z.string().min(1) });

export const KeyParams = z.object({ keyId: z.string().min(1) });

export const SaveRoleInput = z.strictObject({
  title: z.string().optional(),
  pages: z.array(z.string()).optional(),
  settings: z.record(z.string(), z.boolean()).optional(),
  abilities: z.record(z.string(), z.string()).optional(),
});

export const CreateRoleInput = SaveRoleInput.extend({ title: z.string() });

export const UpdateMemberInput = z.strictObject({
  roles: z.array(z.string()),
});

export const AccessSettingsInput = z.strictObject({
  defaultRole: z.string().nullable(),
});

export const KeyScopeInputSchema: z.ZodType<KeyScopeInput> = z.strictObject({
  groups: z.record(
    z.string().min(1),
    z.strictObject({
      level: z.enum(KEY_SCOPE_LEVELS as [KeyScopeLevel, ...KeyScopeLevel[]]),
      objects: z
        .union([z.literal('all'), z.array(z.string().min(1)).min(1)])
        .optional(),
    }),
  ),
});

export const CreateOrgKeyInput = z.strictObject({
  name: z.string(),
  description: z.string().nullable().optional(),
  expiresInDays: z.number().int().nullable(),
  scope: KeyScopeInputSchema,
});

export const UpdateOrgKeyInput = z.strictObject({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const SetOrgKeyScopeInput = z.strictObject({
  scope: KeyScopeInputSchema,
});

// ---------------------------------------------------------------------------------------------------------------------
// What the routes answer
// ---------------------------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

const RoleTitleSchema: z.ZodType<RoleTitle> = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    description: 'Plain text, or an i18n key in a namespace.',
  });

export const RoleSchema: z.ZodType<Role> = z
  .object({
    key: z.string(),
    title: RoleTitleSchema.nullable(),
    builtIn: z.boolean(),
    editable: z.boolean().meta({
      description: 'Whether its grants may be changed (not `owner`).',
    }),
    pages: z.array(z.enum(PAGES)),
    settings: z.record(z.string(), z.boolean()).meta({
      description:
        'Every settings capability of the catalog (`pm.members/read`), on or off.',
    }),
    abilities: z.record(z.string(), z.enum(LEVELS)).meta({
      description:
        'Every business action of the catalog (`pm.issues/edit`) at its level.',
    }),
    holderIds: z.array(z.string()).meta({
      description: 'Users assigned the role directly.',
    }),
    holderCount: z.number().int(),
  })
  .meta({ ref: 'StudioRole' });

const CatalogTextSchema: z.ZodType<CatalogText> = z.union([
  z.string(),
  z.object({ key: z.string(), ns: z.string() }),
]);

const CatalogSectionSchema = z.object({
  name: z.string(),
  title: CatalogTextSchema,
});

export const AccessCatalogSchema: z.ZodType<AccessCatalog> = z
  .object({
    businesses: z.array(
      z.object({
        type: z.string().meta({ description: 'The plugin’s resource type.' }),
        id: z.string(),
        title: CatalogTextSchema,
        description: CatalogTextSchema.optional(),
        section: CatalogSectionSchema.optional(),
        actions: z.array(
          z.object({
            key: z.string().meta({ description: '`business/action`.' }),
            name: z.string(),
            title: CatalogTextSchema.optional(),
            description: CatalogTextSchema.optional(),
            levels: z
              .array(
                z.object({
                  level: z.enum(['related', 'all']),
                  action: z.string().meta({
                    description:
                      'The authorization action that grants the level: `edit.related`, `edit.all`, or `create` for an action without levels.',
                  }),
                  title: CatalogTextSchema.optional(),
                  label: CatalogTextSchema.optional().meta({
                    description:
                      'The level’s short name in a level choice; for `related`, what it reaches.',
                  }),
                  description: CatalogTextSchema.optional().meta({
                    description:
                      'For `related`, one line on the records it reaches.',
                  }),
                }),
              )
              .meta({ description: 'The levels it offers, lowest first.' }),
          }),
        ),
      }),
    ),
    settings: z.array(
      z.object({
        id: z.string(),
        title: CatalogTextSchema,
        description: CatalogTextSchema.optional(),
        section: CatalogSectionSchema.optional(),
        actions: z.array(
          z.object({
            key: z.string().meta({ description: '`item/action`.' }),
            name: z.string(),
            title: CatalogTextSchema.optional(),
          }),
        ),
      }),
    ),
  })
  .meta({ ref: 'StudioAccessCatalog' });

export const MemberSchema: z.ZodType<MemberWithRoles> = z
  .object({
    userId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    roles: z.array(z.string()),
  })
  .meta({ ref: 'StudioMember' });

export const AccessSettingsSchema: z.ZodType<AccessSettings> = z
  .object({
    defaultRole: z.string().nullable().meta({
      description: 'The role a new member is given once, or null for none.',
    }),
  })
  .meta({ ref: 'StudioAccessSettings' });

export const AccessMeSchema: z.ZodType<AccessMe> = z.object({
  roles: z.array(z.string()),
  superuser: z.boolean().meta({
    description: 'A system administrator holds no role and may do everything.',
  }),
});

const LocalizedTextSchema: z.ZodType<LocalizedText> = z.union([
  z.string(),
  z.object({ key: z.string(), ns: z.string() }),
]);

const LevelSchema = z.enum(
  KEY_SCOPE_LEVELS as [KeyScopeLevel, ...KeyScopeLevel[]],
);

const KeyScopeSchema: z.ZodType<KeyScopeInput> = z
  .object({
    groups: z.record(
      z.string(),
      z.object({
        level: LevelSchema,
        objects: z.union([z.literal('all'), z.array(z.string())]).optional(),
      }),
    ),
  })
  .meta({
    ref: 'StudioOrgApiKeyScope',
    description:
      'The permission groups chosen, each at a level, some limited to records.',
  });

const AccessRefSchema: z.ZodType<AccessRef> = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('page'), id: z.string() }),
  z.object({ kind: z.literal('settings'), id: z.string(), action: z.string() }),
  z.object({ kind: z.literal('business'), id: z.string(), action: z.string() }),
]);

const levelRecord = <T extends z.ZodType>(value: T) =>
  z.partialRecord(LevelSchema, value);

export const KeyScopeOptionsSchema: z.ZodType<KeyScopeOptions> = z.object({
  groups: z.array(
    z.object({
      id: z.string(),
      category: z.enum(['business', 'administration', 'account']),
      title: LocalizedTextSchema,
      description: LocalizedTextSchema.nullable(),
      levels: z.array(LevelSchema),
      access: levelRecord(z.array(AccessRefSchema)),
      held: levelRecord(z.boolean()),
      objects: z
        .object({ business: z.string(), title: LocalizedTextSchema })
        .nullable(),
    }),
  ),
  presets: z.array(
    z.object({
      id: z.string(),
      title: LocalizedTextSchema,
      description: LocalizedTextSchema.nullable(),
      groups: z.record(
        z.string(),
        z.object({
          level: LevelSchema,
          objects: z.enum(['all', 'pick']).optional(),
        }),
      ),
      expiresInDays: z.number().int().nullable(),
    }),
  ),
  maxScopedKeyDays: z.number().int().nullable(),
  defaultExpiresInDays: z.number().int(),
  mayCreate: z.boolean().optional(),
});

const PersonRefSchema = z.object({ id: z.string(), name: z.string() });

export const OrgApiKeySchema: z.ZodType<OrgApiKey> = z
  .object({
    id: z.string().meta({
      description: 'The key identity’s id; it stays through a rotation.',
    }),
    keyId: z.string().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    scope: KeyScopeSchema.nullable(),
    start: z.string().nullable().meta({
      description: 'The first characters of the secret, to recognize it.',
    }),
    createdBy: PersonRefSchema.nullable(),
    createdAt: dateTime(),
    expiresAt: dateTime().nullable(),
    lastUsedAt: dateTime().nullable(),
    status: z.enum(['active', 'disabled', 'expired']),
    managedBy: z
      .object({
        resourceId: z.string(),
        projectId: z.string(),
        projectName: z.string(),
        repo: z.string().nullable(),
      })
      .nullable()
      .meta({
        description:
          'The repository whose CI Studio set up with this key and keeps it for; null for a key someone made.',
      }),
  })
  .meta({ ref: 'StudioOrgApiKey' });

export const CreatedOrgApiKeySchema: z.ZodType<CreatedOrgApiKey> = z
  .object({
    key: OrgApiKeySchema,
    secret: z.string().meta({ description: 'The secret, shown only once.' }),
  })
  .meta({ ref: 'StudioCreatedOrgApiKey' });

export const OrgApiKeyEventSchema: z.ZodType<OrgApiKeyEvent> = z.object({
  id: z.string(),
  action: z.enum([
    'created',
    'updated',
    'permissions-changed',
    'rotated',
    'disabled',
    'enabled',
    'deleted',
  ]),
  actor: PersonRefSchema.nullable(),
  details: z.record(z.string(), z.unknown()).nullable().meta({
    description:
      'For `permissions-changed`, the scope before and after; for `updated`, the fields changed.',
  }),
  createdAt: dateTime(),
});
