import { IN_APP_NOTIFICATION_CLIENT_NAMESPACE } from '../../i18n.js';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';

function Spinner(inputProps: React.ComponentProps<'svg'>): ReactElement {
  const { t } = useTranslation(IN_APP_NOTIFICATION_CLIENT_NAMESPACE);
  const { className, ...props } = inputProps;

  return (
    <Loader2Icon
      data-slot='spinner'
      role='status'
      aria-label={t('common.loading', { defaultValue: 'Loading' })}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
