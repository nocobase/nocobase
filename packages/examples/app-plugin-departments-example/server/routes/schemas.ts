import type { AuthorizationTitle } from '@nocobase/authorization/core';
import { z } from 'zod';

// Each schema is annotated with the value it produces, which isolated declarations require of an export.

const nonEmpty = z.string().min(1);

export interface DepartmentParams {
  readonly departmentId: string;
}
export const DepartmentParams: z.ZodType<DepartmentParams> = z.object({
  departmentId: nonEmpty,
});

export interface MemberParams extends DepartmentParams {
  readonly userId: string;
}
export const MemberParams: z.ZodType<MemberParams> = z.object({
  departmentId: nonEmpty,
  userId: nonEmpty,
});

/** A department's fields a client may set. The service checks the id format, the title and the referenced records. */
export interface CreateDepartmentInput {
  readonly id?: string | undefined;
  readonly title: string;
  readonly parentId?: string | null | undefined;
  readonly region?: string | null | undefined;
  readonly managerId?: string | null | undefined;
  readonly sortOrder?: number | undefined;
}
export const CreateDepartmentInput: z.ZodType<CreateDepartmentInput> =
  z.strictObject({
    id: nonEmpty.optional(),
    title: z.string(),
    parentId: nonEmpty.nullable().optional(),
    region: nonEmpty.nullable().optional(),
    managerId: nonEmpty.nullable().optional(),
    sortOrder: z.int().optional(),
  });

export interface UpdateDepartmentInput {
  readonly title?: string | undefined;
  readonly parentId?: string | null | undefined;
  readonly region?: string | null | undefined;
  readonly managerId?: string | null | undefined;
  readonly sortOrder?: number | undefined;
}
export const UpdateDepartmentInput: z.ZodType<UpdateDepartmentInput> =
  z.strictObject({
    title: nonEmpty.optional(),
    parentId: nonEmpty.nullable().optional(),
    region: nonEmpty.nullable().optional(),
    managerId: nonEmpty.nullable().optional(),
    sortOrder: z.int().optional(),
  });

export interface AddMemberInput {
  readonly userId: string;
  readonly primary?: boolean | undefined;
}
export const AddMemberInput: z.ZodType<AddMemberInput> = z.strictObject({
  userId: nonEmpty,
  primary: z.boolean().optional(),
});

export interface MemberCandidatesQuery {
  readonly q?: string | undefined;
  readonly page: number;
  readonly pageSize: number;
}
export const MemberCandidatesQuery: z.ZodType<MemberCandidatesQuery> = z.object(
  {
    q: z.string().max(255).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  },
);

// Response schemas. Each carries a `ref` so the API document names it once and refers to it from every route.

/** Plain text, or the translation descriptor a seeded record stores. */
const Title: z.ZodType<AuthorizationTitle> = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    ref: 'DepartmentsExampleTitle',
    description:
      "Plain text, or a `{ key, ns }` translation descriptor rendered in the reader's language.",
  });

/** A user as a picker shows it: the name as `title`, the email as `description`. */
export interface UserOptionBody {
  readonly id: string;
  readonly title: string;
  readonly description?: string | undefined;
}
export const UserOption: z.ZodType<UserOptionBody> = z
  .object({
    id: z.string().meta({ description: 'The user id.' }),
    title: z.string().meta({ description: 'The user name.' }),
    description: z.string().optional().meta({ description: 'The user email.' }),
  })
  .meta({ ref: 'DepartmentsExampleUserOption' });

export interface DepartmentBody {
  readonly id: string;
  readonly title: AuthorizationTitle;
  readonly parentId: string | null;
  readonly region: string | null;
  readonly managerId: string | null;
  readonly manager: UserOptionBody | null;
  readonly active: boolean;
  readonly sortOrder: number;
}
export const Department: z.ZodType<DepartmentBody> = z
  .object({
    id: z.string(),
    title: Title,
    parentId: z
      .string()
      .nullable()
      .meta({ description: 'The parent department; `null` at the root.' }),
    region: z.string().nullable().meta({
      description:
        'The business region its members work in, such as `North`; `null` when it has none.',
    }),
    managerId: z.string().nullable().meta({
      description: "The head's user id. The head need not be a member.",
    }),
    manager: UserOption.nullable().meta({
      description: 'The head with its display name; `null` without a head.',
    }),
    active: z.boolean().meta({
      description:
        'An inactive department passes no inherited scope to its subtree.',
    }),
    sortOrder: z.number().int(),
  })
  .meta({ ref: 'DepartmentsExampleDepartment' });

export interface DepartmentMemberBody {
  readonly userId: string;
  readonly title: string;
  readonly description?: string | undefined;
  readonly primary: boolean;
}
export const DepartmentMember: z.ZodType<DepartmentMemberBody> = z
  .object({
    userId: z.string(),
    title: z.string().meta({ description: 'The user name.' }),
    description: z.string().optional().meta({ description: 'The user email.' }),
    primary: z.boolean().meta({
      description: "Whether this is the user's primary department.",
    }),
  })
  .meta({ ref: 'DepartmentsExampleMember' });
