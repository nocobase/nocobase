import { z } from 'zod';

/**
 * Request schemas shared by the authorization settings surfaces and the rule plugins. Each one checks the shape of a
 * request; whether a rule's resource, actions and record access exist is checked against the registered model
 * afterwards, by `validateDataScopeRule`.
 */

type Strict<T extends z.core.$ZodLooseShape> = z.ZodObject<T, z.core.$strict>;
type Stripped<T extends z.core.$ZodLooseShape> = z.ZodObject<T, z.core.$strip>;

/** A `{ type, id }` reference: a resource, a subject or a principal. */
export const ReferenceInput: Strict<{ type: z.ZodString; id: z.ZodString }> =
  z.strictObject({
    type: z.string().trim().min(1),
    id: z.string().trim().min(1),
  });

/**
 * The fixed path segments a rule plugin registers beside `/:key` (`<path>/options`, `<path>/subjects/...` and
 * `<path>/records/...`). A rule keyed by one of them could not be addressed, so create and rename refuse them.
 */
export const RESERVED_RULE_KEYS: readonly string[] = Object.freeze([
  'options',
  'subjects',
  'records',
]);

/** A rule key: non-blank, and not one of `RESERVED_RULE_KEYS`. */
export const RuleKeyInput: z.ZodString = z
  .string()
  .trim()
  .min(1)
  .refine((key) => !RESERVED_RULE_KEYS.includes(key), {
    message: `Must not be one of the reserved keys: ${RESERVED_RULE_KEYS.join(', ')}.`,
  });

/**
 * The subjects a rule applies to. A subject listed twice is refused rather than collapsed, so the stored rule is
 * exactly what the administrator sent; the violation names the repeated entry, such as `subjects.2`.
 */
export const SubjectsInput: z.ZodArray<typeof ReferenceInput> = z
  .array(ReferenceInput)
  .superRefine((subjects, context) => {
    const seen = new Set<string>();
    for (const [index, subject] of subjects.entries()) {
      const id = JSON.stringify([subject.type, subject.id]);
      if (seen.has(id))
        context.addIssue({
          code: 'custom',
          path: [index],
          message: `Subject ${subject.type}:${subject.id} is listed more than once.`,
        });
      seen.add(id);
    }
  });

/** Plain text, or a translation descriptor rendered in the reader's language. */
export const TitleInput: z.ZodUnion<
  readonly [z.ZodString, Strict<{ key: z.ZodString; ns: z.ZodString }>]
> = z.union([
  z.string(),
  z.strictObject({
    key: z.string().trim().min(1),
    ns: z.string().trim().min(1),
  }),
]);

/** Which records of a collection an action reaches. */
export const RecordSelectionInput: z.ZodDiscriminatedUnion<
  [
    Strict<{ type: z.ZodLiteral<'all'> }>,
    Strict<{ type: z.ZodLiteral<'records'>; ids: z.ZodArray<z.ZodString> }>,
    Strict<{
      type: z.ZodLiteral<'recordAccess'>;
      key: z.ZodString;
      params: z.ZodOptional<z.ZodUnknown>;
    }>,
  ],
  'type'
> = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('all') }),
  z.strictObject({
    type: z.literal('records'),
    ids: z.array(z.string().min(1)),
  }),
  z.strictObject({
    type: z.literal('recordAccess'),
    key: z.string().min(1),
    params: z.unknown().optional(),
  }),
]);

export const RuleActionInput: Strict<{
  action: z.ZodString;
  scopeKey: z.ZodOptional<z.ZodString>;
  selection: typeof RecordSelectionInput;
}> = z.strictObject({
  action: z.string().trim().min(1),
  scopeKey: z.string().trim().min(1).optional(),
  selection: RecordSelectionInput,
});

/** The body that creates a default-access rule: one resource and the records each action reaches. */
export const DataScopeRuleBody: Strict<{
  key: z.ZodString;
  resource: typeof ReferenceInput;
  actions: z.ZodArray<typeof RuleActionInput>;
}> = z.strictObject({
  key: RuleKeyInput,
  resource: ReferenceInput,
  actions: z.array(RuleActionInput),
});

