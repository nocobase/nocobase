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

/** One invoice the caller may print: one linked to a quote the caller may view. */
export interface InvoiceBody {
  readonly id: string;
  readonly number: string;
  readonly customerName: string;
  readonly issuedOn: string;
  readonly sourceQuoteId: string;
  readonly sourceQuoteTitle: string;
  readonly totalCents: number;
}
// Annotated with the value it describes, which isolated declarations require of an export; the `ref` names it in the
// API document.
export const Invoice: z.ZodType<InvoiceBody> = z
  .object({
    id: z.string(),
    number: z.string().meta({ description: 'The invoice number.' }),
    customerName: z.string(),
    issuedOn: z.iso.date().meta({ description: 'The issue date.' }),
    sourceQuoteId: z
      .string()
      .meta({ description: 'The quote the invoice was issued from.' }),
    sourceQuoteTitle: z.string(),
    totalCents: z
      .number()
      .int()
      .meta({ description: 'The total in US cents.' }),
  })
  .meta({ ref: 'TemplatePrintExampleInvoice' });
