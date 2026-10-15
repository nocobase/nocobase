import { useTranslation } from '@nocobase/i18n/client';
import { resolveAppUrl } from '@nocobase/app-client';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

export interface AppBrandProps {
  readonly compact?: boolean;
}

export function AppBrand(inputProps: AppBrandProps): ReactElement {
  const { t } = useTranslation();
  const { compact = false } = inputProps;

  return (
    <Link
      aria-label={t('navigation.brandHome', { defaultValue: 'NocoBase home' })}
      className='flex min-w-0 items-center text-foreground'
      to='/'
    >
      {compact ? (
        <span className='size-9 shrink-0 overflow-hidden'>
          <img
            src={resolveAppUrl('/assets/logo-mark.png')}
            alt=''
            className='size-full object-contain dark:hidden'
          />
          <img
            src={resolveAppUrl('/assets/logo-mark-dark.png')}
            alt=''
            className='hidden size-full object-contain dark:block'
          />
        </span>
      ) : (
        <span className='h-8 min-w-0 overflow-hidden'>
          <img
            src={resolveAppUrl('/assets/logo.png')}
            alt='NocoBase'
            className='h-full w-auto object-contain dark:hidden'
          />
          <img
            src={resolveAppUrl('/assets/logo-dark.png')}
            alt='NocoBase'
            className='hidden h-full w-auto object-contain dark:block'
          />
        </span>
      )}
    </Link>
  );
}
