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
