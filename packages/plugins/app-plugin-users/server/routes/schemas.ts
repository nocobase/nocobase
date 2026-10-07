import { z } from 'zod';

import type { UserPreferences } from '../preferences/service.js';
import type {
  PublicUserInvitation,
  UserInvitation,
  UserInvitationResult,
} from '../tokens.js';

const nonEmpty = z.string().trim().min(1);

export const UserParams: z.ZodObject<{ userId: z.ZodString }, z.core.$strip> =
  z.object({ userId: z.string().min(1) });

export const UserRoleScopeParams: z.ZodObject<
  { userId: z.ZodString; scope: z.ZodString },
  z.core.$strip
> = z.object({
  userId: z.string().min(1),
  scope: z.string().min(1),
});

export const ListUsersQuery: z.ZodObject<
  {
    page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<
      z.ZodEnum<{ enabled: 'enabled'; disabled: 'disabled' }>
    >;
    roleScope: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  status: z.enum(['enabled', 'disabled']).optional(),
  roleScope: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
});

/** One scope's roles: a single role, or a list that may be empty to clear an optional multi-role scope. */
export const UserRoleValueInput: z.ZodUnion<
  readonly [z.ZodString, z.ZodArray<z.ZodString>]
> = z.union([z.string().min(1), z.array(z.string().min(1))]);

export const CreateUserInput: z.ZodObject<
  {
    name: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    password: z.ZodString;
    roleScopes: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>
      >
    >;
  },
  z.core.$strict
> = z.strictObject({
  name: nonEmpty,
  username: nonEmpty.optional(),
  email: nonEmpty,
  password: nonEmpty,
  roleScopes: z.record(z.string().min(1), UserRoleValueInput).optional(),
});

export const UpdateUserInput: z.ZodObject<
  {
    name: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    email: z.ZodOptional<z.ZodString>;
  },
  z.core.$strict
> = z.strictObject({
  name: nonEmpty.optional(),
  username: nonEmpty.nullable().optional(),
  email: nonEmpty.optional(),
});

export const DeleteUserQuery: z.ZodObject<
  { confirm: z.ZodLiteral<'true'> },
  z.core.$strip
> = z.object({
  confirm: z.literal('true', {
    error: 'Confirm user deletion with confirm=true.',
  }),
});

export const ReplaceUserRoleScopeInput: z.ZodObject<
  { value: z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]> },
  z.core.$strict
> = z.strictObject({
  value: UserRoleValueInput,
});

export const ResetUserPasswordInput: z.ZodObject<
  { password: z.ZodString },
  z.core.$strict
> = z.strictObject({
  password: nonEmpty,
});

export type CreateUserInput = z.infer<typeof CreateUserInput>;
export type UpdateUserInput = z.infer<typeof UpdateUserInput>;

export const InvitationParams: z.ZodObject<
  { invitationId: z.ZodString },
  z.core.$strip
> = z.object({ invitationId: z.string().min(1) });

export const InviteUsersInput: z.ZodObject<
  {
    emails: z.ZodArray<z.ZodString>;
    roleScopes: z.ZodOptional<
      z.ZodRecord<
        z.ZodString,
        z.ZodUnion<readonly [z.ZodString, z.ZodArray<z.ZodString>]>
      >
    >;
  },
  z.core.$strict
> = z.strictObject({
  emails: z.array(nonEmpty).min(1),
  roleScopes: z.record(z.string().min(1), UserRoleValueInput).optional(),
});

/** The token travels in the body so request logs never record it. */
export const InvitationTokenInput: z.ZodObject<
  { token: z.ZodString },
  z.core.$strict
> = z.strictObject({ token: nonEmpty });

export const AcceptInvitationInput: z.ZodObject<
  { token: z.ZodString; name: z.ZodString; password: z.ZodString },
  z.core.$strict
> = z.strictObject({
  token: nonEmpty,
  name: nonEmpty,
  password: nonEmpty,
});

export const PreferenceParams: z.ZodObject<
  { key: z.ZodString },
  z.core.$strip
> = z.object({ key: z.string().min(1) });

/**
 * Several preferences by key. Keys and values are application-defined JSON, so they cannot be described here; the
 * preferences service checks each key and the encoded size of each value.
 */
export const PreferencesInput: z.ZodRecord<z.ZodString, z.ZodUnknown> =
  z.record(z.string(), z.unknown());

/** One preference's value: application-defined JSON, checked by the preferences service. */
export const PreferenceInput: z.ZodObject<
  { value: z.ZodUnknown },
  z.core.$strict
> = z.strictObject({ value: z.unknown() }).refine((input) => 'value' in input, {
  message: 'A preference is { value }.',
  path: ['value'],
});

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

/** An RFC 3339 timestamp, documented by its format alone rather than by the long pattern `z.iso.datetime()` emits. */
const dateTime = (): z.ZodString => z.string().meta({ format: 'date-time' });

