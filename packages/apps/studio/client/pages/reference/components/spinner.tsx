import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

export default function SpinnerExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.spinner.title')}
      description={t('components.spinner.description')}
      docs='https://ui.shadcn.com/docs/components/spinner'
    >
      <ExampleSection
        title={t('components.spinner.sizes')}
        description={t('components.spinner.sizesDescription')}
      >
        <Spinner className='size-3' />
        <Spinner className='size-4' />
        <Spinner className='size-6' />
        <Spinner className='size-8' />
      </ExampleSection>

      <ExampleSection
        title={t('components.spinner.inButtons')}
        description={t('components.spinner.inButtonsDescription')}
      >
        <Button disabled>
          <Spinner data-icon='inline-start' />
          {t('components.spinner.saving')}
        </Button>
        <Button variant='outline' disabled>
          <Spinner data-icon='inline-start' />
          {t('components.spinner.processingPayment')}
        </Button>
        <Button variant='secondary' disabled>
          {t('components.spinner.uploading')}
          <Spinner data-icon='inline-end' />
        </Button>
        <Button size='icon' variant='outline' disabled>
          <Spinner />
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.spinner.inBadges')}
        description={t('components.spinner.inBadgesDescription')}
      >
        <Badge>
          <Spinner data-icon='inline-start' />
          {t('components.spinner.syncing')}
        </Badge>
        <Badge variant='secondary'>
          <Spinner data-icon='inline-start' />
          {t('components.spinner.updating')}
        </Badge>
        <Badge variant='outline'>
          <Spinner data-icon='inline-start' />
          {t('reference.statusProcessing')}
        </Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.spinner.inline')}
        description={t('components.spinner.inlineDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-4'>
          <Item variant='muted'>
            <ItemMedia variant='icon'>
              <Spinner />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('components.spinner.processingPayment')}</ItemTitle>
              <ItemDescription>#ORD-1042 · Northwind Traders</ItemDescription>
            </ItemContent>
            <ItemContent className='flex-none justify-end'>
              <span className='text-sm tabular-nums'>$1,357.20</span>
            </ItemContent>
          </Item>
          <p className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Spinner />
            {t('components.spinner.refreshingOrders')}
          </p>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.spinner.panel')}
        description={t('components.spinner.panelDescription')}
        contentClassName='block'
      >
        <div className='flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-sm text-muted-foreground'>
          <Spinner className='size-6' />
          <span>{t('components.spinner.loadingReport')}</span>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
