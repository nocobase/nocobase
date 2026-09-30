import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  navTitle: 'Template printing example',
  title: 'Template printing example',
  description:
    'Render a fixed DOCX template with an invoice and its authorized quote data as DOCX or PDF. PDF conversion requires LibreOffice on the application server.',
  invoiceList: 'Invoices',
  invoiceCount_one: '{{count}} invoice',
  invoiceCount_other: '{{count}} invoices',
  loading: 'Loading invoices…',
  empty: 'No invoices are available in your quote access scope.',
  emptyHint:
    'Run the Examples database tasks and sign in as sales_manager, or use an account that can view the linked Sales Quote.',
  loadFailed: 'Could not load invoices.',
  download: 'Download DOCX',
  downloading: 'Rendering…',
  downloadFailed: 'Could not render the invoice.',
  invoice: 'Invoice',
  customer: 'Customer',
  issuedOn: 'Issued on',
  quote: 'Source quote',
  amount: 'Total',
  downloadActions: 'Download actions',
  downloadPdf: 'Download PDF',
  pdfConverterUnavailable:
    'PDF conversion is unavailable because LibreOffice could not be found on the application server. Install it on the same machine or container as NocoBase, ensure the server process can find its executable, and restart the application. DOCX download remains available.',
  installLibreOffice: 'Download LibreOffice',
  retry: 'Retry',
} as const;

export type TemplatePrintExampleResource = LocaleResource<typeof enUS>;
export default enUS;
