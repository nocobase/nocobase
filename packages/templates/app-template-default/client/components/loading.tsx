import { useTranslation } from '@nocobase/i18n/client';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { BrandLoadingMark } from '#components/brand-loading-mark';
import { cn } from 'cn';

export interface LoadingProps extends ComponentPropsWithoutRef<'div'> {
  readonly fullscreen?: boolean;
  readonly label?: string;
}

export function Loading(inputProps: LoadingProps): ReactElement {
  const { t } = useTranslation();
  const {
    className,
    fullscreen = false,
    label = t('status.loading', { defaultValue: 'Loading' }),
    ...props
  } = inputProps;

  return (
    <div
      aria-label={label}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullscreen && 'min-h-svh w-full bg-background',
        className,
      )}
      role='status'
      {...props}
    >
      <BrandLoadingMark />
      <span className='text-sm text-muted-foreground'>{label}</span>
    </div>
  );
}
