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
