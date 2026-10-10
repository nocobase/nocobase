import { useTranslation } from '@nocobase/i18n/client';
import {
  BoxIcon,
  ChevronRightIcon,
  CreditCardIcon,
  PackageIcon,
  TruckIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';

import { ExamplePage, ExampleSection } from '../shared';

interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly roleKey: 'owner' | 'editor' | 'viewer';
}

const TEAM: readonly TeamMember[] = [
  {
    id: 'ava',
    name: 'Ava Chen',
    email: 'ava.chen@northwind.example',
    initials: 'AC',
    roleKey: 'owner',
  },
  {
    id: 'marcus',
    name: 'Marcus Reed',
    email: 'marcus.reed@northwind.example',
    initials: 'MR',
    roleKey: 'editor',
  },
  {
    id: 'lena',
    name: 'Lena Okafor',
    email: 'lena.okafor@northwind.example',
    initials: 'LO',
    roleKey: 'viewer',
  },
];

const CATEGORIES = [
  { id: 'scanners', count: 18 },
  { id: 'printers', count: 24 },
  { id: 'terminals', count: 9 },
] as const;

export default function ItemExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.item.title')}
      description={t('components.item.description')}
      docs='https://ui.shadcn.com/docs/components/item'
    >
      <ExampleSection
        title={t('components.item.variants')}
        description={t('components.item.variantsDescription')}
        contentClassName='block'
      >
        <ItemGroup className='max-w-lg'>
          <Item>
            <ItemContent>
              <ItemTitle>{t('components.item.defaultVariant')}</ItemTitle>
              <ItemDescription>
                {t('components.item.defaultVariantDescription')}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant='outline'>
            <ItemContent>
              <ItemTitle>{t('components.item.outlineVariant')}</ItemTitle>
              <ItemDescription>
                {t('components.item.outlineVariantDescription')}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant='muted'>
            <ItemContent>
              <ItemTitle>{t('components.item.mutedVariant')}</ItemTitle>
              <ItemDescription>
                {t('components.item.mutedVariantDescription')}
              </ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.item.media')}
        description={t('components.item.mediaDescription')}
        contentClassName='block'
      >
        <ItemGroup className='max-w-lg'>
          <Item variant='outline'>
            <ItemMedia variant='icon'>
              <TruckIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('components.item.shipmentTitle')}</ItemTitle>
              <ItemDescription>
                {t('components.item.shipmentDescription', {
                  carrier: 'Blue Harbor Logistics',
                })}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge variant='secondary'>{t('reference.statusShipped')}</Badge>
            </ItemActions>
          </Item>
          <Item variant='outline'>
            <ItemMedia>
              <Avatar>
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Ava Chen</ItemTitle>
              <ItemDescription>ava.chen@northwind.example</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant='outline' size='sm'>
                {t('components.item.message')}
              </Button>
            </ItemActions>
          </Item>
          <Item variant='outline'>
            <ItemMedia variant='icon'>
              <CreditCardIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Visa •••• 4242</ItemTitle>
              <ItemDescription>
                {t('components.item.cardExpiry', { date: '08 / 2028' })}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant='ghost' size='sm'>
                {t('reference.edit')}
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.item.sizes')}
        description={t('components.item.sizesDescription')}
        contentClassName='block'
      >
        <ItemGroup className='max-w-lg'>
          <Item variant='outline' size='default'>
            <ItemMedia variant='icon'>
              <BoxIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>POS Terminal Pro</ItemTitle>
              <ItemDescription>
                {t('components.item.inStock', { quantity: 42 })}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Item variant='outline' size='sm'>
            <ItemMedia variant='icon'>
              <BoxIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Thermal Printer 80mm</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant='outline' size='xs'>
            <ItemMedia variant='icon'>
              <BoxIcon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>USB-C Cable 2m</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.item.group')}
        description={t('components.item.groupDescription')}
        contentClassName='block'
      >
        <div className='max-w-lg rounded-lg border p-3'>
          <ItemGroup>
            {TEAM.map((member, index) => (
              <div key={member.id}>
                {index > 0 ? <ItemSeparator /> : null}
                <Item size='sm'>
                  <ItemMedia>
                    <Avatar>
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{member.name}</ItemTitle>
                    <ItemDescription>{member.email}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant='outline'>
                      {t(`components.item.role.${member.roleKey}`)}
                    </Badge>
                  </ItemActions>
                </Item>
              </div>
            ))}
          </ItemGroup>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.item.links')}
        description={t('components.item.linksDescription')}
        contentClassName='block'
      >
        <ItemGroup className='max-w-lg'>
          {CATEGORIES.map((category) => (
            <Item
              key={category.id}
              variant='outline'
              size='sm'
              render={<a href='#' />}
            >
              <ItemMedia variant='icon'>
                <PackageIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {t(`components.item.category.${category.id}`)}
                </ItemTitle>
                <ItemDescription>
                  {t('components.item.productCount', { total: category.count })}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className='size-4 text-muted-foreground' />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.item.headerFooter')}
        description={t('components.item.headerFooterDescription')}
        contentClassName='block'
      >
        <Item variant='outline' className='max-w-lg'>
          <ItemHeader>
            <span className='font-mono text-xs text-muted-foreground'>
              ORD-1042
            </span>
            <Badge variant='secondary'>{t('reference.statusProcessing')}</Badge>
          </ItemHeader>
          <ItemMedia variant='icon'>
            <PackageIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Northwind Traders</ItemTitle>
            <ItemDescription>
              {t('components.item.orderSummary', { items: 4 })}
            </ItemDescription>
          </ItemContent>
          <ItemFooter>
            <span className='text-xs text-muted-foreground'>
              {t('reference.dueDate')} · Oct 2, 2026
            </span>
            <span className='text-sm font-medium tabular-nums'>$2,184.00</span>
          </ItemFooter>
        </Item>
      </ExampleSection>
    </ExamplePage>
  );
}
