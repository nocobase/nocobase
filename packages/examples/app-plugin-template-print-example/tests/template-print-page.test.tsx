import type { I18nRuntime } from '@nocobase/i18n';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import locales from '../client/locales/index.js';
import zhCN from '../client/locales/zh-CN.js';
import TemplatePrintPage from '../client/pages/template-print-page.js';

const NS = '@nocobase/app-plugin-template-print-example';
const messages = { 'en-US': enUS, 'zh-CN': zhCN } as const;

let runtime: I18nRuntime;

beforeEach(async () => {
  runtime = await createTestI18nRuntime({ namespaces: { [NS]: locales } });
});

function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace={NS}>
      {children}
    </TestI18nProvider>
  );
}

const state = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
}));

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@nocobase/app-client')>();
  return { ...original, useApiClient: () => state.api };
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
});

it.each(['en-US', 'zh-CN'] as const)(
  'shows invoice details using the %s locale and downloads DOCX',
  async (locale) => {
    await act(() => runtime.changeLanguage(locale));
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

    render(<TemplatePrintPage />, { wrapper: I18n });

    expect(
      await screen.findByRole('region', {
        name: messages[locale].invoiceList,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
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
        name: `${messages[locale].download} ${invoice.number}`,
      }),
    );

    await waitFor(() => expect(state.api.stream).toHaveBeenCalledOnce());
    expect(state.api.stream).toHaveBeenCalledWith({
      path: 'templatePrintExample/invoices/print-invoice-1/print',
    });
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(clickedDownloads).toEqual([`invoice-${invoice.number}.docx`]);
  },
);

it('explains how to resolve an empty invoice list', async () => {
  state.api.request.mockReset().mockResolvedValue({ data: [] });

  render(<TemplatePrintPage />, { wrapper: I18n });

  expect(await screen.findByText(enUS.emptyHint)).toBeInTheDocument();
});

it('retries invoice loading after a request fails', async () => {
  state.api.request
    .mockReset()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: [invoice] });

  render(<TemplatePrintPage />, { wrapper: I18n });

  expect(await screen.findByRole('alert')).toHaveTextContent('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText(invoice.number)).toBeInTheDocument();
  expect(state.api.request).toHaveBeenCalledTimes(2);
});
