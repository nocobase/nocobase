import { z } from 'zod';

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
