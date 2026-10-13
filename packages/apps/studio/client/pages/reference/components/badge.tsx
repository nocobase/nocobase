import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowUpRightIcon,
  BadgeCheckIcon,
  BookmarkIcon,
  TruckIcon,
} from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

type OrderStatus =
  'paid' | 'pending' | 'shipped' | 'failed' | 'draft' | 'refunded';

interface Order {
  readonly id: string;
  readonly customer: string;
  readonly amount: string;
  readonly status: OrderStatus;
}

const orders: readonly Order[] = [
  {
    id: 'ORD-1042',
    customer: 'Acme Inc.',
    amount: '$1,240.00',
    status: 'paid',
  },
  { id: 'ORD-1043', customer: 'Globex', amount: '$860.00', status: 'pending' },
  {
    id: 'ORD-1044',
    customer: 'Initech',
    amount: '$2,310.00',
    status: 'shipped',
  },
  { id: 'ORD-1045', customer: 'Umbrella', amount: '$412.00', status: 'failed' },
  { id: 'ORD-1046', customer: 'Hooli', amount: '$95.00', status: 'draft' },
  {
    id: 'ORD-1047',
    customer: 'Stark',
    amount: '$1,780.00',
    status: 'refunded',
  },
];

/**
 * One mapping decides how a status looks everywhere; pages render a badge
 * from the status rather than picking a variant inline.
 */
const statusVariant: Record<OrderStatus, BadgeVariant> = {
  paid: 'default',
  pending: 'secondary',
  shipped: 'secondary',
  failed: 'destructive',
  draft: 'outline',
  refunded: 'outline',
};

const statusLabelKey: Record<OrderStatus, string> = {
  paid: 'reference.statusPaid',
  pending: 'reference.statusPending',
  shipped: 'reference.statusShipped',
  failed: 'reference.statusFailed',
  draft: 'reference.statusDraft',
  refunded: 'reference.statusRefunded',
};

export default function BadgeExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.badge.title')}
      description={t('components.badge.description')}
      docs='https://ui.shadcn.com/docs/components/badge'
    >
      <ExampleSection
        title={t('components.badge.variants')}
        description={t('components.badge.variantsDescription')}
      >
        <Badge>{t('components.badge.default')}</Badge>
        <Badge variant='secondary'>{t('components.badge.secondary')}</Badge>
        <Badge variant='destructive'>{t('components.badge.destructive')}</Badge>
        <Badge variant='outline'>{t('components.badge.outline')}</Badge>
        <Badge variant='ghost'>{t('components.badge.ghost')}</Badge>
        <Badge variant='link'>{t('components.badge.link')}</Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.badge.withIcon')}
        description={t('components.badge.withIconDescription')}
      >
        <Badge variant='secondary'>
          <BadgeCheckIcon data-icon='inline-start' />
          {t('components.badge.verified')}
        </Badge>
        <Badge variant='outline'>
          {t('components.badge.bookmarked')}
          <BookmarkIcon data-icon='inline-end' />
        </Badge>
        <Badge>
          <TruckIcon data-icon='inline-start' />
          {t('reference.statusShipped')}
        </Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.badge.withSpinner')}
        description={t('components.badge.withSpinnerDescription')}
      >
        <Badge variant='secondary'>
          <Spinner data-icon='inline-start' />
          {t('components.badge.generating')}
        </Badge>
        <Badge variant='destructive'>
          {t('components.badge.deleting')}
          <Spinner data-icon='inline-end' />
        </Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.badge.asLink')}
        description={t('components.badge.asLinkDescription')}
      >
        <Badge render={<Link to='/dev/components/button' />}>
          {t('components.badge.buttonPage')}
          <ArrowUpRightIcon data-icon='inline-end' />
        </Badge>
        <Badge
          variant='outline'
          render={
            <a
              href='https://ui.shadcn.com/docs/components/badge'
              target='_blank'
              rel='noreferrer'
            />
          }
        >
          {t('reference.docs')}
          <ArrowUpRightIcon data-icon='inline-end' />
        </Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.badge.statusMapping')}
        description={t('components.badge.statusMappingDescription')}
        contentClassName='block'
      >
        <ul className='w-full max-w-md divide-y rounded-lg border text-sm'>
          {orders.map((order) => (
            <li
              key={order.id}
              className='grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-4 py-2.5'
            >
              <span className='font-mono text-xs'>{order.id}</span>
              <span className='truncate text-muted-foreground'>
                {order.customer}
              </span>
              <span className='tabular-nums'>{order.amount}</span>
              <Badge variant={statusVariant[order.status]}>
                {t(statusLabelKey[order.status])}
              </Badge>
            </li>
          ))}
        </ul>
      </ExampleSection>

      <ExampleSection
        title={t('components.badge.counts')}
        description={t('components.badge.countsDescription')}
        contentClassName='block'
      >
        <nav
          aria-label={t('components.badge.mailboxes')}
          className='flex w-48 flex-col gap-0.5'
        >
          <Button variant='ghost' size='sm' className='justify-start'>
            {t('components.badge.inbox')}
            <Badge variant='secondary' className='ml-auto tabular-nums'>
              12
            </Badge>
          </Button>
          <Button variant='ghost' size='sm' className='justify-start'>
            {t('reference.statusDraft')}
            <Badge variant='secondary' className='ml-auto tabular-nums'>
              3
            </Badge>
          </Button>
          <Button variant='ghost' size='sm' className='justify-start'>
            {t('reference.statusFailed')}
            <Badge variant='destructive' className='ml-auto tabular-nums'>
              2
            </Badge>
          </Button>
          <Button variant='ghost' size='sm' className='justify-start'>
            {t('reference.statusArchived')}
            <Badge variant='outline' className='ml-auto tabular-nums'>
              128
            </Badge>
          </Button>
        </nav>
      </ExampleSection>
    </ExamplePage>
  );
}
