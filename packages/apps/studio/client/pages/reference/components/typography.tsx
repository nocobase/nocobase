import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
  TypographyTable,
} from '@/components/typography';

import { ExamplePage, ExampleSection } from '../shared';

interface PlanRow {
  readonly plan: string;
  readonly seats: string;
  readonly price: string;
}

const PLAN_ROWS: readonly PlanRow[] = [
  { plan: 'Starter', seats: 'Up to 5', price: '$29 / month' },
  { plan: 'Growth', seats: 'Up to 25', price: '$99 / month' },
  { plan: 'Enterprise', seats: 'Unlimited', price: 'By agreement' },
];

export default function TypographyExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.typography.title')}
      description={t('components.typography.description')}
      docs='https://ui.shadcn.com/docs/components/typography'
    >
      <ExampleSection
        title={t('components.typography.article')}
        description={t('components.typography.articleDescription')}
        contentClassName='block'
      >
        <article className='max-w-2xl'>
          <TypographyH1>Billing terms for the 2026 season</TypographyH1>
          <TypographyLead>
            What changes for wholesale accounts from October, and what every
            account manager has to tell their customers before the first invoice
            goes out.
          </TypographyLead>
          <TypographyH2 className='mt-10'>Invoicing</TypographyH2>
          <TypographyP>
            Invoices are issued on the first business day of the month and
            emailed to the billing contact on the account. An account with no
            billing contact falls back to the owner, which is usually the person
            who placed the first order.
          </TypographyP>
          <TypographyBlockquote>
            An invoice that bounces is not a delivered invoice. Check the
            address before the run, not after the reminder.
          </TypographyBlockquote>
          <TypographyH3 className='mt-8'>Payment terms</TypographyH3>
          <TypographyP>
            Standard terms are net 30 days. Accounts on net 60 keep their terms
            for the rest of the season, and new applications are reviewed by
            finance each quarter.
          </TypographyP>
          <TypographyList>
            <li>Payment in advance for a first order over $5,000</li>
            <li>Net 14 for accounts under review</li>
            <li>Net 30 as the default for wholesale</li>
          </TypographyList>
          <TypographyH4 className='mt-8'>Late payment</TypographyH4>
          <TypographyP>
            Interest of 1.5% per month accrues from the day after the due date.
            Send the reminder from the invoice page so the record shows it was
            sent, rather than from a personal mailbox.
          </TypographyP>
          <TypographyTable>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Seats</th>
                <th align='right'>Price</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.plan}>
                  <td>{row.plan}</td>
                  <td>{row.seats}</td>
                  <td align='right'>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </TypographyTable>
          <TypographyP>
            The plan on an account is stored as{' '}
            <TypographyInlineCode>accounts.planKey</TypographyInlineCode> and
            cannot be changed mid-month.
          </TypographyP>
          <TypographyMuted className='mt-6'>
            Last updated Sep 18, 2026 by Marcus Reed
          </TypographyMuted>
        </article>
      </ExampleSection>

      <ExampleSection
        title={t('components.typography.headings')}
        description={t('components.typography.headingsDescription')}
        contentClassName='block space-y-4'
      >
        <TypographyH1>Quarterly revenue review</TypographyH1>
        <TypographyH2>Wholesale accounts</TypographyH2>
        <TypographyH3>Northwind Trading</TypographyH3>
        <TypographyH4>Open invoices</TypographyH4>
      </ExampleSection>

      <ExampleSection
        title={t('components.typography.body')}
        description={t('components.typography.bodyDescription')}
        contentClassName='block'
      >
        <div className='max-w-2xl'>
          <TypographyLead>
            Revenue from wholesale accounts grew 18% over the quarter, carried
            almost entirely by three customers in the Auckland region.
          </TypographyLead>
          <TypographyP>
            Order volume was flat, so the growth came from larger baskets rather
            than from new accounts. That is worth watching: the same three
            customers are also the slowest payers on the book.
          </TypographyP>
          <TypographyLarge className='mt-6 block'>
            $412,880 invoiced
          </TypographyLarge>
          <TypographySmall className='mt-1 block text-muted-foreground'>
            Across 148 orders, from Jul 1 to Sep 30, 2026
          </TypographySmall>
          <TypographyBlockquote>
            Growth that comes from three customers is a concentration risk with
            a nice name.
          </TypographyBlockquote>
          <TypographyMuted className='mt-6'>
            Figures exclude credit notes issued after the quarter closed.
          </TypographyMuted>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.typography.lists')}
        description={t('components.typography.listsDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <div>
          <TypographySmall>
            {t('components.typography.unordered')}
          </TypographySmall>
          <TypographyList className='my-3'>
            <li>Confirm the billing contact on the account</li>
            <li>Check the purchase order number is on the invoice</li>
            <li>Attach the signed delivery note</li>
          </TypographyList>
        </div>
        <div>
          <TypographySmall>
            {t('components.typography.ordered')}
          </TypographySmall>
          <TypographyList ordered className='my-3'>
            <li>Raise the credit note against the original invoice</li>
            <li>Send it to the billing contact for acknowledgement</li>
            <li>Refund the card once the acknowledgement arrives</li>
          </TypographyList>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.typography.table')}
        description={t('components.typography.tableDescription')}
        contentClassName='block'
      >
        <div className='max-w-2xl'>
          <TypographyTable>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Seats</th>
                <th align='right'>Price</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.plan}>
                  <td>{row.plan}</td>
                  <td>{row.seats}</td>
                  <td align='right'>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </TypographyTable>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.typography.inline')}
        description={t('components.typography.inlineDescription')}
        contentClassName='block'
      >
        <TypographyP className='max-w-2xl'>
          Set the default terms with{' '}
          <TypographyInlineCode>pnpm nocobase app billing</TypographyInlineCode>
          , or change one account from its billing page. The stored value is a
          plain integer of days, so{' '}
          <TypographyInlineCode>30</TypographyInlineCode> means net 30, and{' '}
          <TypographyInlineCode>0</TypographyInlineCode> means payment in
          advance.
        </TypographyP>
      </ExampleSection>
    </ExamplePage>
  );
}
