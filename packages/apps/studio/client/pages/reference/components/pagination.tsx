import { useTranslation } from '@nocobase/i18n/client';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ExamplePage, ExampleSection } from '../shared';

interface Invoice {
  readonly number: string;
  readonly customer: string;
  readonly amount: number;
  readonly issuedOn: string;
}

const INVOICES: readonly Invoice[] = [
  {
    number: 'INV-2041',
    customer: 'Northwind Traders',
    amount: 2184,
    issuedOn: 'Sep 2, 2026',
  },
  {
    number: 'INV-2042',
    customer: 'Acme Supply Co.',
    amount: 940.5,
    issuedOn: 'Sep 3, 2026',
  },
  {
    number: 'INV-2043',
    customer: 'Blue Harbor Logistics',
    amount: 5312,
    issuedOn: 'Sep 5, 2026',
  },
  {
    number: 'INV-2044',
    customer: 'Cedar Grove Retail',
    amount: 418,
    issuedOn: 'Sep 8, 2026',
  },
  {
    number: 'INV-2045',
    customer: 'Meridian Health',
    amount: 7620,
    issuedOn: 'Sep 9, 2026',
  },
  {
    number: 'INV-2046',
    customer: 'Northwind Traders',
    amount: 1290,
    issuedOn: 'Sep 12, 2026',
  },
  {
    number: 'INV-2047',
    customer: 'Harborline Foods',
    amount: 336.75,
    issuedOn: 'Sep 14, 2026',
  },
  {
    number: 'INV-2048',
    customer: 'Acme Supply Co.',
    amount: 2075,
    issuedOn: 'Sep 15, 2026',
  },
  {
    number: 'INV-2049',
    customer: 'Summit Outfitters',
    amount: 884,
    issuedOn: 'Sep 17, 2026',
  },
  {
    number: 'INV-2050',
    customer: 'Cedar Grove Retail',
    amount: 1560,
    issuedOn: 'Sep 18, 2026',
  },
  {
    number: 'INV-2051',
    customer: 'Meridian Health',
    amount: 210,
    issuedOn: 'Sep 20, 2026',
  },
  {
    number: 'INV-2052',
    customer: 'Blue Harbor Logistics',
    amount: 4405,
    issuedOn: 'Sep 21, 2026',
  },
];

const PAGE_SIZE = 4;
const LARGE_TOTAL = 24;

type PageToken = number | 'start-ellipsis' | 'end-ellipsis';

/** Page numbers around the current page, with ellipsis for the gaps. */
function buildPageTokens(current: number, total: number): PageToken[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const tokens: PageToken[] = [1];
  if (current > 3) {
    tokens.push('start-ellipsis');
  }
  for (
    let page = Math.max(2, current - 1);
    page <= Math.min(total - 1, current + 1);
    page += 1
  ) {
    tokens.push(page);
  }
  if (current < total - 2) {
    tokens.push('end-ellipsis');
  }
  tokens.push(total);
  return tokens;
}

