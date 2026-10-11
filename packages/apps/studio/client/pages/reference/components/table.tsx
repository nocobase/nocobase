import { useTranslation } from '@nocobase/i18n/client';
import { ArrowRightIcon, MoreHorizontalIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ExamplePage, ExampleSection } from '../shared';

type InvoiceStatus = 'paid' | 'pending' | 'failed';

interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly status: InvoiceStatus;
  readonly method: string;
  readonly amount: number;
}

const invoices: readonly Invoice[] = [
  {
    id: 'INV-2026-091',
    customer: 'Northwind Traders',
    status: 'paid',
    method: 'Credit card',
    amount: 1250,
  },
  {
    id: 'INV-2026-092',
    customer: 'Contoso Ltd.',
    status: 'pending',
    method: 'Bank transfer',
    amount: 3480,
  },
  {
    id: 'INV-2026-093',
    customer: 'Fabrikam Inc.',
    status: 'failed',
    method: 'Credit card',
    amount: 620,
  },
  {
    id: 'INV-2026-094',
    customer: 'Adventure Works',
    status: 'paid',
    method: 'PayPal',
    amount: 2190,
  },
  {
    id: 'INV-2026-095',
    customer: 'Tailspin Toys',
    status: 'paid',
    method: 'Credit card',
    amount: 845,
  },
  {
    id: 'INV-2026-096',
    customer: 'Wide World Importers',
    status: 'pending',
    method: 'Bank transfer',
    amount: 5600,
  },
  {
    id: 'INV-2026-097',
    customer: 'Alpine Ski House',
    status: 'paid',
    method: 'PayPal',
    amount: 1310,
  },
];

const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

type LineStatus = 'shipped' | 'processing' | 'pending';

interface OrderLine {
  readonly sku: string;
  readonly product: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly status: LineStatus;
}

const orderLines: readonly OrderLine[] = [
  {
    sku: 'SKU-4410',
    product: 'Standing desk, oak',
    quantity: 2,
    unitPrice: 549,
    status: 'shipped',
  },
  {
    sku: 'SKU-2207',
    product: 'Monitor arm, dual',
    quantity: 4,
    unitPrice: 129,
    status: 'shipped',
  },
  {
    sku: 'SKU-1188',
    product: 'Ergonomic chair',
    quantity: 2,
    unitPrice: 389,
    status: 'processing',
  },
  {
    sku: 'SKU-9031',
    product: 'Desk lamp, LED',
    quantity: 6,
    unitPrice: 45,
    status: 'pending',
  },
];

const lineStatusVariant: Record<
  LineStatus,
  'default' | 'secondary' | 'outline'
> = {
  shipped: 'default',
  processing: 'secondary',
  pending: 'outline',
};

interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly role: string;
  readonly active: boolean;
}

const teamMembers: readonly TeamMember[] = [
  {
    id: 'u1',
    name: 'Olivia Chen',
    email: 'olivia.chen@acme.example',
    initials: 'OC',
    role: 'Owner',
    active: true,
  },
  {
    id: 'u2',
    name: 'Marcus Reid',
    email: 'marcus.reid@acme.example',
    initials: 'MR',
    role: 'Admin',
    active: true,
  },
  {
    id: 'u3',
    name: 'Priya Nair',
    email: 'priya.nair@acme.example',
    initials: 'PN',
    role: 'Editor',
    active: true,
  },
  {
    id: 'u4',
    name: 'Tomás Alvarez',
    email: 'tomas.alvarez@acme.example',
    initials: 'TA',
    role: 'Viewer',
    active: false,
  },
  {
    id: 'u5',
    name: 'Hana Sato',
    email: 'hana.sato@acme.example',
    initials: 'HS',
    role: 'Editor',
    active: true,
  },
];

interface RecentOrder {
  readonly id: string;
  readonly customer: string;
  readonly date: string;
  readonly amount: number;
  readonly status: LineStatus;
}

