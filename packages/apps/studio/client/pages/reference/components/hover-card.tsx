import { useTranslation } from '@nocobase/i18n/client';
import { CalendarIcon, MailIcon, PhoneIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

import { ExamplePage, ExampleSection } from '../shared';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

function MemberCard(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex gap-3'>
      <Avatar>
        <AvatarFallback>AC</AvatarFallback>
      </Avatar>
      <div className='flex flex-col gap-1'>
        <div className='font-semibold'>Ava Chen</div>
        <div className='text-muted-foreground'>
          {t('components.hoverCard.roleAccountManager')}
        </div>
        <div className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
          <CalendarIcon className='size-3.5' aria-hidden='true' />
          {t('components.hoverCard.joined', { date: 'March 2024' })}
        </div>
      </div>
    </div>
  );
}

export default function HoverCardExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.hoverCard.title')}
      description={t('components.hoverCard.description')}
      docs='https://ui.shadcn.com/docs/components/hover-card'
    >
      <ExampleSection
        title={t('components.hoverCard.basic')}
        description={t('components.hoverCard.basicDescription')}
      >
        <HoverCard>
          <HoverCardTrigger render={<Button variant='link' />}>
            @ava.chen
          </HoverCardTrigger>
          <HoverCardContent className='w-72'>
            <MemberCard />
          </HoverCardContent>
        </HoverCard>
      </ExampleSection>

      <ExampleSection
        title={t('components.hoverCard.delays')}
        description={t('components.hoverCard.delaysDescription')}
      >
        <HoverCard>
          <HoverCardTrigger
            delay={0}
            closeDelay={0}
            render={<Button variant='outline' />}
          >
            {t('components.hoverCard.instant')}
          </HoverCardTrigger>
          <HoverCardContent className='w-72'>
            <MemberCard />
          </HoverCardContent>
        </HoverCard>
        <HoverCard>
          <HoverCardTrigger
            delay={700}
            closeDelay={300}
            render={<Button variant='outline' />}
          >
            {t('components.hoverCard.delayed')}
          </HoverCardTrigger>
          <HoverCardContent className='w-72'>
            <MemberCard />
          </HoverCardContent>
        </HoverCard>
      </ExampleSection>

      <ExampleSection
        title={t('components.hoverCard.sides')}
        description={t('components.hoverCard.sidesDescription')}
      >
        {SIDES.map((side) => (
          <HoverCard key={side}>
            <HoverCardTrigger render={<Button variant='outline' />}>
              {t(`components.hoverCard.${side}`)}
            </HoverCardTrigger>
            <HoverCardContent side={side} className='w-56'>
              {t('components.hoverCard.sideHint', { side })}
            </HoverCardContent>
          </HoverCard>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.hoverCard.business')}
        description={t('components.hoverCard.businessDescription')}
        contentClassName='block'
      >
        <p className='max-w-prose text-sm leading-relaxed'>
          {t('components.hoverCard.sentenceStart')}{' '}
          <HoverCard>
            <HoverCardTrigger
              render={
                <Button
                  variant='link'
                  className='h-auto p-0 font-mono text-sm'
                />
              }
            >
              ORD-1042
            </HoverCardTrigger>
            <HoverCardContent className='flex w-64 flex-col gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-mono text-xs text-muted-foreground'>
                  ORD-1042
                </span>
                <Badge variant='secondary'>
                  {t('reference.statusShipped')}
                </Badge>
              </div>
              <dl className='grid grid-cols-2 gap-y-1 text-xs'>
                <dt className='text-muted-foreground'>
                  {t('reference.total')}
                </dt>
                <dd className='text-right tabular-nums'>$1,240.00</dd>
                <dt className='text-muted-foreground'>
                  {t('components.hoverCard.items')}
                </dt>
                <dd className='text-right tabular-nums'>6</dd>
                <dt className='text-muted-foreground'>{t('reference.date')}</dt>
                <dd className='text-right'>Sep 18, 2026</dd>
              </dl>
            </HoverCardContent>
          </HoverCard>{' '}
          {t('components.hoverCard.sentenceMiddle')}{' '}
          <HoverCard>
            <HoverCardTrigger
              render={<Button variant='link' className='h-auto p-0 text-sm' />}
            >
              Ava Chen
            </HoverCardTrigger>
            <HoverCardContent className='flex w-64 flex-col gap-2'>
              <MemberCard />
              <div className='flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <MailIcon className='size-3.5' aria-hidden='true' />
                  ava.chen@northwind.example
                </span>
                <span className='flex items-center gap-1.5'>
                  <PhoneIcon className='size-3.5' aria-hidden='true' />
                  +1 (555) 014-2201
                </span>
              </div>
            </HoverCardContent>
          </HoverCard>
          {t('components.hoverCard.sentenceEnd')}
        </p>
      </ExampleSection>
    </ExamplePage>
  );
}
