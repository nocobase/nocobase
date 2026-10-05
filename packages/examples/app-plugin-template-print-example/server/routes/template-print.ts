import carbone from 'carbone';
import { QUOTES } from '@nocobase/app-plugin-authorization-example/server';
import type {
  AuthorizationContext,
  AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';
import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import { Hono, type MiddlewareHandler } from 'hono';
import path from 'node:path';

import {
  Invoice,
  InvoiceParams,
  ListInvoicesQuery,
  PrintInvoiceQuery,
  type OutputFormat,
} from './schemas.js';

const DOMAIN = 'templatePrintExample';

const QUOTE_RESOURCE = 'example.sales.quotes';
const QUOTE_PAGE = 'example.sales.quotes';
const MAX_VISIBLE_QUOTES = 100;
const MAX_VISIBLE_INVOICES = 100;
const MAX_INVOICE_LINES = 50;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
const tags = ['TemplatePrintExample'];
/** Answered when a caller may not open the Sales Quotes page or view any quote, before its input is looked at. */
const quoteAccessDenied = apiErrorResponse(
  403,
  'The caller may not open the Sales Quotes page (`page:example.sales.quotes` `access`) or view quotes (`AUTHORIZATION_DENIED`).',
);
/** Answered when the visible quotes, invoices or lines exceed what the example renders. */
const outputLimit = apiErrorResponse(
  400,
  'The data exceeds what the example renders (`OUTPUT_LIMIT_EXCEEDED`).',
);

interface QuoteRecord {
  readonly id: string;
  readonly title: string;
}

interface InvoiceRecord {
  readonly id: string;
  readonly number: string;
  readonly customerName: string;
  readonly issuedOn: string;
  readonly sourceQuoteId: string;
  readonly totalCents: number;
}

interface InvoiceLineRecord {
  readonly id: string;
  readonly invoiceId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

interface InvoiceListItem extends InvoiceRecord {
  readonly sourceQuoteTitle: string;
}

interface TemplatePrintEnv {
  Variables: AuthorizationEnv['Variables'] & { quotePolicy: RepositoryPolicy };
}

export function createTemplatePrintRoutes(
  database: DatabaseManager,
): Hono<TemplatePrintEnv> {
  const router = new Hono<TemplatePrintEnv>();

  router.get(
    '/invoices',
    requireQuoteAccess(),
    describeRoute({
      tags,
      summary: 'List printable invoices',
      operationId: 'templatePrintExampleListInvoices',
      description:
        'The invoices issued from quotes the caller may view, by number, paged by `page` and `pageSize`.',
      responses: {
        200: listResponse(Invoice),
        ...apiErrorResponses,
        400: outputLimit,
        403: quoteAccessDenied,
      },
    }),
    apiValidator('query', ListInvoicesQuery),
    async (context) => {
      const { page, pageSize } = context.req.valid('query');
      const invoices = await visibleInvoices(database, context.var.quotePolicy);
      return context.json({
        data: invoices.slice((page - 1) * pageSize, page * pageSize),
        meta: { page, pageSize, total: invoices.length },
      });
    },
  );

  // A download, so a GET answering the document's bytes rather than `{ data }`.
  router.get(
    '/invoices/:invoiceId/print',
    requireQuoteAccess(),
    describeRoute({
      tags,
      summary: 'Print an invoice',
      operationId: 'templatePrintExamplePrintInvoice',
      description:
        'Renders the invoice from its DOCX template and answers the file as an attachment. `format=pdf` converts it with LibreOffice on the server.',
      responses: {
        200: {
          description: 'The rendered document, as an attachment.',
          content: {
            [DOCX_MIME]: { schema: { type: 'string', format: 'binary' } },
            [PDF_MIME]: { schema: { type: 'string', format: 'binary' } },
          },
        },
        ...apiErrorResponses,
        400: outputLimit,
        403: quoteAccessDenied,
        404: apiErrorResponse(
          404,
          'No invoice has this id, or its quote is not one the caller may view (`INVOICE_NOT_FOUND`).',
        ),
        503: apiErrorResponse(
          503,
          'PDF was asked for and LibreOffice is not installed on the server (`PDF_CONVERTER_UNAVAILABLE`); DOCX remains available.',
        ),
      },
    }),
    apiValidator('param', InvoiceParams),
    apiValidator('query', PrintInvoiceQuery),
    async (context) => {
      const { invoiceId } = context.req.valid('param');
      const { format } = context.req.valid('query');

      const invoices = await visibleInvoices(database, context.var.quotePolicy);
      const invoice = invoices.find((item) => item.id === invoiceId);
      // An invoice whose quote the caller may not view is answered like a missing one.
      if (!invoice)
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'INVOICE_NOT_FOUND',
          domain: DOMAIN,
          message: `Invoice ${invoiceId} was not found.`,
        });

      const lines = await database
        .repository<InvoiceLineRecord>('templatePrintExampleInvoiceLines')
        .findMany({
          filter: { invoiceId: invoice.id },
          limit: MAX_INVOICE_LINES + 1,
          sort: (sort) => sort.field('id').asc(),
        });
      if (lines.length > MAX_INVOICE_LINES) throw outputLimitExceeded();

      const data = {
        number: invoice.number,
        customerName: invoice.customerName,
        issuedOn: invoice.issuedOn,
        quoteTitle: invoice.sourceQuoteTitle,
        total: formatCents(invoice.totalCents),
        lines: lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: formatCents(line.unitPriceCents),
          lineTotal: formatCents(line.unitPriceCents * line.quantity),
        })),
      };
      const templatePath = path.resolve(
        import.meta.dirname,
        '../../templates/invoice.docx',
      );
      const document = await renderInvoiceDocument(templatePath, data, format);
      const extension = format === 'pdf' ? 'pdf' : 'docx';
      const contentType = format === 'pdf' ? PDF_MIME : DOCX_MIME;
      const fileName = `invoice-${invoice.number}.${extension}`;
      const safeFallback = fileName.replace(/[^a-zA-Z0-9._-]/gu, '_');

      return context.body(new Uint8Array(document), 200, {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Type': contentType,
      });
    },
  );

  return router;
}

