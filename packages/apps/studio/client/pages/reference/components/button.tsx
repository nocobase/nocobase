import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { ExamplePage, ExampleSection } from '../shared';

export default function ButtonExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.button.title')}
      description={t('components.button.description')}
      docs='https://ui.shadcn.com/docs/components/button'
    >
      <ExampleSection
        title={t('components.button.variants')}
        description={t('components.button.variantsDescription')}
      >
        <Button>{t('reference.save')}</Button>
        <Button variant='secondary'>{t('reference.cancel')}</Button>
        <Button variant='outline'>{t('reference.edit')}</Button>
        <Button variant='ghost'>{t('reference.more')}</Button>
        <Button variant='destructive'>{t('reference.delete')}</Button>
        <Button variant='link'>{t('reference.viewAll')}</Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.button.sizes')}
        description={t('components.button.sizesDescription')}
      >
        <Button size='xs'>{t('components.button.extraSmall')}</Button>
        <Button size='sm'>{t('components.button.small')}</Button>
        <Button>{t('components.button.default')}</Button>
        <Button size='lg'>{t('components.button.large')}</Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.button.withIcon')}
        description={t('components.button.withIconDescription')}
      >
        <Button>
          <PlusIcon data-icon='inline-start' />
          {t('reference.create')}
        </Button>
        <Button variant='outline'>
          <MailIcon data-icon='inline-start' />
          {t('components.button.sendEmail')}
        </Button>
        <Button variant='secondary'>
          {t('reference.next')}
          <ArrowRightIcon data-icon='inline-end' />
        </Button>
        <Button variant='outline'>
          {t('reference.more')}
          <ChevronDownIcon data-icon='inline-end' />
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.button.iconOnly')}
        description={t('components.button.iconOnlyDescription')}
      >
        <Button
          size='icon-xs'
          variant='outline'
          aria-label={t('reference.create')}
        >
          <PlusIcon />
        </Button>
        <Button
          size='icon-sm'
          variant='outline'
          aria-label={t('reference.create')}
        >
          <PlusIcon />
        </Button>
        <Button
          size='icon'
          variant='outline'
          aria-label={t('reference.create')}
        >
          <PlusIcon />
        </Button>
        <Button
          size='icon-lg'
          variant='destructive'
          aria-label={t('reference.delete')}
        >
          <Trash2Icon />
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.button.states')}
        description={t('components.button.statesDescription')}
      >
        <Button disabled>{t('reference.save')}</Button>
        <Button disabled>
          <Spinner data-icon='inline-start' />
          {t('reference.loading')}
        </Button>
        <Button variant='outline' disabled>
          {t('reference.cancel')}
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.button.asLink')}
        description={t('components.button.asLinkDescription')}
      >
        <Button
          variant='outline'
          render={
            <a
              href='https://ui.shadcn.com/docs/components/button'
              target='_blank'
              rel='noreferrer'
            />
          }
        >
          {t('reference.docs')}
          <ArrowRightIcon data-icon='inline-end' />
        </Button>
      </ExampleSection>
    </ExamplePage>
  );
}
