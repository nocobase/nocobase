import { z } from 'zod';
import { ReferenceInput, TitleInput } from '../extension/schemas.js';

type Strict<T extends z.core.$ZodLooseShape> = z.ZodObject<T, z.core.$strict>;
type Stripped<T extends z.core.$ZodLooseShape> = z.ZodObject<T, z.core.$strip>;

export const PermissionGrantActionInput: Strict<{
  action: z.ZodString;
  policy: z.ZodOptional<z.ZodObject<{ type: z.ZodString }, z.core.$loose>>;
}> = z.strictObject({
  action: z.string().min(1),
  // A policy belongs to the resource type that reads it, so only its `type` is checked here.
  policy: z.looseObject({ type: z.string().min(1) }).optional(),
});

export const PermissionGrantInput: Strict<{
  resource: Strict<{ type: z.ZodString; id: z.ZodString }>;
  actions: z.ZodArray<typeof PermissionGrantActionInput>;
}> = z.strictObject({
  resource: z.strictObject({
    type: z.string().min(1),
    id: z.string().min(1),
  }),
  actions: z.array(PermissionGrantActionInput),
});

export const CreatePermissionSetBody: Strict<{
  key: z.ZodString;
  title: z.ZodOptional<z.ZodNullable<typeof TitleInput>>;
  grants: z.ZodArray<typeof PermissionGrantInput>;
}> = z.strictObject({
  key: z.string().min(1),
  title: TitleInput.nullable().optional(),
  grants: z.array(PermissionGrantInput),
});

/** Only the fields that change; `key` renames the set and `title: null` clears its title. */
export const UpdatePermissionSetBody: Strict<{
  key: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodNullable<typeof TitleInput>>;
  grants: z.ZodOptional<z.ZodArray<typeof PermissionGrantInput>>;
}> = z.strictObject({
  key: z.string().min(1).optional(),
  title: TitleInput.nullable().optional(),
  grants: z.array(PermissionGrantInput).optional(),
});

export const PermissionSetParams: Stripped<{ key: z.ZodString }> = z.object({
  key: z.string().min(1),
});

export const AssignmentParams: Stripped<{
  key: z.ZodString;
  assignmentId: z.ZodString;
}> = z.object({
  key: z.string().min(1),
  assignmentId: z.string().min(1),
});

/** Narrows the list to the sets one subject holds, including the default sets every subject holds. */
export const ListPermissionSetsQuery: Stripped<{
  subjectType: z.ZodOptional<z.ZodString>;
  subjectId: z.ZodOptional<z.ZodString>;
}> = z.object({
  subjectType: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
});

export const AssignPermissionSetBody: Strict<{
  id: z.ZodOptional<z.ZodString>;
  subject: typeof ReferenceInput;
}> = z.strictObject({
  id: z.string().min(1).optional(),
  subject: ReferenceInput,
});

export const DecideBody: Strict<{
  subject: typeof ReferenceInput;
  resource: typeof ReferenceInput;
  action: z.ZodString;
}> = z.strictObject({
  subject: ReferenceInput,
  resource: ReferenceInput,
  action: z.string().min(1),
});

export const BatchDecideBody: Strict<{
  subject: typeof ReferenceInput;
  checks: z.ZodArray<
    Strict<{ resource: typeof ReferenceInput; action: z.ZodString }>
  >;
}> = z.strictObject({
  subject: ReferenceInput,
  checks: z
    .array(
      z.strictObject({
        resource: ReferenceInput,
        action: z.string().min(1),
      }),
    )
    .min(1)
    .max(100),
});

export const ConfiguredAccessQuery: Stripped<{
  subjectType: z.ZodString;
  subjectId: z.ZodString;
}> = z.object({
  subjectType: z.string().min(1),
  subjectId: z.string().min(1),
});
