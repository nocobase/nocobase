import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

import { ExamplePage, ExampleSection } from '../shared';

interface OrderSummary {
  readonly reference: string;
  readonly customer: string;
  readonly amount: string;
}

const ORDERS: readonly OrderSummary[] = [
  { reference: 'ORD-1042', customer: 'Northwind Trading', amount: '$2,418.00' },
  { reference: 'ORD-1041', customer: 'Blue Harbor Cafe', amount: '$312.50' },
  { reference: 'ORD-1039', customer: 'Lakeside Clinic', amount: '$1,090.00' },
  { reference: 'ORD-1036', customer: 'Foxglove Studio', amount: '$744.20' },
];

const ACTIVITY: readonly string[] = [
  'Sep 18 · Payment captured by Ava Chen',
  'Sep 17 · Invoice INV-2041 sent to accounts@northwind.example',
  'Sep 16 · Order approved by Marcus Reed',
  'Sep 16 · Draft created from quote QTE-0884',
];

export default function ResizableExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.resizable.title')}
      description={t('components.resizable.description')}
      docs='https://ui.shadcn.com/docs/components/resizable'
    >
      <ExampleSection
        title={t('components.resizable.horizontal')}
        description={t('components.resizable.horizontalDescription')}
        contentClassName='h-80 p-0 overflow-hidden'
      >
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel defaultSize='38%' minSize='25%'>
            <div className='flex h-full flex-col'>
              <div className='border-b px-4 py-3 text-sm font-medium'>
                {t('components.resizable.orderList')}
              </div>
              <ul className='flex-1 overflow-y-auto'>
                {ORDERS.map((order) => (
                  <li
                    key={order.reference}
                    className='flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm last:border-b-0'
                  >
                    <span className='min-w-0'>
                      <span className='block font-mono text-xs text-muted-foreground'>
                        {order.reference}
                      </span>
                      <span className='block truncate'>{order.customer}</span>
                    </span>
                    <span className='tabular-nums'>{order.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='62%' minSize='30%'>
            <div className='flex h-full flex-col gap-3 p-4'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-sm'>ORD-1042</span>
                <Badge variant='secondary'>{t('reference.statusPaid')}</Badge>
              </div>
              <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
                <dt className='text-muted-foreground'>
                  {t('reference.customer')}
                </dt>
                <dd>Northwind Trading</dd>
                <dt className='text-muted-foreground'>
                  {t('reference.owner')}
                </dt>
                <dd>Marcus Reed</dd>
                <dt className='text-muted-foreground'>
                  {t('reference.createdAt')}
                </dt>
                <dd>Sep 16, 2026</dd>
                <dt className='text-muted-foreground'>
                  {t('reference.total')}
                </dt>
                <dd className='tabular-nums'>$2,418.00</dd>
              </dl>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.resizable.vertical')}
        description={t('components.resizable.verticalDescription')}
        contentClassName='h-80 p-0 overflow-hidden'
      >
        <ResizablePanelGroup orientation='vertical'>
          <ResizablePanel defaultSize='45%' minSize='20%'>
            <div className='flex h-full flex-col gap-2 p-4'>
              <span className='text-sm font-medium'>
                {t('components.resizable.customerRecord')}
              </span>
              <p className='text-sm text-muted-foreground'>
                Northwind Trading · 18 Quay Street, Auckland
              </p>
              <p className='text-sm text-muted-foreground'>
                ava.chen@northwind.example · +64 9 555 0142
              </p>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='55%' minSize='20%'>
            <div className='flex h-full flex-col gap-2 overflow-y-auto p-4'>
              <span className='text-sm font-medium'>
                {t('components.resizable.activity')}
              </span>
              <ul className='space-y-1.5 text-sm text-muted-foreground'>
                {ACTIVITY.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.resizable.nested')}
        description={t('components.resizable.nestedDescription')}
        contentClassName='h-80 p-0 overflow-hidden'
      >
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel defaultSize='28%' minSize='18%' maxSize='45%'>
            <nav className='flex h-full flex-col gap-1 p-3 text-sm'>
              <span className='px-2 pb-1 text-xs text-muted-foreground'>
                {t('components.resizable.navigation')}
              </span>
              <span className='rounded-md bg-muted px-2 py-1.5 font-medium'>
                {t('components.resizable.invoices')}
              </span>
              <span className='rounded-md px-2 py-1.5 text-muted-foreground'>
                {t('components.resizable.payments')}
              </span>
              <span className='rounded-md px-2 py-1.5 text-muted-foreground'>
                {t('components.resizable.creditNotes')}
              </span>
            </nav>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='72%'>
            <ResizablePanelGroup orientation='vertical'>
              <ResizablePanel defaultSize='65%' minSize='25%'>
                <div className='flex h-full flex-col gap-2 p-4'>
                  <span className='text-sm font-medium'>
                    {t('components.resizable.invoicePreview')}
                  </span>
                  <p className='text-sm text-muted-foreground'>
                    INV-2041 · Northwind Trading · Due Oct 16, 2026
                  </p>
                  <div className='flex-1 rounded-md bg-muted' />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize='35%' minSize='15%'>
                <div className='flex h-full flex-col gap-2 overflow-y-auto p-4'>
                  <span className='text-sm font-medium'>
                    {t('reference.notes')}
                  </span>
                  <p className='text-sm text-muted-foreground'>
                    Customer asked for net 30 terms on this invoice. Approved by
                    finance on Sep 17.
                  </p>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.resizable.collapsible')}
        description={t('components.resizable.collapsibleDescription')}
        contentClassName='h-64 p-0 overflow-hidden'
      >
        <ResizablePanelGroup orientation='horizontal'>
          <ResizablePanel
            defaultSize='30%'
            minSize='18%'
            collapsible
            collapsedSize='0%'
          >
            <div className='flex h-full flex-col gap-2 p-4'>
              <span className='text-sm font-medium'>
                {t('reference.filter')}
              </span>
              <p className='text-sm text-muted-foreground'>
                {t('components.resizable.filterHint')}
              </p>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='70%' minSize='40%'>
            <div className='flex h-full items-center justify-center p-4 text-sm text-muted-foreground'>
              {t('components.resizable.resultsHint')}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