/** The body that updates a default-access rule: only the fields it changes. */
export const DataScopeRulePatchBody: Strict<{
  key: z.ZodOptional<z.ZodString>;
  resource: z.ZodOptional<typeof ReferenceInput>;
  actions: z.ZodOptional<z.ZodArray<typeof RuleActionInput>>;
}> = z.strictObject({
  key: RuleKeyInput.optional(),
  resource: ReferenceInput.optional(),
  actions: z.array(RuleActionInput).optional(),
});

/** The body that creates a sharing or restriction rule, which also names its subjects. */
export const SubjectRuleBody: Strict<{
  key: z.ZodString;
  title: z.ZodOptional<z.ZodNullable<typeof TitleInput>>;
  resource: typeof ReferenceInput;
  actions: z.ZodArray<typeof RuleActionInput>;
  subjects: z.ZodArray<typeof ReferenceInput>;
  reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}> = z.strictObject({
  key: RuleKeyInput,
  title: TitleInput.nullable().optional(),
  resource: ReferenceInput,
  actions: z.array(RuleActionInput),
  subjects: SubjectsInput,
  reason: z.string().nullable().optional(),
});

/** The body that updates a sharing or restriction rule: only the fields it changes; `null` clears a title or reason. */
export const SubjectRulePatchBody: Strict<{
  key: z.ZodOptional<z.ZodString>;
  title: z.ZodOptional<z.ZodNullable<typeof TitleInput>>;
  resource: z.ZodOptional<typeof ReferenceInput>;
  actions: z.ZodOptional<z.ZodArray<typeof RuleActionInput>>;
  subjects: z.ZodOptional<z.ZodArray<typeof ReferenceInput>>;
  reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}> = z.strictObject({
  key: RuleKeyInput.optional(),
  title: TitleInput.nullable().optional(),
  resource: ReferenceInput.optional(),
  actions: z.array(RuleActionInput).optional(),
  subjects: SubjectsInput.optional(),
  reason: z.string().nullable().optional(),
});

/** The path of one rule. */
export const RuleParams: Stripped<{ key: z.ZodString }> = z.object({
  key: z.string().min(1),
});

export const SubjectTypeParams: Stripped<{ type: z.ZodString }> = z.object({
  type: z.string().min(1),
});

/** A page of a subject directory. */
export const SubjectListQuery: Stripped<{
  q: z.ZodOptional<z.ZodString>;
  page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}> = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ResolveSubjectsBody: Strict<{
  ids: z.ZodArray<z.ZodString>;
}> = z.strictObject({
  ids: z.array(z.string().min(1)).max(100),
});

export const RecordsParams: Stripped<{ collection: z.ZodString }> = z.object({
  collection: z.string().min(1),
});

/** A page of a Collection's records for a record picker. */
export const RecordsQuery: Stripped<{
  page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}> = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type DataScopeRuleBody = z.infer<typeof DataScopeRuleBody>;
export type DataScopeRulePatchBody = z.infer<typeof DataScopeRulePatchBody>;
export type SubjectRuleBody = z.infer<typeof SubjectRuleBody>;
export type SubjectRulePatchBody = z.infer<typeof SubjectRulePatchBody>;

// Response schemas. They describe what the settings routes send in the API document at `/api/swagger/docs`; nothing
// validates a response against them. A rule plugin builds its rule schema from `DataScopeRuleSchema` or
// `SubjectRuleSchema` and gives it a `ref` of its own.

/** A `{ type, id }` reference to a resource, a subject or a principal. */
export const ReferenceSchema: z.ZodType = z
  .object({ type: z.string(), id: z.string() })
  .meta({ ref: 'AuthorizationReference' });

/** A title as stored: plain text, or a translation key and namespace. */
export const TitleSchema: z.ZodType = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    ref: 'AuthorizationTitle',
    description:
      'Plain text, or a `{ key, ns }` translation descriptor rendered in the reader’s language.',
  });

/** A display text: plain text, or a translation descriptor with an optional default. */
export const OptionTextSchema: z.ZodType = z
  .union([
    z.string(),
    z.object({
      key: z.string(),
      ns: z.string().optional(),
      defaultValue: z.string().optional(),
    }),
  ])
  .meta({
    ref: 'AuthorizationOptionText',
    description:
      'Plain text, or a `{ key, ns, defaultValue }` translation descriptor the client renders in the viewer’s language.',
  });

