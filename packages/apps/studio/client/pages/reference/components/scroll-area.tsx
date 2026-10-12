import { useTranslation } from '@nocobase/i18n/client';
import { Fragment, type ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { ExamplePage, ExampleSection } from '../shared';

interface AuditEntry {
  readonly id: string;
  readonly actor: string;
  readonly summary: string;
  readonly at: string;
}

const AUDIT_ENTRIES: readonly AuditEntry[] = [
  {
    id: 'a-24',
    actor: 'Ava Chen',
    summary: 'Marked ORD-1042 as paid',
    at: 'Sep 18, 09:14',
  },
  {
    id: 'a-23',
    actor: 'Marcus Reed',
    summary: 'Sent invoice INV-2041',
    at: 'Sep 17, 16:02',
  },
  {
    id: 'a-22',
    actor: 'Priya Nair',
    summary: 'Changed payment terms to net 30',
    at: 'Sep 17, 15:48',
  },
  {
    id: 'a-21',
    actor: 'Ava Chen',
    summary: 'Approved quote QTE-0884',
    at: 'Sep 16, 11:20',
  },
  {
    id: 'a-20',
    actor: 'Léa Dubois',
    summary: 'Added shipping address in Auckland',
    at: 'Sep 16, 10:55',
  },
  {
    id: 'a-19',
    actor: 'Marcus Reed',
    summary: 'Created order ORD-1042',
    at: 'Sep 16, 10:31',
  },
  {
    id: 'a-18',
    actor: 'Priya Nair',
    summary: 'Imported 42 products from the September catalog',
    at: 'Sep 15, 18:07',
  },
  {
    id: 'a-17',
    actor: 'Ava Chen',
    summary: 'Refunded INV-1998 in full',
    at: 'Sep 15, 14:12',
  },
  {
    id: 'a-16',
    actor: 'Tom Byrom',
    summary: 'Updated the Blue Harbor Cafe credit limit',
    at: 'Sep 14, 09:40',
  },
  {
    id: 'a-15',
    actor: 'Léa Dubois',
    summary: 'Archived the 2025 price list',
    at: 'Sep 12, 17:25',
  },
];

interface ProductCard {
  readonly sku: string;
  readonly name: string;
  readonly price: string;
}

const PRODUCTS: readonly ProductCard[] = [
  { sku: 'POS-PRO', name: 'POS Terminal Pro', price: '$1,299.00' },
  { sku: 'SCN-X2', name: 'Barcode Scanner X2', price: '$189.00' },
  { sku: 'PRT-80', name: 'Thermal Printer 80mm', price: '$249.00' },
  { sku: 'DRW-16', name: 'Cash Drawer 16"', price: '$159.00' },
  { sku: 'SCL-30', name: 'Digital Scale 30kg', price: '$219.00' },
  { sku: 'STD-01', name: 'Tablet Stand', price: '$45.00' },
];

interface TeamMember {
  readonly name: string;
  readonly initials: string;
  readonly role: string;
}

const TEAM: readonly TeamMember[] = [
  { name: 'Ava Chen', initials: 'AC', role: 'Owner' },
  { name: 'Marcus Reed', initials: 'MR', role: 'Finance' },
  { name: 'Priya Nair', initials: 'PN', role: 'Operations' },
  { name: 'Léa Dubois', initials: 'LD', role: 'Support' },
  { name: 'Tom Byrom', initials: 'TB', role: 'Support' },
  { name: 'Hana Sato', initials: 'HS', role: 'Sales' },
  { name: 'Diego Alvarez', initials: 'DA', role: 'Sales' },
  { name: 'Nina Kowalski', initials: 'NK', role: 'Warehouse' },
];

const TERMS_PARAGRAPHS: readonly string[] = [
  'Payment is due within thirty days of the invoice date unless a different term is agreed in writing. Invoices unpaid after that period accrue interest at 1.5% per month.',
  'Goods remain the property of the supplier until payment has been received in full. Risk passes to the customer on delivery to the nominated address.',
  'Orders may be cancelled without charge up to the point of dispatch. After dispatch, the return policy applies and a restocking fee of 10% may be deducted.',
  'Delivery dates are estimates. The supplier is not liable for delays caused by carriers, customs, or events outside its reasonable control.',
  'Claims for damaged or missing goods must be raised within seven days of delivery, with photographs of the packaging and the shipping label.',
  'Either party may terminate a supply agreement on sixty days written notice. Orders already accepted at the date of notice are fulfilled under these terms.',
];

export default function ScrollAreaExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.scrollArea.title')}
      description={t('components.scrollArea.description')}
      docs='https://ui.shadcn.com/docs/components/scroll-area'
    >
      <ExampleSection
        title={t('components.scrollArea.vertical')}
        description={t('components.scrollArea.verticalDescription')}
        contentClassName='items-stretch'
      >
        <ScrollArea className='h-64 w-72 rounded-lg border'>
          <div className='p-4'>
            <h4 className='mb-3 text-sm leading-none font-medium'>
              {t('components.scrollArea.auditTrail')}
            </h4>
            {AUDIT_ENTRIES.map((entry) => (
              <Fragment key={entry.id}>
                <div className='text-sm'>
                  <div>{entry.summary}</div>
                  <div className='text-xs text-muted-foreground'>
                    {entry.actor} · {entry.at}
                  </div>
                </div>
                <Separator className='my-2 last:hidden' />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
      </ExampleSection>

      <ExampleSection
        title={t('components.scrollArea.horizontal')}
        description={t('components.scrollArea.horizontalDescription')}
        contentClassName='block'
      >
        <ScrollArea className='w-full rounded-lg border whitespace-nowrap'>
          <div className='flex w-max gap-4 p-4'>
            {PRODUCTS.map((product) => (
              <figure key={product.sku} className='w-40 shrink-0'>
                <div className='aspect-[4/3] rounded-md bg-muted' />
                <figcaption className='pt-2 text-xs text-muted-foreground'>
                  <span className='block truncate font-medium text-foreground'>
                    {product.name}
                  </span>
                  <span className='font-mono'>{product.sku}</span> ·{' '}
                  <span className='tabular-nums'>{product.price}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <ScrollBar orientation='horizontal' />
        </ScrollArea>
      </ExampleSection>

      <ExampleSection
        title={t('components.scrollArea.list')}
        description={t('components.scrollArea.listDescription')}
        contentClassName='items-stretch'
      >
        <ScrollArea className='h-56 w-full max-w-md rounded-lg border'>
          <ul className='divide-y'>
            {TEAM.map((member) => (
              <li
                key={member.name}
                className='flex items-center gap-3 px-4 py-2.5'
              >
                <Avatar size='sm'>
                  <AvatarFallback>{member.initials}</AvatarFallback>
                </Avatar>
                <span className='min-w-0 flex-1 truncate text-sm'>
                  {member.name}
                </span>
                <Badge variant='secondary'>{member.role}</Badge>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </ExampleSection>

      <ExampleSection
        title={t('components.scrollArea.prose')}
        description={t('components.scrollArea.proseDescription')}
        contentClassName='block'
      >
        <ScrollArea className='h-52 w-full max-w-2xl rounded-lg border'>
          <div className='space-y-3 p-4 text-sm leading-6'>
            <h4 className='font-medium'>
              {t('components.scrollArea.termsTitle')}
            </h4>
            {TERMS_PARAGRAPHS.map((paragraph) => (
              <p key={paragraph} className='text-muted-foreground'>
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollArea>
      </ExampleSection>
    </ExamplePage>
  );
}
