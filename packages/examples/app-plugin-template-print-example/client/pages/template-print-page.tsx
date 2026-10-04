import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { FileDown, FileText, LoaderCircle } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';

interface InvoiceListItem {
  readonly id: string;
  readonly number: string;
  readonly customerName: string;
  readonly issuedOn: string;
  readonly sourceQuoteTitle: string;
  readonly totalCents: number;
}

type OutputFormat = 'docx' | 'pdf';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isPdfConverterUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.reason === 'PDF_CONVERTER_UNAVAILABLE'
  );
}

function formatIssuedOn(value: string, formatter: Intl.DateTimeFormat): string {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : formatter.format(date);
}

export default function TemplatePrintPage(): ReactElement {
  const api = useApiClient();
  const { t, i18n } = useTranslation(
    '@nocobase/app-plugin-template-print-example',
  );
  const [invoices, setInvoices] = useState<readonly InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyDownload, setBusyDownload] = useState<{
    readonly invoiceId: string;
    readonly format: OutputFormat;
  }>();
  const [loadError, setLoadError] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();
  const [pdfConverterUnavailable, setPdfConverterUnavailable] = useState(false);

  const requestInvoices = useCallback(
    (signal?: AbortSignal) =>
      api.request<{ data: InvoiceListItem[] }>({
        path: 'template-print-example/invoices',
        ...(signal ? { signal } : {}),
      }),
    [api],
  );

  useEffect(() => {
    const controller = new AbortController();
    void requestInvoices(controller.signal)
      .then((response) => {
        setInvoices(response.data);
        setLoadError(undefined);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError(messageOf(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [requestInvoices]);

  const downloadInvoice = useCallback(
    async (invoice: InvoiceListItem, format: OutputFormat): Promise<void> => {
      setBusyDownload({ invoiceId: invoice.id, format });
      setDownloadError(undefined);
      setPdfConverterUnavailable(false);
      try {
        const formatQuery = format === 'pdf' ? '?format=pdf' : '';
        const stream = await api.stream({
          path: `template-print-example/invoices/${encodeURIComponent(invoice.id)}/print${formatQuery}`,
        });
        const responseBlob = await new Response(stream).blob();
        const blob = new Blob([responseBlob], {
          type: format === 'pdf' ? 'application/pdf' : DOCX_MIME,
        });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `invoice-${invoice.number}.${format}`;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      } catch (cause) {
        const converterUnavailable = isPdfConverterUnavailable(cause);
        setPdfConverterUnavailable(converterUnavailable);
        setDownloadError(
          converterUnavailable
            ? t('pdfConverterUnavailable')
            : messageOf(cause),
        );
      } finally {
        setBusyDownload(undefined);
      }
    },
    [api, t],
  );

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: 'USD',
      }),
    [i18n.language],
  );
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }),
    [i18n.language],
  );

  return (
    <PageContainer>
      <PageHeader title={t('title')} description={t('description')} />

      <Card
        role='region'
        aria-labelledby='template-print-invoices-title'
        className='min-w-0 rounded-xl shadow-2xs'
      >
        <CardHeader>
          <CardTitle
            id='template-print-invoices-title'
            className='text-base font-semibold'
          >
            {t('invoiceList')}
          </CardTitle>
          {!loading && !loadError && invoices.length > 0 && (
            <CardAction>
              <span className='rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground'>
                {t('invoiceCount', { count: invoices.length })}
              </span>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className='space-y-4'>
          {loading && (
            <div
              role='status'
              className='flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground'
            >
              <LoaderCircle
                aria-hidden='true'
                className='size-4 animate-spin text-primary'
              />
              {t('loading')}
            </div>
          )}
          {loadError && (
            <div
              role='alert'
              className='flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4'
            >
              <p className='text-sm text-destructive'>
                {t('loadFailed')}: {loadError}
              </p>
              <Button
                variant='outline'
                onClick={() => {
                  setLoading(true);
                  setLoadError(undefined);
                  void requestInvoices()
                    .then((response) => setInvoices(response.data))
                    .catch((cause: unknown) => setLoadError(messageOf(cause)))
                    .finally(() => setLoading(false));
                }}
              >
                {t('retry')}
              </Button>
            </div>
          )}
          {!loading && !loadError && invoices.length === 0 && (
            <div
              role='status'
              className='flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-6 py-10 text-center'
            >
              <FileText
                aria-hidden='true'
                className='size-8 text-muted-foreground/70'
              />
              <p className='font-medium text-foreground'>{t('empty')}</p>
              <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                {t('emptyHint')}
              </p>
            </div>
          )}
          {!loading && !loadError && invoices.length > 0 && (
            <Table aria-label={t('invoiceList')} className='min-w-[760px]'>
              <TableCaption className='sr-only'>
                {t('invoiceList')}
              </TableCaption>
              <TableHeader className='bg-muted/30'>
                <TableRow>
                  <TableHead>{t('invoice')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('issuedOn')}</TableHead>
                  <TableHead>{t('quote')}</TableHead>
                  <TableHead className='text-right'>{t('amount')}</TableHead>
                  <TableHead>
                    <span className='sr-only'>{t('downloadActions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className='font-medium'>
                      {invoice.number}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      {formatIssuedOn(invoice.issuedOn, date)}
                    </TableCell>
                    <TableCell>{invoice.sourceQuoteTitle}</TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {currency.format(invoice.totalCents / 100)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex flex-wrap justify-end gap-2'>
                        <Button
                          size='sm'
                          aria-label={`${t('downloadPdf')} ${invoice.number}`}
                          aria-busy={
                            busyDownload?.invoiceId === invoice.id &&
                            busyDownload.format === 'pdf'
                          }
                          disabled={busyDownload !== undefined}
                          variant='outline'
                          onClick={() => void downloadInvoice(invoice, 'pdf')}
                        >
                          <FileDown aria-hidden='true' className='size-4' />
                          {busyDownload?.invoiceId === invoice.id &&
                          busyDownload.format === 'pdf'
                            ? t('downloading')
                            : t('downloadPdf')}
                        </Button>
                        <Button
                          size='sm'
                          aria-label={`${t('download')} ${invoice.number}`}
                          aria-busy={
                            busyDownload?.invoiceId === invoice.id &&
                            busyDownload.format === 'docx'
                          }
                          disabled={busyDownload !== undefined}
                          onClick={() => void downloadInvoice(invoice, 'docx')}
                        >
                          <FileDown aria-hidden='true' className='size-4' />
                          {busyDownload?.invoiceId === invoice.id &&
                          busyDownload.format === 'docx'
                            ? t('downloading')
                            : t('download')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {downloadError && !loading && invoices.length > 0 && (
            <div
              role='alert'
              className='space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
            >
              <p>
                {pdfConverterUnavailable ? '' : `${t('downloadFailed')}: `}
                {downloadError}
              </p>
              {pdfConverterUnavailable && (
                <a
                  className='font-medium underline underline-offset-4'
                  href='https://www.libreoffice.org/download/download-libreoffice/'
                  target='_blank'
                  rel='noreferrer'
                >
                  {t('installLibreOffice')}
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
