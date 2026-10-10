import { useTranslation } from '@nocobase/i18n/client';
import {
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { ExamplePage, ExampleSection } from '../shared';

export default function SeparatorExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.separator.title')}
      description={t('components.separator.description')}
      docs='https://ui.shadcn.com/docs/components/separator'
    >
      <ExampleSection
        title={t('components.separator.horizontal')}
        description={t('components.separator.horizontalDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-4 text-sm'>
          <div className='flex flex-col gap-1.5'>
            <div className='leading-none font-medium'>Northwind Traders</div>
            <div className='text-muted-foreground'>
              {t('components.separator.planLabel')}
            </div>
          </div>
          <Separator />
          <p>{t('components.separator.accountSummary')}</p>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.separator.vertical')}
        description={t('components.separator.verticalDescription')}
      >
        <div className='flex h-5 items-center gap-4 text-sm'>
          <div>
            <span className='text-muted-foreground'>
              {t('reference.owner')}
            </span>{' '}
            Olivia Chen
          </div>
          <Separator orientation='vertical' />
          <div>
            <span className='text-muted-foreground'>
              {t('reference.updatedAt')}
            </span>{' '}
            Sep 18, 2026
          </div>
          <Separator orientation='vertical' />
          <div>
            <span className='text-muted-foreground'>
              {t('reference.status')}
            </span>{' '}
            {t('reference.statusActive')}
          </div>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.separator.toolbar')}
        description={t('components.separator.toolbarDescription')}
      >
        <div className='flex items-center gap-1 rounded-lg border bg-background p-1'>
          <Button variant='ghost' size='sm'>
            <PencilIcon data-icon='inline-start' />
            {t('reference.edit')}
          </Button>
          <Button variant='ghost' size='sm'>
            <CopyIcon data-icon='inline-start' />
            {t('reference.copy')}
          </Button>
          <Separator orientation='vertical' className='mx-1 my-1' />
          <Button variant='ghost' size='sm'>
            <Share2Icon data-icon='inline-start' />
            {t('reference.share')}
          </Button>
          <Button variant='ghost' size='sm'>
            <DownloadIcon data-icon='inline-start' />
            {t('reference.download')}
          </Button>
          <Separator orientation='vertical' className='mx-1 my-1' />
          <Button variant='ghost' size='sm' className='text-destructive'>
            <Trash2Icon data-icon='inline-start' />
            {t('reference.delete')}
          </Button>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.separator.list')}
        description={t('components.separator.listDescription')}
        contentClassName='block'
      >
        <div className='flex w-full max-w-sm flex-col gap-2 text-sm'>
          <dl className='flex items-center justify-between'>
            <dt>{t('components.separator.subtotal')}</dt>
            <dd className='text-muted-foreground tabular-nums'>$1,240.00</dd>
          </dl>
          <Separator />
          <dl className='flex items-center justify-between'>
            <dt>{t('components.separator.tax')}</dt>
            <dd className='text-muted-foreground tabular-nums'>$99.20</dd>
          </dl>
          <Separator />
          <dl className='flex items-center justify-between'>
            <dt>{t('components.separator.shipping')}</dt>
            <dd className='text-muted-foreground tabular-nums'>$18.00</dd>
          </dl>
          <Separator />
          <dl className='flex items-center justify-between font-medium'>
            <dt>{t('reference.total')}</dt>
            <dd className='tabular-nums'>$1,357.20</dd>
          </dl>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}
