import { useTranslation } from '@nocobase/i18n/client';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { Spinner } from '@/components/ui/spinner';
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
        'flex items-center justify-center',
        fullscreen && 'min-h-svh w-full bg-background',
        className,
      )}
      role='status'
      {...props}
    >
      <Spinner aria-hidden='true' role={undefined} />
    </div>
  );
}
