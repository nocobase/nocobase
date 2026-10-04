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
