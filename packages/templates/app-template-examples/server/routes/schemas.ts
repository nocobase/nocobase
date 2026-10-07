import type { ReviewTask } from '../../client/pages/workflow-waiting-tasks/types.js';
import { z } from 'zod';

export const articleStatuses = ['draft', 'published', 'archived'] as const;

export const ArticleParams = z.object({
  // The column is an auto-increment integer; the API exchanges it as a string.
  articleId: z.string().regex(/^[1-9]\d{0,15}$/, 'Expected an article id.'),
});

export const ListArticlesQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(255).default(''),
  status: z.enum(articleStatuses).optional(),
});
export type ListArticlesQuery = z.infer<typeof ListArticlesQuery>;

const title = z.string().trim().min(1).max(255);
const summary = z.string().trim().max(2000);
const content = z.string().max(100000);
const status = z.enum(articleStatuses);

export const CreateArticleInput = z.strictObject({
  title,
  summary,
  content,
  status,
});
export type CreateArticleInput = z.infer<typeof CreateArticleInput>;

export const UpdateArticleInput = z.strictObject({
  title: title.optional(),
  summary: summary.optional(),
  content: content.optional(),
  status: status.optional(),
});
export type UpdateArticleInput = z.infer<typeof UpdateArticleInput>;

/** The columns `orderBy` may name on `GET /api/numericExamples`. */
export const numericOrderFields = [
  'id',
  'integerValue',
  'bigintValue',
  'decimalValue',
  'floatValue',
  'doubleValue',
] as const;
export type NumericOrderField = (typeof numericOrderFields)[number];
export interface NumericOrder {
  readonly field: NumericOrderField;
  readonly direction: 'asc' | 'desc';
}

const orderByItem = /^([A-Za-z][A-Za-z0-9]*)(?: +(desc))?$/u;

/**
 * `orderBy` in AIP-132 form: a comma-separated list of field names, each optionally followed by ` desc`, such as
 * `decimalValue desc,id`. Each name must be one of `numericOrderFields`, and none may repeat.
 */
export const NumericOrderBy = z
  .string()
  .default('id')
  .transform((value, context): NumericOrder[] => {
    const orders: NumericOrder[] = [];
    for (const item of value.split(',').map((part) => part.trim())) {
      const match = orderByItem.exec(item);
      const field = match?.[1];
      if (
        !field ||
        !(numericOrderFields as readonly string[]).includes(field)
      ) {
        context.addIssue({
          code: 'custom',
          message: `Expected a field among ${numericOrderFields.join(', ')}, optionally followed by " desc"; got "${item}".`,
        });
        return z.NEVER;
      }
      if (orders.some((order) => order.field === field)) {
        context.addIssue({
          code: 'custom',
          message: `${field} is named more than once.`,
        });
        return z.NEVER;
      }
      orders.push({
        field: field as NumericOrderField,
        direction: match[2] ? 'desc' : 'asc',
      });
    }
    return orders;
  });

export const NumericExamplesQuery = z.object({
  source: z.enum(['query', 'repository']).default('query'),
  sample: z.enum(['all', 'null', 'empty']).default('all'),
  orderBy: NumericOrderBy,
});
export type NumericExamplesQuery = z.infer<typeof NumericExamplesQuery>;

export const QuotationReviewParams = z.object({
  taskId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export const QuotationReviewQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(64).default(''),
  status: z
    .enum(['all', 'pending', 'submitting', 'submitted', 'unavailable'])
    .default('all'),
});
export const QuotationReviewDecision = z.strictObject({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000).trim(),
});
// Response schemas. Each carries a `ref` so the API document names it once and refers to it from every route.

export const ExampleGreeting = z
  .object({
    scope: z.literal('api'),
    message: z
      .string()
      .meta({ description: "The message the application's provider gives." }),
  })
  .meta({ ref: 'ExamplesGreeting' });

export const Article = z
  .object({
    id: z.string().meta({ description: 'The article id, as a string.' }),
    title: z.string(),
    summary: z.string().nullable(),
    content: z.string(),
    status: z.enum(articleStatuses),
    publishedAt: z.iso.datetime().nullable().meta({
      description: 'When the article was first published; `null` until then.',
    }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ ref: 'ExamplesArticle' });

const numericValue = z.unknown().meta({
  description:
    'As the driver returns it: a number, or a string for a type the dialect returns as text, such as `bigint` or `decimal` on some dialects; `null` when unset.',
});

export const NumericExamples = z
  .object({
    dialect: z
      .string()
      .meta({ description: 'The dialect of the main connection.' }),
    source: z.enum(['query', 'repository']).meta({
      description:
        'Whether the rows were read with the query builder or through the Repository.',
    }),
    sample: z.enum(['all', 'null', 'empty']),
    rows: z
      .array(
        z.object({
          sample: z.string(),
          id: numericValue,
          integerValue: numericValue,
          bigintValue: numericValue,
          decimalValue: numericValue,
          floatValue: numericValue,
          doubleValue: numericValue,
        }),
      )
      .meta({ description: 'At most 100 rows, in `orderBy` order.' }),
    aggregates: z
      .array(
        z.object({
          field: z.enum(numericOrderFields),
          count: numericValue,
          sum: numericValue,
          avg: numericValue,
          min: numericValue,
          max: numericValue,
        }),
      )
      .meta({
        description: 'Count, sum, average, minimum and maximum per field.',
      }),
  })
  .meta({ ref: 'ExamplesNumericExamples' });

export const QuotationReviewTask: z.ZodType<ReviewTask> = z
  .object({
    id: z.string(),
    runId: z.string(),
    quotationId: z.string(),
    totalCents: z.number(),
    route: z.enum(['standard', 'manual-follow-up']),
    status: z.enum(['pending', 'submitting', 'submitted', 'unavailable']),
    waitStatus: z.string(),
    resumeRequestId: z.string().nullable(),
    resumeRequest: z
      .union([
        z.object({
          status: z.enum(['executing', 'queued', 'processing', 'consumed']),
          reason: z.null(),
        }),
        z.object({
          status: z.literal('rejected'),
          reason: z.enum([
            'stale',
            'run-ended',
            'target-missing',
            'commit-failed',
          ]),
        }),
        z.object({ status: z.literal('not-found') }),
      ])
      .nullable(),
    confirmedBy: z.string().nullable(),
    reviewerId: z.string().nullable(),
    decision: z.enum(['approved', 'rejected']).nullable(),
    comment: z.string().nullable(),
    createdAt: z.iso.datetime(),
    submittedAt: z.iso.datetime().nullable(),
  })
  .meta({ ref: 'ExamplesQuotationReviewTask' });

export const QuotationReviewDetail = z
  .object({
    data: QuotationReviewTask,
    meta: z.object({
      currentReviewer: z.object({ id: z.string(), name: z.string() }),
    }),
  })
  .meta({ ref: 'ExamplesQuotationReviewDetail' });