const roleValue = z.union([z.string(), z.array(z.string())]).meta({
  description:
    'A single role for a `single` scope, or a list of roles for a `multiple` scope. An empty string or list means unassigned.',
});

export const ManagedUserSchema: z.ZodType = z
  .object({
    id: z.string(),
    name: z.string(),
    username: z.string().optional(),
    email: z.string(),
    emailVerified: z.boolean(),
    disabledAt: dateTime().nullable().meta({
      description: 'When the account was disabled; `null` while it is enabled.',
    }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
    roleScopes: z.record(z.string(), roleValue).meta({
      description:
        'The roles the user holds in each registered role scope, keyed by scope key.',
    }),
  })
  .meta({ ref: 'UsersUser' });

export const UsersPageMeta: z.ZodType = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z
      .number()
      .int()
      .meta({ description: 'The number of users matching the filters.' }),
  })
  .meta({ ref: 'UsersPageMeta' });

const RoleOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  labelI18nKey: z.string().optional(),
  labelI18nNs: z.string().optional(),
  description: z.string().optional(),
  assignable: z.boolean().optional().meta({
    description:
      'Defaults to true; false for a role this scope shows but does not let an administrator add.',
  }),
  removable: z.boolean().optional().meta({
    description:
      'Defaults to true; false for a protected assignment this scope does not let an administrator revoke.',
  }),
});

export const UserManagementOptionsSchema: z.ZodType = z
  .object({
    roleScopes: z.array(
      z.object({
        key: z.string().meta({
          description:
            'The scope key used in `roleScopes` and in `/api/users/{userId}/roleScopes/{scope}`.',
        }),
        label: z.string(),
        labelI18nKey: z.string().optional(),
        labelI18nNs: z.string().optional(),
        selection: z.enum(['single', 'multiple']),
        requiredOnCreate: z.boolean(),
        hasAuthenticatedDefaultAccess: z.boolean().meta({
          description:
            'Whether permissions granted to every signed-in user apply alongside the roles this scope shows.',
        }),
        options: z.array(RoleOptionSchema),
      }),
    ),
  })
  .meta({ ref: 'UsersManagementOptions' });

export const UserInvitationSchema: z.ZodType<UserInvitation> = z
  .object({
    id: z.string(),
    email: z.string(),
    status: z.enum(['pending', 'accepted', 'revoked', 'expired']).meta({
      description: '`expired` is derived from `expiresAt`.',
    }),
    invitedBy: z.object({ id: z.string(), name: z.string() }),
    roleScopes: z.record(z.string(), roleValue).meta({
      description:
        'The roles the account gets when it is created on acceptance.',
    }),
    data: z.record(z.string(), z.unknown()).meta({
      description:
        'What the inviter attached for `onInvitationAccepted` handlers.',
    }),
    summary: z.array(z.string()).meta({
      description:
        'Shown to the invitee, for example the names of the projects they join.',
    }),
    expiresAt: dateTime(),
    sentAt: dateTime().nullable().meta({
      description: 'The last successful send; `null` when sending failed.',
    }),
    createdAt: dateTime(),
  })
  .meta({ ref: 'UsersInvitation' });

export const UserInvitationResultSchema: z.ZodType<UserInvitationResult> = z
  .discriminatedUnion('outcome', [
    z.object({
      email: z.string(),
      outcome: z.literal('invited'),
      invitationId: z.string(),
      emailSent: z.boolean(),
      inviteUrl: z.string().optional().meta({
        description:
          'Returned once when sending failed, for the inviter to forward.',
      }),
    }),
    z.object({
      email: z.string(),
      outcome: z.literal('existingUser').meta({
        description: 'The address already has an account; nothing was sent.',
      }),
      userId: z.string(),
    }),
  ])
  .meta({ ref: 'UsersInvitationResult' });

export const PublicUserInvitationSchema: z.ZodType<PublicUserInvitation> =
  z.object({
    email: z.string(),
    inviterName: z.string(),
    summary: z.array(z.string()),
    expiresAt: dateTime(),
  });

export const AcceptedInvitationSchema: z.ZodType<{
  email: string;
  existingAccount: boolean;
}> = z.object({
  email: z.string(),
  existingAccount: z.boolean().meta({
    description:
      'The address had an account already: nothing was created, and it signs in with its own password.',
  }),
});

export const UserPreferencesSchema: z.ZodType<UserPreferences> = z
  .record(z.string(), z.json())
  .meta({
    ref: 'UsersPreferences',
    description:
      "The signed-in person's preferences by key; each value is application-defined JSON.",
  });

export const UserPreferenceSchema: z.ZodType<{ value: unknown }> = z.object({
  value: z.json().meta({ description: 'Application-defined JSON.' }),
});

/** Pending and expired invitations are a bounded list, so it is not paged. */
export const InvitationsMeta: z.ZodType<{ total: number }> = z.object({
  total: z.number().int(),
});