export const RecordSelectionSchema: z.ZodType = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('all') }),
    z.object({ type: z.literal('records'), ids: z.array(z.string()) }),
    z.object({
      type: z.literal('recordAccess'),
      key: z
        .string()
        .meta({ description: 'A registered record access definition.' }),
      params: z.unknown().optional(),
    }),
  ])
  .meta({
    ref: 'AuthorizationRecordSelection',
    description: 'Which records of a collection an action reaches.',
  });

export const RuleActionSchema: z.ZodType = z
  .object({
    action: z.string(),
    scopeKey: z.string().optional().meta({
      description:
        'The composite action’s data scope; absent for a rule on the resource itself.',
    }),
    selection: RecordSelectionSchema,
  })
  .meta({ ref: 'AuthorizationRuleAction' });

const dataScopeRuleShape = {
  key: z.string(),
  resource: ReferenceSchema,
  actions: z.array(RuleActionSchema),
};

/** A default-access rule as stored. Give it a `ref` with `.meta()` before declaring it. */
export const DataScopeRuleSchema: z.ZodObject = z.object(dataScopeRuleShape);

/** A sharing or restriction rule as stored. Give it a `ref` with `.meta()` before declaring it. */
export const SubjectRuleSchema: z.ZodObject = z.object({
  ...dataScopeRuleShape,
  title: TitleSchema.optional(),
  subjects: z.array(ReferenceSchema),
  reason: z.string().optional(),
});

/** The `meta` of a bounded configuration list. */
export const TotalMetaSchema: z.ZodType = z
  .object({ total: z.number().int() })
  .meta({ ref: 'AuthorizationTotalMeta' });

/** The `meta` of a page-numbered list. */
export const PageMetaSchema: z.ZodType = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })
  .meta({ ref: 'AuthorizationPageMeta' });

export const SubjectOptionSchema: z.ZodType = z
  .object({
    id: z.string(),
    title: OptionTextSchema,
    description: OptionTextSchema.optional(),
  })
  .meta({ ref: 'AuthorizationSubjectOption' });

export const RecordOptionSchema: z.ZodType = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })
  .meta({ ref: 'AuthorizationRecordOption' });

const OptionsActionSchema = z.object({
  name: z.string(),
  title: OptionTextSchema,
});

/** What every `options` route answers: the workspace catalogue the settings pages render. */
export const AuthorizationOptionsSchema: z.ZodType = z
  .object({
    sections: z.array(
      z.object({
        name: z.string(),
        title: OptionTextSchema,
        order: z.number(),
        subsections: z.array(
          z.object({
            name: z.string(),
            title: OptionTextSchema,
            recordType: z
              .object({
                type: z.string(),
                actions: z.array(OptionsActionSchema),
              })
              .optional()
              .meta({
                description:
                  'Set when the client supplies the resources of a record type, such as `page` from its route tree.',
              }),
            resources: z.array(
              z.object({
                type: z.string(),
                id: z.string(),
                title: OptionTextSchema,
                description: OptionTextSchema.optional(),
                group: z.string().optional(),
                actions: z.array(OptionsActionSchema),
                dataScopes: z
                  .record(
                    z.string(),
                    z.array(
                      z.object({
                        key: z.string(),
                        title: OptionTextSchema,
                        collection: z.string(),
                        fields: z.array(z.string()),
                        recordAccess: z.array(z.string()),
                        defaultValue: z.string().optional(),
                      }),
                    ),
                  )
                  .optional()
                  .meta({
                    description:
                      'Composites only: the data scopes of each action, keyed by action name.',
                  }),
              }),
            ),
          }),
        ),
      }),
    ),
    resourceGroups: z
      .array(
        z.object({
          name: z.string(),
          title: OptionTextSchema,
          parent: z.string().optional(),
          order: z.number().optional(),
        }),
      )
      .optional(),
    subjectTypes: z.array(
      z.object({
        type: z.string(),
        title: OptionTextSchema,
        selection: z.discriminatedUnion('type', [
          z.object({ type: z.literal('fixed'), id: z.string() }),
          z.object({ type: z.literal('collection') }),
        ]),
      }),
    ),
    recordAccess: z.array(
      z.object({
        key: z.string(),
        title: OptionTextSchema,
        description: OptionTextSchema.optional(),
        collections: z.array(z.string()),
      }),
    ),
    collections: z.array(
      z.object({ name: z.string(), fields: z.array(z.string()) }),
    ),
  })
  .meta({ ref: 'AuthorizationOptions' });
