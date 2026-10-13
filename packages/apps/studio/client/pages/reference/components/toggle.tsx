import { useTranslation } from '@nocobase/i18n/client';
import {
  BellIcon,
  BellOffIcon,
  BookmarkIcon,
  EyeIcon,
  FilterIcon,
  StarIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Toggle } from '@/components/ui/toggle';

import { ExamplePage, ExampleSection } from '../shared';

const TOGGLE_SIZES = ['sm', 'default', 'lg'] as const;

export default function ToggleExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [onlyMine, setOnlyMine] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  return (
    <ExamplePage
      title={t('components.toggle.title')}
      description={t('components.toggle.description')}
      docs='https://ui.shadcn.com/docs/components/toggle'
    >
      <ExampleSection
        title={t('components.toggle.basic')}
        description={t('components.toggle.basicDescription')}
      >
        <Toggle aria-label={t('components.toggle.followCustomer')}>
          <BookmarkIcon className='group-aria-pressed/toggle:fill-foreground' />
          {t('components.toggle.followCustomer')}
        </Toggle>
        <Toggle variant='outline' defaultPressed>
          <StarIcon className='group-aria-pressed/toggle:fill-foreground' />
          {t('components.toggle.priorityAccount')}
        </Toggle>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggle.sizes')}
        description={t('components.toggle.sizesDescription')}
      >
        {TOGGLE_SIZES.map((size) => (
          <Toggle
            key={size}
            size={size}
            variant='outline'
            aria-label={t('components.toggle.showArchived')}
          >
            <EyeIcon />
            {t('components.toggle.showArchived')}
          </Toggle>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.toggle.iconOnly')}
        description={t('components.toggle.iconOnlyDescription')}
      >
        <Toggle variant='outline' aria-label={t('reference.filter')}>
          <FilterIcon />
        </Toggle>
        <Toggle
          variant='outline'
          aria-label={t('components.toggle.followCustomer')}
        >
          <BookmarkIcon className='group-aria-pressed/toggle:fill-foreground' />
        </Toggle>
        <Toggle
          variant='outline'
          defaultPressed
          aria-label={t('components.toggle.priorityAccount')}
        >
          <StarIcon className='group-aria-pressed/toggle:fill-foreground' />
        </Toggle>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggle.controlled')}
        description={t('components.toggle.controlledDescription')}
      >
        <Toggle
          variant='outline'
          pressed={onlyMine}
          onPressedChange={(pressed: boolean) => setOnlyMine(pressed)}
        >
          <FilterIcon />
          {t('components.toggle.onlyMyOrders')}
        </Toggle>
        <span className='text-sm text-muted-foreground'>
          {onlyMine
            ? t('components.toggle.resultsMine', { count: 12 })
            : t('components.toggle.resultsAll', { count: 148 })}
        </span>
      </ExampleSection>

      <ExampleSection
        title={t('components.toggle.states')}
        description={t('components.toggle.statesDescription')}
      >
        <Toggle
          variant='outline'
          pressed={subscribed}
          onPressedChange={(pressed: boolean) => setSubscribed(pressed)}
        >
          {subscribed ? <BellIcon /> : <BellOffIcon />}
          {subscribed
            ? t('components.toggle.notificationsOn')
            : t('components.toggle.notificationsOff')}
        </Toggle>
        <Toggle variant='outline' disabled>
          <BellIcon />
          {t('components.toggle.smsAlerts')}
        </Toggle>
      </ExampleSection>
    </ExamplePage>
  );
}
