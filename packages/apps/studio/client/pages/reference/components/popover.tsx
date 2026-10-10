import { useTranslation } from '@nocobase/i18n/client';
import { MailIcon, PhoneIcon, SettingsIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

import { ExamplePage, ExampleSection } from '../shared';

export default function PopoverExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [quantity, setQuantity] = useState('4');
  const [draftQuantity, setDraftQuantity] = useState('4');

  const openQuantityEditor = (open: boolean): void => {
    if (open) {
      setDraftQuantity(quantity);
    }
    setQuantityOpen(open);
  };

  return (
    <ExamplePage
      title={t('components.popover.title')}
      description={t('components.popover.description')}
      docs='https://ui.shadcn.com/docs/components/popover'
    >
      <ExampleSection
        title={t('components.popover.basic')}
        description={t('components.popover.basicDescription')}
      >
        <Popover>
          <PopoverTrigger render={<Button variant='outline' />}>
            {t('components.popover.viewOrder')}
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>ORD-1042</PopoverTitle>
              <PopoverDescription>
                {t('components.popover.orderSummary', {
                  customer: 'Northwind Traders',
                })}
              </PopoverDescription>
            </PopoverHeader>
            <dl className='grid grid-cols-2 gap-1.5 text-sm'>
              <dt className='text-muted-foreground'>{t('reference.status')}</dt>
              <dd className='text-right'>
                <Badge variant='secondary'>
                  {t('reference.statusProcessing')}
                </Badge>
              </dd>
              <dt className='text-muted-foreground'>{t('reference.total')}</dt>
              <dd className='text-right tabular-nums'>$2,184.00</dd>
              <dt className='text-muted-foreground'>
                {t('reference.dueDate')}
              </dt>
              <dd className='text-right'>Oct 2, 2026</dd>
            </dl>
          </PopoverContent>
        </Popover>
      </ExampleSection>

      <ExampleSection
        title={t('components.popover.placement')}
        description={t('components.popover.placementDescription')}
      >
        <Popover>
          <PopoverTrigger render={<Button variant='outline' />}>
            {t('components.popover.alignStart')}
          </PopoverTrigger>
          <PopoverContent align='start' className='w-56'>
            <PopoverDescription>
              {t('components.popover.placementHint', { align: 'start' })}
            </PopoverDescription>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger render={<Button variant='outline' />}>
            {t('components.popover.alignEnd')}
          </PopoverTrigger>
          <PopoverContent align='end' className='w-56'>
            <PopoverDescription>
              {t('components.popover.placementHint', { align: 'end' })}
            </PopoverDescription>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger render={<Button variant='outline' />}>
            {t('components.popover.sideTop')}
          </PopoverTrigger>
          <PopoverContent side='top' className='w-56'>
            <PopoverDescription>
              {t('components.popover.placementHint', { align: 'top' })}
            </PopoverDescription>
          </PopoverContent>
        </Popover>
      </ExampleSection>

      <ExampleSection
        title={t('components.popover.form')}
        description={t('components.popover.formDescription')}
        contentClassName='block space-y-3'
      >
        <p className='text-sm'>
          POS Terminal Pro ·{' '}
          <span className='tabular-nums'>
            {t('components.popover.quantityValue', { quantity })}
          </span>
        </p>
        <Popover open={quantityOpen} onOpenChange={openQuantityEditor}>
          <PopoverTrigger render={<Button variant='outline' size='sm' />}>
            <SettingsIcon data-icon='inline-start' />
            {t('components.popover.adjustQuantity')}
          </PopoverTrigger>
          <PopoverContent align='start' className='w-64'>
            <PopoverHeader>
              <PopoverTitle>
                {t('components.popover.adjustQuantity')}
              </PopoverTitle>
              <PopoverDescription>
                {t('components.popover.adjustQuantityDescription')}
              </PopoverDescription>
            </PopoverHeader>
            <Field>
              <FieldLabel htmlFor='popover-quantity'>
                {t('reference.quantity')}
              </FieldLabel>
              <Input
                id='popover-quantity'
                type='number'
                min={1}
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(event.target.value)}
              />
            </Field>
            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setQuantityOpen(false)}
              >
                {t('reference.cancel')}
              </Button>
              <Button
                size='sm'
                onClick={() => {
                  setQuantity(draftQuantity);
                  setQuantityOpen(false);
                }}
              >
                {t('reference.save')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </ExampleSection>

      <ExampleSection
        title={t('components.popover.contact')}
        description={t('components.popover.contactDescription')}
      >
        <Popover>
          <PopoverTrigger render={<Button variant='link' />}>
            Ava Chen
          </PopoverTrigger>
          <PopoverContent className='w-72'>
            <div className='flex items-center gap-3'>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
              <div className='min-w-0'>
                <div className='truncate font-medium'>Ava Chen</div>
                <div className='truncate text-xs text-muted-foreground'>
                  {t('components.popover.contactRole', {
                    company: 'Northwind Traders',
                  })}
                </div>
              </div>
            </div>
            <div className='space-y-1.5 text-sm'>
              <p className='flex items-center gap-2'>
                <MailIcon className='size-4 text-muted-foreground' />
                ava.chen@northwind.example
              </p>
              <p className='flex items-center gap-2'>
                <PhoneIcon className='size-4 text-muted-foreground' />
                +1 (415) 555-0142
              </p>
            </div>
            <Button variant='outline' size='sm' className='w-full'>
              {t('components.popover.viewCustomer')}
            </Button>
          </PopoverContent>
        </Popover>
      </ExampleSection>
    </ExamplePage>
  );
}
