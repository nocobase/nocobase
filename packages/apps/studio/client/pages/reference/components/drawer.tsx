import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@/components/ui/item';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Toaster, toast } from '@/components/ui/toast';

import { ExamplePage, ExampleSection } from '../shared';

interface OrderLine {
  readonly product: string;
  readonly quantity: number;
  readonly price: number;
}

const ORDER_LINES: readonly OrderLine[] = [
  { product: 'Barcode Scanner X2', quantity: 2, price: 378 },
  { product: 'Thermal Printer 80mm', quantity: 1, price: 249 },
  { product: 'Receipt Paper 80mm (50 rolls)', quantity: 3, price: 96 },
];

type DeliverySlot = 'asap' | 'evening-early' | 'evening-mid' | 'evening-late';

interface DeliveryOption {
  readonly value: DeliverySlot;
  /** A fixed time window is data; the standard option has a translated label. */
  readonly window?: string;
}

const DELIVERY_OPTIONS: readonly DeliveryOption[] = [
  { value: 'asap' },
  { value: 'evening-early', window: '5:00 PM – 5:15 PM' },
  { value: 'evening-mid', window: '6:00 PM – 6:15 PM' },
  { value: 'evening-late', window: '6:30 PM – 6:45 PM' },
];

const DELIVERY_LABEL_KEY: Record<DeliverySlot, string> = {
  asap: 'components.drawer.slotStandard',
  'evening-early': 'components.drawer.slotAfterWork',
  'evening-mid': 'components.drawer.slotPopular',
  'evening-late': 'components.drawer.slotLast',
};

function isDeliverySlot(value: unknown): value is DeliverySlot {
  return (
    value === 'asap' ||
    value === 'evening-early' ||
    value === 'evening-mid' ||
    value === 'evening-late'
  );
}

interface ActivityEntry {
  readonly id: string;
  readonly name: string;
  readonly time: string;
  readonly amount: number;
}

const ACTIVITY: readonly ActivityEntry[] = [
  { id: 'a1', name: 'Ava Chen', time: '09:12', amount: 1240 },
  { id: 'a2', name: 'Liam Patel', time: '09:48', amount: 389.5 },
  { id: 'a3', name: 'Noah Fischer', time: '10:05', amount: 2150 },
  { id: 'a4', name: 'Mia Rossi', time: '10:31', amount: 96 },
  { id: 'a5', name: 'Ethan Novak', time: '11:02', amount: 540 },
  { id: 'a6', name: 'Sofia Alvarez', time: '11:40', amount: 1780.25 },
  { id: 'a7', name: 'Lucas Meyer', time: '12:15', amount: 210 },
  { id: 'a8', name: 'Emma Dubois', time: '13:07', amount: 3320 },
  { id: 'a9', name: 'Oliver Kim', time: '13:52', amount: 455 },
  { id: 'a10', name: 'Isabella Costa', time: '14:20', amount: 899.99 },
];

const SIDES = [
  { key: 'top', swipeDirection: 'up' },
  { key: 'right', swipeDirection: 'right' },
  { key: 'bottom', swipeDirection: 'down' },
  { key: 'left', swipeDirection: 'left' },
] as const;

