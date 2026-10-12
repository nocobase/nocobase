import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';

function Spinner(inputProps: React.ComponentProps<'svg'>) {
  const { t } = useTranslation();
  const { className, ...props } = inputProps;

  return (
    <Loader2Icon
      data-slot='spinner'
      role='status'
      aria-label={t('status.loading', { defaultValue: 'Loading' })}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
