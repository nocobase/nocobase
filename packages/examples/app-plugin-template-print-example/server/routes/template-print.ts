import carbone from 'carbone';
import { QUOTES } from '@nocobase/app-plugin-authorization-example/server';
import type {
  AuthorizationContext,
  AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { buildFilter } from '@nocobase/repository-input';
import { Hono } from 'hono';
import path from 'node:path';

import {
  PdfConverterUnavailableError,
  PrintOutputLimitError,
} from './errors.js';

const QUOTE_RESOURCE = 'example.sales.quotes';
const QUOTE_PAGE = 'example.sales.quotes';
const MAX_VISIBLE_QUOTES = 100;
const MAX_VISIBLE_INVOICES = 100;
const MAX_INVOICE_LINES = 50;
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';

type OutputFormat = 'docx' | 'pdf';

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

export function createTemplatePrintRoutes(
  database: DatabaseManager,
): Hono<AuthorizationEnv> {
  const router = new Hono<AuthorizationEnv>();

  router.get('/invoices', async (context) => {
    await requireQuotePageAccess(context.var.authz);
    const invoices = await visibleInvoices(database, context.var.authz);
    return context.json({ data: invoices });
  });

  router.get('/invoices/:id/print', async (context) => {
    await requireQuotePageAccess(context.var.authz);
    const invoiceId = context.req.param('id');
    if (!/^[a-zA-Z0-9_-]{1,64}$/u.test(invoiceId))
      throw new TypeError('Invalid invoice id');
    const requestedFormat = context.req.query('format');
    if (
      requestedFormat !== undefined &&
      requestedFormat !== 'docx' &&
      requestedFormat !== 'pdf'
    )
      throw new TypeError('Unsupported output format');
    const format: OutputFormat = requestedFormat ?? 'docx';

    const invoices = await visibleInvoices(database, context.var.authz);
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return context.json({ code: 'NOT_FOUND' }, 404);

    const lines = await database
      .repository<InvoiceLineRecord>('templatePrintExampleInvoiceLines')
      .findMany({
        filter: { invoiceId: invoice.id },
        limit: MAX_INVOICE_LINES + 1,
        sort: (sort) => sort.field('id').asc(),
      });
    if (lines.length > MAX_INVOICE_LINES) throw new PrintOutputLimitError();

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
  });

  return router;
}

async function requireQuotePageAccess(
  authorization: AuthorizationContext,
): Promise<void> {
  await authorization.require({
    resource: { type: 'page', id: QUOTE_PAGE },
    action: 'access',
  });
}

async function visibleInvoices(
  database: DatabaseManager,
  authorization: AuthorizationContext,
): Promise<InvoiceListItem[]> {
  const decision = await authorization.authorize({
    resource: { type: 'composite', id: QUOTE_RESOURCE },
    action: 'view',
  });
  if (decision.effect === 'deny' || !decision.conditions?.database)
    throw new AuthorizationDeniedError(decision);

  const quotePolicy = decision.conditions.database[QUOTES] as
    RepositoryPolicy | undefined;
  if (!quotePolicy?.read) throw new AuthorizationDeniedError(decision);

  const quotes = await database
    .repository<QuoteRecord>(QUOTES)
    .withPolicy(quotePolicy)
    .findMany({
      limit: MAX_VISIBLE_QUOTES + 1,
      sort: (sort) => sort.field('id').asc(),
    });
  if (quotes.length > MAX_VISIBLE_QUOTES) throw new PrintOutputLimitError();
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
  if (invoices.length > MAX_VISIBLE_INVOICES) throw new PrintOutputLimitError();

  return invoices.flatMap((invoice) => {
    const sourceQuoteTitle = quoteTitles.get(invoice.sourceQuoteId);
    return sourceQuoteTitle ? [{ ...invoice, sourceQuoteTitle }] : [];
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
          reject(new PdfConverterUnavailableError(message));
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