export default function PaginationExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [basicPage, setBasicPage] = useState(1);
  const [largePage, setLargePage] = useState(8);
  const [compactPage, setCompactPage] = useState(3);
  const [invoicePage, setInvoicePage] = useState(1);

  const currency = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  });

  const invoicePages = Math.ceil(INVOICES.length / PAGE_SIZE);
  const firstIndex = (invoicePage - 1) * PAGE_SIZE;
  const visibleInvoices = INVOICES.slice(firstIndex, firstIndex + PAGE_SIZE);

  return (
    <ExamplePage
      title={t('components.pagination.title')}
      description={t('components.pagination.description')}
      docs='https://ui.shadcn.com/docs/components/pagination'
    >
      <ExampleSection
        title={t('components.pagination.basic')}
        description={t('components.pagination.basicDescription')}
        contentClassName='block space-y-3'
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                text={t('reference.previous')}
                aria-disabled={basicPage === 1}
                className={
                  basicPage === 1 ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  setBasicPage((page) => Math.max(1, page - 1));
                }}
              />
            </PaginationItem>
            {[1, 2, 3, 4, 5].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href='#'
                  isActive={page === basicPage}
                  onClick={(event) => {
                    event.preventDefault();
                    setBasicPage(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href='#'
                text={t('reference.next')}
                aria-disabled={basicPage === 5}
                className={
                  basicPage === 5 ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  setBasicPage((page) => Math.min(5, page + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className='text-center text-sm text-muted-foreground'>
          {t('components.pagination.pageOf', { page: basicPage, total: 5 })}
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.pagination.ellipsis')}
        description={t('components.pagination.ellipsisDescription')}
        contentClassName='block space-y-3'
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                text={t('reference.previous')}
                aria-disabled={largePage === 1}
                className={
                  largePage === 1 ? 'pointer-events-none opacity-50' : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  setLargePage((page) => Math.max(1, page - 1));
                }}
              />
            </PaginationItem>
            {buildPageTokens(largePage, LARGE_TOTAL).map((token) => (
              <PaginationItem key={token}>
                {typeof token === 'number' ? (
                  <PaginationLink
                    href='#'
                    isActive={token === largePage}
                    onClick={(event) => {
                      event.preventDefault();
                      setLargePage(token);
                    }}
                  >
                    {token}
                  </PaginationLink>
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href='#'
                text={t('reference.next')}
                aria-disabled={largePage === LARGE_TOTAL}
                className={
                  largePage === LARGE_TOTAL
                    ? 'pointer-events-none opacity-50'
                    : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  setLargePage((page) => Math.min(LARGE_TOTAL, page + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className='text-center text-sm text-muted-foreground'>
          {t('components.pagination.pageOf', {
            page: largePage,
            total: LARGE_TOTAL,
          })}
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.pagination.compact')}
        description={t('components.pagination.compactDescription')}
      >
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('reference.previous')}
            disabled={compactPage === 1}
            onClick={() => setCompactPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeftIcon />
          </Button>
          <span className='text-sm tabular-nums text-muted-foreground'>
            {t('components.pagination.pageOf', {
              page: compactPage,
              total: 12,
            })}
          </span>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('reference.next')}
            disabled={compactPage === 12}
            onClick={() => setCompactPage((page) => Math.min(12, page + 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.pagination.list')}
        description={t('components.pagination.listDescription')}
        contentClassName='block space-y-4'
      >
        <ul className='divide-y rounded-lg border'>
          {visibleInvoices.map((invoice) => (
            <li
              key={invoice.number}
              className='flex items-center justify-between gap-4 px-4 py-2.5 text-sm'
            >
              <div className='min-w-0'>
                <div className='truncate font-medium'>{invoice.customer}</div>
                <div className='font-mono text-xs text-muted-foreground'>
                  {invoice.number} · {invoice.issuedOn}
                </div>
              </div>
              <span className='tabular-nums'>
                {currency.format(invoice.amount)}
              </span>
            </li>
          ))}
        </ul>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-sm text-muted-foreground'>
            {t('components.pagination.range', {
              from: firstIndex + 1,
              to: firstIndex + visibleInvoices.length,
              total: INVOICES.length,
            })}
          </p>
          <Pagination className='mx-0 w-auto justify-end'>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href='#'
                  text={t('reference.previous')}
                  aria-disabled={invoicePage === 1}
                  className={
                    invoicePage === 1
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    setInvoicePage((page) => Math.max(1, page - 1));
                  }}
                />
              </PaginationItem>
              {Array.from(
                { length: invoicePages },
                (_, index) => index + 1,
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href='#'
                    isActive={page === invoicePage}
                    onClick={(event) => {
                      event.preventDefault();
                      setInvoicePage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href='#'
                  text={t('reference.next')}
                  aria-disabled={invoicePage === invoicePages}
                  className={
                    invoicePage === invoicePages
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    setInvoicePage((page) => Math.min(invoicePages, page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
