import { useTranslation } from '@nocobase/i18n/client';
import {
  CreditCardIcon,
  PackageIcon,
  ReceiptTextIcon,
  TruckIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ExamplePage, ExampleSection } from '../shared';

const LIST_VARIANTS = ['default', 'line'] as const;

interface OrderLine {
  readonly sku: string;
  readonly product: string;
  readonly quantity: number;
  readonly amount: string;
}

const ORDER_LINES: readonly OrderLine[] = [
  {
    sku: 'POS-PRO',
    product: 'POS Terminal Pro',
    quantity: 1,
    amount: '$1,299.00',
  },
  {
    sku: 'SCN-X2',
    product: 'Barcode Scanner X2',
    quantity: 4,
    amount: '$756.00',
  },
  {
    sku: 'PRT-80',
    product: 'Thermal Printer 80mm',
    quantity: 1,
    amount: '$249.00',
  },
];

export default function TabsExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.tabs.title')}
      description={t('components.tabs.description')}
      docs='https://ui.shadcn.com/docs/components/tabs'
    >
      <ExampleSection
        title={t('components.tabs.basic')}
        description={t('components.tabs.basicDescription')}
        contentClassName='block'
      >
        <Tabs defaultValue='summary' className='w-full max-w-lg'>
          <TabsList>
            <TabsTrigger value='summary'>
              {t('components.tabs.summary')}
            </TabsTrigger>
            <TabsTrigger value='items'>
              {t('components.tabs.items')}
            </TabsTrigger>
            <TabsTrigger value='shipping'>
              {t('components.tabs.shipping')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='summary'>
            <Card>
              <CardHeader>
                <CardTitle>{t('components.tabs.summary')}</CardTitle>
                <CardDescription>
                  {t('components.tabs.summaryDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='text-sm text-muted-foreground'>
                ORD-1042 · Northwind Trading · $2,418.00
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='items'>
            <Card>
              <CardHeader>
                <CardTitle>{t('components.tabs.items')}</CardTitle>
                <CardDescription>
                  {t('components.tabs.itemsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className='space-y-1.5 text-sm'>
                  {ORDER_LINES.map((line) => (
                    <li
                      key={line.sku}
                      className='flex items-center justify-between gap-4'
                    >
                      <span className='truncate'>
                        {line.quantity} × {line.product}
                      </span>
                      <span className='tabular-nums'>{line.amount}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='shipping'>
            <Card>
              <CardHeader>
                <CardTitle>{t('components.tabs.shipping')}</CardTitle>
                <CardDescription>
                  {t('components.tabs.shippingDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='text-sm text-muted-foreground'>
                18 Quay Street, Auckland 1010 · Arriving Sep 24, 2026
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ExampleSection>

      <ExampleSection
        title={t('components.tabs.variants')}
        description={t('components.tabs.variantsDescription')}
        contentClassName='block space-y-4'
      >
        {LIST_VARIANTS.map((variant) => (
          <Tabs key={variant} defaultValue='open' className='w-full max-w-lg'>
            <TabsList variant={variant}>
              <TabsTrigger value='open'>
                {t('components.tabs.openInvoices')}
              </TabsTrigger>
              <TabsTrigger value='overdue'>
                {t('components.tabs.overdueInvoices')}
              </TabsTrigger>
              <TabsTrigger value='paid'>
                {t('reference.statusPaid')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value='open' className='text-muted-foreground'>
              {t('components.tabs.invoiceCount', { count: 7 })}
            </TabsContent>
            <TabsContent value='overdue' className='text-muted-foreground'>
              {t('components.tabs.invoiceCount', { count: 2 })}
            </TabsContent>
            <TabsContent value='paid' className='text-muted-foreground'>
              {t('components.tabs.invoiceCount', { count: 118 })}
            </TabsContent>
          </Tabs>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.tabs.withIcons')}
        description={t('components.tabs.withIconsDescription')}
        contentClassName='block'
      >
        <Tabs defaultValue='fulfilment' className='w-full max-w-lg'>
          <TabsList>
            <TabsTrigger value='fulfilment'>
              <PackageIcon />
              {t('components.tabs.fulfilment')}
            </TabsTrigger>
            <TabsTrigger value='delivery'>
              <TruckIcon />
              {t('components.tabs.delivery')}
            </TabsTrigger>
            <TabsTrigger value='billing'>
              <CreditCardIcon />
              {t('components.tabs.billing')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='fulfilment' className='text-muted-foreground'>
            {t('components.tabs.fulfilmentBody')}
          </TabsContent>
          <TabsContent value='delivery' className='text-muted-foreground'>
            {t('components.tabs.deliveryBody')}
          </TabsContent>
          <TabsContent value='billing' className='text-muted-foreground'>
            {t('components.tabs.billingBody')}
          </TabsContent>
        </Tabs>
      </ExampleSection>

      <ExampleSection
        title={t('components.tabs.vertical')}
        description={t('components.tabs.verticalDescription')}
        contentClassName='block'
      >
        <Tabs
          defaultValue='profile'
          orientation='vertical'
          className='w-full max-w-lg'
        >
          <TabsList className='w-44'>
            <TabsTrigger value='profile'>
              {t('components.tabs.companyProfile')}
            </TabsTrigger>
            <TabsTrigger value='contacts'>
              {t('components.tabs.contacts')}
            </TabsTrigger>
            <TabsTrigger value='terms'>
              {t('components.tabs.paymentTerms')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='profile' className='text-muted-foreground'>
            Northwind Trading · Wholesale · Customer since 2019
          </TabsContent>
          <TabsContent value='contacts' className='text-muted-foreground'>
            Ava Chen · ava.chen@northwind.example · +64 9 555 0142
          </TabsContent>
          <TabsContent value='terms' className='text-muted-foreground'>
            {t('components.tabs.paymentTermsBody')}
          </TabsContent>
        </Tabs>
      </ExampleSection>

      <ExampleSection
        title={t('components.tabs.disabled')}
        description={t('components.tabs.disabledDescription')}
        contentClassName='block'
      >
        <Tabs defaultValue='invoice' className='w-full max-w-lg'>
          <TabsList>
            <TabsTrigger value='invoice'>
              <ReceiptTextIcon />
              {t('components.tabs.invoice')}
            </TabsTrigger>
            <TabsTrigger value='creditNote' disabled>
              {t('components.tabs.creditNote')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='invoice'>
            <span className='flex items-center gap-2 text-muted-foreground'>
              INV-2041
              <Badge variant='secondary'>{t('reference.statusPaid')}</Badge>
            </span>
          </TabsContent>
          <TabsContent value='creditNote' className='text-muted-foreground'>
            {t('components.tabs.creditNoteBody')}
          </TabsContent>
        </Tabs>
      </ExampleSection>
    </ExamplePage>
  );
}
