import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { ExamplePage, ExampleSection } from '../shared';

const productImage =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80';

const stats = [
  {
    id: 'revenue',
    labelKey: 'components.card.statRevenue',
    value: '$45,231.89',
    change: '+20.1%',
    up: true,
  },
  {
    id: 'orders',
    labelKey: 'components.card.statOrders',
    value: '1,284',
    change: '+12.4%',
    up: true,
  },
  {
    id: 'customers',
    labelKey: 'components.card.statCustomers',
    value: '573',
    change: '-2.3%',
    up: false,
  },
];

const activity = [
  {
    id: 'a1',
    textKey: 'components.card.activityPaid',
    params: { invoice: 'INV-2031', customer: 'Acme Inc.' },
    time: '09:41',
  },
  {
    id: 'a2',
    textKey: 'components.card.activityShipped',
    params: { order: 'ORD-1042' },
    time: '08:15',
  },
  {
    id: 'a3',
    textKey: 'components.card.activityJoined',
    params: { name: 'Jackson Lee' },
    time: null,
  },
];

export default function CardExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.card.title')}
      description={t('components.card.description')}
      docs='https://ui.shadcn.com/docs/components/card'
    >
      <ExampleSection
        title={t('components.card.basic')}
        description={t('components.card.basicDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-sm'>
          <CardHeader>
            <CardTitle>{t('components.card.inviteTitle')}</CardTitle>
            <CardDescription>
              {t('components.card.inviteDescription')}
            </CardDescription>
            <CardAction>
              <Button variant='link'>{t('components.card.viewMembers')}</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => event.preventDefault()}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor='card-invite-name'>
                    {t('reference.name')}
                  </FieldLabel>
                  <Input id='card-invite-name' placeholder='Olivia Martin' />
                </Field>
                <Field>
                  <FieldLabel htmlFor='card-invite-email'>
                    {t('reference.email')}
                  </FieldLabel>
                  <Input
                    id='card-invite-email'
                    type='email'
                    placeholder='olivia@acme.com'
                  />
                  <FieldDescription>
                    {t('components.card.inviteEmailHint')}
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className='justify-end gap-2'>
            <Button variant='outline'>{t('reference.cancel')}</Button>
            <Button>{t('components.card.sendInvite')}</Button>
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.card.small')}
        description={t('components.card.smallDescription')}
        contentClassName='block'
      >
        <Card size='sm' className='w-full max-w-xs'>
          <CardHeader>
            <CardTitle>{t('components.card.featureTitle')}</CardTitle>
            <CardDescription>
              {t('components.card.featureDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='grid gap-2 py-1 text-sm'>
              <li className='flex gap-2'>
                <ChevronRightIcon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <span>{t('components.card.featureBulletSchedule')}</span>
              </li>
              <li className='flex gap-2'>
                <ChevronRightIcon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <span>{t('components.card.featureBulletRecipients')}</span>
              </li>
              <li className='flex gap-2'>
                <ChevronRightIcon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                <span>{t('components.card.featureBulletContent')}</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className='flex-col gap-2'>
            <Button size='sm' className='w-full'>
              {t('components.card.setUpReports')}
            </Button>
            <Button variant='outline' size='sm' className='w-full'>
              {t('components.card.learnMore')}
            </Button>
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.card.withImage')}
        description={t('components.card.withImageDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-sm'>
          <img
            src={productImage}
            alt='Studio Headphones'
            loading='lazy'
            className='aspect-video w-full object-cover'
          />
          <CardHeader>
            <CardTitle>Studio Headphones</CardTitle>
            <CardDescription>
              {t('components.card.productDescription')}
            </CardDescription>
            <CardAction>
              <Badge>{t('components.card.newArrival')}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className='flex items-baseline gap-2'>
            <span className='text-2xl font-semibold tabular-nums'>$199.00</span>
            <span className='text-sm text-muted-foreground line-through'>
              $249.00
            </span>
          </CardContent>
          <CardFooter>
            <Button className='w-full'>
              <ShoppingCartIcon data-icon='inline-start' />
              {t('components.card.addToCart')}
            </Button>
          </CardFooter>
        </Card>
      </ExampleSection>

      <ExampleSection
        title={t('components.card.stats')}
        description={t('components.card.statsDescription')}
        contentClassName='grid gap-4 sm:grid-cols-3'
      >
        {stats.map((stat) => (
          <Card key={stat.id} size='sm'>
            <CardHeader>
              <CardDescription>{t(stat.labelKey)}</CardDescription>
              <CardTitle className='text-2xl tabular-nums'>
                {stat.value}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  {stat.up ? (
                    <TrendingUpIcon data-icon='inline-start' />
                  ) : (
                    <TrendingDownIcon data-icon='inline-start' />
                  )}
                  {stat.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className='text-xs text-muted-foreground'>
              {t('components.card.vsLastMonth')}
            </CardContent>
          </Card>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.card.edgeToEdge')}
        description={t('components.card.edgeToEdgeDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-sm'>
          <CardHeader>
            <CardTitle>{t('components.card.activityTitle')}</CardTitle>
            <CardDescription>
              {t('components.card.activityDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='-mb-(--card-spacing)'>
            <ul className='-mx-(--card-spacing) divide-y border-t text-sm'>
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className='flex items-center justify-between gap-4 px-(--card-spacing) py-3'
                >
                  <span className='min-w-0 truncate'>
                    {t(entry.textKey, entry.params)}
                  </span>
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {entry.time ?? t('reference.yesterday')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className='justify-end'>
            <Button variant='ghost' size='sm'>
              {t('reference.viewAll')}
              <ArrowRightIcon data-icon='inline-end' />
            </Button>
          </CardFooter>
        </Card>
      </ExampleSection>
    </ExamplePage>
  );
}
