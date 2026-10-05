import { z } from 'zod';
import {
  ReferenceInput,
  ReferenceSchema,
  TitleInput,
  TitleSchema,
} from '../extension/schemas.js';

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

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

export const PermissionGrantSchema: z.ZodType = z
  .object({
    resource: ReferenceSchema,
    actions: z.array(
      z.object({
        action: z.string(),
        policy: z.looseObject({ type: z.string() }).optional().meta({
          description:
            'A policy the resource type reads, such as a composite grant’s data scopes; its other fields depend on `type`.',
        }),
      }),
    ),
  })
  .meta({ ref: 'AuthorizationPermissionGrant' });

const writeOperation = z.enum([
  'create',
  'update',
  'delete',
  'assign',
  'revoke',
]);

export const PermissionSetSchema: z.ZodType = z
  .object({
    key: z.string(),
    title: TitleSchema.optional(),
    grants: z.array(PermissionGrantSchema),
    protection: z
      .object({
        owner: z
          .string()
          .meta({ description: 'Who protects the set, such as a plugin.' }),
        allow: z.array(writeOperation).meta({
          description: 'What the generic API may still do to the set.',
        }),
        requireActiveAssignment: z.boolean().optional(),
        unrestricted: z.boolean().optional(),
        assignableTo: z.array(z.string()).optional().meta({
          description:
            'Subject types the set may be assigned to; absent means any.',
        }),
      })
      .optional()
      .meta({ description: 'Present when the set is protected.' }),
    unrestricted: z.boolean().optional().meta({
      description: 'True when holding the set grants unrestricted access.',
    }),
  })
  .meta({ ref: 'AuthorizationPermissionSet' });

export const PermissionSetAssignmentSchema: z.ZodType = z
  .object({
    id: z.string(),
    subject: ReferenceSchema,
    permissionSet: z.string().meta({ description: 'The Permission Set key.' }),
  })
  .meta({ ref: 'AuthorizationPermissionSetAssignment' });

export const AuthorizationDecisionSchema: z.ZodType = z
  .object({
    effect: z.enum(['permit', 'conditional', 'deny']).meta({
      description:
        '`conditional` permits only the records or fields `conditions` describes.',
    }),
    conditions: z.looseObject({ type: z.string() }).optional(),
    reasons: z.array(
      z.object({
        code: z.string(),
        message: z.string(),
        plugin: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
    checks: z.array(z.unknown()).optional().meta({
      description:
        'For a composite resource: the decision of each underlying check.',
    }),
  })
  .meta({ ref: 'AuthorizationDecision' });

export const BatchDecisionSchema: z.ZodType = z.object({
  resource: ReferenceSchema,
  action: z.string(),
  decision: AuthorizationDecisionSchema,
});

export const ConfiguredAccessSchema: z.ZodType = z
  .object({
    unrestricted: z.boolean().meta({
      description:
        'True when one of the subject’s Permission Sets grants unrestricted access.',
    }),
    types: z
      .array(z.string())
      .meta({ description: 'The resource types the stored grants cover.' }),
    resources: z.array(ReferenceSchema).meta({
      description:
        'Every resource a stored grant gives at least one action on.',
    }),
    identity: z.object({
      subjects: z.array(ReferenceSchema).meta({
        description:
          'The subjects the request middleware adds for this principal.',
      }),
    }),
    sets: z.array(
      z.object({
        key: z.string(),
        title: TitleSchema.optional(),
        sources: z.array(ReferenceSchema).meta({
          description:
            'The assignments of the principal or its subjects that bring this set.',
        }),
      }),
    ),
  })
  .meta({ ref: 'AuthorizationConfiguredAccess' });

export const AuthorizationSnapshotSchema: z.ZodType = z
  .object({
    unrestricted: z.boolean().meta({
      description:
        'True when every action is permitted; `permissions` is then empty.',
    }),
    permissions: z.array(
      z.object({ resource: ReferenceSchema, actions: z.array(z.string()) }),
    ),
  })
  .meta({
    ref: 'AuthorizationSnapshot',
    description:
      'What the client may show for the signed-in user. It is never an executable data policy: the server checks every request again.',
  });
