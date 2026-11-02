import { invoiceTimingGroup } from '../configuration/definitions.js';
import {
  defineLifecycle,
  type Lifecycle,
  type LifecycleRecord,
} from '@nocobase/lifecycle';
import { INVOICE_ORDERS } from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import { errorText, required, type FlowServices } from './flow-services.js';
import {
  notifyInvoice,
  queryInvoice,
  submitInvoice,
} from './invoice.effects.js';

export type InvoiceState =
  | 'draft'
  | 'submitting'
  | 'awaitingIssue'
  | 'querying'
  | 'issued'
  | 'issueFailed';
export interface Invoice extends LifecycleRecord {
  readonly orderRef: string;
  readonly customerId: string;
  readonly title: string;
  readonly taxNumber: string;
  readonly amountCents: number;
  readonly failSubmissions: number;
  readonly providerRequestId: string | null;
  readonly status: InvoiceState;
  readonly statusChangedAt: string;
  readonly queryCount: number;
}
export interface InvoiceTypes {
  record: Invoice;
  state: InvoiceState;
  parameters: { querySeconds: number };
  services: FlowServices;
}

/** One invoice per completed sandbox order; retries reuse the provider request. */
export const invoiceLifecycle: Lifecycle<InvoiceTypes> =
  defineLifecycle<InvoiceTypes>({
    name: 'invoices',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.invoices,
    initial: 'draft',
    create: {
      validate: (values) => [
        ...required(values, 'title', 'Enter the invoice title.'),
        ...(/^[A-Za-z0-9]{15,20}$/.test(text(values.taxNumber))
          ? []
          : [
              {
                field: 'taxNumber',
                message: 'Enter a tax number of 15 to 20 letters or digits.',
              },
            ]),
        ...(INVOICE_ORDERS.some((order) => order.orderRef === values.orderRef)
          ? []
          : [
              {
                field: 'orderRef',
                message: 'Choose a completed sandbox order.',
              },
            ]),
      ],
    },
    states: [
      'draft',
      'submitting',
      'awaitingIssue',
      'querying',
      { name: 'issued', final: true },
      'issueFailed',
    ],
    parameterConfiguration: { readMode: 'live', groups: [invoiceTimingGroup] },
    parameters: { querySeconds: 30 },
    transitions: {
      submit: { title: 'Request invoice', from: 'draft', to: 'submitting' },
      retryInvoice: {
        title: 'Retry invoice',
        from: 'issueFailed',
        to: 'submitting',
        set: () => ({ lastError: null }),
      },
      submitted: {
        title: 'Request submitted',
        manual: false,
        from: 'submitting',
        to: 'awaitingIssue',
        accept: ['providerRequestId'],
      },
      submissionFailed: {
        title: 'Submission failed',
        manual: false,
        from: 'submitting',
        to: 'issueFailed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      query: {
        title: 'Query invoice',
        manual: false,
        from: 'awaitingIssue',
        to: 'querying',
        set: ({ record }) => ({ queryCount: record.queryCount + 1 }),
      },
      stillPending: {
        title: 'Still pending',
        manual: false,
        from: 'querying',
        to: 'awaitingIssue',
      },
      issued: {
        title: 'Invoice issued',
        manual: false,
        from: ['awaitingIssue', 'querying'],
        to: 'issued',
        validate: (input) => [
          ...required(
            input,
            'invoiceNumber',
            'The provider must return an invoice number.',
          ),
          ...(/^\/api\/lifecycleExample\/invoices\/\d+\/pdf$/.test(
            text(input.pdfUrl),
          )
            ? []
            : [
                {
                  field: 'pdfUrl',
                  message: 'The provider must return the invoice PDF path.',
                },
              ]),
        ],
        guard: ({ record, input }) =>
          input.providerRequestId === record.providerRequestId || {
            code: 'invoiceRequestMismatch',
            message: 'The result belongs to another invoice request.',
          },
        accept: ['invoiceNumber', 'pdfUrl'],
        set: () => ({ lastError: null }),
      },
      issueFailed: {
        title: 'Issue failed',
        manual: false,
        from: ['awaitingIssue', 'querying'],
        to: 'issueFailed',
        guard: ({ record, input }) =>
          input.providerRequestId === record.providerRequestId || {
            code: 'invoiceRequestMismatch',
            message: 'The result belongs to another invoice request.',
          },
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
      queryFailed: {
        title: 'Query failed',
        manual: false,
        from: 'querying',
        to: 'issueFailed',
        set: ({ input }) => ({ lastError: errorText(input) }),
      },
    },
    onEnter: {
      submitting: [submitInvoice],
      querying: [queryInvoice],
      issued: [notifyInvoice],
    },
    triggers: {
      queryMissingCallback: {
        transition: 'query',
        when: 'awaitingIssue',
        after: ({ querySeconds }) => querySeconds * 1000,
      },
    },
  });
