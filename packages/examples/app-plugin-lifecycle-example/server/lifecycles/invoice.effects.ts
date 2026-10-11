import { defineEffect, type EffectDefinition } from '@nocobase/lifecycle';
import { fireIfStill } from './flow-services.js';
import type { InvoiceTypes } from './invoice.js';

export const submitInvoice: EffectDefinition<InvoiceTypes> =
  defineEffect<InvoiceTypes>({
    name: 'invoices.submit',
    retry: { attempts: 3, backoffMs: 2000, factor: 2 },
    timeoutMs: 10000,
    onSuccess: 'submitted',
    onFailure: 'submissionFailed',
    async run({ record, services }) {
      if (
        services.shouldFail(
          `invoice-submit:${record.id}`,
          record.failSubmissions,
        )
      )
        throw new Error(
          'The invoicing platform is temporarily unavailable (simulated).',
        );
      return services.sandbox.submitInvoice({
        idempotencyKey: `invoice:${record.id}`,
        invoiceId: String(record.id),
        title: record.title,
        taxNumber: record.taxNumber,
        amountCents: record.amountCents,
      });
    },
  });

export const queryInvoice: EffectDefinition<InvoiceTypes> =
  defineEffect<InvoiceTypes>({
    name: 'invoices.query',
    retry: { attempts: 3, backoffMs: 1000 },
    timeoutMs: 10000,
    onFailure: 'queryFailed',
    async run({ record, services }) {
      if (!record.providerRequestId)
        throw new Error('The invoice has no provider request.');
      const result = await services.sandbox.invoice(record.providerRequestId);
      const transition =
        result.status === 'issued'
          ? 'issued'
          : result.status === 'failed'
            ? 'issueFailed'
            : 'stillPending';
      const fired = await fireIfStill(
        services,
        'invoices',
        record.id,
        transition,
        {
          requestId: `invoice-query:${record.id}:${record.queryCount}`,
          input: {
            providerRequestId: result.providerRequestId,
            invoiceNumber: result.invoiceNumber ?? '',
            pdfUrl: result.pdfUrl ?? '',
            error: result.error ?? '',
          },
        },
      );
      return { status: result.status, fired };
    },
  });

export const notifyInvoice: EffectDefinition<InvoiceTypes> =
  defineEffect<InvoiceTypes>({
    name: 'invoices.notifyCustomer',
    retry: { attempts: 3, backoffMs: 1000 },
    run: ({ record, services }) =>
      services.sandbox.notifyInvoice(
        String(record.id),
        record.customerId,
        String(record.invoiceNumber),
      ),
  });
