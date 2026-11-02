import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { ArrowLeftRight } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { ACCOUNT_SWITCHER_NAMESPACE, useAccountSwitcher } from '../context.js';
import { Button } from './ui/button.js';

/** Floats over the page rather than joining its layout, which belongs to each application's shell. */
export function SwitchedBanner(): ReactElement | null {
  const context = useAccountSwitcher();
  const { t } = useTranslation(ACCOUNT_SWITCHER_NAMESPACE);
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  const switched = context?.state?.switched;
  if (!context || !switched) return null;

  const returnToOwnAccount = async () => {
    setPending(true);
    try {
      await context.stop();
    } catch {
      setPending(false);
      toaster.show({ type: 'error', title: t('errors.returnFailed') });
    }
  };

  return (
    <div
      role='status'
      className='fixed bottom-4 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-foreground px-3 py-2 text-sm text-background shadow-lg'
    >
      <ArrowLeftRight aria-hidden className='size-4 shrink-0' />
      <span className='min-w-0'>
        <span className='font-medium'>
          {t('banner.actingAs', { name: switched.target.name })}
        </span>
        <span className='ml-2 opacity-70'>{t('banner.description')}</span>
      </span>
      <Button
        size='sm'
        variant='secondary'
        disabled={pending}
        onClick={() => void returnToOwnAccount()}
      >
        {t('banner.return', { name: switched.actor.name })}
      </Button>
    </div>
  );
}
