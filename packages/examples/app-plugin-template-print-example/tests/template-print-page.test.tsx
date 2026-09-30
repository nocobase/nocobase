import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import TemplatePrintPage from '../client/pages/template-print-page.js';

const state = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  language: 'en-US',
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@nocobase/app-client')>();
  return { ...original, useApiClient: () => state.api };
});

vi.mock('@nocobase/i18n/client', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@nocobase/i18n/client')>();
  const messages: Readonly<Record<string, string>> = {
    title: 'Template printing example',
    description: 'Render a fixed DOCX template with authorized quote data.',
    invoiceList: 'Invoices',
    invoice: 'Invoice',
    customer: 'Customer',
    issuedOn: 'Issued on',
    quote: 'Source quote',
    amount: 'Total',
    downloadActions: 'Download actions',
    download: 'Download DOCX',
    downloading: 'Rendering…',
    empty: 'No invoices are available in your quote access scope.',
    emptyHint: 'Run the database tasks and use an account with quote access.',
    loadFailed: 'Could not load invoices.',
    retry: 'Retry',
    loading: 'Loading invoices…',
    downloadFailed: 'Could not render the invoice.',
  };
  return {
    ...original,
    useTranslation: () => ({
      t: (key: string, options?: { readonly count?: number }) =>
        key === 'invoiceCount'
          ? `${options?.count ?? 0} invoices`
          : (messages[key] ?? key),
      i18n: { language: state.language },
    }),
  };
});

const invoice = {
  id: 'print-invoice-1',
  number: 'INV-2026-003',
  customerName: 'Hill Studio',
  issuedOn: '2026-09-22',
  sourceQuoteTitle: 'Hill project quote',
  totalCents: 123456,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  state.language = 'en-US';
});

it.each(['en-US', 'zh-CN'])(
  'shows invoice details using the %s locale and downloads DOCX',
  async (locale) => {
    state.language = locale;
    state.api.request.mockReset().mockResolvedValue({ data: [invoice] });
    state.api.stream.mockReset().mockResolvedValue(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array([0x50, 0x4b]));
          controller.close();
        },
      }),
    );
    const createObjectURL = vi.fn(() => 'blob:invoice');
    const revokeObjectURL = vi.fn();
    const OriginalURL = globalThis.URL;
    vi.stubGlobal(
      'URL',
      Object.assign(class extends OriginalURL {}, {
        createObjectURL,
        revokeObjectURL,
      }),
    );
    const clickedDownloads: string[] = [];
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clickedDownloads.push(this.download);
      });

    render(<TemplatePrintPage />);

    expect(
      await screen.findByRole('region', { name: 'Invoices' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(invoice.number)).toBeInTheDocument();
    expect(
      screen.getByText(
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'USD',
        }).format(invoice.totalCents / 100),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }).format(new Date(`${invoice.issuedOn}T00:00:00Z`)),
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: `Download DOCX ${invoice.number}`,
      }),
    );

    await waitFor(() => expect(state.api.stream).toHaveBeenCalledOnce());
    expect(state.api.stream).toHaveBeenCalledWith({
      path: 'template-print-example/invoices/print-invoice-1/print',
    });
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(clickedDownloads).toEqual([`invoice-${invoice.number}.docx`]);
  },
);

it('explains how to resolve an empty invoice list', async () => {
  state.api.request.mockReset().mockResolvedValue({ data: [] });

  render(<TemplatePrintPage />);

  expect(
    await screen.findByText(
      'Run the database tasks and use an account with quote access.',
    ),
  ).toBeInTheDocument();
});

it('retries invoice loading after a request fails', async () => {
  state.api.request
    .mockReset()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: [invoice] });

  render(<TemplatePrintPage />);

  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText(invoice.number)).toBeInTheDocument();
  expect(state.api.request).toHaveBeenCalledTimes(2);
});
