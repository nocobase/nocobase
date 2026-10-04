import { z } from 'zod';

export const DEFAULT_INVOICE_PAGE_SIZE = 20;
export const MAX_INVOICE_PAGE_SIZE = 100;

export const InvoiceParams: z.ZodObject<
  { invoiceId: z.ZodString },
  z.core.$strip
> = z.object({ invoiceId: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/u) });

export const ListInvoicesQuery: z.ZodObject<
  {
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  },
  z.core.$strip
> = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_INVOICE_PAGE_SIZE)
    .default(DEFAULT_INVOICE_PAGE_SIZE),
});

export const PrintInvoiceQuery: z.ZodObject<
  { format: z.ZodDefault<z.ZodEnum<{ docx: 'docx'; pdf: 'pdf' }>> },
  z.core.$strip
> = z.object({ format: z.enum(['docx', 'pdf']).default('docx') });

export type OutputFormat = z.infer<typeof PrintInvoiceQuery>['format'];
