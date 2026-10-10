import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

import { ExamplePage, ExampleSection } from '../shared';

interface OrderLine {
  readonly sku: string;
  readonly product: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

const ORDER_LINES: readonly OrderLine[] = [
  { sku: 'SCN-X2', product: 'Barcode Scanner X2', quantity: 4, unitPrice: 189 },
  {
    sku: 'PRT-80',
    product: 'Thermal Printer 80mm',
    quantity: 2,
    unitPrice: 249,
  },
  { sku: 'POS-PRO', product: 'POS Terminal Pro', quantity: 1, unitPrice: 1299 },
  { sku: 'CBL-USB', product: 'USB-C Cable 2m', quantity: 12, unitPrice: 9.5 },
  { sku: 'STD-01', product: 'Tablet Stand', quantity: 3, unitPrice: 45 },
  {
    sku: 'PPR-80',
    product: 'Receipt Paper 80mm (50 rolls)',
    quantity: 6,
    unitPrice: 32,
  },
  { sku: 'DRW-16', product: 'Cash Drawer 16"', quantity: 1, unitPrice: 159 },
  {
    sku: 'LBL-4X6',
    product: 'Shipping Labels 4x6 (500)',
    quantity: 5,
    unitPrice: 28,
  },
  { sku: 'SCL-30', product: 'Digital Scale 30kg', quantity: 1, unitPrice: 219 },
  {
    sku: 'WAR-2Y',
    product: 'Extended Warranty (2 years)',
    quantity: 1,
    unitPrice: 299,
  },
];

const SHARE_LINK = 'https://app.example.com/invoices/INV-2041?token=8f3a';

export default function DialogExamplePage(): ReactElement {
  const { t, i18n } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);

  const currency = new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'USD',
  });
  const total = ORDER_LINES.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(SHARE_LINK).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ExamplePage
      title={t('components.dialog.title')}
      description={t('components.dialog.description')}
      docs='https://ui.shadcn.com/docs/components/dialog'
    >
      <ExampleSection
        title={t('components.dialog.form')}
        description={t('components.dialog.formDescription')}
      >
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('components.dialog.editCustomer')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle>{t('components.dialog.editCustomer')}</DialogTitle>
              <DialogDescription>
                {t('components.dialog.editCustomerDescription')}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='dialog-customer-name'>
                  {t('reference.name')}
                </FieldLabel>
                <Input id='dialog-customer-name' defaultValue='Ava Chen' />
              </Field>
              <Field>
                <FieldLabel htmlFor='dialog-customer-email'>
                  {t('reference.email')}
                </FieldLabel>
                <Input
                  id='dialog-customer-email'
                  type='email'
                  defaultValue='ava.chen@northwind.example'
                />
                <FieldDescription>
                  {t('components.dialog.emailHint')}
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant='outline' />}>
                {t('reference.cancel')}
              </DialogClose>
              <DialogClose render={<Button />}>
                {t('reference.save')}
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.dialog.confirm')}
        description={t('components.dialog.confirmDescription')}
      >
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger
            render={<Button variant='destructive' disabled={deleted} />}
          >
            <Trash2Icon data-icon='inline-start' />
            {t('components.dialog.deleteInvoice')}
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>
                {t('components.dialog.deleteInvoiceTitle', {
                  number: 'INV-2041',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('components.dialog.deleteInvoiceDescription')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant='outline' />}>
                {t('reference.cancel')}
              </DialogClose>
              <Button
                variant='destructive'
                onClick={() => {
                  setDeleted(true);
                  setConfirmOpen(false);
                }}
              >
                {t('reference.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {deleted ? (
          <span className='flex items-center gap-2 text-sm text-muted-foreground'>
            {t('components.dialog.deleted', { number: 'INV-2041' })}
            <Button variant='link' size='sm' onClick={() => setDeleted(false)}>
              {t('components.dialog.undo')}
            </Button>
          </span>
        ) : null}
      </ExampleSection>

      <ExampleSection
        title={t('components.dialog.scrollable')}
        description={t('components.dialog.scrollableDescription')}
      >
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('components.dialog.viewOrderItems')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>
                {t('components.dialog.orderItems', { number: 'ORD-1042' })}
              </DialogTitle>
              <DialogDescription>
                {t('components.dialog.orderItemsDescription', {
                  count: ORDER_LINES.length,
                })}
              </DialogDescription>
            </DialogHeader>
            <ul className='-mx-4 max-h-72 divide-y overflow-y-auto px-4'>
              {ORDER_LINES.map((line) => (
                <li
                  key={line.sku}
                  className='flex items-center justify-between gap-4 py-2.5'
                >
                  <div className='min-w-0'>
                    <div className='truncate font-medium'>{line.product}</div>
                    <div className='font-mono text-xs text-muted-foreground'>
                      {line.sku} × {line.quantity}
                    </div>
                  </div>
                  <span className='tabular-nums'>
                    {currency.format(line.quantity * line.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
            <DialogFooter showCloseButton className='sm:justify-between'>
              <span className='flex items-center gap-2 text-sm'>
                <span className='text-muted-foreground'>
                  {t('reference.total')}
                </span>
                <Badge variant='secondary' className='tabular-nums'>
                  {currency.format(total)}
                </Badge>
              </span>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.dialog.share')}
        description={t('components.dialog.shareDescription')}
      >
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('reference.share')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{t('components.dialog.shareLink')}</DialogTitle>
              <DialogDescription>
                {t('components.dialog.shareLinkDescription')}
              </DialogDescription>
            </DialogHeader>
            <InputGroup>
              <InputGroupInput
                aria-label={t('components.dialog.shareLink')}
                value={SHARE_LINK}
                readOnly
              />
              <InputGroupAddon align='inline-end'>
                <InputGroupButton
                  size='icon-xs'
                  aria-label={t('reference.copy')}
                  onClick={handleCopy}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <DialogFooter className='sm:justify-start'>
              <DialogClose render={<Button type='button' />}>
                {t('reference.close')}
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ExampleSection>

      <ExampleSection
        title={t('components.dialog.sizes')}
        description={t('components.dialog.sizesDescription')}
      >
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('components.dialog.small')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle>{t('components.dialog.small')}</DialogTitle>
              <DialogDescription>
                {t('components.dialog.sizeHint', { width: 'sm:max-w-sm' })}
              </DialogDescription>
            </DialogHeader>
            <div className='h-24 rounded-lg bg-muted' />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('components.dialog.medium')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{t('components.dialog.medium')}</DialogTitle>
              <DialogDescription>
                {t('components.dialog.sizeHint', { width: 'sm:max-w-lg' })}
              </DialogDescription>
            </DialogHeader>
            <div className='h-24 rounded-lg bg-muted' />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger render={<Button variant='outline' />}>
            {t('components.dialog.large')}
          </DialogTrigger>
          <DialogContent className='sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle>{t('components.dialog.large')}</DialogTitle>
              <DialogDescription>
                {t('components.dialog.sizeHint', { width: 'sm:max-w-2xl' })}
              </DialogDescription>
            </DialogHeader>
            <div className='h-24 rounded-lg bg-muted' />
          </DialogContent>
        </Dialog>
      </ExampleSection>
    </ExamplePage>
  );
}