/**
 * Decide access before anything about the request is looked at: the quotes page, then the quotes the caller may view.
 * Mounted ahead of `validator()`, so a caller without access is answered 403 whatever its path and query hold.
 */
function requireQuoteAccess(): MiddlewareHandler<TemplatePrintEnv> {
  return async (context, next) => {
    const quotePolicy = await quoteViewPolicy(context.var.authz);
    context.set('quotePolicy', quotePolicy);
    await next();
  };
}

async function quoteViewPolicy(
  authorization: AuthorizationContext,
): Promise<RepositoryPolicy> {
  await authorization.require({
    resource: { type: 'page', id: QUOTE_PAGE },
    action: 'access',
  });
  const decision = await authorization.authorize({
    resource: { type: 'composite', id: QUOTE_RESOURCE },
    action: 'view',
  });
  if (decision.effect === 'deny' || !decision.conditions?.database)
    throw new AuthorizationDeniedError(decision);

  const quotePolicy = decision.conditions.database[QUOTES] as
    RepositoryPolicy | undefined;
  if (!quotePolicy?.read) throw new AuthorizationDeniedError(decision);
  return quotePolicy;
}

async function visibleInvoices(
  database: DatabaseManager,
  quotePolicy: RepositoryPolicy,
): Promise<InvoiceListItem[]> {
  const quotes = await database
    .repository<QuoteRecord>(QUOTES)
    .withPolicy(quotePolicy)
    .findMany({
      limit: MAX_VISIBLE_QUOTES + 1,
      sort: (sort) => sort.field('id').asc(),
    });
  if (quotes.length > MAX_VISIBLE_QUOTES) throw outputLimitExceeded();
  if (!quotes.length) return [];

  const quoteIds = quotes.flatMap((quote) =>
    typeof quote.id === 'string' ? [quote.id] : [],
  );
  if (!quoteIds.length) return [];

  const quoteTitles = new Map(
    quotes.flatMap((quote) =>
      typeof quote.id === 'string' && typeof quote.title === 'string'
        ? [[quote.id, quote.title] as const]
        : [],
    ),
  );
  const quoteScope = buildFilter((filter) =>
    filter.or(
      quoteIds.map((quoteId) => filter.string('sourceQuoteId').eq(quoteId)),
    ),
  );
  const invoices = await database
    .repository<InvoiceRecord>('templatePrintExampleInvoices')
    .findMany({
      filter: quoteScope,
      limit: MAX_VISIBLE_INVOICES + 1,
      sort: (sort) => sort.field('number').asc(),
    });
  if (invoices.length > MAX_VISIBLE_INVOICES) throw outputLimitExceeded();

  return invoices.flatMap((invoice) => {
    const sourceQuoteTitle = quoteTitles.get(invoice.sourceQuoteId);
    return sourceQuoteTitle ? [{ ...invoice, sourceQuoteTitle }] : [];
  });
}

/** The request is fine; the data it would print is larger than the example renders, so this is a precondition. */
function outputLimitExceeded(): ApiError {
  return new ApiError({
    status: 'FAILED_PRECONDITION',
    reason: 'OUTPUT_LIMIT_EXCEEDED',
    domain: DOMAIN,
    message: 'The printed output exceeds the example limits.',
  });
}

function pdfConverterUnavailable(cause: string): ApiError {
  return new ApiError({
    status: 'UNAVAILABLE',
    reason: 'PDF_CONVERTER_UNAVAILABLE',
    domain: DOMAIN,
    message:
      'PDF conversion requires LibreOffice on the NocoBase server. Install LibreOffice in the application host or container and restart the application; DOCX downloads remain available.',
    cause,
  });
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function renderInvoiceDocument(
  templatePath: string,
  data: Record<string, unknown>,
  format: OutputFormat,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const callback = (
      error: NodeJS.ErrnoException | null,
      result: Buffer | string,
    ): void => {
      if (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (format === 'pdf' && /cannot find libreoffice/iu.test(message)) {
          reject(pdfConverterUnavailable(message));
          return;
        }
        reject(new Error(message));
        return;
      }
      if (!Buffer.isBuffer(result)) {
        reject(new Error(`Expected rendered ${format.toUpperCase()} bytes`));
        return;
      }
      resolve(result);
    };

    if (format === 'pdf')
      carbone.render(templatePath, data, { convertTo: 'pdf' }, callback);
    else carbone.render(templatePath, data, callback);
  });
}