const recentOrders: readonly RecentOrder[] = [
  {
    id: 'ORD-1042',
    customer: 'Northwind Traders',
    date: 'Sep 21, 2026',
    amount: 1357.2,
    status: 'pending',
  },
  {
    id: 'ORD-1041',
    customer: 'Contoso Ltd.',
    date: 'Sep 20, 2026',
    amount: 4820,
    status: 'processing',
  },
  {
    id: 'ORD-1040',
    customer: 'Fabrikam Inc.',
    date: 'Sep 20, 2026',
    amount: 612.5,
    status: 'shipped',
  },
  {
    id: 'ORD-1039',
    customer: 'Tailspin Toys',
    date: 'Sep 19, 2026',
    amount: 98,
    status: 'shipped',
  },
  {
    id: 'ORD-1038',
    customer: 'Alpine Ski House',
    date: 'Sep 19, 2026',
    amount: 2760,
    status: 'shipped',
  },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function TableExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<readonly string[]>(['u2']);

  const invoiceStatusLabel: Record<InvoiceStatus, string> = {
    paid: t('reference.statusPaid'),
    pending: t('reference.statusPending'),
    failed: t('reference.statusFailed'),
  };
  const lineStatusLabel: Record<LineStatus, string> = {
    shipped: t('reference.statusShipped'),
    processing: t('reference.statusProcessing'),
    pending: t('reference.statusPending'),
  };

  const allSelected = selected.length === teamMembers.length;
  const someSelected = selected.length > 0 && !allSelected;

  function toggleMember(id: string, checked: boolean): void {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  return (
    <ExamplePage
      title={t('components.table.title')}
      description={t('components.table.description')}
      docs='https://ui.shadcn.com/docs/components/table'
    >
      <ExampleSection
        title={t('components.table.invoices')}
        description={t('components.table.invoicesDescription')}
        contentClassName='block'
      >
        <Table>
          <TableCaption>{t('components.table.invoicesCaption')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className='w-36'>
                {t('components.table.invoice')}
              </TableHead>
              <TableHead>{t('reference.customer')}</TableHead>
              <TableHead>{t('reference.status')}</TableHead>
              <TableHead>{t('components.table.paymentMethod')}</TableHead>
              <TableHead className='text-right'>
                {t('reference.amount')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className='font-medium'>{invoice.id}</TableCell>
                <TableCell>{invoice.customer}</TableCell>
                <TableCell>{invoiceStatusLabel[invoice.status]}</TableCell>
                <TableCell>{invoice.method}</TableCell>
                <TableCell className='text-right tabular-nums'>
                  {currency.format(invoice.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>{t('reference.total')}</TableCell>
              <TableCell className='text-right tabular-nums'>
                {currency.format(invoiceTotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </ExampleSection>

      <ExampleSection
        title={t('components.table.compact')}
        description={t('components.table.compactDescription')}
        contentClassName='block'
      >
        <Table className='text-xs [&_td]:py-1.5 [&_th]:h-8'>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reference.product')}</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className='text-right'>
                {t('reference.quantity')}
              </TableHead>
              <TableHead className='text-right'>
                {t('reference.price')}
              </TableHead>
              <TableHead className='text-right'>
                {t('reference.total')}
              </TableHead>
              <TableHead>{t('reference.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderLines.map((line) => (
              <TableRow key={line.sku}>
                <TableCell className='font-medium'>{line.product}</TableCell>
                <TableCell className='font-mono text-muted-foreground'>
                  {line.sku}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {line.quantity}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {currency.format(line.unitPrice)}
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {currency.format(line.quantity * line.unitPrice)}
                </TableCell>
                <TableCell>
                  <Badge variant={lineStatusVariant[line.status]}>
                    {lineStatusLabel[line.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ExampleSection>

      <ExampleSection
        title={t('components.table.selectable')}
        description={t('components.table.selectableDescription')}
        contentClassName='block'
      >
        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between gap-4 text-sm text-muted-foreground'>
            <span>
              {t('components.table.selectedCount', {
                selected: selected.length,
                total: teamMembers.length,
              })}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={selected.length === 0}
              onClick={() => setSelected([])}
            >
              {t('reference.reset')}
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    aria-label={t('components.table.selectAll')}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? teamMembers.map((member) => member.id) : [],
                      )
                    }
                  />
                </TableHead>
                <TableHead>{t('reference.name')}</TableHead>
                <TableHead>{t('reference.role')}</TableHead>
                <TableHead>{t('reference.status')}</TableHead>
                <TableHead className='w-12'>
                  <span className='sr-only'>{t('reference.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const isSelected = selected.includes(member.id);
                return (
                  <TableRow
                    key={member.id}
                    data-state={isSelected ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={member.name}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          toggleMember(member.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar size='sm'>
                          <AvatarFallback>{member.initials}</AvatarFallback>
                        </Avatar>
                        <div className='grid leading-tight'>
                          <span className='font-medium'>{member.name}</span>
                          <span className='text-xs text-muted-foreground'>
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Badge variant={member.active ? 'default' : 'outline'}>
                        {member.active
                          ? t('reference.statusActive')
                          : t('reference.statusInactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={t('reference.more')}
                      >
                        <MoreHorizontalIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.table.inCard')}
        description={t('components.table.inCardDescription')}
        contentClassName='block'
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('components.table.recentOrders')}</CardTitle>
            <CardDescription>
              {t('components.table.recentOrdersDescription')}
            </CardDescription>
            <CardAction>
              <Button variant='ghost' size='sm'>
                {t('reference.viewAll')}
                <ArrowRightIcon data-icon='inline-end' />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('components.table.order')}</TableHead>
                  <TableHead>{t('reference.customer')}</TableHead>
                  <TableHead>{t('reference.date')}</TableHead>
                  <TableHead>{t('reference.status')}</TableHead>
                  <TableHead className='text-right'>
                    {t('reference.amount')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className='font-medium'>{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {order.date}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lineStatusVariant[order.status]}>
                        {lineStatusLabel[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {currency.format(order.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </ExampleSection>
    </ExamplePage>
  );
}
