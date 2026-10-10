import { useTranslation } from '@nocobase/i18n/client';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { cn } from 'cn';
import { BrandLoadingMark } from './brand-loading-mark';

/** Inline loading uses the same brand animation as page and startup loading. */
export function BrandSpinner({
  className,
  ...props
}: ComponentPropsWithoutRef<'svg'>): ReactElement {
  const { t } = useTranslation();
  return (
    <BrandLoadingMark
      data-slot='spinner'
      role='status'
      aria-hidden={undefined}
      aria-label={t('status.loading', { defaultValue: 'Loading' })}
      className={cn('size-5 text-current', className)}
      {...props}
    />
  );
}
