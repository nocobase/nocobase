import { useTranslation } from '@nocobase/i18n/client';
import { HistoryIcon, PencilIcon, TruckIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { ExamplePage, ExampleSection } from '../shared';

const SHEET_SIDES = ['top', 'right', 'bottom', 'left'] as const;

type SheetSide = (typeof SHEET_SIDES)[number];

const sideLabelKeys: Record<SheetSide, string> = {
  top: 'components.sheet.sideTop',
  right: 'components.sheet.sideRight',
  bottom: 'components.sheet.sideBottom',
  left: 'components.sheet.sideLeft',
};

const activityLog = [
  { id: 'a1', time: 'Sep 18, 09:12', text: 'Payment of $1,240.00 captured' },
  { id: 'a2', time: 'Sep 18, 09:14', text: 'Order confirmed by warehouse' },
  { id: 'a3', time: 'Sep 18, 11:40', text: 'Packing slip printed' },
  { id: 'a4', time: 'Sep 18, 14:05', text: 'Two items picked from aisle 7' },
  { id: 'a5', time: 'Sep 18, 15:30', text: 'Quality check passed' },
  { id: 'a6', time: 'Sep 19, 08:02', text: 'Label created with DHL Express' },
  { id: 'a7', time: 'Sep 19, 08:45', text: 'Handed to carrier' },
  { id: 'a8', time: 'Sep 19, 17:20', text: 'Departed sorting facility' },
  { id: 'a9', time: 'Sep 20, 06:10', text: 'Arrived at regional hub' },
  { id: 'a10', time: 'Sep 20, 12:33', text: 'Out for delivery' },
  { id: 'a11', time: 'Sep 20, 15:48', text: 'Delivered, signed by O. Chen' },
  { id: 'a12', time: 'Sep 21, 09:00', text: 'Customer rated the delivery 5/5' },
];

export default function SheetExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'shipped'>(
    'pending',
  );

  return (
    <ExamplePage
      title={t('components.sheet.title')}
      description={t('components.sheet.description')}
      docs='https://ui.shadcn.com/docs/components/sheet'
    >
      <ExampleSection
        title={t('components.sheet.basic')}
        description={t('components.sheet.basicDescription')}
      >
        <Sheet>
          <SheetTrigger render={<Button variant='outline' />}>
            <PencilIcon data-icon='inline-start' />
            {t('components.sheet.editCustomer')}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('components.sheet.editCustomer')}</SheetTitle>
              <SheetDescription>
                {t('components.sheet.editCustomerDescription')}
              </SheetDescription>
            </SheetHeader>
            <FieldGroup className='px-4'>
              <Field>
                <FieldLabel htmlFor='sheet-customer-name'>
                  {t('reference.name')}
                </FieldLabel>
                <Input id='sheet-customer-name' defaultValue='Olivia Chen' />
              </Field>
              <Field>
                <FieldLabel htmlFor='sheet-customer-email'>
                  {t('reference.email')}
                </FieldLabel>
                <Input
                  id='sheet-customer-email'
                  type='email'
                  defaultValue='olivia.chen@northwind.example'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='sheet-customer-phone'>
                  {t('reference.phone')}
                </FieldLabel>
                <Input
                  id='sheet-customer-phone'
                  type='tel'
                  defaultValue='+1 415 555 0142'
                />
              </Field>
            </FieldGroup>
            <SheetFooter>
              <SheetClose render={<Button />}>{t('reference.save')}</SheetClose>
              <SheetClose render={<Button variant='outline' />}>
                {t('reference.cancel')}
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </ExampleSection>

      <ExampleSection
        title={t('components.sheet.sides')}
        description={t('components.sheet.sidesDescription')}
      >
        {SHEET_SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger render={<Button variant='outline' />}>
              {t(sideLabelKeys[side])}
            </SheetTrigger>
            <SheetContent
              side={side}
              className='data-[side=bottom]:max-h-[50vh] data-[side=top]:max-h-[50vh]'
            >
              <SheetHeader>
                <SheetTitle>
                  {t('components.sheet.sidePreviewTitle')}
                </SheetTitle>
                <SheetDescription>
                  {t('components.sheet.sidePreviewDescription')}
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <SheetClose render={<Button variant='outline' />}>
                  {t('reference.close')}
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.sheet.controlled')}
        description={t('components.sheet.controlledDescription')}
      >
        <span className='text-sm font-medium'>#ORD-1042</span>
        <Badge variant={orderStatus === 'shipped' ? 'default' : 'secondary'}>
          {orderStatus === 'shipped'
            ? t('reference.statusShipped')
            : t('reference.statusPending')}
        </Badge>
        <Button variant='outline' size='sm' onClick={() => setOrderOpen(true)}>
          {t('components.sheet.viewOrder')}
        </Button>
        {orderStatus === 'shipped' ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setOrderStatus('pending')}
          >
            {t('reference.reset')}
          </Button>
        ) : null}
        <Sheet open={orderOpen} onOpenChange={setOrderOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{t('components.sheet.orderDetails')}</SheetTitle>
              <SheetDescription>
                {t('components.sheet.orderDetailsDescription')}
              </SheetDescription>
            </SheetHeader>
            <dl className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-4 text-sm'>
              <dt className='text-muted-foreground'>
                {t('reference.customer')}
              </dt>
              <dd>Northwind Traders</dd>
              <dt className='text-muted-foreground'>{t('reference.amount')}</dt>
              <dd className='tabular-nums'>$1,357.20</dd>
              <dt className='text-muted-foreground'>{t('reference.date')}</dt>
              <dd>Sep 18, 2026</dd>
              <dt className='text-muted-foreground'>{t('reference.status')}</dt>
              <dd>
                {orderStatus === 'shipped'
                  ? t('reference.statusShipped')
                  : t('reference.statusPending')}
              </dd>
            </dl>
            <SheetFooter>
              <Button
                disabled={orderStatus === 'shipped'}
                onClick={() => {
                  setOrderStatus('shipped');
                  setOrderOpen(false);
                }}
              >
                <TruckIcon data-icon='inline-start' />
                {t('components.sheet.markShipped')}
              </Button>
              <SheetClose render={<Button variant='outline' />}>
                {t('reference.close')}
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </ExampleSection>

      <ExampleSection
        title={t('components.sheet.scrollable')}
        description={t('components.sheet.scrollableDescription')}
      >
        <Sheet>
          <SheetTrigger render={<Button variant='outline' />}>
            <HistoryIcon data-icon='inline-start' />
            {t('components.sheet.activityLog')}
          </SheetTrigger>
          <SheetContent showCloseButton={false}>
            <SheetHeader>
              <SheetTitle>{t('components.sheet.activityLog')}</SheetTitle>
              <SheetDescription>
                {t('components.sheet.activityLogDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className='min-h-0 flex-1 overflow-y-auto px-4'>
              <ol className='space-y-4 text-sm'>
                {activityLog.map((entry) => (
                  <li key={entry.id} className='flex gap-3'>
                    <span className='w-28 shrink-0 text-muted-foreground tabular-nums'>
                      {entry.time}
                    </span>
                    <span>{entry.text}</span>
                  </li>
                ))}
              </ol>
            </div>
            <SheetFooter>
              <SheetClose render={<Button variant='outline' />}>
                {t('reference.close')}
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </ExampleSection>
    </ExamplePage>
  );
}
