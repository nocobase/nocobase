import { z } from 'zod';

const text = z.string().max(500);

/** Page-number paging for the sales lists: 20 rows by default, at most 100. */
export const SalesListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SalesListQuery = z.infer<typeof SalesListQuery>;

export const QuoteParams = z.object({ quoteId: z.string().min(1) });
export const OrderParams = z.object({ orderId: z.string().min(1) });

/** The fields a draft quote may change; a client sends only the ones it changes. */
export const UpdateQuoteInput = z
  .strictObject({
    amount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    notes: text,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Expected at least one field.',
  });
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteInput>;

/** A blank reference is refused in the handler with its own reason, `DELIVERY_REFERENCE_REQUIRED`. */
export const DeliverOrderInput = z.strictObject({ deliveryReference: text });
export type DeliverOrderInput = z.infer<typeof DeliverOrderInput>;

/**
 * A Repository mutation tree for the order's relations, such as `{ carrier: { connect: { id } } }`. Only the relation
 * names are checked here: the Repository validates each tree against the bound Policy, which decides what may change.
 */
export const UpdateOrderRelationsInput = z
  .strictObject({
    carrier: z.unknown(),
    checks: z.unknown(),
    collaborators: z.unknown(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Expected at least one relation.',
  });
export type UpdateOrderRelationsInput = z.infer<
  typeof UpdateOrderRelationsInput
>;

/** The `values` of a `salesProjects/updateOne` request: only a project's title and notes are editable. */
export const ProjectUpdateInput = z.looseObject({
  values: z
    .strictObject({ title: text, notes: text })
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Expected at least one field.',
    }),
});

// Response schemas. Each carries a `ref` so the API document names it once and refers to it from every route. The
// sales records are read through the caller's Repository Policy, so a field the Policy does not show is absent.

const policyNote = 'Fields the caller may not read are absent.';

const ProjectSummary = z
  .object({ title: z.string(), region: z.string() })
  .meta({
    ref: 'AuthorizationExampleProjectSummary',
    description:
      'The quote’s project, present when the caller may view that project.',
  });

/** Why an operation on a listed row is or is not available to the caller. */
const operationAccess = (
  values: readonly [string, ...string[]],
  what: string,
) =>
  z.enum(values).meta({
    description: `Whether the caller may ${what} this row: \`allowed\`, or the reason it may not.`,
  });

/** Page-number paging plus the sales pages the caller may open. */
export const SalesListMeta = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    navigation: z
      .object({
        projects: z.boolean(),
        quotes: z.boolean(),
        orders: z.boolean(),
      })
      .meta({ description: 'Which sales pages the caller may open.' }),
  })
  .meta({ ref: 'AuthorizationExampleSalesListMeta' });

const ProjectFields = {
  id: z.string(),
  title: z.string().optional(),
  region: z.string().optional(),
  ownerId: z.string().optional(),
  confidential: z.boolean().optional(),
  notes: z.string().optional(),
};

export const SalesProjectRow = z
  .object({
    ...ProjectFields,
    operations: z.object({
      edit: operationAccess(['allowed', 'notGranted', 'outsideScope'], 'edit'),
    }),
  })
  .meta({ ref: 'AuthorizationExampleProjectRow', description: policyNote });

const QuoteFields = {
  id: z.string(),
  title: z.string().optional(),
  projectId: z.string().optional(),
  preparedById: z.string().optional(),
  preparedByName: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().int().optional(),
  status: z
    .string()
    .optional()
    .meta({ description: '`draft`, `submitted` or `accepted`.' }),
};

export const SalesQuote = z
  .object(QuoteFields)
  .meta({ ref: 'AuthorizationExampleQuote', description: policyNote });

export const SalesQuoteRow = z
  .object({
    ...QuoteFields,
    project: ProjectSummary.optional(),
    operations: z.object({
      edit: operationAccess(
        ['allowed', 'notGranted', 'outsideScope', 'notDraft'],
        'edit',
      ),
      submit: operationAccess(
        [
          'allowed',
          'notGranted',
          'quoteScope',
          'projectScope',
          'notDraft',
          'invalidAmount',
        ],
        'submit',
      ),
    }),
  })
  .meta({ ref: 'AuthorizationExampleQuoteRow', description: policyNote });

const OrderFields = {
  id: z.string(),
  title: z.string().optional(),
  projectId: z.string().optional(),
  quoteId: z.string().optional(),
  status: z
    .string()
    .optional()
    .meta({ description: '`ready` or `delivered`.' }),
  deliveryReference: z.string().nullable().optional(),
};

export const SalesOrder = z
  .object(OrderFields)
  .meta({ ref: 'AuthorizationExampleOrder', description: policyNote });

export const SalesOrderRow = z
  .object({
    ...OrderFields,
    project: ProjectSummary.optional(),
    operations: z.object({
      deliver: operationAccess(
        ['allowed', 'notGranted', 'outsideScope', 'notReady'],
        'deliver',
      ),
    }),
  })
  .meta({ ref: 'AuthorizationExampleOrderRow', description: policyNote });

const Carrier = z
  .object({ id: z.string(), title: z.string() })
  .meta({ ref: 'AuthorizationExampleCarrier' });

const RelationOperations = z.array(z.string()).meta({
  description:
    'The mutation operations the caller may send for this relation, such as `connect` or `create`; empty when none.',
});

export const OrderRelations = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    status: z.string().optional(),
    carrier: Carrier.nullable().optional(),
    checks: z
      .array(z.object({ id: z.string(), title: z.string(), done: z.boolean() }))
      .optional(),
    collaborators: z.array(Carrier).optional(),
    operations: z
      .object({
        carrier: RelationOperations,
        checks: RelationOperations,
        collaborators: RelationOperations,
      })
      .meta({ description: 'What the caller may change on each relation.' }),
    options: z
      .object({
        carrier: z.array(Carrier).optional(),
        collaborators: z.array(Carrier).optional(),
      })
      .meta({
        description:
          'The carriers the caller may connect, for each relation it may connect.',
      }),
    access: z.enum(['allowed', 'notGranted', 'outsideScope', 'notReady']).meta({
      description:
        'Whether the caller may change the relations: `allowed`, or the reason it may not.',
    }),
  })
  .meta({ ref: 'AuthorizationExampleOrderRelations', description: policyNote });

const PermissionSubject = z
  .object({ type: z.string(), id: z.string() })
  .meta({ ref: 'AuthorizationExampleSubject' });

export const PracticeContext = z
  .object({
    canReset: z.boolean().meta({
      description:
        'Whether the caller is unrestricted and may reset the example data.',
    }),
    roles: z
      .array(
        z.object({
          key: z.string(),
          title: z
            .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
            .optional(),
          sources: z.array(PermissionSubject).meta({
            description:
              'The assignments that give the caller this permission set: the user itself, or a subject it belongs to.',
          }),
        }),
      )
      .meta({ description: 'The permission sets in effect for the caller.' }),
  })
  .meta({ ref: 'AuthorizationExamplePracticeContext' });

export const ResetResult = z
  .object({ saved: z.literal(true) })
  .meta({ ref: 'AuthorizationExampleResetResult' });