export default function DrawerExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('asap');

  const currency = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  });
  const total = ORDER_LINES.reduce((sum, line) => sum + line.price, 0);

  const confirmDelivery = (): void => {
    const option = DELIVERY_OPTIONS.find((item) => item.value === deliverySlot);
    setDeliveryOpen(false);
    toast.add({
      type: 'success',
      title: t('components.drawer.deliveryConfirmed'),
      description: option?.window ?? t(DELIVERY_LABEL_KEY[deliverySlot]),
    });
  };

  return (
    <ExamplePage
      title={t('components.drawer.title')}
      description={t('components.drawer.description')}
      docs='https://ui.shadcn.com/docs/components/drawer'
    >
      <Toaster />

      <ExampleSection
        title={t('components.drawer.basic')}
        description={t('components.drawer.basicDescription')}
      >
        <Drawer showSwipeHandle>
          <DrawerTrigger render={<Button variant='outline' />}>
            {t('components.drawer.openOrderSummary')}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('components.drawer.orderSummary')}</DrawerTitle>
              <DrawerDescription>
                {t('components.drawer.orderSummaryDescription', {
                  number: 'ORD-1042',
                })}
              </DrawerDescription>
            </DrawerHeader>
            <div className='mx-auto w-full max-w-md p-4'>
              <ul className='divide-y text-sm'>
                {ORDER_LINES.map((line) => (
                  <li
                    key={line.product}
                    className='flex items-center justify-between gap-4 py-2'
                  >
                    <span>
                      {line.quantity} × {line.product}
                    </span>
                    <span className='tabular-nums'>
                      {currency.format(line.price)}
                    </span>
                  </li>
                ))}
                <li className='flex items-center justify-between gap-4 py-2 font-medium'>
                  <span>{t('reference.total')}</span>
                  <span className='tabular-nums'>{currency.format(total)}</span>
                </li>
              </ul>
            </div>
            <DrawerFooter className='mx-auto w-full max-w-md'>
              <DrawerClose render={<Button />}>
                {t('components.drawer.confirmOrder')}
              </DrawerClose>
              <DrawerClose render={<Button variant='outline' />}>
                {t('reference.cancel')}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ExampleSection>

      <ExampleSection
        title={t('components.drawer.positions')}
        description={t('components.drawer.positionsDescription')}
      >
        {SIDES.map((side) => (
          <Drawer key={side.key} swipeDirection={side.swipeDirection}>
            <DrawerTrigger render={<Button variant='outline' />}>
              {t(`components.drawer.${side.key}`)}
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t(`components.drawer.${side.key}`)}</DrawerTitle>
                <DrawerDescription>
                  {t('components.drawer.panelDescription', {
                    direction: side.swipeDirection,
                  })}
                </DrawerDescription>
              </DrawerHeader>
              <div className='flex-1 p-4'>
                <div className='min-h-40 rounded-xl bg-muted group-data-[swipe-axis=x]/drawer-popup:size-full' />
              </div>
              <DrawerFooter>
                <DrawerClose render={<Button variant='outline' />}>
                  {t('reference.close')}
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.drawer.controlled')}
        description={t('components.drawer.controlledDescription')}
      >
        <Drawer
          open={deliveryOpen}
          onOpenChange={setDeliveryOpen}
          showSwipeHandle={isMobile}
          swipeDirection={isMobile ? 'down' : 'right'}
        >
          <DrawerTrigger render={<Button variant='secondary' />}>
            {t('components.drawer.pickDeliveryTime')}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {t('components.drawer.pickDeliveryTime')}
              </DrawerTitle>
              <DrawerDescription>
                {t('components.drawer.deliveryDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <div className='flex-1 overflow-y-auto p-4'>
              <RadioGroup
                value={deliverySlot}
                onValueChange={(value: unknown) => {
                  if (isDeliverySlot(value)) setDeliverySlot(value);
                }}
                className='gap-2'
              >
                {DELIVERY_OPTIONS.map((option) => (
                  <FieldLabel
                    key={option.value}
                    htmlFor={`delivery-${option.value}`}
                  >
                    <Field orientation='horizontal'>
                      <FieldContent>
                        <FieldTitle className='flex items-center gap-2'>
                          {option.window ??
                            t('components.drawer.standardDelivery')}
                          {option.value === 'asap' ? (
                            <Badge variant='secondary'>
                              {t('components.drawer.fastest')}
                            </Badge>
                          ) : null}
                        </FieldTitle>
                        <FieldDescription>
                          {t(DELIVERY_LABEL_KEY[option.value])}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={option.value}
                        id={`delivery-${option.value}`}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </div>
            <DrawerFooter>
              <Button onClick={confirmDelivery}>
                {t('components.drawer.confirmDelivery')}
              </Button>
              <DrawerClose render={<Button variant='outline' />}>
                {t('reference.cancel')}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <span className='text-sm text-muted-foreground'>
          {t('components.drawer.responsiveHint')}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.drawer.snapPoints')}
        description={t('components.drawer.snapPointsDescription')}
      >
        <Drawer snapPoints={['20rem', 1]} showSwipeHandle>
          <DrawerTrigger render={<Button variant='outline' />}>
            {t('components.drawer.openActivity')}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('components.drawer.activity')}</DrawerTitle>
              <DrawerDescription>
                {t('components.drawer.activityDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <div className='flex-1 overflow-y-auto p-4'>
              <ItemGroup className='mx-auto max-w-md gap-1'>
                {ACTIVITY.map((entry) => (
                  <Item key={entry.id} size='sm' variant='muted'>
                    <ItemContent>
                      <ItemTitle>{entry.name}</ItemTitle>
                      <ItemDescription>
                        {t('components.drawer.paymentReceived', {
                          time: entry.time,
                        })}
                      </ItemDescription>
                    </ItemContent>
                    <span className='text-sm font-medium tabular-nums'>
                      {currency.format(entry.amount)}
                    </span>
                  </Item>
                ))}
              </ItemGroup>
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button variant='outline' />}>
                {t('reference.close')}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ExampleSection>

      <ExampleSection
        title={t('components.drawer.nonModal')}
        description={t('components.drawer.nonModalDescription')}
      >
        <Drawer modal={false} disablePointerDismissal swipeDirection='right'>
          <DrawerTrigger render={<Button variant='outline' />}>
            {t('components.drawer.openNotes')}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('reference.notes')}</DrawerTitle>
              <DrawerDescription>
                {t('components.drawer.notesDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <div className='flex-1 p-4'>
              <Textarea
                aria-label={t('reference.notes')}
                placeholder={t('components.drawer.notesPlaceholder')}
                className='min-h-40'
              />
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button />}>
                {t('reference.save')}
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ExampleSection>
    </ExamplePage>
  );
}
